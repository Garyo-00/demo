// ===== 持込機械 デモ用データ =====
// 実画面（持込機械一覧／詳細／編集／新規登録）に合わせたサンプル値。

// 点検表の種類（新規登録・編集のプルダウン）
export const INSPECTION_TYPES = ["月例点検表", "年次、特定自主検査表", "出庫前点検表", "その他"];

// 期限管理の対象となる点検表。労働安全衛生法の特定自主検査は年1回。
export const SPECIFIC_INSPECTION = "年次、特定自主検査表";

// 期限の何日前から通知するか
export const NOTIFY_DAYS_BEFORE = 30;

// デモの「当日」。本番では実際の当日を使う。
export const BM_TODAY = "2026-08-25";

export const BM_CATEGORIES = [
  "荷役運搬・揚重機械",
  "高所作業車（カテゴリ）",
  "掘削機械",
  "整地用機械・運搬用機械",
  "コンクリート関連機器",
];

export const BM_COMPANIES = ["テスト建設", "協力会社A", "ひらたクレーン", "Arch", "株式会社Arch"];
export const BM_PRIMARY = ["テスト工業", "B会社", "ひらたバックホウ", "Arch機械", "アーチ建設工業"];
export const BM_OPERATORS = ["テスト太郎", "建設太郎", "ひらたえい", "建設たろう", "テストたろう", "テストはなこ", "テスト次郎"];
export const BM_TAGS = ["重点管理", "レンタル", "長期"];

// 表示対象（一覧の絞り込み）
export const BM_SCOPES = [
  { value: "inPeriod", label: "使用期間内" },
  { value: "outPeriod", label: "使用期間外" },
  { value: "archived", label: "アーカイブ" },
];

function insp(type, month, file = "点検記録.pdf") {
  return { id: `i${month}${type.slice(0, 2)}`, type, month, file };
}

