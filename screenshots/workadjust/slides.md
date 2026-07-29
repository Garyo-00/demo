---
marp: true
paginate: true
size: 16:9
theme: default
style: |
  section {
    background: #f4f6f8;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    justify-content: flex-start;
    padding: 26px 34px 20px;
  }
  section.title { align-items: center; justify-content: center; }
  h5 { margin: 0 0 12px; color: #33415a; font-size: 19px; text-align: center; }
  h1 { color: #1b2430; }
  img { box-shadow: 0 6px 20px rgba(0,0,0,.18); border-radius: 6px; background:#fff; }
  /* 画面（左）＋ 詳細仕様の記入欄（右）の2カラム */
  .row { display: flex; gap: 22px; flex: 1; min-height: 0; align-items: stretch; }
  .shot { flex: 1; display: flex; align-items: center; justify-content: center; min-width: 0; }
  .shot img { max-width: 100%; max-height: 590px; object-fit: contain; }
  /* スマホ画面（端末キャプチャを横に2枚並べる） */
  .shot-phones p { display: flex; gap: 18px; margin: 0; align-items: center; justify-content: center; }
  .shot-phones img { max-height: 588px; max-width: 47%; width: auto; border: 1px solid #d5dbe4; }
  .spec {
    flex: 0 0 336px; display: flex; flex-direction: column;
    background: #fff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 14px 16px;
  }
  .spec-h {
    font-weight: 700; color: #1f6feb; font-size: 15px;
    padding-bottom: 8px; margin-bottom: 8px; border-bottom: 2px solid #e8eef7;
  }
  .spec-body {
    flex: 1; color: #23324a; font-size: 14px; line-height: 32px;
    background-image: repeating-linear-gradient(#ffffff, #ffffff 31px, #eef1f5 31px, #eef1f5 32px);
  }
  .spec-body ul { margin: 0; padding-left: 20px; }
  .spec-body li { margin: 0; line-height: 32px; }
  /* コメントへの回答（最終ページに集約） */
  section.qa { align-items: stretch; justify-content: flex-start; padding: 34px 46px 24px; }
  section.qa h5 { align-self: center; }
  .qa { text-align: left; width: 100%; }
  .qa-item { margin: 0 0 12px; }
  .qa-q { font-size: 15px; line-height: 1.45; }
  .qa-tag { display: inline-block; font-size: 11px; font-weight: 700; color: #1f6feb; background: #e8f1ff; border-radius: 6px; padding: 1px 8px; margin-right: 6px; }
  .qa-a { margin-top: 5px; border: 1px solid #cbd2dc; border-radius: 6px; min-height: 26px; background: #fff; padding: 5px 10px; font-size: 13px; color: #475467; }
  /* セクション区切り（専用ページ） */
  section.divider { align-items: center; justify-content: center; text-align: center; background: #1b2430; }
  section.divider .kicker { color: #7fb0ff; font-weight: 700; letter-spacing: .14em; font-size: 15px; margin-bottom: 12px; }
  section.divider h1 { color: #ffffff; font-size: 44px; margin: 0; }
  section.divider p { color: #c5ced9; font-size: 18px; margin-top: 14px; }
---

<!-- _class: title -->
<!-- _paginate: false -->

# 作業間調整pro 画面キャプチャ

/workadjust の各画面を「元請ビュー」「職長ビュー」に分けて掲載（1枚1ページ・右側は詳細仕様の記入欄）

<small>デモ日付：2026年7月9日（木）／確定前は7月10日（金）</small>

---

<!-- _class: divider -->
<!-- _paginate: false -->

<div class="kicker">SECTION 1 / 6</div>

# PC画面・元請ビュー

パソコン画面／元請ユーザーが見る画面

---

##### 01-1. 作業予定一覧 — 確定後

<div class="row">
<div class="shot">

![](01-1-作業予定一覧_確定後.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>表示中の日付の作業予定を一覧表示（並び順は業種を基準）。</li><li>列：協力会社名／業種／職種／作業場所（棟・階・エリア・工区）／作業内容／作業人数（予定・実績）／元請安全指示事項。</li><li>ステータス（未確定／確定済）を表示。確定済の行は薄いグレー。</li><li>確定・実績入力・出力は元請のみ。確定済は編集・削除不可（要・確定解除）。</li></ul></div></div>
</div>

---

##### 01-2. 作業予定一覧 — 確定前

<div class="row">
<div class="shot">

![](01-2-作業予定一覧_確定前.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>未確定レコードがある状態。</li><li>元請が「確定」で当日ぶんを一括確定（確定時に元請安全指示事項を入力）。</li><li>確定ボタンは元請のみ表示。職長は作成・編集まで。</li><li>運用フロー：職長が作成 → 元請が確定 → 元請が実績入力。</li></ul></div></div>
</div>

---

##### 01-3. 作業予定一覧 — 出力

<div class="row">
<div class="shot">

![](01-3-作業予定一覧_出力.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>確定済みのみをA4帳票で出力（印刷プレビュー）。</li><li>列に業種・職種を含む。職長名は非表示。</li><li>押印欄あり（元請担当者・押印）。</li></ul></div></div>
</div>

---

##### 02-1. 作業予定一覧 — 新規作成（作業ブロックを複数登録）

<div class="row">
<div class="shot">

![](02-1-作業予定一覧_新規作成.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>共通項目（日付・協力会社名・業種・職種・職長）＋作業ブロック（棟・階・エリア・工区・作業内容・作業人数・工数）。</li><li>作業ブロックは複数追加可。1回の作成で複数レコードを登録。</li><li>協力会社・業種・職種はログインユーザー情報から自動入力（変更可）。業種・職種は選択のみ（自由記述不可）。</li><li>職長は協力会社から自動反映。作業人数は通常／早出・残業で人数・工数を入力（一覧の人数は通常作業のみ）。</li></ul></div></div>
</div>

---

##### 02-2. 作業予定一覧 — コピー作成（元請）

<div class="row">
<div class="shot">

![](02-2-作業予定一覧_コピー作成元請.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>過去の作業予定を複製し、当日ぶんとして登録。</li><li>元請版：全協力会社別に直近3日を表示、複数選択して一括登録（未確定で登録）。</li></ul></div></div>
</div>

---

##### 02-3. 作業予定一覧 — コピー作成（職長）

<div class="row">
<div class="shot">

![](02-3-作業予定一覧_コピー作成職長.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>職長版：自社が作成した直近5日を表示、選択して当日に複製（未確定で登録）。</li></ul></div></div>
</div>

---

##### 03. 作業予定一覧 — 実績入力

<div class="row">
<div class="shot">

![](03-作業予定一覧_実績入力.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>確定済みの各作業に作業人数（実績）・工数を入力（会社ごとにまとめて表示）。</li><li>入場人数はDNN（出面・日報管理）連携の値を表示。</li><li>入力は元請。</li></ul></div></div>
</div>

---

##### 04-1. 予約 — ゲート（確定前）

<div class="row">
<div class="shot">

![](04-1-予約_ゲート_確定前.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>タイムライン（15分単位）で「ゲート×時刻」に予約バーを表示。</li><li>通常予約＝青、スポット予約＝オレンジ。通常予約の重複は薄い赤帯で警告（ヘッダーのベルにも件数表示）。</li><li>確定は全タブ（揚重機／ゲート／資機材・その他）共通・日付単位。確定は元請のみ。</li><li>デモは枠クリックで編集・削除（実運用はドラッグで新規作成）。</li></ul></div></div>
</div>

---

##### 04-2. 予約 — ゲート（確定後）

<div class="row">
<div class="shot">

![](04-2-予約_ゲート_確定後.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>確定すると当日の通常・スポット予約をグレーアウト（編集不可）。</li><li>確定後は通常予約は作成不可、スポット予約のみ追加可（追加分は次回確定までは編集可）。</li><li>「確定解除」で編集可能に戻す（元請のみ）。</li></ul></div></div>
</div>

---

##### 05-1. 予約 — 揚重機（確定前）

<div class="row">
<div class="shot">

![](05-1-予約_揚重機_確定前.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>タイムライン（15分単位）で「揚重機×時刻」に予約バーを表示。</li><li>通常予約＝青、スポット予約＝オレンジ。通常予約の重複は薄い赤帯で警告（ヘッダーのベルにも件数表示）。</li><li>確定は全タブ（揚重機／ゲート／資機材・その他）共通・日付単位。確定は元請のみ。</li><li>デモは枠クリックで編集・削除（実運用はドラッグで新規作成）。</li></ul></div></div>
</div>

---

##### 05-2. 予約 — 揚重機（確定後）

<div class="row">
<div class="shot">

![](05-2-予約_揚重機_確定後.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>確定すると当日の通常・スポット予約をグレーアウト（編集不可）。</li><li>確定後は通常予約は作成不可、スポット予約のみ追加可（追加分は次回確定までは編集可）。</li><li>「確定解除」で編集可能に戻す（元請のみ）。</li></ul></div></div>
</div>

---

##### 06-1. 予約 — その他（確定前）

<div class="row">
<div class="shot">

![](06-1-予約_その他_確定前.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>タイムライン（15分単位）で「資機材・その他×時刻」に予約バーを表示。</li><li>通常予約＝青、スポット予約＝オレンジ。通常予約の重複は薄い赤帯で警告（ヘッダーのベルにも件数表示）。</li><li>確定は全タブ（揚重機／ゲート／資機材・その他）共通・日付単位。確定は元請のみ。</li><li>デモは枠クリックで編集・削除（実運用はドラッグで新規作成）。</li></ul></div></div>
</div>

---

##### 06-2. 予約 — その他（確定後）

<div class="row">
<div class="shot">

![](06-2-予約_その他_確定後.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>確定すると当日の通常・スポット予約をグレーアウト（編集不可）。</li><li>確定後は通常予約は作成不可、スポット予約のみ追加可（追加分は次回確定までは編集可）。</li><li>「確定解除」で編集可能に戻す（元請のみ）。</li></ul></div></div>
</div>

---

##### 07-1. 予約 — 予約作成（ゲート）

<div class="row">
<div class="shot">

![](07-1-予約_予約作成ゲート.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>予約種別（通常／スポット）・資源選択・協力会社名・車種・日付・開始/終了（スポットは所要時間）・作業内容（最大25文字）・備考。</li><li>車種はゲートのみ。備考は一覧非表示・詳細で確認。</li><li>予約時間は15分単位。</li></ul></div></div>
</div>

---

##### 07-2. 予約 — 予約作成（揚重機）

<div class="row">
<div class="shot">

![](07-2-予約_予約作成揚重機.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>予約種別（通常／スポット）・資源選択・協力会社名・日付・開始/終了（スポットは所要時間）・作業内容・備考。</li><li>揚重機は車種なし。備考は一覧非表示・詳細で確認。</li></ul></div></div>
</div>

---

##### 07-3. 予約 — 出力

<div class="row">
<div class="shot">

![](07-3-予約_出力.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>資源種別（揚重機／ゲート／資機材・その他）ごとの予約表をA4帳票で出力。</li><li>押印欄あり（登録台数欄は廃止）。</li></ul></div></div>
</div>

---

##### 08. 配置図作成

<div class="row">
<div class="shot">

![](08-配置図作成.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>日付ごとに配置図を管理。台紙セレクタで切替、前日からコピー可。</li><li>台紙上に作業・資機材・ゲート・注意の配置（マーカー）を表示。</li><li>元請連絡事項（日付ごと）を記入。1日に登録台紙分の配置図を作成可。</li></ul></div></div>
</div>

---

##### 09. 配置図作成 — 新規作成（台紙選択）

<div class="row">
<div class="shot">

![](09-配置図作成_新規作成台紙選択.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>「＋配置図を新規作成」で、作業配置図設定に登録済みの台紙から選択して作成。</li></ul></div></div>
</div>

---

##### 10. 配置図作成 — 配置を追加

<div class="row">
<div class="shot">

![](10-配置図作成_配置を追加.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>未保存（編集モード）で台紙上をクリックして配置を追加・編集 →「保存して確定」。</li><li>本番ではスタンプの追加や編集が可能。</li></ul></div></div>
</div>

---

##### 11. 作業配置図設定 — 一覧

<div class="row">
<div class="shot">

![](11-作業配置図設定_一覧.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>台紙（フロア）の一覧。ステータス「変換済／未変換」（PDF・画像の登録状態、NEOと共通）。</li><li>⋮メニューから詳細・削除。</li></ul></div></div>
</div>

---

##### 12. 作業配置図設定 — 登録

<div class="row">
<div class="shot">

![](12-作業配置図設定_登録.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>フロア名・備考・図面（画像）を登録。</li><li>「平面図」の名称は立面図にも対応するためNEO側で「図面」等へ変更予定。</li></ul></div></div>
</div>

---

##### 13. 作業配置図設定 — 詳細

<div class="row">
<div class="shot">

![](13-作業配置図設定_詳細.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>登録した台紙の詳細（備考・図面プレビュー）を表示。</li></ul></div></div>
</div>

---

##### 14. 資機材・ゲート登録 — 揚重機

<div class="row">
<div class="shot">

![](14-資機材ゲート登録_揚重機.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>揚重機の登録一覧。列：ID・カテゴリ・表示名（現場内呼称）・持込会社名・一次会社・予約表示・操作。</li><li>「予約表示」チェックで予約画面への表示ON/OFF。</li></ul></div></div>
</div>

---

##### 15. 資機材・ゲート登録 — ゲート

<div class="row">
<div class="shot">

![](15-資機材ゲート登録_ゲート.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>ゲートの登録一覧（ゲートID・ゲート名・設置場所・備考・予約表示・操作）。</li><li>「予約表示」チェックで予約画面への表示ON/OFF。</li></ul></div></div>
</div>

---

##### 16. 資機材・ゲート登録 — 資機材

<div class="row">
<div class="shot">

![](16-資機材ゲート登録_資機材.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>資機材（その他）の登録一覧。列：ID・カテゴリ・表示名（現場内呼称）・持込会社名・一次会社・予約表示・操作。</li><li>「予約表示」チェックで予約画面への表示ON/OFF。</li></ul></div></div>
</div>

---

##### 17. 資機材・ゲート登録 — 新規登録

<div class="row">
<div class="shot">

![](17-資機材ゲート登録_新規登録.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>カテゴリ・表示名（現場内呼称）・持込会社名・一次会社を登録（すべて必須）。</li></ul></div></div>
</div>

---

##### 18. 資機材・ゲート登録 — 一括登録

<div class="row">
<div class="shot">

![](18-資機材ゲート登録_一括登録.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>複数行をまとめて登録（4項目すべて入力された行のみ登録）。</li></ul></div></div>
</div>

---

##### 19. 資機材・ゲート登録 — 持込機械から同期

<div class="row">
<div class="shot">

![](19-資機材ゲート登録_持込機械から同期.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>別サービス「安全セーフティ」の持込機械一覧から選択して取り込み。</li></ul></div></div>
</div>

---

##### 20. 協力会社設定 — 一覧

<div class="row">
<div class="shot">

![](20-協力会社設定_一覧.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>DNN・他サービスと共通利用する協力会社設定。</li><li>会社×職種、表示設定（入退場システムの選択肢として表示）、検索・CSVインポート/エクスポート。</li></ul></div></div>
</div>

---

##### 21. 協力会社設定 — 新規作成

<div class="row">
<div class="shot">

![](21-協力会社設定_新規作成.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>協力会社名＋業種・職種（複数）＋職長ユーザー＋表示設定を登録。</li></ul></div></div>
</div>

---

##### 22. 予約設定 — 予約時間設定

<div class="row">
<div class="shot">

![](22-設定_予約時間設定.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>揚重機／ゲート／資機材の1日の予約可能時間を設定（開始0〜6時・終了24〜30時、24時間以内）。</li></ul></div></div>
</div>

---

##### 23. 予約設定 — 予約権限設定

<div class="row">
<div class="shot">

![](23-設定_予約権限設定.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>予約時のアカウント要否。揚重機・ゲートは「アカウント必須」固定、その他は必須／不要を選択。</li></ul></div></div>
</div>

---

##### 24. 予約設定 — 予約種類設定

<div class="row">
<div class="shot">

![](24-設定_予約種類設定.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>予約方式。揚重機・ゲートは「時間制」固定、その他は時間制／2部制を選択。</li></ul></div></div>
</div>

---

##### 25. 予約設定 — 予約時間間隔設定

<div class="row">
<div class="shot">

![](25-設定_予約時間間隔設定.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>予約枠の時間間隔（15分／30分／60分）。スポット予約の所要時間候補に影響。</li></ul></div></div>
</div>

---

<!-- _class: divider -->
<!-- _paginate: false -->

<div class="kicker">SECTION 2 / 6</div>

# PC画面・職長ビュー

パソコン画面／職長ユーザーが見る画面（確定・出力・設定・配置図作成・QR発行・通知ベルは非表示）

---

##### 01-1. 作業予定一覧 — 確定後

<div class="row">
<div class="shot">

![](foreman/01-1-作業予定一覧_確定後.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>表示中の日付の作業予定を一覧表示（並び順は業種を基準）。</li><li>列：協力会社名／業種／職種／作業場所（棟・階・エリア・工区）／作業内容／作業人数（予定・実績）／元請安全指示事項。</li><li>ステータス（未確定／確定済）を表示。確定済の行は薄いグレー。</li><li>確定・実績入力・出力は元請のみ。確定済は編集・削除不可（要・確定解除）。</li></ul></div></div>
</div>

---

##### 01-2. 作業予定一覧 — 確定前

<div class="row">
<div class="shot">

![](foreman/01-2-作業予定一覧_確定前.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>未確定レコードがある状態。</li><li>元請が「確定」で当日ぶんを一括確定（確定時に元請安全指示事項を入力）。</li><li>確定ボタンは元請のみ表示。職長は作成・編集まで。</li><li>運用フロー：職長が作成 → 元請が確定 → 元請が実績入力。</li></ul></div></div>
</div>

---

##### 02-1. 作業予定一覧 — 新規作成（作業ブロックを複数登録）

<div class="row">
<div class="shot">

![](foreman/02-1-作業予定一覧_新規作成.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>共通項目（日付・協力会社名・業種・職種・職長）＋作業ブロック（棟・階・エリア・工区・作業内容・作業人数・工数）。</li><li>作業ブロックは複数追加可。1回の作成で複数レコードを登録。</li><li>協力会社・業種・職種はログインユーザー情報から自動入力（変更可）。業種・職種は選択のみ（自由記述不可）。</li><li>職長は協力会社から自動反映。作業人数は通常／早出・残業で人数・工数を入力（一覧の人数は通常作業のみ）。</li></ul></div></div>
</div>

---

##### 02-3. 作業予定一覧 — コピー作成（職長）

<div class="row">
<div class="shot">

![](foreman/02-3-作業予定一覧_コピー作成職長.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>職長版：自社が作成した直近5日を表示、選択して当日に複製（未確定で登録）。</li></ul></div></div>
</div>

---

##### 04-1. 予約 — ゲート（確定前）

<div class="row">
<div class="shot">

![](foreman/04-1-予約_ゲート_確定前.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>タイムライン（15分単位）で「ゲート×時刻」に予約バーを表示。</li><li>通常予約＝青、スポット予約＝オレンジ。通常予約の重複は薄い赤帯で警告（ヘッダーのベルにも件数表示）。</li><li>確定は全タブ（揚重機／ゲート／資機材・その他）共通・日付単位。確定は元請のみ。</li><li>デモは枠クリックで編集・削除（実運用はドラッグで新規作成）。</li></ul></div></div>
</div>

---

##### 05-1. 予約 — 揚重機（確定前）

<div class="row">
<div class="shot">

![](foreman/05-1-予約_揚重機_確定前.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>タイムライン（15分単位）で「揚重機×時刻」に予約バーを表示。</li><li>通常予約＝青、スポット予約＝オレンジ。通常予約の重複は薄い赤帯で警告（ヘッダーのベルにも件数表示）。</li><li>確定は全タブ（揚重機／ゲート／資機材・その他）共通・日付単位。確定は元請のみ。</li><li>デモは枠クリックで編集・削除（実運用はドラッグで新規作成）。</li></ul></div></div>
</div>

---

##### 06-1. 予約 — その他（確定前）

<div class="row">
<div class="shot">

![](foreman/06-1-予約_その他_確定前.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>タイムライン（15分単位）で「資機材・その他×時刻」に予約バーを表示。</li><li>通常予約＝青、スポット予約＝オレンジ。通常予約の重複は薄い赤帯で警告（ヘッダーのベルにも件数表示）。</li><li>確定は全タブ（揚重機／ゲート／資機材・その他）共通・日付単位。確定は元請のみ。</li><li>デモは枠クリックで編集・削除（実運用はドラッグで新規作成）。</li></ul></div></div>
</div>

---

##### 07-1. 予約 — 予約作成（ゲート）

<div class="row">
<div class="shot">

![](foreman/07-1-予約_予約作成ゲート.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>予約種別（通常／スポット）・資源選択・協力会社名・車種・日付・開始/終了（スポットは所要時間）・作業内容（最大25文字）・備考。</li><li>車種はゲートのみ。備考は一覧非表示・詳細で確認。</li><li>予約時間は15分単位。</li></ul></div></div>
</div>

---

##### 07-2. 予約 — 予約作成（揚重機）

<div class="row">
<div class="shot">

![](foreman/07-2-予約_予約作成揚重機.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>予約種別（通常／スポット）・資源選択・協力会社名・日付・開始/終了（スポットは所要時間）・作業内容・備考。</li><li>揚重機は車種なし。備考は一覧非表示・詳細で確認。</li></ul></div></div>
</div>

---

<!-- _class: divider -->
<!-- _paginate: false -->

<div class="kicker">SECTION 3 / 6</div>

# スマホ画面・元請ビュー

スマートフォン画面／元請ユーザーが見る画面

---

##### 26. スマホ表示 — ナビゲーション／ベル通知

<div class="row">
<div class="shot shot-phones">

![](mobile/26-1-drawer.png)
![](mobile/26-2-bell.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>サイドメニューはハンバーガーからドロワーで表示。</li><li>ヘッダーのベルで予約の重複通知（ヘッダー全幅のパネルで表示）。</li></ul></div></div>
</div>

---

##### 27. スマホ表示 — 作業予定一覧（確定前／確定後）

<div class="row">
<div class="shot shot-phones">

![](mobile/27-1-schedule-pending.png)
![](mobile/27-2-schedule-confirmed.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>一覧はテーブルではなくカード表示（横スクロール不要）。</li><li>確定済カードは薄グレー。確定・実績入力・出力は元請のみ。</li></ul></div></div>
</div>

---

##### 28. スマホ表示 — 作業予定の新規作成／コピー作成（元請）

<div class="row">
<div class="shot shot-phones">

![](mobile/28-1-schedule-create.png)
![](mobile/28-2-copy-prime.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>新規作成はモーダル（1カラム）。作業ブロックを複数追加可。</li><li>コピー作成（元請）＝全協力会社・直近3日から複製。</li></ul></div></div>
</div>

---

##### 29. スマホ表示 — コピー作成（職長）

<div class="row">
<div class="shot">

![](mobile/29-1-copy-foreman.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>職長版コピー作成＝自社・直近5日から複製。</li></ul></div></div>
</div>

---

##### 30. スマホ表示 — 予約一覧（確定前／確定後）

<div class="row">
<div class="shot shot-phones">

![](mobile/30-1-reservation-before.png)
![](mobile/30-2-reservation-after.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>タイムラインは横スクロール。確定後は通常・スポットをグレーアウト。</li><li>確定操作は元請のみ。</li></ul></div></div>
</div>

---

##### 31. スマホ表示 — 予約の新規作成／編集

<div class="row">
<div class="shot shot-phones">

![](mobile/31-1-reservation-create.png)
![](mobile/31-2-reservation-edit.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>予約の作成・編集フォーム（1カラム）。</li></ul></div></div>
</div>

---

##### 32. スマホ表示 — 配置図作成

<div class="row">
<div class="shot">

![](mobile/32-1-floorplan.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>配置図作成のモバイル表示（台紙選択・配置・元請連絡事項）。</li></ul></div></div>
</div>

---

##### 33. スマホ表示 — 作業配置図設定／協力会社設定

<div class="row">
<div class="shot shot-phones">

![](mobile/33-1-floorplan-setting.png)
![](mobile/33-2-companies.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>各設定一覧のモバイル表示。</li></ul></div></div>
</div>

---

##### 34. スマホ表示 — 予約設定（予約時間／予約権限）

<div class="row">
<div class="shot shot-phones">

![](mobile/34-1-settings-time.png)
![](mobile/34-2-settings-auth.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>予約設定タブのモバイル表示。</li></ul></div></div>
</div>

---

##### 35. スマホ表示 — 予約設定（予約種類／予約時間間隔）

<div class="row">
<div class="shot shot-phones">

![](mobile/35-1-settings-type.png)
![](mobile/35-2-settings-interval.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>予約設定タブのモバイル表示。</li></ul></div></div>
</div>

---

##### 36. スマホ表示 — 資機材・ゲート登録（揚重機／資機材・その他）

<div class="row">
<div class="shot shot-phones">

![](mobile/36-1-registry-lift.png)
![](mobile/36-2-registry-equip.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>登録一覧はカード表示（横スクロール不要）。</li></ul></div></div>
</div>

---

##### 37. スマホ表示 — 資機材・ゲート登録（ゲート／新規登録）

<div class="row">
<div class="shot shot-phones">

![](mobile/37-1-registry-gate.png)
![](mobile/37-2-registry-new.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>ゲート一覧のカード表示＋新規登録モーダル。</li></ul></div></div>
</div>

---

##### 38. スマホ表示 — 資機材・ゲート登録（一括登録／持込機械から同期）

<div class="row">
<div class="shot shot-phones">

![](mobile/38-1-registry-bulk.png)
![](mobile/38-2-registry-import.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>一括登録・持込機械から同期のダイアログをカード化。</li><li>「持込機械から同期」は選択チェックを右端に配置しコンパクト表示。</li></ul></div></div>
</div>

---

<!-- _class: divider -->
<!-- _paginate: false -->

<div class="kicker">SECTION 4 / 6</div>

# スマホ画面・職長ビュー

スマートフォン画面／職長ユーザーが見る画面

---

##### 26. スマホ表示 — ナビゲーション

<div class="row">
<div class="shot">

![](foreman/mobile/26-1-drawer.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>サイドメニューはハンバーガーからドロワーで表示（職長ビュー）。</li></ul></div></div>
</div>

---

##### 27. スマホ表示 — 作業予定一覧（確定前／確定後）

<div class="row">
<div class="shot shot-phones">

![](foreman/mobile/27-1-schedule-pending.png)
![](foreman/mobile/27-2-schedule-confirmed.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>一覧はテーブルではなくカード表示（横スクロール不要）。</li><li>確定済カードは薄グレー。確定・実績入力・出力は元請のみ。</li></ul></div></div>
</div>

---

##### 28. スマホ表示 — 作業予定の新規作成

<div class="row">
<div class="shot">

![](foreman/mobile/28-1-schedule-create.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>新規作成はモーダル（1カラム）。作業ブロックを複数追加可（職長ビュー）。</li></ul></div></div>
</div>

---

##### 29. スマホ表示 — コピー作成（職長）

<div class="row">
<div class="shot">

![](foreman/mobile/29-1-copy-foreman.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>職長版コピー作成＝自社・直近5日から複製。</li></ul></div></div>
</div>

---

##### 30. スマホ表示 — 予約一覧（確定前）

<div class="row">
<div class="shot">

![](foreman/mobile/30-1-reservation-before.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>タイムラインは横スクロール（職長ビュー・確定操作なし）。</li></ul></div></div>
</div>

---

##### 31. スマホ表示 — 予約の新規作成／編集

<div class="row">
<div class="shot shot-phones">

![](foreman/mobile/31-1-reservation-create.png)
![](foreman/mobile/31-2-reservation-edit.png)

</div>
<div class="spec"><div class="spec-h">📝 詳細仕様</div><div class="spec-body"><ul><li>予約の作成・編集フォーム（1カラム）。</li></ul></div></div>
</div>

---

<!-- _class: divider -->
<!-- _paginate: false -->

<div class="kicker">SECTION 5 / 6</div>

# 作業実績入力（QR）

QR発行 → スマホで読み取り → 現場で実績入力する流れ

---

##### QR-1. 作業実績入力用QR発行（元請・PC）

<div class="row">
<div class="shot">

![](actual/01-qr-issue.png)

</div>
<div class="spec"><div class="spec-h">📝 説明</div><div class="spec-body"><ul>
<li>元請が「作業実績入力用QR発行」から当日ぶんのQRを発行。</li>
<li>印刷して現場に掲示、または画面提示。</li>
<li>協力会社がスマホで読み取ると、作業実績入力ページへ遷移（デモではQRクリックでも遷移）。</li>
</ul></div></div>
</div>

---

##### QR-2. QR読み取り後 — 作業実績入力（アカウントなし）

<div class="row">
<div class="shot shot-phones">

![](actual/02-input-select.png)
![](actual/03-input-form.png)

</div>
<div class="spec"><div class="spec-h">📝 説明</div><div class="spec-body"><ul>
<li>アカウントが無い場合は、まず会社名を選択。</li>
<li>選択した会社の作業について、作業人数（実績）・工数を入力して送信。</li>
<li>入場人数は DNN（出面・日報管理）連携の値を表示。</li>
</ul></div></div>
</div>

---

##### QR-3. QR読み取り後 — 作業実績入力（アカウントあり）／送信完了

<div class="row">
<div class="shot shot-phones">

![](actual/04-input-account.png)
![](actual/05-input-done.png)

</div>
<div class="spec"><div class="spec-h">📝 説明</div><div class="spec-body"><ul>
<li>アカウントがある場合は会社選択を省略し、ログイン会社の実績入力へ直行。</li>
<li>送信すると完了画面（ブラウザを閉じる案内）を表示。</li>
</ul></div></div>
</div>

---

<!-- _class: divider -->
<!-- _paginate: false -->

<div class="kicker">SECTION 6 / 6</div>

# コメント

いただいたコメントへの回答

---

<!-- _class: qa -->

##### コメントへの回答（1/3）

<div class="qa">
<div class="qa-item"><div class="qa-q">1. <span class="qa-tag">01-1 確定後</span>「ステータス」「操作」両方に確定済でくどい → 確定済で背景グレーアウト案</div><div class="qa-a">回答：確定済の行を薄いグレーで表示するよう修正しました</div></div>
<div class="qa-item"><div class="qa-q">2. <span class="qa-tag">01-1 確定後</span>「設定」の中に作業配置図・資機材ゲート登録・協力会社一覧・設定をまとめたい</div><div class="qa-a">回答：協力会社設定はDNNと、作業配置図はNEOと共通ページとして使うので、設定タブの中に複数の設定を入れ込むように変更しました</div></div>
<div class="qa-item"><div class="qa-q">3. <span class="qa-tag">01-2 確定前</span>ステータス必要？</div><div class="qa-a">回答：後追い確定のように、確定後に予定が追加されたときに個別で見分けがつくようにステータスを持たせています。</div></div>
<div class="qa-item"><div class="qa-q">4. <span class="qa-tag">01-2 確定前</span>確定ボタンは元請権限のみに表示</div><div class="qa-a">回答：その仕様で考えています</div></div>
<div class="qa-item"><div class="qa-q">5. <span class="qa-tag">01-2 確定前</span>「日付指定コピー」機能が欲しい</div><div class="qa-a">回答：コピー作成機能として実装しました（元請版＝全協力会社の直近3日／職長版＝自社の直近5日から選択し、当日の予定として複製）。→ 02-2・02-3</div></div>
<div class="qa-item"><div class="qa-q">6. <span class="qa-tag">01-3 出力</span>「業種」「職種」も列として欲しい</div><div class="qa-a">回答：出力画面の列に追加しました</div></div>
<div class="qa-item"><div class="qa-q">7. <span class="qa-tag">01-3 出力</span>点線◯なし</div><div class="qa-a">回答：ハンコの点線を消しました</div></div>
</div>

---

<!-- _class: qa -->

##### コメントへの回答（2/3）

<div class="qa">
<div class="qa-item"><div class="qa-q">8. <span class="qa-tag">01-3 出力</span>職長名なしで</div><div class="qa-a">回答：職長名を削除しました</div></div>
<div class="qa-item"><div class="qa-q">9. <span class="qa-tag">02-1 新規作成</span>「協力会社」「業種」「職種」はログインユーザー情報から自動入力に</div><div class="qa-a">回答：自動入力としつつ、変更可能の仕様で考えています。業種と職種は複数候補がある場合、協力会社設定画面の登録昇順で最も上の候補が表示されます。職長ユーザーに設定されていないユーザーの場合は協力会社名だけが自動入力となります。</div></div>
<div class="qa-item"><div class="qa-q">10. <span class="qa-tag">02-1 新規作成</span>日付指定コピー機能（過去の日付から作業内容をコピー）</div><div class="qa-a">回答：コピー作成機能として実装しました（元請版／職長版）。→ 02-2・02-3</div></div>
<div class="qa-item"><div class="qa-q">11. <span class="qa-tag">02-1 新規作成</span>この一文はなくてOK</div><div class="qa-a">回答：削除しました</div></div>
<div class="qa-item"><div class="qa-q">12. <span class="qa-tag">02-1 新規作成</span>作業内容を複数登録できるようにしたい</div><div class="qa-a">回答：作業ブロックを複数追加でき、1回の作成で複数レコードを登録できるよう変更しました</div></div>
<div class="qa-item"><div class="qa-q">13. <span class="qa-tag">04 予約ゲート</span>確定するとグレーアウト？</div><div class="qa-a">回答：確定後は通常予約をグレーアウトするよう変更しました（確定前／確定後を 04〜06 に併記）</div></div>
<div class="qa-item"><div class="qa-q">14. <span class="qa-tag">07-1 予約作成</span>作業内容の他に備考を入力（一覧非表示・詳細で確認）</div><div class="qa-a">回答：備考を追加しました</div></div>
</div>

---

<!-- _class: qa -->

##### コメントへの回答（3/3）

<div class="qa">
<div class="qa-item"><div class="qa-q">15. <span class="qa-tag">07-2 予約作成</span>備考入力したい</div><div class="qa-a">回答：備考を追加しました</div></div>
<div class="qa-item"><div class="qa-q">16. <span class="qa-tag">07-3 予約出力</span>登録台数不要／押印欄が欲しい</div><div class="qa-a">回答：登録台数を消して押印エリアに変更しました</div></div>
<div class="qa-item"><div class="qa-q">17. <span class="qa-tag">08 配置図作成</span>複数作れる？（作れた方が良いかも）</div><div class="qa-a">回答：1日あたり、登録されている作業配置図分作成できるような仕様で考えています</div></div>
<div class="qa-item"><div class="qa-q">18. <span class="qa-tag">11 配置図設定一覧</span>「変換済」ってなんですか？</div><div class="qa-a">回答：NEOの作業配置図設定画面と同じもので、PDFと画像が登録されたかどうかのステータスになります</div></div>
<div class="qa-item"><div class="qa-q">19. <span class="qa-tag">12 配置図設定登録</span>立面図の可能性あり →「平面図」の名称を「図面」等に変更</div><div class="qa-a">回答：NEO側で変更します</div></div>
<div class="qa-item"><div class="qa-q">20. <span class="qa-tag">16 資機材（資機材）</span>「表示する」チェックボックスのデザインを揃えたい</div><div class="qa-a">回答：協力会社設定画面のデザインと統一しました</div></div>
</div>
