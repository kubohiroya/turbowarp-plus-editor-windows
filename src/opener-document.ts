import React from 'react';
import ReactDOM from 'react-dom';

/**
 * Connects a document in another window to the editor document that renders into it.
 *
 * Views moved to another window keep running in the editor's script realm, and parts of the
 * Scratch GUI wait for input on the editor's global `document` and `window`: the sprite list's
 * drag sorting, the paint editor's drawing (paper.js), and the context menus, which are portaled
 * into the editor's `document.body`. React 16 also listens per document, and only on the
 * documents where an element with that handler was created. This connection fills those gaps
 * without changing the views:
 *
 * - mouse and touch input in the other document is repeated on the editor document,
 * - React 16 listens on the other document for every event it handles,
 * - a context menu opened from the other document is shown there while it is open,
 * - canvases created in the other document pass `instanceof HTMLCanvasElement` (paper.js checks it),
 * - optionally, styles the editor adds after the window opened are copied to it.
 */
export interface OpenerDocumentOptions {
    /** The document that renders into `child`. Defaults to the global document. */
    opener?: Document;
    /**
     * Copy `<style>` and stylesheet `<link>` elements the opener adds to its head after this call,
     * and keep them in step. Use it when the styles present at open were copied by someone else.
     */
    mirrorNewStyles?: boolean;
}

const pointerEvents = ['mousedown', 'mousemove', 'mouseup', 'touchstart', 'touchmove', 'touchend', 'touchcancel'] as const;
// The class react-contextmenu puts on a menu while it is shown.
const visibleMenu = 'react-contextmenu--visible';
// A menu that becomes visible this long after a context menu event in the other document is its menu.
const menuDelay = 1000;
const mirrored = 'data-tw-opener-style';

// Every event React 16 handles through a document listener, as element properties.
const reactHandlers = [
    'onClick', 'onContextMenu', 'onDoubleClick', 'onMouseDown', 'onMouseUp', 'onMouseMove', 'onMouseOver',
    'onMouseOut', 'onMouseEnter', 'onMouseLeave', 'onDrag', 'onDragEnd', 'onDragEnter', 'onDragExit', 'onDragLeave',
    'onDragOver', 'onDragStart', 'onDrop', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel',
    'onPointerDown', 'onPointerMove', 'onPointerUp', 'onPointerCancel', 'onPointerOver', 'onPointerOut',
    'onPointerEnter', 'onPointerLeave', 'onGotPointerCapture', 'onLostPointerCapture', 'onKeyDown', 'onKeyUp',
    'onKeyPress', 'onFocus', 'onBlur', 'onChange', 'onInput', 'onSubmit', 'onReset', 'onInvalid', 'onSelect',
    'onBeforeInput', 'onCompositionStart', 'onCompositionUpdate', 'onCompositionEnd', 'onCopy', 'onCut', 'onPaste',
    'onWheel', 'onScroll'
];

const isElement = (node: unknown): node is Element =>
    Boolean(node) && (node as Node).nodeType === 1;
const isStyle = (node: Node): node is HTMLStyleElement | HTMLLinkElement => isElement(node) &&
    (node.localName === 'style' || (node.localName === 'link' && /\bstylesheet\b/i.test(node.getAttribute('rel') ?? '')));

function copyMouseEvent(event: MouseEvent, view: Window & typeof globalThis): MouseEvent {
    return new view.MouseEvent(event.type, {
        bubbles: true, cancelable: event.cancelable, view, detail: event.detail,
        screenX: event.screenX, screenY: event.screenY, clientX: event.clientX, clientY: event.clientY,
        ctrlKey: event.ctrlKey, shiftKey: event.shiftKey, altKey: event.altKey, metaKey: event.metaKey,
        button: event.button, buttons: event.buttons
    });
}

