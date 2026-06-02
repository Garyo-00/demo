// サンプルデータ（ブラウザ保持・バックエンド不要）
// status: inspected=点検済 / uninspected=未点検 / idle=非稼働

export const MACHINES = [
  ["M-001", "油圧ショベル", "ZX120", "inspected"],
  ["M-002", "油圧ショベル", "SK75", "inspected"],
  ["M-003", "バックホウ取付ブレーカ", "ZX75B", "uninspected"],
  ["M-004", "クローラクレーン", "CC-50", "inspected"],
  ["M-005", "機械式トラッククレーン", "TG-25", "idle"],
  ["M-006", "ダンプトラック", "10t", "inspected"],
  ["M-007", "ダンプトラック", "4t", "uninspected"],
  ["M-008", "ホイールローダ", "WA100", "inspected"],
  ["M-009", "ラフタークレーン", "25t", "inspected"],
  ["M-010", "高所作業車", "12m", "uninspected"],
  ["M-011", "油圧ショベル", "PC78", "inspected"],
  ["M-012", "クローラクレーン", "CC-30", "inspected"],
  ["M-013", "ダンプトラック", "10t", "inspected"],
  ["M-014", "コンクリートポンプ車", "IPF-95", "idle"],
  ["M-015", "油圧ショベル", "ZX200", "inspected"],
  ["M-016", "バックホウ", "SK135", "inspected"],
  ["M-017", "ローラ", "振動式", "uninspected"],
  ["M-018", "高所作業車", "8m", "inspected"],
  ["M-019", "ダンプトラック", "2t", "inspected"],
  ["M-020", "クローラクレーン", "CC-80", "idle"],
  ["M-021", "ホイールローダ", "WA200", "inspected"],
  ["M-022", "油圧ショベル", "ZX55", "inspected"],
].map(([id, name, model, status]) => ({ id, name, model, status, category: "機械" }));

export const TEMPS = [
  ["T-001", "仮設足場（北面）", "枠組", "inspected"],
  ["T-002", "仮設足場（南面）", "くさび", "uninspected"],
  ["T-003", "仮設動力盤 No.1", "100V/200V", "inspected"],
  ["T-004", "仮設動力盤 No.2", "三相200V", "inspected"],
  ["T-005", "土砂ホッパ", "-", "inspected"],
  ["T-006", "仮囲い（東側）", "鋼板", "inspected"],
  ["T-007", "単管バリケード", "-", "uninspected"],
  ["T-008", "仮設階段", "鋼製", "inspected"],
  ["T-009", "仮設トイレ", "水洗", "idle"],
  ["T-010", "仮設照明", "LED投光器", "uninspected"],
  ["T-011", "乗入構台", "H鋼", "inspected"],
  ["T-012", "電動工具置場", "-", "idle"],
].map(([id, name, model, status]) => ({ id, name, model, status, category: "仮設・その他" }));

export const ALL = [...MACHINES, ...TEMPS];

export function summarize(list) {
  const idle = list.filter((x) => x.status === "idle").length;
  const inspected = list.filter((x) => x.status === "inspected").length;
  const uninspected = list.filter((x) => x.status === "uninspected").length;
  return { target: inspected + uninspected, inspected, uninspected, idle };
}

// 月例・組立後等（サンプル固定値）
export const MONTHLY = { target: 16, done: 11 };
export const ASSEMBLY = { done: 4 };

// 未承認（サンプル固定値）
export const UNAPPROVED = { machines: 3, users: 5 };

export const STATUS_LABEL = {
  inspected: "点検済",
  uninspected: "未点検",
  idle: "非稼働",
};

// ===== 承認・申請 =====
// ログイン中ユーザー（承認ページのフィルタに使用）
export const CURRENT_USER = { id: "engineer-005", name: "山田 太郎" };

// 申請種別（「すべて」を除く5種別）
export const REQUEST_TYPES = [
  "注文", "持込機械", "作業計画書", "火気使用届", "協力会社ユーザー",
];

export const APPROVAL_STATUS_LABEL = {
  pending: "承認待ち",
  approved: "承認済",
  rejected: "差戻し",
};

// 申請サンプル（approver がログインユーザーのものは承認ページに表示）
export const REQUESTS = [
  ["R-001", "注文", "生コン 20m³ 追加発注", "佐藤 健", "山田 太郎", "2026-06-01", "pending"],
  ["R-002", "持込機械", "油圧ショベル ZX130 持込", "鈴木 一郎", "山田 太郎", "2026-06-01", "pending"],
  ["R-003", "作業計画書", "6月2週 山留工事 計画書", "高橋 誠", "田中 部長", "2026-05-30", "pending"],
  ["R-004", "火気使用届", "鉄骨建方 溶接作業", "伊藤 大輔", "山田 太郎", "2026-05-29", "approved"],
  ["R-005", "協力会社ユーザー", "渡辺工務店 作業員5名 追加", "渡辺 浩", "山田 太郎", "2026-05-31", "pending"],
  ["R-006", "注文", "安全帯 10セット", "中村 翼", "田中 部長", "2026-05-28", "approved"],
  ["R-007", "持込機械", "高所作業車 12m 持込", "小林 望", "山田 太郎", "2026-05-27", "rejected"],
  ["R-008", "作業計画書", "6月3週 コンクリート打設 計画書", "加藤 豊", "山田 太郎", "2026-06-02", "pending"],
  ["R-009", "火気使用届", "ガス切断作業", "吉田 学", "田中 部長", "2026-06-01", "pending"],
  ["R-010", "協力会社ユーザー", "山本電気 作業員2名 追加", "山本 健太", "田中 部長", "2026-05-26", "approved"],
  ["R-011", "注文", "仮設照明 LED投光器 8台", "松本 剛", "山田 太郎", "2026-06-02", "pending"],
  ["R-012", "持込機械", "ダンプトラック 4t 持込", "井上 隆", "田中 部長", "2026-05-30", "pending"],
  ["R-013", "火気使用届", "アスファルト溶融作業", "木村 駿", "山田 太郎", "2026-06-02", "pending"],
  ["R-014", "協力会社ユーザー", "林基礎 作業員3名 追加", "林 大樹", "山田 太郎", "2026-05-25", "approved"],
].map(([id, type, title, applicant, approver, date, status]) => ({
  id, type, title, applicant, approver, date, status,
}));

export const MENU = [
  "ダッシュボード", "現場内在庫一覧", "貸出管理", "返却引取依頼", "棚卸", "点検",
  "持込機械管理", "仮設・その他管理", "巡回/パトロール", "動力盤管理",
  "各種QRコード発行", "稼働レポート", "承認・申請", "設定",
  // 別ドメインへの外部リンク（設定の下に表示）
  "作業計画書", "火気使用届",
];

// 別ドメインのページへ遷移するメニュー（外部リンク）
// ※URLはデモ用のプレースホルダー。実運用では各システムのURLに差し替える。
export const EXTERNAL_LINKS = {
  "作業計画書": "https://work-plan.example.com/",
  "火気使用届": "https://fire-permit.example.com/",
};

export function todayStr() {
  const d = new Date();
  const w = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${w}）`;
}
