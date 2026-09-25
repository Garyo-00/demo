# KY-NEXT（デジタルKY）画面デモ — 本番との対応

> 位置づけ：本番アプリ `kynext/`（TypeScript / refine / urql・GraphQL / 社内パッケージ `@repo/*`）の画面構成・見た目・操作フローを、**静的データと React state だけで** `/kynext` 配下に再現した要件確認用モック。
> 本番のソースはこのリポジトリの `kynext/` に置いてあるが、社内パッケージ（`@repo/ui`, `@repo/features`, `@repo/graphql` など）が無いため単体では動かない。デモはそれらを MUI 標準部品で置き換えている。

---

## 1. デモの構成

```
src/
├─ kynextData.js                    … カタログ（テンプレート）・KYシート・ユーザー・ダイレクト連携のサンプルデータと計算ユーティリティ
├─ components/
│  ├─ KynextLayout.jsx              … サイドバー＋ヘッダ（本番 ThemedLayout + Sider + Header）。元請／協力会社のロール切替付き
│  └─ kynext/
│     ├─ KynextContext.jsx          … 画面間で共有する状態（本番の GraphQL 取得・更新をブラウザ上の state に置き換え）
│     ├─ KynextProviderRoute.jsx    … Provider をレイアウトの外側で張るルート
│     ├─ KynextCommon.jsx           … 共通部品（ステータスチップ・必須マーク・サインパッド・SplitFab・確認ダイアログ・通知）
│     └─ ...                        … 画面ごとの部品（Detail* / Create* / Template* など）
└─ pages/kynext/                    … 各画面（本番 src/pages/**/index.tsx に対応）
```

- ルート定義は `src/App.jsx` の `/kynext` ブロック。本番 `kynext/src/router.tsx` の URL 構成を `/kynext` 接頭辞付きでそのまま写している。
- テーマは既存デモ共通の `src/theme.js`。本番の `PureLightTheme` とは色が異なるが、部品の使い方（MUI 標準）は同じ。

## 2. 画面と本番ソースの対応

| 画面 | デモのパス | デモのファイル | 本番のソース（`kynext/src/`） |
|---|---|---|---|
| ログイン | `/kynext/login` | `pages/kynext/KynextLogin.jsx` | `pages/auth/login.tsx`, `components/Auth/Login` |
| 現場選択 | `/kynext/projects/select` | `pages/kynext/KynextProjectSelect.jsx` | `pages/projects/select.tsx`, `features/project/ProjectSelectPaper.tsx` |
| KYシート一覧 | `/kynext` | `pages/kynext/KynextSheets.jsx` | `pages/kySheets/index.tsx`, `features/kySheet/KYNEXTSheets.tsx`, `KYNEXTSheetDataGrid.tsx`, `columns.tsx`, `dataGridByCompany/*` |
| 新規作成（参照選択） | `/kynext/ky-sheets/create/reference` | `pages/kynext/KynextSheetReference.jsx` | `features/create/reference/*` |
| 作成／修正フォーム | `/kynext/ky-sheets/create`, `/kynext/ky-sheets/:id/edit` | `pages/kynext/KynextSheetForm.jsx` | `features/create/custom/*`（`CreateCustomKYNEXTSheetPage.tsx`, `virtualSteps.ts` ほか） |
| KYシート詳細 | `/kynext/ky-sheets/:id` | `pages/kynext/KynextSheetDetail.jsx` | `pages/kySheets/[kySheet]/index.tsx`, `features/kySheet/DetailKynextnext.tsx`, `detail/*` |
| 元請からの安全指示 | `/kynext/ky-sheets/:id/safety-instructions` | `pages/kynext/KynextSafetyInstructions.jsx` | `features/kySheet/safetyInstructions/*` |
| 職長チェックリスト回答 | `/kynext/ky-sheets/:id/checklists/:checklist` | `pages/kynext/KynextChecklist.jsx` | `features/kySheet/checklist/*` |
| 元請確認サイン（作成後／完了後） | `/kynext/ky-sheets/:id/create-confirm/sign`, `.../complete-confirm/sign` | `pages/kynext/KynextConfirmSign.jsx` | `features/kySheet/createConfirmButton/sign`, `completeConfirmButton/sign` |
| 作業員チェック（作業内容→リスク評価→チェックリスト→サイン） | `/kynext/ky-sheets/:id/worker-check/{procedures,risks,checklist,sign}` | `pages/kynext/KynextWorkerCheck.jsx` | `features/kySheet/workerCheck/*`, `workerCheckLogined/*` |
| KY出力 | `/kynext/export` | `pages/kynext/KynextExport.jsx` | `pages/kynextExport/index.tsx`, `features/kySheet/export/*` |
| QRコード発行 | `/kynext/ky-sheets/qr-codes` | `pages/kynext/KynextQrCodes.jsx` | `features/kySheet/KYNEXTSheetsQRCodes.tsx`, `components/KYNEXTSheets*QRCodesBox.tsx` |
| KYシート単体QR | `/kynext/ky-sheets/:id/qr-code` | `pages/kynext/KynextSheetQr.jsx` | `pages/kySheets/qrCode/index.tsx` |
| ダイレクト連携 | `/kynext/integration/direct` | `pages/kynext/KynextDirect.jsx` | `features/direct/*` |
| 設定（テンプレート一覧） | `/kynext/templates` | `pages/kynext/KynextTemplates.jsx` | `pages/templates/index.tsx`, `features/kySheet/templates/*`, `features/companySettings/*` |
| テンプレート詳細／編集 | `/kynext/templates/:template`, `.../edit` | `pages/kynext/KynextTemplateDetail.jsx` | `features/kySheet/templateEdit/*`, `features/kySheet/settings/*` |
| 現場情報 | `/kynext/projects/detail` | `pages/kynext/KynextProjectDetail.jsx` | `@repo/features/src/project/detail/ProjectCard`（社内パッケージ。デモは独自構成） |

