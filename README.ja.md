# TurboWarp Plus Editor Windows

[English](README.md)

TurboWarp Plus Editor のページ内に浮かぶ窓、そのタイトルバー、エディター全体の全画面表示の切り替え。あわせて、アイコンのメニューボタン、ダイアログの操作ボタンの並び、別窓への表示の受け渡し（`./surfaces`）、窓をまたぐコピーの転送（`./transfer`）を持つ。これらの部品は Scratch について何も知らない。窓に何を表示するかはホストが決め、窓の要素に描画する。

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
| `IconMenuButton` | 文字のラベルが入らないツールバー向けに、アイコンのボタンから項目のメニューを開く。矢印キー・Home・End・Escape で操作できる |
| `dialogAction(button, action)`・`dialogActions(document, ...buttons)` | ダイアログの下端に操作ボタンを並べる。`cancel`・`close`・`confirm`・`delete` の種類に合わせてアイコンが付く |

## 部品を持たない export

| export | 役割 |
| --- | --- |
| `./surfaces` | 内容をドックから別窓などの表示先へ移す遷移（ドック・初期化中・外部表示）。準備ができるまでドックを残し、切断やエラーで戻す。表示先の記録と復旧、未反映の編集の回収も持つ。ブラウザー・Electron・GUI には依存しない |
| `./transfer` | 窓をまたぐコピーの転送参照を作り、型・版・セッション・転送ID・期限を照合して、一度だけ適用する。参照にはデータ本体や読み込みURLを入れない |
| `./opener-document` | `connectOpenerDocument(child, {opener, mirrorNewStyles})` は、別窓の document を、そこへ描画するエディターの document に結ぶ。別窓でのマウス・タッチの入力をエディターの document でも発生させ、React 16 が別窓ですべてのイベントを受けるようにし、別窓で開いたコンテキストメニューを開いている間だけ別窓に表示する。別窓で作ったキャンバスをエディターの `instanceof HTMLCanvasElement` に通し、指定すれば後からエディターに加わったスタイルを写す。戻り値の関数で切り離す |

表示は英語で、`locale` が `ja` で始まるときは日本語。`@kubohiroya/turbowarp-plus-editor-windows/styles.css` をグローバルなスタイルシートとして読み込む。

Editor は GUI の React 16 にこれらを描画するので、React 16.14 以降に対応する。

## 検証

`npm test` でビルドし、React 16.14 より新しい API を使っていないことと、各部品が描画できることを確かめる。

## ライセンス

MPL-2.0。窓とタイトルバーの部品は、`@kubohiroya/turbowarp-plus-editor-layout` から切り出したもので、その履歴をこのリポジトリに残している。もとは Editor の以前のリリースアーカイブ `b0390c3` のソースで、GPL のコードを含まず、GPL のモジュールも import しない。

`IconMenuButton`・`dialogAction`・`dialogActions`・`./surfaces`・`./transfer` は、turbowarp-plus-editor の `packages/editor-ui`・`packages/editor-surfaces`・`packages/editor-transfer` から移した。どれも同じ作者が書いたもので、GPL-3.0 から MPL-2.0 にした。由来の監査は [turbowarp-plus-packages の移行計画](https://github.com/kubohiroya/turbowarp-plus-packages/blob/main/docs/editor-migration-plan.ja.md)の「由来の監査（7b）」にある。