export const INITIAL_MACHINES = [
  {
    id: "bm1",
    archId: 150271,
    category: "荷役運搬・揚重機械",
    name: "ゴンドラ",
    alias: "ゴンドラ",
    mgmtNo: "",
    primary: "テスト工業",
    company: "テスト建設",
    operator: "テスト太郎",
    bringDate: "2026/07/31",
    useFrom: "2026-07-31",
    useTo: "2026-08-31",
    tags: [],
    archived: false,
    registeredAt: "2026/07/31",
    repName: "",
    maker: "",
    spec: "",
    madeYear: "",
    usePlace: "",
    vehicleInspExpiry: "",
    insurance: { person: "", object: "", passenger: "", other: "" },
    // 特定自主検査が 2025-08 → 期限 2026-08-01 を過ぎている
    inspections: [insp(SPECIFIC_INSPECTION, "2025-08", "特定自主検査記録_2025.pdf")],
    approval: { status: "", applyNo: "", applyDate: "", applicant: "" },
  },
  {
    id: "bm2",
    archId: 47829,
    category: "高所作業車（カテゴリ）",
    name: "ブーム型自走式高所作業車_エンジン式（点検表名）",
    alias: "高所作業者-1号",
    mgmtNo: "",
    primary: "B会社",
    company: "協力会社A",
    operator: "_",
    bringDate: "2025/06/06",
    useFrom: "2025-06-06",
    useTo: "2026-12-31",
    tags: ["重点管理"],
    archived: false,
    registeredAt: "2025/06/06",
    repName: "山田 一郎",
    maker: "アイチコーポレーション",
    spec: "作業床高さ 12m",
    madeYear: "2019",
    usePlace: "A棟外周",
    vehicleInspExpiry: "2027-03-31",
    insurance: { person: "無制限", object: "10000", passenger: "5000", other: "" },
    // 2025-09 → 期限 2026-09-01。当日(8/25)から7日後で通知対象
    inspections: [insp("月例点検表", "2026-08"), insp(SPECIFIC_INSPECTION, "2025-09")],
    approval: { status: "承認済", applyNo: "A-1042", applyDate: "2025/06/05", applicant: "Arch管理者" },
  },
  {
    id: "bm3",
    archId: 48953,
    category: "高所作業車（カテゴリ）",
    name: "ブーム型自走式高所作業車_エンジン式（点検表名）",
    alias: "新大阪駅 平田家改修工事",
    mgmtNo: "",
    primary: "B会社",
    company: "協力会社A",
    operator: "建設太郎",
    bringDate: "2025/06/13",
    useFrom: "2025-06-13",
    useTo: "2026-12-31",
    tags: ["重点管理"],
    archived: false,
    registeredAt: "2025/06/13",
    repName: "",
    maker: "",
    spec: "",
    madeYear: "",
    usePlace: "",
    vehicleInspExpiry: "",
    insurance: { person: "", object: "", passenger: "", other: "" },
    // 特定自主検査の記録なし
    inspections: [insp("出庫前点検表", "2026-06")],
    approval: { status: "承認済", applyNo: "A-1051", applyDate: "2025/06/12", applicant: "Arch管理者" },
  },
  {
    id: "bm4",
    archId: 94612,
    category: "高所作業車（カテゴリ）",
    name: "ブーム型自走式高所作業車_バッテリー式（点検表名）",
    alias: "新大阪駅 平田家改修工事",
    mgmtNo: "",
    primary: "ひらたバックホウ",
    company: "ひらたクレーン",
    operator: "ひらたえい",
    bringDate: "2026/02/10",
    useFrom: "2026-02-10",
    useTo: "2026-12-31",
    tags: ["レンタル"],
    archived: false,
    registeredAt: "2026/02/10",
    repName: "",
    maker: "",
    spec: "",
    madeYear: "",
    usePlace: "",
    vehicleInspExpiry: "",
    insurance: { person: "", object: "", passenger: "", other: "" },
    // 2026-02 → 期限 2027-02-01。まだ余裕あり
    inspections: [insp(SPECIFIC_INSPECTION, "2026-02")],
    approval: { status: "承認済", applyNo: "A-2210", applyDate: "2026/02/09", applicant: "Arch管理者" },
  },
  {
    id: "bm5",
    archId: 128156,
    category: "荷役運搬・揚重機械",
    name: "移動式クレーン",
    alias: "クレーン1号",
    mgmtNo: "",
    primary: "Arch機械",
    company: "Arch",
    operator: "建設たろう",
    bringDate: "2026/05/31",
    useFrom: "2026-05-31",
    useTo: "2026-12-31",
    tags: [],
    archived: false,
    registeredAt: "2026/05/31",
    repName: "",
    maker: "",
    spec: "",
    madeYear: "",
    usePlace: "",
    vehicleInspExpiry: "",
    insurance: { person: "", object: "", passenger: "", other: "" },
    // 2025-09 → 期限 2026-09-01。通知対象
    inspections: [insp(SPECIFIC_INSPECTION, "2025-09"), insp("月例点検表", "2026-08")],
    approval: { status: "承認済", applyNo: "A-3301", applyDate: "2026/05/30", applicant: "Arch管理者" },
  },
  {
    id: "bm6",
    archId: 128157,
    category: "荷役運搬・揚重機械",
    name: "移動式クレーン",
    alias: "クレーン2号",
    mgmtNo: "",
    primary: "Arch機械",
    company: "Arch",
    operator: "建設たろう",
    bringDate: "2026/05/31",
    useFrom: "2026-05-31",
    useTo: "2026-12-31",
    tags: [],
    archived: false,
    registeredAt: "2026/05/31",
    repName: "",
    maker: "",
    spec: "",
    madeYear: "",
    usePlace: "",
    vehicleInspExpiry: "",
    insurance: { person: "", object: "", passenger: "", other: "" },
    inspections: [insp(SPECIFIC_INSPECTION, "2026-06")],
    approval: { status: "承認済", applyNo: "A-3302", applyDate: "2026/05/30", applicant: "Arch管理者" },
  },
  {
    id: "bm7",
    archId: 121446,
    category: "掘削機械",
    name: "油圧ショベル",
    alias: "0.7BH -1",
    mgmtNo: "",
    primary: "アーチ建設工業",
    company: "株式会社Arch",
    operator: "テストたろう",
    bringDate: "2026/05/15",
    useFrom: "2026-05-15",
    useTo: "2026-12-31",
    tags: [],
    archived: false,
    registeredAt: "2026/05/15",
    repName: "",
    maker: "コマツ",
    spec: "0.7m3",
    madeYear: "2021",
    usePlace: "",
    vehicleInspExpiry: "",
    insurance: { person: "", object: "", passenger: "", other: "" },
    inspections: [insp(SPECIFIC_INSPECTION, "2026-05")],
    approval: { status: "承認済", applyNo: "A-3120", applyDate: "2026/05/14", applicant: "Arch管理者" },
  },
  {
    id: "bm8",
    archId: 121447,
    category: "掘削機械",
    name: "油圧ショベル",
    alias: "0.7BH -2",
    mgmtNo: "",
    primary: "アーチ建設工業",
    company: "株式会社Arch",
    operator: "テストはなこ",
    bringDate: "2026/05/15",
    useFrom: "2026-05-15",
    useTo: "2026-12-31",
    tags: [],
    archived: false,
    registeredAt: "2026/05/15",
    repName: "",
    maker: "",
    spec: "",
    madeYear: "",
    usePlace: "",
    vehicleInspExpiry: "",
    insurance: { person: "", object: "", passenger: "", other: "" },
    // 2025-10 → 期限 2026-10-01。まだ余裕あり
    inspections: [insp(SPECIFIC_INSPECTION, "2025-10")],
    approval: { status: "承認済", applyNo: "A-3121", applyDate: "2026/05/14", applicant: "Arch管理者" },
  },
  {
    id: "bm9",
    archId: 121448,
    category: "掘削機械",
    name: "油圧ショベル",
    alias: "0.7BH -3",
    mgmtNo: "",
    primary: "アーチ建設工業",
    company: "株式会社Arch",
    operator: "テスト次郎",
    bringDate: "2026/05/15",
    useFrom: "2026-05-15",
    useTo: "2026-12-31",
    tags: [],
    archived: false,
    registeredAt: "2026/05/15",
    repName: "",
    maker: "",
    spec: "",
    madeYear: "",
    usePlace: "",
    vehicleInspExpiry: "",
    insurance: { person: "", object: "", passenger: "", other: "" },
    // 記録なし
    inspections: [],
    approval: { status: "", applyNo: "", applyDate: "", applicant: "" },
  },
];

