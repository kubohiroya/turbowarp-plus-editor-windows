import assert from 'node:assert/strict';
import test from 'node:test';
import {JSDOM} from 'jsdom';
import {connectOpenerDocument} from '../dist/opener-document.js';

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

// Two windows, as the editor and a window it renders views into. Each has its own constructors.
function windows() {
    const opener = new JSDOM('<!doctype html><html><head></head><body></body></html>').window;
    const child = new JSDOM('<!doctype html><html><head></head><body><div id="view"></div></body></html>').window;
    return {opener, child, view: child.document.getElementById('view')!};
}

test('mouse input in the other window is repeated on the opener document', () => {
    const {opener, child, view} = windows();
    const seen: MouseEvent[] = [];
    opener.document.addEventListener('mousemove', event => {
        seen.push(event as MouseEvent);
        event.preventDefault();
    });
    const disconnect = connectOpenerDocument(child.document, {opener: opener.document});
    const event = new child.MouseEvent('mousemove', {bubbles: true, cancelable: true, clientX: 12, clientY: 34, buttons: 1});
    view.dispatchEvent(event);
    assert.equal(seen.length, 1);
    assert.ok(seen[0] instanceof opener.MouseEvent);
    assert.deepEqual([seen[0].clientX, seen[0].clientY, seen[0].buttons], [12, 34, 1]);
    // A handler on the opener that cancels the copy cancels the input, as it would in one window.
    assert.equal(event.defaultPrevented, true);

    disconnect();
    view.dispatchEvent(new child.MouseEvent('mousemove', {bubbles: true}));
    assert.equal(seen.length, 1);
});

test('input in the opener document itself is not repeated', () => {
    const {opener} = windows();
    let count = 0;
    opener.document.addEventListener('mouseup', () => count++);
    const disconnect = connectOpenerDocument(opener.document, {opener: opener.document});
    opener.document.body.dispatchEvent(new opener.MouseEvent('mouseup', {bubbles: true}));
    assert.equal(count, 1);
    disconnect();
});

test('a context menu opened from the other window is shown there until it closes', async () => {
    const {opener, child, view} = windows();
    const menu = opener.document.createElement('nav');
    menu.className = 'react-contextmenu';
    menu.innerHTML = '<div class="react-contextmenu-item">large readout</div>';
    opener.document.body.appendChild(menu);
    const keys: number[] = [];
    let mousedowns = 0;
    opener.document.addEventListener('keydown', event => keys.push((event as KeyboardEvent).keyCode));
    opener.document.addEventListener('mousedown', () => mousedowns++);
    const disconnect = connectOpenerDocument(child.document, {opener: opener.document});

    // Keys are not repeated while no menu is shown here.
    view.dispatchEvent(new child.KeyboardEvent('keydown', {bubbles: true, key: 'Escape', keyCode: 27}));
    view.dispatchEvent(new child.MouseEvent('contextmenu', {bubbles: true}));
    menu.classList.add('react-contextmenu--visible');
    await settle();
    assert.equal(menu.parentNode, child.document.body);

    // Pressing an item does not reach the opener, where it would count as a click outside the menu.
    menu.firstElementChild!.dispatchEvent(new child.MouseEvent('mousedown', {bubbles: true}));
    assert.equal(mousedowns, 0);
    view.dispatchEvent(new child.MouseEvent('mousedown', {bubbles: true}));
    assert.equal(mousedowns, 1);
    const escape = new child.KeyboardEvent('keydown', {bubbles: true, key: 'Escape'});
    Object.defineProperty(escape, 'keyCode', {value: 27});
    view.dispatchEvent(escape);
    assert.deepEqual(keys, [27]);

    menu.classList.remove('react-contextmenu--visible');
    await settle();
    assert.equal(menu.parentNode, opener.document.body);
    disconnect();
});

test('a menu shown without a context menu event in the other window stays in the opener', async () => {
    const {opener, child} = windows();
    const menu = opener.document.createElement('nav');
    menu.className = 'react-contextmenu';
    opener.document.body.appendChild(menu);
    const disconnect = connectOpenerDocument(child.document, {opener: opener.document});
    menu.classList.add('react-contextmenu--visible');
    await settle();
    assert.equal(menu.parentNode, opener.document.body);
    disconnect();
});

test('a menu shown here goes back to the opener on disconnect', async () => {
    const {opener, child, view} = windows();
    const menu = opener.document.createElement('nav');
    menu.className = 'react-contextmenu';
    opener.document.body.appendChild(menu);
    const disconnect = connectOpenerDocument(child.document, {opener: opener.document});
    view.dispatchEvent(new child.MouseEvent('contextmenu', {bubbles: true}));
    menu.classList.add('react-contextmenu--visible');
    await settle();
    assert.equal(menu.parentNode, child.document.body);
    disconnect();
    assert.equal(menu.parentNode, opener.document.body);
});

test('styles the opener adds later are copied and kept in step only when asked', async () => {
    const {opener, child} = windows();
    const present = opener.document.createElement('style');
    present.textContent = '.present {}';
    opener.document.head.appendChild(present);
    const copied = () => [...child.document.head.querySelectorAll('[data-tw-opener-style]')].map(node => node.textContent);

    const plain = connectOpenerDocument(child.document, {opener: opener.document});
    const ignored = opener.document.createElement('style');
    ignored.textContent = '.ignored {}';
    opener.document.head.appendChild(ignored);
    await settle();
    assert.deepEqual(copied(), []);
    plain();

    const disconnect = connectOpenerDocument(child.document, {opener: opener.document, mirrorNewStyles: true});
    const later = opener.document.createElement('style');
    later.textContent = '.paint {}';
    opener.document.head.appendChild(later);
    const notStyle = opener.document.createElement('meta');
    opener.document.head.appendChild(notStyle);
    await settle();
    // The styles present when the window opened are left to whoever copied them then.
    assert.deepEqual(copied(), ['.paint {}']);
    later.textContent = '.paint { color: red }';
    await settle();
    assert.deepEqual(copied(), ['.paint { color: red }']);
    later.remove();
    await settle();
    assert.deepEqual(copied(), []);

    disconnect();
    opener.document.head.appendChild(later);
    await settle();
    assert.deepEqual(copied(), []);
});

test('canvases from the other window count as canvases of the opener while it is connected', () => {
    const {opener, child} = windows();
    const canvas = child.document.createElement('canvas');
    assert.equal(canvas instanceof opener.HTMLCanvasElement, false);
    const disconnect = connectOpenerDocument(child.document, {opener: opener.document});
    assert.equal(canvas instanceof opener.HTMLCanvasElement, true);
    assert.equal(opener.document.createElement('canvas') instanceof opener.HTMLCanvasElement, true);
    assert.equal(child.document.createElement('div') instanceof opener.HTMLCanvasElement, false);
    disconnect();
    assert.equal(canvas instanceof opener.HTMLCanvasElement, false);
});
