// ===== 作業計画書NEO 作業計画書（一覧・新規作成・詳細）デモ用データ =====
import { newId } from "./workPlanNeoData.js";

// 申請ステータス
export const PLAN_STATUS = {
  applying: { label: "申請中", cls: "applying" },
  approved: { label: "承認済", cls: "approved" },
  rejected: { label: "否認", cls: "rejected" },
  withdrawn: { label: "取下", cls: "withdrawn" },
};

// 機械カテゴリ（持込機械／レンタル機械 共通）
export const MACHINE_CATEGORIES = [
  "整地用機械・運搬用機械",
  "掘削・運搬",
  "掘削機械",
  "コンクリート関連機器",
  "高所作業車",
  "高圧洗浄機",
  "道路・整地/保安用品",
  "ポンプ",
  "レンタカー",
  "ハウス・倉庫/シーズン品",
  "その他(自由記述)",
  "発電周辺機器",
  "溶接機",
  "荷役運搬・揚重機器",
];

// 機械マスタ（AS＝安全セーフティ 連携想定）
// kind: "bring" … 持込機械 / "rental" … レンタル機械
export const MACHINES = [
  { id: "m1", kind: "bring", category: "荷役運搬・揚重機器", name: "移動式クレーン（クローラー式）", alias: "クレーン1号機", mgmtNo: "", company: "Arch建設" },
  { id: "m2", kind: "bring", category: "掘削機械", name: "ブレーカ（油圧式）", alias: "BH②", mgmtNo: "1", company: "" },
  { id: "m3", kind: "bring", category: "整地用機械・運搬用機械", name: "ホイールローダ", alias: "ホイール1号機", mgmtNo: "", company: "株式会社Arch" },
  { id: "m4", kind: "bring", category: "掘削・運搬", name: "バックホー/後方小旋回/新JIS:0.022m3/1t級/旧JIS呼称:0.03m3", alias: "バックホウ001", mgmtNo: "", company: "株式会社Arch" },
  { id: "m5", kind: "bring", category: "コンクリート関連機器", name: "インバーター/出力:1.5Kva/100V", alias: "", mgmtNo: "", company: "株式会社Arch" },
  { id: "m6", kind: "bring", category: "高所作業車", name: "テーブルリフト/タイヤ/拡張デッキ/4.5m級", alias: "aaaa", mgmtNo: "", company: "株式会社Arch" },
  { id: "m7", kind: "bring", category: "高圧洗浄機", name: "高圧洗浄機/モーター式/200V", alias: "eeeffffeeeefffあ", mgmtNo: "", company: "株式会社Arch" },
  { id: "m8", kind: "bring", category: "道路・整地/保安用品", name: "配筋養生金網足場/約450x約2000mm/鋼製", alias: "", mgmtNo: "", company: "株式会社Arch" },
  { id: "m9", kind: "bring", category: "ポンプ", name: "水中ポンプ/普通/2B/100V/出力:〜0.5Kw", alias: "", mgmtNo: "", company: "株式会社Arch" },
  { id: "m10", kind: "rental", category: "レンタカー", name: "ダンプ/2t", alias: "あいうえおかきくけこさしすせそ等伝えたちつてとなにぬねのはひふへほ", mgmtNo: "", company: "株式会社Arch" },
  { id: "m11", kind: "rental", category: "ハウス・倉庫/シーズン品", name: "コンテナ倉庫/1坪/シャッター", alias: "１１１１", mgmtNo: "", company: "株式会社Arch" },
  { id: "m12", kind: "rental", category: "その他(自由記述)", name: "目隠しシート１８００", alias: "", mgmtNo: "", company: "株式会社Arch" },
  { id: "m13", kind: "rental", category: "発電周辺機器", name: "電工ドラム/屋外型/漏電ブレーカ付/対応電圧:100V", alias: "", mgmtNo: "", company: "株式会社Arch" },
  { id: "m14", kind: "rental", category: "溶接機", name: "直流溶接機/300A/200V", alias: "溶接①", mgmtNo: "", company: "株式会社Arch" },
  { id: "m15", kind: "rental", category: "荷役運搬・揚重機器", name: "フォークリフト/バッテリー式/最大荷重:2t/充電電圧:200V", alias: "ベイマックス", mgmtNo: "", company: "株式会社Arch" },
];

