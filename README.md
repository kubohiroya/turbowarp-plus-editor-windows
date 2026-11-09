# TurboWarp Plus Editor Windows

[日本語](README.ja.md)

Windows that float inside the TurboWarp Plus Editor page, their title bars, and the editor's full-screen control. These components know nothing about Scratch: the host decides what a window shows and mounts it into the window's element.

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

Labels are in English, or in Japanese when `locale` starts with `ja`. Load `@kubohiroya/turbowarp-plus-editor-windows/styles.css` as a global stylesheet.

React 16.14 or later is supported, because the Editor mounts these components in the GUI's React 16.

## Verification

Run `npm test` to build the package, check that it uses no React API newer than 16.14, and render each component.

## License

MPL-2.0. These components were split out of `@kubohiroya/turbowarp-plus-editor-layout`, whose history this repository keeps. They came from the source of the Editor's previous release archive at `b0390c3`, carry no GPL code and import no GPL module.
