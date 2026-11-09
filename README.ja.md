# TurboWarp Plus Editor Windows

[English](README.md)

TurboWarp Plus Editor のページ内に浮かぶ窓、そのタイトルバー、エディター全体の全画面表示の切り替え。これらの部品は Scratch について何も知らない。窓に何を表示するかはホストが決め、窓の要素に描画する。

## 部品

| export | 役割 |
| --- | --- |
| `WindowDesktop` | 窓が浮かぶ領域。子要素は窓の下に描画する。`layoutMenu` を渡すと各窓にレイアウトメニューが付く |
| `useWindowHost()` | `WindowDesktop` の中で窓を開き、その描画先を返す。外では `undefined` を返す |
| `WindowList` | 開いている窓を一覧し、選んだ窓を前面に出す。すべての窓を見える位置に戻すこともできる |
| `WindowTitleBar` とそのボタン | 別窓で開く・最小化・最大化・ドックのボタンを持つタイトルバー。`presentation="external"` では窓の操作ボタンを隠す |
| `WindowLayoutMenu` | ページ内の窓と別窓の両方で、アンドック・ドック・複製・最大化・最小化・元に戻す |
| `DockablePanel` | 元の位置から窓へ移り、戻ってこられる内容 |
| `EditorFullscreenButton` | body のポータルに描くメニューやダイアログも含めて、文書全体を全画面にする。全画面が使えない環境では何も描画しない |

表示は英語で、`locale` が `ja` で始まるときは日本語。`@kubohiroya/turbowarp-plus-editor-windows/styles.css` をグローバルなスタイルシートとして読み込む。

Editor は GUI の React 16 にこれらを描画するので、React 16.14 以降に対応する。

## 検証

`npm test` でビルドし、React 16.14 より新しい API を使っていないことと、各部品が描画できることを確かめる。

## ライセンス

MPL-2.0。`@kubohiroya/turbowarp-plus-editor-layout` から切り出した部品で、その履歴をこのリポジトリに残している。もとは Editor の以前のリリースアーカイブ `b0390c3` のソースで、GPL のコードを含まず、GPL のモジュールも import しない。
