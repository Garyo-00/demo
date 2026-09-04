// ===== 巡回/パトロール デモ用データ =====
// 巡回記録は現場に掲示したQRコードを読み取ったユーザーだけが作成する。
// この画面（一覧）からは作成できず、作成済みの記録の閲覧と元請確認・是正入力を行う。

export const PATROL_PROJECT = "テストプロジェクト_星野";

// サンプル現場写真（実データの代わりに色違いのSVGダミーを data URI で持つ）
const photo = (label, sky, ground) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">` +
      `<rect width="320" height="240" fill="${sky}"/>` +
      `<rect y="156" width="320" height="84" fill="${ground}"/>` +
      `<path d="M40 156V70h18v86M58 92h56M114 156V70h18v86" fill="none" stroke="#8a94a6" stroke-width="5"/>` +
      `<path d="M196 156l30-44 30 44z" fill="#b7c0cf"/>` +
      `<circle cx="268" cy="52" r="18" fill="#ffffff" opacity=".55"/>` +
      `<text x="160" y="212" font-family="sans-serif" font-size="17" fill="#42506b" text-anchor="middle">${label}</text>` +
    `</svg>`
  );

export const PHOTO_A = photo("現場写真 A", "#cfe3f5", "#cbb99c");
export const PHOTO_B = photo("現場写真 B", "#d7e9d3", "#c2b49b");
export const PHOTO_C = photo("現場写真 C", "#e2ddf3", "#bfb49f");

// 巡回結果の評価
// サンプル添付ファイル（ダウンロードできるテキストを data URI で持つ）
const SAMPLE_FILE =
  "data:text/plain;charset=utf-8," +
  encodeURIComponent("是正報告書\n開口部の手摺りを増設し、是正を完了しました。\n報告者：テスト 協力会社\n");

// 巡回結果の評価
export const RATINGS = ["良好", "普通", "要改善"];
export const RATING_COLOR = { 良好: "success", 普通: "default", 要改善: "error" };

// 追記を行うユーザー（デモではロールごとに1人ずつ固定）
export const USERS = {
  prime: { id: "u-prime", name: "星野 遼河", label: "元請" },
  partner: { id: "u-partner", name: "テスト 協力会社", label: "協力会社" },
};

// 実施会社・一次会社（検索プルダウン用）
export const COMPANIES = ["株式会社Arch", "company"];
export const PRIMARY_COMPANIES = ["〇〇建設", "company"];

// 巡回チェック項目（テンプレート）。QR読み取り時にこの並びで回答する。
const CHECK_ITEMS = [
  "担当工種：（回答例：「該当なし」　メモ欄：杭工事）",
  "本日の作業員数：（回答例：「該当なし」　メモ欄：19人）",
  "【直感！】もし事故が起こるとしたら・・・具体的に記入する（感じたままに！　例：開口部の手摺りがぐらついているから、転落災害が起こりそう！）",
  "【良かった事例】写真撮影可",
  "【良かった事例】写真撮影可",
  "【悪かった事例】写真撮影可",
  "【悪かった事例】写真撮影可",
  "意見・要望（特に無ければ空白で可）",
  "東京建築支店項目",
  "本店項目",
  "前友会項目",
  "①現場へ入場させる前に「送り出し教育」を確実に実施しているか",
  "②現場で行われている作業内容・手順等は「送り出し教育」内容通りに行われているか",
  "③高齢者においては、就業規則（60歳以上：適正配置と健康管理の徹底　65歳以上：作業所長の許可、足場の組立・解体作業等の禁止　70歳以上：原則就労不可、主管部長が一次事業主と面談し許可された場合のみ就労可 など）に則って作業が行われているか",
  "④1次会社：作業所より提供される安全教育動画を活用した作業員教育を実施しているか　2次以下会社：1次会社が実施する安全教育動画を活用した作業員教育に積極的に参加しているか",
  "⑤外国籍労働者の作業状況、指示系統及び日々のコミュニケーション等に問題はないか",
];

// チェック項目の回答をまとめて作る。overrides は 1 始まりの項目番号をキーにする。
function items(overrides = {}) {
  return CHECK_ITEMS.map((text, i) => ({
    no: i + 1,
    text,
    rating: "普通",
    comment: "",
    fix: "",
    ...(overrides[i + 1] || {}),
  }));
}

