# 安全セーフティ ｜ ドキュメント

現場スマホで使う点検実施画面に関する資料。

| 種別 | ファイル | 内容 |
|---|---|---|
| 仕様書 | [01-点検実施画面.md](./01-点検実施画面.md) | 点検実施画面の詳細仕様（画面要素・表示ルール・ボタンの活性条件・決定事項） |
| スライド | [点検実施画面_表示パターン.md](./点検実施画面_表示パターン.md) | 表示パターン一覧（Marp）。機械4＋仮設・その他6の計10パターン |
| 画像 | [images/](./images/) | スライドで使用する画面キャプチャ |

## スライドの表示方法

Marp 形式のため、以下のいずれかで表示・書き出しができる。

- VS Code 拡張「Marp for VS Code」でプレビュー
- CLI で PDF / HTML に書き出す

キャプチャをローカルファイルとして読み込むため、**`--allow-local-files` が必要**。

```
npx @marp-team/marp-cli docs/safety/点検実施画面_表示パターン.md --pdf --allow-local-files
npx @marp-team/marp-cli docs/safety/点検実施画面_表示パターン.md --images png --allow-local-files
```

## 表示パターンの再取得

画面を変更したあとにキャプチャを撮り直す場合は、開発サーバーを起動した状態で
`scripts/capture-inspection-patterns.mjs` を実行する。