export function machineById(id) {
  return MACHINES.find((m) => m.id === id) || null;
}

// 承認フロー（承認フロー設定で複数登録され、職長が作成時に選択する）
export const APPROVAL_FLOWS = [
  {
    id: "flow1",
    name: "標準フロー（工事担当→所長）",
    steps: [
      { no: 1, group: "グループ1", approvers: ["門脇_管理者", "門脇_パートナー"] },
      { no: 2, group: "グループ2", approvers: ["所長 山田"] },
    ],
  },
  {
    id: "flow2",
    name: "簡易フロー（工事担当のみ）",
    steps: [{ no: 1, group: "グループ1", approvers: ["門脇_管理者"] }],
  },
];

export function flowById(id) {
  return APPROVAL_FLOWS.find((f) => f.id === id) || null;
}

// 承認フローから決裁状況の初期値を作る
function makeApprovals(flowId, status) {
  const flow = flowById(flowId);
  if (!flow) return [];
  return flow.steps.map((s) => ({
    no: s.no,
    group: s.group,
    status: status === "approved" ? "approved" : "applying",
    rows: s.approvers.map((a) => ({
      approver: a,
      date: status === "approved" ? "2026/07/09" : "",
      status: status === "approved" ? "approved" : "applying",
      comment: "",
    })),
  }));
}

// 作業計画書の回答値。テンプレートの項目IDをキーに持つ。
function answers(pairs = {}) {
  return { ...pairs };
}

// 初期サンプル（一覧のキャプチャに合わせて3件）
export function initialPlans(templates) {
  const tplCrane = templates.find((t) => t.id === "tplCrane");
  const tplAerial = templates.find((t) => t.id === "tplAerial");
  const tplPump = templates.find((t) => t.id === "tplPump");
  return [
    {
      id: "plan1",
      name: "作業計画書",
      templateId: tplCrane?.id,
      templateName: tplCrane?.name || "",
      start: "2026/07/08",
      end: "2026/07/08",
      applicant: "門脇_管理者",
      author: "門脇_管理者",
      company: "株式会社Arch",
      status: "applying",
      machineIds: ["m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10", "m11", "m12", "m13", "m14", "m15"],
      flowId: "flow1",
      approvals: makeApprovals("flow1", "applying"),
      common: answers(),
      works: [{ id: newId("w"), values: {} }],
      files: [{ id: "pf1", name: "作業配置図.png" }],
      memo: "",
      checklistResults: [],
      safetyInstructions: [],
    },
    {
      id: "plan2",
      name: "作業計画書",
      templateId: tplAerial?.id,
      templateName: tplAerial?.name || "",
      start: "2026/07/08",
      end: "2026/07/08",
      applicant: "門脇_管理者",
      author: "門脇_管理者",
      company: "株式会社Arch",
      status: "approved",
      machineIds: ["m3", "m7"],
      flowId: "flow2",
      approvals: makeApprovals("flow2", "approved"),
      common: answers(),
      works: [{ id: newId("w"), values: {} }],
      files: [],
      memo: "",
      checklistResults: [],
      safetyInstructions: [],
    },
    {
      id: "plan3",
      name: "作業計画書",
      templateId: tplPump?.id,
      templateName: tplPump?.name || "",
      start: "2026/07/08",
      end: "2026/07/08",
      applicant: "門脇_管理者",
      author: "門脇_管理者",
      company: "株式会社Arch",
      status: "applying",
      machineIds: [],
      flowId: "flow2",
      approvals: makeApprovals("flow2", "applying"),
      common: answers(),
      works: [{ id: newId("w"), values: {} }],
      files: [],
      memo: "",
      checklistResults: [],
      safetyInstructions: [],
    },
  ];
}

// 一覧の「持込/レンタル機械カテゴリ」チップ用に、カテゴリごとの台数を集計
export function categoryCounts(machineIds) {
  const counts = new Map();
  machineIds.forEach((id) => {
    const m = machineById(id);
    if (!m) return;
    counts.set(m.category, (counts.get(m.category) || 0) + 1);
  });
  return [...counts.entries()].map(([category, count]) => ({ category, count }));
}

export const APPLICANTS = ["門脇_管理者", "門脇_パートナー", "星野 恵河"];
export const COMPANIES = ["株式会社Arch", "Arch建設", "アーチ工業"];