## 3. 本番と意図的に変えている点（デモ固有）

- **ロール切替**：ヘッダ右の「元請／協力会社」トグルはデモ用。本番はログインユーザーの現場ロール（`me.projectRole`）で決まる。
  - 元請：設定・ダイレクト連携メニューが出る。元請確認・安全指示・テンプレート編集ができる。
  - 協力会社（職長）：KYシートの作成・修正・職長確認・作業員チェックができる。元請確認は disabled（理由をツールチップ表示）。
- **権限判定**：本番は API が返す `permissions.*`（`allowed` / `deniedReason`）で判定する。デモは「作業完了後の元請確認済み（Completed）は編集不可」「他社のシートは削除不可」程度に簡略化し、文言は本番 `permissions.ts` のものを使っている。
- **データ**：すべて `src/kynextData.js` のサンプル値。リロードで初期状態に戻る（作成フローの下書きだけ sessionStorage）。
- **置き換えた部品**：
  - `@mui/x-data-grid` → MUI `Table`（ページネーション・並び替えは簡易実装）
  - `@mui/x-date-pickers` → `<input type="date" / "month">`
  - `react-hook-form` + `zod` → `useState` と自前の必須チェック
  - `@dnd-kit`（ドラッグ並び替え）→ 上下ボタン
  - `@react-pdf/renderer`（PDF出力）→ `window.print()` または通知のみ
  - `@repo/features/src/signature`（サインパッド）→ `KynextCommon.jsx` の canvas 実装
  - AI提案（Arch Intelligence）→ 固定の提案を 1 秒後に返すダミー
- **未再現**：LINE ログイン・パスワード再設定・旧 uuid ルート（`/projects/:project/ky-sheets/...`）・ゲスト（署名付き URL）表示・dnn 日報からのディープリンク。

## 4. サンプルデータの概要

- 現場：テストプロジェクト_星野（他 2 現場を現場選択に表示）
- テンプレート：標準テンプレート（使用中）／品質KY付きテンプレート／本店標準（一括適用・元請）
- KYシート：本日 3 件（提出済・作業中・仮作成）、前日 2 件（完了）、翌日 1 件、過去 2 件。仮作成は作業間調整proから自動生成された想定。
- 基本情報カタログ：作業日／一次会社／職長氏名／職種／作業内容／作業場所／作業人数／作業開始時刻＋任意グループ「使用機械・工具」（条件付き項目・画像添付を含む）
- リスク評価：重大性 × 可能性（各 1〜3）、評価 Ⅰ〜Ⅲ（色付き）。安全KY は作業手順 3〜5 件＋指差呼称。
- 作業員サイン：作業員チェックリスト（体調・睡眠時間・確認事項）＋手書き署名＋集合写真。
- 元請確認：KY作成後（署名）／作業完了後（ボタン）、元請からの安全指示あり。
