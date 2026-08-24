// ===== 作業計画書NEO 作業計画書（一覧・新規作成・詳細）デモ用データ =====

// 打合せ参加者サインのサンプル画像（手書き風のSVGをデータURIで持つ）
const SIG_A =
  "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%2290%22%3E%3Cpath%20d%3D%22M20%2062c10-26%2018-30%2022-14%204%2015%200%2024%206%2022%207-2%2010-26%2016-24%205%202%202%2022%209%2021%208-1%2012-30%2019-28%206%202%201%2026%208%2026%208%200%2016-18%2024-30%22%20fill%3D%22none%22%20stroke%3D%22%231f2437%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E";
const SIG_B =
  "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%2290%22%3E%3Cpath%20d%3D%22M22%2058c6-22%2014-32%2020-24%205%207-4%2030%204%2032%209%202%2014-28%2022-26%206%202%203%2020%2010%2020%209%200%2015-22%2022-22%206%200%204%2016%2010%2016%206%200%2012-8%2018-16%22%20fill%3D%22none%22%20stroke%3D%22%231f2437%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E";
const SIG_C =
  "data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22240%22%20height%3D%2290%22%3E%3Cpath%20d%3D%22M18%2066c14-34%2024-36%2026-16%202%2017-2%2026%205%2026%208%200%2013-32%2021-30%207%202%202%2024%2010%2024%209%200%2018-26%2026-24%206%202%202%2018%208%2018%206%200%2012-10%2018-20%22%20fill%3D%22none%22%20stroke%3D%22%231f2437%22%20stroke-width%3D%222.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E";

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
  {
    id: "flow3",
    name: "一括依頼フロー（グループ全員に依頼／1名の承認で可）",
    steps: [
      {
        no: 1,
        group: "グループ1",
        approvers: [
          "星野 遼河",
          "かわい",
          "松枝直",
          "林田萌絵香",
          "山口惇",
          "宮本洋平",
          "西岡伸博",
          "Arch 石尾",
          "個人樋口",
          "テストユーザー_管理者",
          "五十嵐 雄人",
          "たなか ゆうき",
          "羽泉 喬平(manager)",
          "白數____管理者",
          "大内 泰希",
          "門脇 夕季乃",
          "濱口 梨沙",
        ],
      },
    ],
  },
];

export function flowById(id) {
  return APPROVAL_FLOWS.find((f) => f.id === id) || null;
}

// 承認フローから決裁状況の初期値を作る。
// 承認済のステップでも「実際に決裁したのは1名、残りは申請中のまま」という運用があるため、
// approved のときは先頭の1名だけを承認済にする（詳細画面のアコーディオン確認用）。
function makeApprovals(flowId, status, approvedBy = 0) {
  const flow = flowById(flowId);
  if (!flow) return [];
  return flow.steps.map((s) => ({
    no: s.no,
    group: s.group,
    status: status === "approved" ? "approved" : "applying",
    rows: s.approvers.map((a, i) => {
      const done = status === "approved" && i === approvedBy;
      return {
        approver: a,
        date: done ? "2026/07/22" : "",
        status: done ? "approved" : "applying",
        comment: "",
      };
    }),
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
      other: answers(),
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
      other: answers(),
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
      other: answers(),
      files: [],
      memo: "",
      checklistResults: [],
      safetyInstructions: [],
    },
    // 打合せサイン用QRの動作確認用：承認済の計画書を協力会社ごとに用意する
    {
      id: "plan4",
      name: "橋脚配筋 揚重作業計画書",
      templateId: tplCrane?.id,
      templateName: tplCrane?.name || "",
      start: "2026/07/21",
      end: "2026/07/24",
      applicant: "星野 遼河",
      author: "星野 遼河",
      company: "Arch建設",
      status: "approved",
      machineIds: ["m1", "m4"],
      flowId: "flow3",
      approvals: makeApprovals("flow3", "approved"),
      other: answers(),
      files: [{ id: "pf4", name: "移動式クレーン作業手順書.pdf" }],
      memo: "",
      checklistResults: [],
      safetyInstructions: [],
      meetingSigns: [
        { id: "sg1", image: SIG_A, name: "", at: "2026/07/21 07:52" },
        { id: "sg2", image: SIG_B, name: "", at: "2026/07/21 07:54" },
        { id: "sg3", image: null, name: "五十嵐 雄人", at: "2026/07/21 07:58" },
      ],
    },
    {
      id: "plan5",
      name: "床版下面 点検補修作業計画書",
      templateId: tplAerial?.id,
      templateName: tplAerial?.name || "",
      start: "2026/07/22",
      end: "2026/07/22",
      applicant: "門脇 夕季乃",
      author: "門脇 夕季乃",
      company: "アーチ工業",
      status: "approved",
      machineIds: ["m6"],
      flowId: "flow1",
      approvals: makeApprovals("flow1", "approved"),
      other: answers(),
      files: [],
      memo: "",
      checklistResults: [],
      safetyInstructions: [],
      meetingSigns: [{ id: "sg4", image: SIG_C, name: "", at: "2026/07/22 08:05" }],
    },
    {
      id: "plan6",
      name: "地覆コンクリート 打設作業計画書",
      templateId: tplPump?.id,
      templateName: tplPump?.name || "",
      start: "2026/07/23",
      end: "2026/07/23",
      applicant: "大内 泰希",
      author: "大内 泰希",
      company: "Arch建設",
      status: "approved",
      machineIds: ["m5", "m9"],
      flowId: "flow3",
      approvals: makeApprovals("flow3", "approved", 2),
      other: answers(),
      files: [],
      memo: "",
      checklistResults: [],
      safetyInstructions: [],
    },
  ];
}

// 打合せサイン用QRの会社選択で使う、承認済の作業計画書がある協力会社
export function companiesWithApprovedPlans(plans) {
  return [...new Set(plans.filter((p) => p.status === "approved").map((p) => p.company))];
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
