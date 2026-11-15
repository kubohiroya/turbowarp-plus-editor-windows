import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {
    DockWindowButton, IconMenuButton, WindowDesktop, WindowLayoutMenu, WindowList, WindowTitleBar, useWindowHost
} from '../dist/index.js';

const render = (element: React.ReactElement) => renderToStaticMarkup(element);

test('the title bar shows window controls only inside the editor', () => {
    const controls = React.createElement(DockWindowButton, {onDock() {}, label: 'Dock'});
    const internal = render(React.createElement(WindowTitleBar, {title: 'Code', windowControls: controls}));
    assert.match(internal, /aria-label="Code"/);
    assert.match(internal, /class="tw-window-titlebar__title">Code</);
    assert.match(internal, /Dock/);
    const external = render(React.createElement(WindowTitleBar, {title: 'Code', windowControls: controls, presentation: 'external'}));
    assert.doesNotMatch(external, /Dock/);
});

test('the layout menu is labelled in the editor language and starts closed', () => {
    assert.match(render(React.createElement(WindowLayoutMenu, {presentation: 'internal'})), /aria-label="Window layout"/);
    const japanese = render(React.createElement(WindowLayoutMenu, {presentation: 'internal', locale: 'ja-JP'}));
    assert.match(japanese, /aria-label="レイアウト変更"/);
    assert.match(japanese, /aria-expanded="false"/);
    assert.doesNotMatch(japanese, /<ul/);
});

test('the desktop renders its children, and the window list and host exist only inside it', () => {
    let inside: unknown;
    let outside: unknown = 'unset';
    function Probe({record}: {record: (host: unknown) => void}) {
        record(useWindowHost());
        return null;
    }
    const markup = render(React.createElement(WindowDesktop, null,
        React.createElement('p', null, 'editor'),
        React.createElement(Probe, {record: host => { inside = host; }}),
        React.createElement(WindowList)));
    assert.match(markup, /^<div class="tw-window-desktop"><p>editor<\/p><\/div>$/);
    assert.equal(typeof (inside as {open?: unknown})?.open, 'function');

    render(React.createElement(Probe, {record: host => { outside = host; }}));
    assert.equal(outside, undefined);
    assert.equal(render(React.createElement(WindowList)), '');
});

test('the icon menu button is labelled, closed at first and keeps the class it is given', () => {
    const markup = render(React.createElement(IconMenuButton, {
        label: 'Layout', icon: React.createElement('svg'), className: 'host-menu',
        items: [{id: 'one', label: 'One'}]
    }));
    assert.match(markup, /class="tw-icon-menu host-menu"/);
    assert.match(markup, /aria-label="Layout"/);
    assert.match(markup, /aria-haspopup="menu"/);
    assert.match(markup, /aria-expanded="false"/);
    assert.doesNotMatch(markup, /role="menu"/);
});
