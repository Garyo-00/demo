# 点検システム 画面デモ（Vite + React）

デジタル点検システムの画面デモ。Vite + React 構成です。

## セットアップ

```bash
cd ~/Documents/demo
npm install        # 依存パッケージのインストール（初回のみ）
npm run dev        # 開発サーバー起動 → http://localhost:3000/
```

`npm run dev` を実行するとブラウザが自動で開きます。ルート（`/`）がデモ画面一覧、`/app` がダッシュボードです。

## その他コマンド

```bash
npm run build      # 本番ビルド（dist/ を生成）
npm run preview    # ビルド結果をローカルで確認
```

## 構成

```
demo/
├─ index.html            … Vite エントリ
├─ vite.config.js        … dev サーバー（port 3000 / 自動起動）
├─ package.json
└─ src/
   ├─ main.jsx           … エントリ（BrowserRouter）
   ├─ App.jsx            … ルーティング定義
   ├─ index.css          … スタイル
   ├─ data.js            … サンプルデータ・集計・メニュー定義
   ├─ components/
   │  ├─ AppLayout.jsx   … サイドバー＋ヘッダのレイアウト
   │  └─ Card.jsx        … 数値カード
   └─ pages/
      ├─ DemoList.jsx        … デモ画面一覧（ルート）
      ├─ Dashboard.jsx       … ダッシュボード
      ├─ InspectionRecords.jsx … 点検記録確認（種別・状態で絞り込み）
      └─ Placeholder.jsx     … 未実装メニュー用

```

## 画面

- **デモ画面一覧（/）** … 今後デモを増やす場合は `src/pages/DemoList.jsx` の `DEMOS` 配列に追加。
- **ダッシュボード（/app）** … 機械の当日サマリ4カード、仮設・その他4カード、月例/組立後等点検3カード。各サマリカードの「点検記録確認」リンクで、種別・状態で絞り込んだ一覧（`/app/inspection`）へ遷移。
- データはすべて `src/data.js` 内のサンプル値（バックエンド不要）。