function copyTouchEvent(event: TouchEvent, view: Window & typeof globalThis): TouchEvent | null {
    // Safari has no Touch constructor; touch input from the other window then stays there.
    if (typeof view.Touch !== 'function' || typeof view.TouchEvent !== 'function') return null;
    const touches = (list: TouchList) => Array.from(list, touch => new view.Touch({
        identifier: touch.identifier, target: touch.target, clientX: touch.clientX, clientY: touch.clientY,
        screenX: touch.screenX, screenY: touch.screenY, pageX: touch.pageX, pageY: touch.pageY,
        radiusX: touch.radiusX, radiusY: touch.radiusY, rotationAngle: touch.rotationAngle, force: touch.force
    }));
    return new view.TouchEvent(event.type, {
        bubbles: true, cancelable: event.cancelable, view, touches: touches(event.touches),
        targetTouches: touches(event.targetTouches), changedTouches: touches(event.changedTouches),
        ctrlKey: event.ctrlKey, shiftKey: event.shiftKey, altKey: event.altKey, metaKey: event.metaKey
    });
}

function copyKeyboardEvent(event: KeyboardEvent, view: Window & typeof globalThis): KeyboardEvent {
    const copy = new view.KeyboardEvent(event.type, {
        bubbles: true, cancelable: event.cancelable, view, key: event.key, code: event.code,
        location: event.location, repeat: event.repeat,
        ctrlKey: event.ctrlKey, shiftKey: event.shiftKey, altKey: event.altKey, metaKey: event.metaKey
    });
    // Menus still read the legacy codes, which the constructor cannot set.
    for (const name of ['keyCode', 'which', 'charCode'] as const) {
        Object.defineProperty(copy, name, {value: event[name]});
    }
    return copy;
}

/** Copy the opener's later styles into `child`. Returns a function that stops copying. */
function mirrorStyles(child: Document, opener: Document): () => void {
    const view = opener.defaultView;
    if (!view?.MutationObserver) return () => {};
    const copies = new Map<Node, Element>();
    const add = (node: HTMLStyleElement | HTMLLinkElement) => {
        if (copies.has(node)) return;
        const copy = child.importNode(node, true) as Element;
        copy.setAttribute(mirrored, '');
        child.head.appendChild(copy);
        copies.set(node, copy);
    };
    const sync = (node: Node | null) => {
        for (let current = node; current; current = current.parentNode) {
            const copy = copies.get(current);
            if (copy) {
                copy.textContent = current.textContent;
                return;
            }
        }
    };
    const observer = new view.MutationObserver(records => {
        for (const record of records) {
            if (record.target === opener.head) {
                record.addedNodes.forEach(node => { if (isStyle(node)) add(node); });
                record.removedNodes.forEach(node => {
                    copies.get(node)?.remove();
                    copies.delete(node);
                });
            } else {
                sync(record.target);
            }
        }
    });
    observer.observe(opener.head, {childList: true, subtree: true, characterData: true});
    return () => {
        observer.disconnect();
        copies.clear();
    };
}

// The other windows whose canvases each opener window accepts as its own.
const canvasRealms = new WeakMap<Window, Set<Window>>();

/**
 * Let `instanceof view.HTMLCanvasElement` accept canvases from `child`'s window. paper.js draws on an
 * offscreen canvas instead of a canvas that fails the check, so the paint editor stays blank when it
 * is first opened in another window.
 */
function acceptCanvases(view: Window & typeof globalThis, child: Window | null): () => void {
    const Canvas = view.HTMLCanvasElement;
    if (!child || !Canvas || (child as Window & typeof globalThis).HTMLCanvasElement === Canvas) return () => {};
    let realms = canvasRealms.get(view);
    if (!realms) {
        const others = realms = new Set();
        canvasRealms.set(view, realms);
        const native = Function.prototype[Symbol.hasInstance];
        Object.defineProperty(Canvas, Symbol.hasInstance, {configurable: true, value(this: unknown, value: unknown) {
            if (native.call(this, value)) return true;
            if (this !== Canvas) return false;
            for (const other of others) {
                try {
                    if (native.call((other as Window & typeof globalThis).HTMLCanvasElement, value)) return true;
                } catch {
                    // A closed window has no constructors left.
                }
            }
            return false;
        }});
    }
    realms.add(child);
    return () => { realms.delete(child); };
}