// 巡回記録。confirmedDate / confirmedBy が入っているものが「元請確認済み」。
export const INITIAL_RECORDS = [
  {
    id: "p11625",
    no: "11625",
    plannedDate: "",
    date: "2026-03-05",
    nextDate: "2026-03-12",
    company: "株式会社Arch",
    primaryCompany: "〇〇建設",
    inspector: "Arch管理者",
    accompany: "解体次郎",
    hearing: "テスト",
    confirmedDate: "2026-03-05",
    confirmedBy: "星野 遼河",
    siteComment: "テストテスト",
    items: items({
      1: { comment: "杭工事" },
      2: { comment: "19人" },
      3: { rating: "要改善", comment: "開口部の手摺りがぐらついているから、転落災害が起こりそう！" },
      6: { rating: "要改善", comment: "資材の仮置きが通路にはみ出している" },
    }),
    photos: [
      { id: "ph1", src: PHOTO_A, caption: "是正してください", fixSrc: "", fixComment: "" },
      { id: "ph2", src: PHOTO_B, caption: "是正してください", fixSrc: "", fixComment: "" },
    ],
    notes: [
      {
        id: "n1",
        authorId: USERS.prime.id,
        authorName: USERS.prime.name,
        authorLabel: USERS.prime.label,
        createdAt: "2026-03-06T09:12",
        updatedAt: "",
        text: "巡回時に指摘した開口部について、翌朝の朝礼でも周知しました。",
        files: [],
      },
      {
        id: "n2",
        authorId: USERS.partner.id,
        authorName: USERS.partner.name,
        authorLabel: USERS.partner.label,
        createdAt: "2026-03-06T17:40",
        updatedAt: "2026-03-07T08:05",
        text: "手摺りの増設が完了しました。是正報告書を添付します。",
        files: [
          { id: "f1", name: "是正報告書_20260306.txt", size: 1240, type: "text/plain", url: SAMPLE_FILE },
          { id: "f2", name: "是正後_手摺り.svg", size: 21500, type: "image/svg+xml", url: PHOTO_B },
          { id: "f3", name: "是正後_通路.svg", size: 20800, type: "image/svg+xml", url: PHOTO_C },
        ],
      },
    ],
  },
  {
    id: "p11640",
    no: "11640",
    plannedDate: "2026-03-12",
    date: "2026-03-05",
    nextDate: "",
    company: "株式会社Arch",
    primaryCompany: "〇〇建設",
    inspector: "Arch管理者",
    accompany: "",
    hearing: "特記事項なし",
    confirmedDate: "",
    confirmedBy: "",
    siteComment: "",
    items: items({ 1: { comment: "該当なし" }, 2: { comment: "12人" } }),
    photos: [],
    notes: [],
  },
  {
    id: "p11656",
    no: "11656",
    plannedDate: "",
    date: "2026-03-05",
    nextDate: "",
    company: "株式会社Arch",
    primaryCompany: "〇〇建設",
    inspector: "星野 遼河",
    accompany: "",
    hearing: "てすと",
    confirmedDate: "",
    confirmedBy: "",
    siteComment: "",
    items: items({
      12: { rating: "要改善", comment: "テストテスト" },
    }),
    photos: [
      { id: "ph1", src: PHOTO_B, caption: "是正してください", fixSrc: "", fixComment: "" },
      { id: "ph2", src: PHOTO_C, caption: "是正してください", fixSrc: "", fixComment: "" },
    ],
    notes: [],
  },
  {
    id: "p11661",
    no: "11661",
    plannedDate: "",
    date: "2026-03-06",
    nextDate: "",
    company: "株式会社Arch",
    primaryCompany: "company",
    inspector: "テスト 協力会社",
    accompany: "",
    hearing: "",
    confirmedDate: "",
    confirmedBy: "",
    siteComment: "",
    items: items({ 1: { comment: "該当なし" } }),
    photos: [],
    notes: [],
  },
  {
    id: "p11580",
    no: "11580",
    plannedDate: "",
    date: "2026-02-18",
    nextDate: "2026-03-05",
    company: "株式会社Arch",
    primaryCompany: "〇〇建設",
    inspector: "Arch管理者",
    accompany: "鳶太郎",
    hearing: "先月分の巡回。指摘事項は当日中に是正済み。",
    confirmedDate: "2026-02-19",
    confirmedBy: "星野 遼河",
    siteComment: "指摘箇所の是正を確認しました。",
    items: items({
      6: { rating: "要改善", comment: "開口部の養生が不足", fix: "当日中に手摺りを増設し是正しました。" },
    }),
    photos: [{ id: "ph1", src: PHOTO_C, caption: "是正してください", fixSrc: PHOTO_A, fixComment: "手摺りを増設しました。" }],
    notes: [],
  },
  {
    id: "p11571",
    no: "11571",
    plannedDate: "2026-02-12",
    date: "2026-02-12",
    nextDate: "",
    company: "company",
    primaryCompany: "company",
    inspector: "テスト 協力会社",
    accompany: "",
    hearing: "",
    confirmedDate: "",
    confirmedBy: "",
    siteComment: "",
    items: items(),
    photos: [],
    notes: [],
  },
];

// 元請確認が済んでいるか
export const isConfirmed = (r) => !!r.confirmedDate;

// 一覧・詳細の日付表示（YYYY/MM/DD）。未設定は空文字。
export const fmtDate = (v) => (v ? v.replaceAll("-", "/") : "");

// 巡回月（YYYY-MM）のラベル
export const fmtMonth = (ym) => `${ym.slice(0, 4)}年${Number(ym.slice(5, 7))}月`;

// 巡回月を n ヶ月ずらす
export function shiftMonth(ym, n) {
  const d = new Date(`${ym}-01T00:00:00`);
  d.setMonth(d.getMonth() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// 追記の日時表示（YYYY/MM/DD HH:MM）。未設定は空文字。
export const fmtDateTime = (v) => (v ? `${v.slice(0, 10).replaceAll("-", "/")} ${v.slice(11, 16)}` : "");

// 現在時刻（ローカル）を "YYYY-MM-DDTHH:MM" で返す
export function nowStamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

// 添付ファイルのサイズ表示
export function fmtSize(bytes) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
