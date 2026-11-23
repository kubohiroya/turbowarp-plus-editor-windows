# TurboWarp Plus Editor Windows

[日本語](README.ja.md)

Windows that float inside the TurboWarp Plus Editor page, their title bars, and the editor's full-screen control. The package also has an icon menu button, the action row of a dialog, the hand-over of content to another surface such as a separate window (`./surfaces`), and copy transfers between windows (`./transfer`). These components know nothing about Scratch: the host decides what a window shows and mounts it into the window's element.

## Components

| Export | Role |
| --- | --- |
| `WindowDesktop` | The area windows float in. Children render beneath the windows. Pass `layoutMenu` to give each window a layout menu |
| `useWindowHost()` | Inside a `WindowDesktop`, opens a window and returns its mount point. Outside one it returns `undefined` |
| `WindowList` | Lists the open windows and brings one forward, or moves every window back into view |
| `WindowTitleBar` and its buttons | A title bar with open, minimize, maximize and dock buttons. With `presentation="external"` the window controls are hidden |
| `WindowLayoutMenu` | Undock, dock, duplicate, maximize, minimize and restore, for windows inside or outside the page |
| `DockablePanel` | Content that can leave its place for a window and return |
| `EditorFullscreenButton` | Puts the whole document, including menus and dialogs in body portals, into full screen. Renders nothing where full screen is unavailable |
| `IconMenuButton` | An icon button that opens a menu of items, for toolbars where a text label does not fit. Works with the arrow keys, Home, End and Escape |
| `dialogAction(button, action)` and `dialogActions(document, ...buttons)` | Lay out the buttons at the foot of a dialog, with an icon for each kind: `cancel`, `close`, `confirm` or `delete` |

## Exports without components

| Export | Role |
| --- | --- |
| `./surfaces` | Moves content from its dock to another surface, such as a separate window, through docked, opening and external states. The dock stays until the surface is ready, and the content returns on disconnection or error. It also records surfaces for recovery and collects edits not yet applied. It does not depend on the browser, Electron or the GUI. `createBrowserHost(parent, show, page?, detachOpener?, synchronousPageHide?)` is the host for a surface in a browser window or tab: the page receives a `MessagePort` after a ticketed handshake, and closing either window or navigating the child away disconnects with its cause |
| `./transfer` | Makes a reference for a copy between windows, checks its kind, version, session, transfer ID and expiry, and applies it once. The reference never carries the data itself or a URL to read it from |
| `./opener-document` | `connectOpenerDocument(child, {opener, mirrorNewStyles})` connects a document in another window to the editor document that renders into it. Mouse and touch input there is repeated on the editor document, React 16 listens there for every event, a context menu opened there is shown there while it is open, canvases created there pass the editor's `instanceof HTMLCanvasElement`, and, when asked, styles the editor adds later are copied. It returns a function that disconnects |

Labels are in English, or in Japanese when `locale` starts with `ja`. Load `@kubohiroya/turbowarp-plus-editor-windows/styles.css` as a global stylesheet.

The stylesheet also sets the backdrop behind GUI dialogs (`--ui-modal-overlay`) to a translucent dark tone, `rgba(0, 0, 0, 0.4)`, in place of the accent fill of the GUI's light theme. Set `--tw-modal-overlay` on `:root` to choose another colour.

React 16.14 or later is supported, because the Editor mounts these components in the GUI's React 16.

## Verification

Run `npm test` to build the package, check that it uses no React API newer than 16.14, and render each component.

## License

MPL-2.0. The window and title bar components were split out of `@kubohiroya/turbowarp-plus-editor-layout`, whose history this repository keeps. They came from the source of the Editor's previous release archive at `b0390c3`, carry no GPL code and import no GPL module.

`IconMenuButton`, `dialogAction`, `dialogActions`, `./surfaces` and `./transfer` moved here from `packages/editor-ui`, `packages/editor-surfaces` and `packages/editor-transfer` in turbowarp-plus-editor. The same author wrote all of them, and they changed from GPL-3.0 to MPL-2.0 in the move. The provenance audit is in the "由来の監査（7b）" section of the [migration plan in turbowarp-plus-packages](https://github.com/kubohiroya/turbowarp-plus-packages/blob/main/docs/editor-migration-plan.ja.md).