/** Make React 16 listen on `child` for every event it handles. */
function listenWithReact(child: Document): () => void {
    if (!/^16\./.test(ReactDOM.version ?? '')) return () => {};
    const container = child.createElement('div');
    container.hidden = true;
    container.setAttribute('aria-hidden', 'true');
    child.body.appendChild(container);
    const noop = () => {};
    // A legacy root's listeners stay on the document after it unmounts, so render it once.
    (ReactDOM as unknown as {render(element: React.ReactElement, container: Element): void})
        .render(React.createElement('div', Object.fromEntries(reactHandlers.map(name => [name, noop]))), container);
    return () => {
        (ReactDOM as unknown as {unmountComponentAtNode(container: Element): boolean}).unmountComponentAtNode(container);
        container.remove();
    };
}

export function connectOpenerDocument(child: Document, {
    opener = document, mirrorNewStyles = false
}: OpenerDocumentOptions = {}): () => void {
    const view = opener.defaultView as (Window & typeof globalThis) | null;
    if (child === opener || !view) return () => {};
    const stops: (() => void)[] = [];
    let menuRequested = -Infinity;
    // Menus from the opener's body that are shown in `child`.
    const menus = new Set<Element>();
    const inMenu = (target: EventTarget | null) => [...menus].some(menu => menu.contains(target as Node));

    const repeat = (event: Event) => {
        if (inMenu(event.target)) return;
        const copy = event.type.startsWith('touch') ?
            copyTouchEvent(event as TouchEvent, view) : copyMouseEvent(event as MouseEvent, view);
        if (!copy) return;
        opener.dispatchEvent(copy);
        if (copy.defaultPrevented && event.cancelable) event.preventDefault();
    };
    for (const type of pointerEvents) child.addEventListener(type, repeat, {passive: false});
    stops.push(() => { for (const type of pointerEvents) child.removeEventListener(type, repeat); });

    // While a menu is shown here, keys reach the menu's handlers on the opener.
    const repeatKey = (event: KeyboardEvent) => {
        if (!menus.size) return;
        const copy = copyKeyboardEvent(event, view);
        opener.dispatchEvent(copy);
        if (copy.defaultPrevented) event.preventDefault();
    };
    child.addEventListener('keydown', repeatKey);
    stops.push(() => child.removeEventListener('keydown', repeatKey));

    const requestMenu = () => { menuRequested = Date.now(); };
    child.addEventListener('contextmenu', requestMenu, true);
    stops.push(() => child.removeEventListener('contextmenu', requestMenu, true));

    // React removes a menu from the opener's body when its owner unmounts, so each goes back there.
    const returnMenu = (menu: Element) => {
        menus.delete(menu);
        if (menu.parentNode === child.body) opener.body.appendChild(opener.adoptNode(menu));
    };
    if (view.MutationObserver) {
        const observer = new view.MutationObserver(records => {
            for (const record of records) {
                const menu = record.target;
                if (!isElement(menu)) continue;
                const shown = menu.classList.contains(visibleMenu);
                if (shown && !menus.has(menu) && menu.parentNode === opener.body && Date.now() - menuRequested < menuDelay) {
                    menuRequested = -Infinity;
                    menus.add(menu);
                    child.body.appendChild(child.adoptNode(menu));
                } else if (!shown && menus.has(menu)) {
                    returnMenu(menu);
                }
            }
        });
        observer.observe(opener.body, {subtree: true, attributes: true, attributeFilter: ['class']});
        // Menus moved here are outside the opener's body, so watch them where they are now.
        const local = new (child.defaultView?.MutationObserver ?? view.MutationObserver)(records => {
            for (const record of records) {
                const menu = record.target;
                if (isElement(menu) && menus.has(menu) && !menu.classList.contains(visibleMenu)) returnMenu(menu);
            }
        });
        local.observe(child.body, {subtree: true, attributes: true, attributeFilter: ['class']});
        stops.push(() => {
            observer.disconnect();
            local.disconnect();
            for (const menu of [...menus]) returnMenu(menu);
        });
    }

    stops.push(listenWithReact(child));
    stops.push(acceptCanvases(view, child.defaultView));
    if (mirrorNewStyles) stops.push(mirrorStyles(child, opener));
    let stopped = false;
    return () => {
        if (stopped) return;
        stopped = true;
        for (const stop of stops.reverse()) {
            try {
                stop();
            } catch {
                // The other window may already be gone.
            }
        }
    };
}