// ===== 特定自主検査の期限計算 =====
// 点検記録は「点検月（YYYY-MM）」までしか持たないため、その月の1日に実施したとみなす。
// 期限を早めに見積もる（安全側）ことになる。
export function inspectionDate(month) {
  return `${month}-01`;
}

function addYear(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y + 1, m - 1, d)).toISOString().slice(0, 10);
}

function diffDays(from, to) {
  const ms = new Date(`${to}T00:00:00Z`) - new Date(`${from}T00:00:00Z`);
  return Math.round(ms / 86400000);
}

export function fmt(ymd) {
  return (ymd || "").replaceAll("-", "/");
}

/**
 * 特定自主検査の次回期限。
 * state: "none"（記録なし）／"ok"／"due"（30日前〜期限）／"overdue"（超過）
 */
export function specificInspection(machine, today = BM_TODAY) {
  const rows = (machine.inspections || []).filter((i) => i.type === SPECIFIC_INSPECTION && i.month);
  if (rows.length === 0) return { state: "none", latest: null, due: null, days: null };
  // 直近の実施月を基準にする
  const latest = rows.map((i) => i.month).sort().at(-1);
  const due = addYear(inspectionDate(latest));
  const days = diffDays(today, due);
  const state = days < 0 ? "overdue" : days <= NOTIFY_DAYS_BEFORE ? "due" : "ok";
  return { state, latest, due, days };
}

// 通知対象（要対応）かどうか。記録なしも対応が必要なため含める。
export function needsAttention(machine, today = BM_TODAY) {
  const s = specificInspection(machine, today).state;
  return s === "due" || s === "overdue" || s === "none";
}

// 一覧・ダッシュボードの表示ラベル
export const INSPECTION_STATE = {
  none: { label: "記録なし", color: "default" },
  ok: { label: "OK", color: "success" },
  due: { label: "要検査", color: "warning" },
  overdue: { label: "期限超過", color: "error" },
};

// 使用期間内かどうか
export function inPeriod(m, today = BM_TODAY) {
  return m.useFrom <= today && today <= m.useTo;
}

// ダッシュボード用の集計
export function inspectionSummary(machines, today = BM_TODAY) {
  const target = machines.filter((m) => !m.archived);
  const count = (s) => target.filter((m) => specificInspection(m, today).state === s).length;
  return { overdue: count("overdue"), due: count("due"), none: count("none"), total: target.length };
}
