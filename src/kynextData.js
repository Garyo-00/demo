// ===== KY-NEXT（デジタルKY）デモ用データ =====
// 本番 kynext/ のカタログ（テンプレート）・KYシート・ユーザー構成を静的データで再現する。
// 構造は本番の GraphQL 型（KYNEXTSheetCatalog / KYNEXTSheet）に寄せている。

export const KYNEXT_PROJECT = { id: 101, name: "テストプロジェクト_星野" };

// 現場選択で並べる現場（本番の /projects/select 相当）
export const KYNEXT_PROJECTS = [
  { id: 101, name: "テストプロジェクト_星野", status: "InProgress" },
  { id: 98, name: "（仮称）湾岸物流センター新築工事", status: "InProgress" },
  { id: 77, name: "中央区オフィスビル改修工事", status: "Completed" },
];

// ログインユーザー。デモではロール切替でそのまま切り替わる。
// general … 元請（ゼネコン）。テンプレート設定・元請確認・ダイレクト連携ができる。
// partner … 協力会社（職長）。KYシートの作成・職長確認・作業員チェックができる。
export const USERS = {
  general: {
    id: 1,
    name: "星野 遼河",
    company: "株式会社Arch",
    role: "元請（管理者）",
    key: "general",
    templateEditable: true,
    sheetCreatable: true,
    generalContractorConfirmable: true,
    integratable: true,
  },
  partner: {
    id: 2,
    name: "建設 太郎",
    company: "株式会社テスト",
    role: "協力会社（職長）",
    key: "partner",
    templateEditable: false,
    sheetCreatable: true,
    generalContractorConfirmable: false,
    integratable: false,
  },
};

// 日付ユーティリティ（依存パッケージなし）
export const pad2 = (n) => String(n).padStart(2, "0");
export const toYmd = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const todayYmd = () => toYmd(new Date());
export const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00`);
  d.setDate(d.getDate() + n);
  return toYmd(d);
};
// YYYY-MM-DD → YYYY/MM/DD（本番 formatDateString 相当）
export const fmtDate = (ymd) => (ymd ? ymd.replace(/-/g, "/") : "");
export const fmtDateJa = (ymd) => {
  if (!ymd) return "";
  const [y, m, d] = ymd.split("-");
  return `${y}年${Number(m)}月${d}日`;
};
export const fmtMonthJa = (ym) => {
  const [y, m] = ym.split("-");
  return `${y}年${Number(m)}月`;
};
export const nowIso = () => new Date().toISOString();

export const TODAY = todayYmd();

// ステータス表記（本番 kynextSheetStatusJa）
export const STATUS_JA = {
  NotStarted: "提出済",
  InProgress: "作業中",
  Completed: "完了",
  Provisional: "仮作成",
};
export const STATUS_COLOR = {
  NotStarted: "warning",
  InProgress: "info",
  Completed: "success",
  Provisional: "default",
};

// 項目タイプの表記（本番 itemTypeLabel）
export const ITEM_TYPE_LABEL = {
  ButtonSelection: "単一選択",
  CheckboxSelection: "複数選択",
  Text: "自由記述",
  HourMinutes: "時刻(HH:MM)",
  Date: "日付",
  Number: "数値入力",
  NumberPicker: "数値選択",
  File: "画像添付",
  ReferenceSelection: "参照選択",
};

// テンプレート編集画面のブロック名（本番 blockLabels）
export const BLOCK_LABELS = {
  "basic-details": "基本情報ブロック",
  "risk-assessments": "リスク評価ブロック",
  "risk-assessment": "安全KYブロック",
  "quality-risk-assessment": "品質KYブロック",
  "other-risk-assessment": "その他KYブロック",
  "foreperson-checklist": "職長チェックリストブロック",
  "worker-sign": "作業員サインブロック",
  "worker-checklist": "作業員サインブロック",
  "worker-risk-assessment": "リスク評価ブロック",
  "general-contractor-check": "元請確認ブロック",
};

// 記号評価のマップ（本番 SYMBOL_MAP）
export const SYMBOL_MAP = { 3: "×", 2: "△", 1: "◯" };

// ダミー署名画像（手書き風の線を SVG で表現）
export const SIGNATURE_IMG =
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="50" viewBox="0 0 200 50">` +
      `<path d="M10 35 C 25 5, 40 45, 55 20 S 80 5, 95 30 S 120 45, 140 18 S 170 10, 190 32" fill="none" stroke="#1f2437" stroke-width="2.2" stroke-linecap="round"/>` +
      `</svg>`
  );

// ダミー写真（色違いの SVG）
const photo = (label, sky, ground) =>
  "data:image/svg+xml;charset=utf-8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240">` +
      `<rect width="320" height="240" fill="${sky}"/>` +
      `<rect y="156" width="320" height="84" fill="${ground}"/>` +
      `<path d="M40 156V70h18v86M58 92h56M114 156V70h18v86" fill="none" stroke="#8a94a6" stroke-width="5"/>` +
      `<circle cx="268" cy="52" r="18" fill="#ffffff" opacity=".55"/>` +
      `<text x="160" y="212" font-family="sans-serif" font-size="17" fill="#42506b" text-anchor="middle">${label}</text>` +
      `</svg>`
  );
export const PHOTO_A = photo("集合写真", "#cfe3f5", "#cbb99c");
export const PHOTO_B = photo("作業員写真", "#d7e9d3", "#c2b49b");
export const PHOTO_C = photo("参考画像", "#e2ddf3", "#bfb49f");

// ---------- リスク評価カタログ（安全KY） ----------
// 評価点は 重大性 × 可能性（Multiplication）。
export const SAFETY_RISK_CATALOG = {
  id: 501,
  type: "Safety", // Safety | Quality | Other
  title: "",
  assessmentType: "WithProcedure", // WithProcedure | WithoutProcedure
  hasPointingAndCalling: true,
  hasDoubleSafety: false,
  hasMultipleAiSuggestion: true,
  scoreType: "Multiplication", // Multiplication | Addition
  scoreTableType: "Number", // Number | Symbol
  minProcedureCount: 3,
  maxProcedureCount: 5,
  dangerPointLabel: "どんな危険があるか（予想される災害）",
  countermeasureLabel: "私たちはこうする（リスク低減対策）",
  severities: [
    { score: 3, description: "死亡・重篤な災害（休業4日以上）" },
    { score: 2, description: "休業を伴う災害" },
    { score: 1, description: "不休・軽微な災害" },
  ],
  possibilities: [
    { possibility: 3, description: "頻繁に発生する" },
    { possibility: 2, description: "時々発生する" },
    { possibility: 1, description: "ほとんど発生しない" },
  ],
  evaluations: [
    { scoreMin: 6, scoreMax: 9, evaluation: "Ⅲ", description: "直ちに対策が必要", color: "#f8c5c5" },
    { scoreMin: 3, scoreMax: 5, evaluation: "Ⅱ", description: "速やかに対策が必要", color: "#fde8b5" },
    { scoreMin: 1, scoreMax: 2, evaluation: "Ⅰ", description: "必要に応じて対策", color: "#d9f0d3" },
  ],
  evaluationsBySymbol: null,
};

// 品質KY（作業内容をリスク評価カードの中で入力する統合パターン）
export const QUALITY_RISK_CATALOG = {
  ...SAFETY_RISK_CATALOG,
  id: 502,
  type: "Quality",
  title: "",
  hasPointingAndCalling: false,
  hasMultipleAiSuggestion: false,
  minProcedureCount: 1,
  maxProcedureCount: 3,
  dangerPointLabel: "どんな不具合があるか",
  countermeasureLabel: "私たちはこうする（品質確保対策）",
};

// ---------- 基本情報カタログ ----------
// internalUseType … 一覧・検索で参照する項目（WorkDate / FirstCompany / WorkContent / WorkerCount など）
export const BASIC_DETAIL_CATALOG = {
  id: 301,
  firstCompanyLabel: "一次会社",
  workContentLabel: "作業内容",
  workDateLabel: "作業日",
  groups: [
    {
      id: 3101,
      name: "基本情報",
      optional: false,
      items: [
        { id: 1, name: "作業日", type: "Date", internalUseType: "WorkDate", optional: false, omit: false, omittable: false },
        { id: 2, name: "一次会社", type: "Text", internalUseType: "FirstCompany", optional: false, omit: false, omittable: false },
        { id: 3, name: "職長氏名", type: "Text", internalUseType: "Foreperson", optional: false, omit: false, omittable: false },
        {
          id: 4,
          name: "職種",
          type: "ButtonSelection",
          internalUseType: "None",
          optional: false,
          omit: false,
          omittable: true,
          options: [
            { id: 41, name: "鉄筋工", hasText: false },
            { id: 42, name: "型枠大工", hasText: false },
            { id: 43, name: "とび工", hasText: false },
            { id: 44, name: "電気工", hasText: false },
            { id: 45, name: "その他", hasText: true, textLabel: "職種名", textRequired: true },
          ],
        },
        { id: 5, name: "作業内容", type: "Text", internalUseType: "WorkContent", optional: false, omit: false, omittable: false },
        { id: 6, name: "作業場所", type: "Text", internalUseType: "None", optional: false, omit: false, omittable: true },
        {
          id: 7,
          name: "作業人数",
          type: "NumberPicker",
          internalUseType: "WorkerCount",
          optional: false,
          omit: false,
          omittable: false,
          settings: { numberPickerSettings: { min: 1, max: 30, step: 1, decimalPlaces: 0 } },
        },
        { id: 8, name: "作業開始時刻", type: "HourMinutes", internalUseType: "None", optional: true, omit: false, omittable: true },
      ],
    },
    {
      id: 3102,
      name: "使用機械・工具",
      optional: true,
      items: [
        {
          id: 9,
          name: "使用する機械",
          type: "CheckboxSelection",
          internalUseType: "None",
          optional: false,
          omit: false,
          omittable: true,
          options: [
            { id: 91, name: "移動式クレーン", hasText: false },
            { id: 92, name: "高所作業車", hasText: false },
            { id: 93, name: "バックホウ", hasText: false },
            { id: 94, name: "電動工具", hasText: false },
            { id: 95, name: "その他", hasText: true, textLabel: "機械名", textRequired: false },
          ],
        },
        {
          id: 10,
          name: "有資格者の配置",
          type: "ButtonSelection",
          internalUseType: "None",
          optional: false,
          omit: false,
          omittable: true,
          options: [
            { id: 101, name: "あり", hasText: false },
            { id: 102, name: "なし", hasText: false },
          ],
        },
        {
          id: 11,
          name: "資格者氏名",
          type: "Text",
          internalUseType: "None",
          optional: true,
          omit: false,
          omittable: true,
          // 「有資格者の配置」で「あり」を選んだときだけ表示する
          settings: { condition: { item: 10, option: 101 } },
        },
        { id: 12, name: "作業計画書・写真", type: "File", internalUseType: "None", optional: true, omit: false, omittable: true },
      ],
    },
  ],
};

// ---------- 職長チェックリスト ----------
export const FOREPERSON_CHECKLIST_CATALOG = {
  id: 601,
  name: "職長チェックリスト（作業開始前）",
  hasSignature: true,
  itemGroups: [
    {
      id: 6101,
      name: "作業開始前確認",
      items: [
        {
          id: 611,
          name: "作業員の体調確認を行ったか",
          type: "ButtonSelection",
          optional: false,
          options: [
            { id: 6111, name: "はい", hasText: false },
            { id: 6112, name: "いいえ", hasText: true, textLabel: "理由", textRequired: true },
          ],
        },
        {
          id: 612,
          name: "保護具の着用を確認したか",
          type: "ButtonSelection",
          optional: false,
          options: [
            { id: 6121, name: "はい", hasText: false },
            { id: 6122, name: "いいえ", hasText: false },
          ],
        },
        { id: 613, name: "作業開始時刻", type: "HourMinutes", optional: true },
        { id: 614, name: "特記事項", type: "Text", optional: true },
      ],
    },
  ],
};

// ---------- 作業員チェックリスト（サインブロック） ----------
export const WORKER_CHECKLIST_CATALOG = {
  id: 701,
  name: "作業員チェックリスト",
  selectRiskAssessmentItem: true, // 自分が行う作業（手順）を選ばせる
  itemGroups: [
    {
      id: 7101,
      name: "本日の体調",
      items: [
        {
          id: 711,
          name: "体調は良好ですか",
          type: "ButtonSelection",
          optional: false,
          options: [
            { id: 7111, name: "良好", hasText: false },
            { id: 7112, name: "不調", hasText: true, textLabel: "内容", textRequired: true },
          ],
        },
        {
          id: 712,
          name: "睡眠時間",
          type: "NumberPicker",
          optional: false,
          settings: { numberPickerSettings: { min: 0, max: 12, step: 1, decimalPlaces: 0 } },
        },
        {
          id: 713,
          name: "確認事項",
          type: "CheckboxSelection",
          optional: false,
          options: [
            { id: 7131, name: "KYの内容を理解した", hasText: false },
            { id: 7132, name: "保護具を着用した", hasText: false },
            { id: 7133, name: "作業手順を確認した", hasText: false },
          ],
        },
      ],
    },
  ],
};

export const SIGNATURE_CATALOG = {
  hasIndividualWorkerSignature: true,
  hasIndividualWorkerPhoto: false,
  individualWorkerOptional: true,
  hasGroupPhoto: true,
  groupPhotoOptional: true,
};

// ---------- 元請確認ブロック ----------
export const WORKFLOW_CATALOG = {
  hasGeneralContractorConfirmCreateKynextSheet: true, // KY作成後 元請確認
  hasGeneralContractorConfirmPostWork: true, // 作業完了後 元請確認
  hasSafetyInstruction: true, // 元請からの安全指示
  safetyInstructionLabel: "元請からの安全指示",
  createConfirmType: "Sign", // Sign | Button
  completeConfirmType: "Button",
};

// ---------- テンプレート（カタログ） ----------
export const buildCatalog = (overrides = {}) => ({
  id: 201,
  version: 3,
  template: { id: 11, name: "標準テンプレート" },
  canScheduleCopy: true,
  basicDetailCatalog: BASIC_DETAIL_CATALOG,
  // 配列位置＝表示順。安全KY → 品質KY
  safetyRiskAssessmentCatalogs: [SAFETY_RISK_CATALOG],
  qualityRiskAssessmentCatalogs: [],
  otherRiskAssessmentCatalogs: [],
  forepersonChecklistCatalogs: [FOREPERSON_CHECKLIST_CATALOG],
  workerChecklistCatalogSlots: [WORKER_CHECKLIST_CATALOG],
  workerRiskAssessmentCatalog: null,
  signatureCatalogV2: SIGNATURE_CATALOG,
  workflowCatalog: WORKFLOW_CATALOG,
  ...overrides,
});

// カタログから表示順のリスク評価カタログを取り出す（本番 selectRiskAssessmentCatalogs）
export const selectRiskCatalogs = (catalog) =>
  catalog
    ? [
        ...(catalog.safetyRiskAssessmentCatalogs ?? []),
        ...(catalog.qualityRiskAssessmentCatalogs ?? []),
        ...(catalog.otherRiskAssessmentCatalogs ?? []),
      ]
    : [];

// テンプレート一覧に並ぶテンプレート。isExternal は元請が一括適用したもの。
export const INITIAL_TEMPLATES = [
  {
    id: 11,
    name: "標準テンプレート",
    isExternal: false,
    used: true,
    catalog: buildCatalog(),
    latestCatalog: { version: 3, createdAt: `${addDays(TODAY, -12)}T09:30:00` },
  },
  {
    id: 12,
    name: "品質KY付きテンプレート",
    isExternal: false,
    used: false,
    catalog: buildCatalog({
      id: 202,
      version: 1,
      template: { id: 12, name: "品質KY付きテンプレート" },
      qualityRiskAssessmentCatalogs: [QUALITY_RISK_CATALOG],
    }),
    latestCatalog: { version: 1, createdAt: `${addDays(TODAY, -3)}T14:05:00` },
  },
  {
    id: 13,
    name: "本店標準（一括適用）",
    isExternal: true,
    used: false,
    catalog: buildCatalog({
      id: 203,
      version: 7,
      template: { id: 13, name: "本店標準（一括適用）" },
      forepersonChecklistCatalogs: [],
      workflowCatalog: { ...WORKFLOW_CATALOG, hasSafetyInstruction: false },
    }),
    latestCatalog: { version: 7, createdAt: `${addDays(TODAY, -40)}T10:00:00` },
  },
];

// ---------- KYシート ----------
// basicDetails … 項目ID → 回答値。formInputs と同じ形にして作成フローと詳細で共有する。
//   Text/Date/HourMinutes: 文字列、NumberPicker: 数値、
//   ButtonSelection: { id, text }、CheckboxSelection: [{ id, text }]、File: [{ id, name, path }]
// riskAssessments … 配列位置＝カタログ（selectRiskCatalogs）の並び。
const risk = (dangerPoint, countermeasure, s, p, is, ip, doubleSafety) => ({
  dangerPoint,
  countermeasure,
  doubleSafety: doubleSafety ?? "",
  severity: s,
  possibility: p,
  improvedSeverity: is,
  improvedPossibility: ip,
});

let seq = 1000;
const nextId = () => ++seq;

export const emptyRisk = () => ({
  dangerPoint: "",
  countermeasure: "",
  doubleSafety: "",
  severity: 0,
  possibility: 0,
  improvedSeverity: 0,
  improvedPossibility: 0,
});

const sheet = ({
  id,
  status,
  workDate,
  firstCompany,
  foreperson,
  occupation,
  workContent,
  place,
  workerCount,
  startTime,
  machines,
  qualified,
  riskAssessments,
  workerChecklists = [],
  forepersonChecklistAnswer = null,
  createConfirm = null,
  workCompleteConfirm = null,
  completeConfirm = null,
  safetyInstruction = null,
  groupNotUse = {},
  createdBy = USERS.partner,
  createSourceType = "ConstructionUser",
  groupPhotos = [],
  catalog = INITIAL_TEMPLATES[0].catalog,
  copySchedule = null,
}) => ({
  id,
  uuid: `uuid-${id}`,
  status,
  workDate,
  firstCompanyName: firstCompany,
  workContent,
  catalog,
  basicDetails: {
    1: workDate,
    2: firstCompany,
    3: foreperson,
    4: occupation,
    5: workContent,
    6: place,
    7: workerCount,
    8: startTime ?? "",
    9: machines ?? [],
    10: qualified ?? null,
    11: "",
    12: [],
  },
  groupNotUse,
  riskAssessments,
  workerChecklists,
  groupPhotos,
  forepersonChecklistAnswer,
  createConfirm,
  workCompleteConfirm,
  completeConfirm,
  safetyInstruction,
  createdBy: { id: createdBy.id, name: createdBy.name },
  createSourceType,
  copySchedule,
  createdAt: `${workDate}T07:30:00`,
});

const workerChecklist = (id, name, items, answers, signed = true, photo = null) => ({
  id,
  workerName: name,
  signature: signed ? { path: SIGNATURE_IMG } : null,
  photo: photo ? { path: photo } : null,
  answeredAt: `${TODAY}T08:1${id % 10}:00`,
  riskAssessmentItems: items, // 自分が行う手順の index（0起点）
  answers, // 作業員チェックリスト項目ID → 回答
});

const wc = (id, name, items, sleep) =>
  workerChecklist(id, name, items, {
    711: { id: 7111, text: "" },
    712: sleep,
    713: [
      { id: 7131, text: "" },
      { id: 7132, text: "" },
      { id: 7133, text: "" },
    ],
  });

export const INITIAL_SHEETS = [
  sheet({
    id: 1,
    status: "InProgress",
    workDate: TODAY,
    firstCompany: "株式会社テスト",
    foreperson: "建設 太郎",
    occupation: { id: 43, text: "" },
    workContent: "外部足場の組立（3〜4層）",
    place: "南面 3階〜4階",
    workerCount: 4,
    startTime: "08:30",
    machines: [
      { id: 94, text: "" },
      { id: 95, text: "ラチェットレンチ" },
    ],
    qualified: { id: 101, text: "" },
    riskAssessments: [
      {
        workSteps: [
          { step: "材料の荷揚げ", risk: risk("荷揚げ中に部材が落下し、下の作業員に当たる", "立入禁止措置を行い、合図者を配置して荷揚げする", 3, 2, 3, 1) },
          { step: "建枠・筋交いの取付", risk: risk("足場上で足を踏み外し墜落する", "親綱を先行して張り、フルハーネスを常時使用する", 3, 2, 2, 1) },
          { step: "足場板の敷設", risk: risk("足場板の固定不足で踏み抜き転落する", "足場板は番線で確実に固定し、敷設後に点検する", 3, 1, 1, 1) },
          { step: "手摺・巾木の設置", risk: risk("手摺未設置区間から工具が落下する", "手摺先行工法で施工し、工具には落下防止ひもを付ける", 2, 2, 1, 1) },
        ],
        actionGoal: "足場上で移動する時は親綱にフックを掛けよう、ヨシ！",
      },
    ],
    workerChecklists: [
      wc(11, "山田 一郎", [0, 1], 7),
      wc(12, "佐藤 次郎", [1, 2], 6),
      wc(13, "鈴木 三郎", [2, 3], 7),
    ],
    groupPhotos: [{ id: 901, name: "group.jpg", path: PHOTO_A }],
    forepersonChecklistAnswer: {
      answeredAt: `${TODAY}T08:05:00`,
      answers: { 611: { id: 6111, text: "" }, 612: { id: 6121, text: "" }, 613: "08:30", 614: "" },
      signature: { path: SIGNATURE_IMG },
    },
    createConfirm: { confirmedAt: `${TODAY}T08:40:00`, confirmer: { name: USERS.general.name }, signature: { path: SIGNATURE_IMG } },
    safetyInstruction: { safetyInstruction: "3階南側は開口部の養生が未完了です。作業前に必ず確認してください。", updatedAt: `${TODAY}T08:45:00` },
  }),
  sheet({
    id: 2,
    status: "NotStarted",
    workDate: TODAY,
    firstCompany: "田中建設工業",
    foreperson: "田中 健",
    occupation: { id: 41, text: "" },
    workContent: "2階床スラブ配筋",
    place: "2階 北側スパン",
    workerCount: 6,
    startTime: "08:00",
    machines: [{ id: 94, text: "" }],
    qualified: { id: 102, text: "" },
    riskAssessments: [
      {
        workSteps: [
          { step: "鉄筋の小運搬", risk: risk("鉄筋を担いで移動中につまずき転倒する", "通路を整理し、2人で声を掛け合って運搬する", 2, 2, 1, 1) },
          { step: "配筋・結束", risk: risk("結束線の端部で手を切る", "手袋を着用し、結束線の端部は内側に折り込む", 1, 3, 1, 1) },
          { step: "スペーサーの設置", risk: risk("鉄筋上を歩行中に足を挟む", "歩み板を敷設し、鉄筋上を直接歩かない", 2, 2, 1, 1) },
        ],
        actionGoal: "鉄筋上は歩み板の上を歩こう、ヨシ！",
      },
    ],
    workerChecklists: [wc(21, "高橋 四郎", [0, 1], 6)],
  }),
  sheet({
    id: 3,
    status: "Completed",
    workDate: addDays(TODAY, -1),
    firstCompany: "株式会社テスト",
    foreperson: "建設 太郎",
    occupation: { id: 43, text: "" },
    workContent: "外部足場の組立（1〜2層）",
    place: "南面 1階〜2階",
    workerCount: 4,
    startTime: "08:30",
    machines: [{ id: 94, text: "" }],
    qualified: { id: 101, text: "" },
    riskAssessments: [
      {
        workSteps: [
          { step: "材料の荷揚げ", risk: risk("荷揚げ中に部材が落下し、下の作業員に当たる", "立入禁止措置を行い、合図者を配置して荷揚げする", 3, 2, 3, 1) },
          { step: "建枠・筋交いの取付", risk: risk("足場上で足を踏み外し墜落する", "親綱を先行して張り、フルハーネスを常時使用する", 3, 2, 2, 1) },
          { step: "足場板の敷設", risk: risk("足場板の固定不足で踏み抜き転落する", "足場板は番線で確実に固定し、敷設後に点検する", 3, 1, 1, 1) },
        ],
        actionGoal: "足場上で移動する時は親綱にフックを掛けよう、ヨシ！",
      },
    ],
    workerChecklists: [wc(31, "山田 一郎", [0, 1], 7), wc(32, "佐藤 次郎", [1, 2], 7), wc(33, "鈴木 三郎", [2], 6), wc(34, "伊藤 五郎", [0, 2], 8)],
    groupPhotos: [{ id: 902, name: "group.jpg", path: PHOTO_A }],
    forepersonChecklistAnswer: {
      answeredAt: `${addDays(TODAY, -1)}T08:05:00`,
      answers: { 611: { id: 6111, text: "" }, 612: { id: 6121, text: "" }, 613: "08:30", 614: "" },
      signature: { path: SIGNATURE_IMG },
    },
    createConfirm: { confirmedAt: `${addDays(TODAY, -1)}T08:40:00`, confirmer: { name: USERS.general.name }, signature: { path: SIGNATURE_IMG } },
    workCompleteConfirm: { confirmedAt: `${addDays(TODAY, -1)}T17:10:00`, confirmer: { name: USERS.partner.name } },
    completeConfirm: { confirmedAt: `${addDays(TODAY, -1)}T17:30:00`, confirmer: { name: USERS.general.name }, signature: null },
  }),
  sheet({
    id: 4,
    status: "Completed",
    workDate: addDays(TODAY, -1),
    firstCompany: "高橋電設",
    foreperson: "高橋 誠",
    occupation: { id: 44, text: "" },
    workContent: "1階電気配線・ケーブルラック取付",
    place: "1階 電気室〜EPS",
    workerCount: 3,
    startTime: "09:00",
    machines: [{ id: 92, text: "" }, { id: 94, text: "" }],
    qualified: { id: 101, text: "" },
    riskAssessments: [
      {
        workSteps: [
          { step: "高所作業車の設置", risk: risk("不整地で高所作業車が転倒する", "設置前に地盤を確認し、アウトリガーを確実に張り出す", 3, 1, 1, 1) },
          { step: "ケーブルラックの取付", risk: risk("ラックの落下で下の作業員に当たる", "作業範囲を立入禁止にし、ラックは仮固定してから本締めする", 3, 2, 2, 1) },
          { step: "配線作業", risk: risk("活線に触れて感電する", "作業前に検電し、停電表示札を掲示する", 3, 1, 3, 1) },
        ],
        actionGoal: "配線前に検電して活線でないことを確認しよう、ヨシ！",
      },
    ],
    workerChecklists: [wc(41, "渡辺 六郎", [0, 1], 7), wc(42, "中村 七郎", [1, 2], 6), wc(43, "小林 八郎", [2], 7)],
    createConfirm: { confirmedAt: `${addDays(TODAY, -1)}T09:20:00`, confirmer: { name: USERS.general.name }, signature: { path: SIGNATURE_IMG } },
    workCompleteConfirm: { confirmedAt: `${addDays(TODAY, -1)}T16:50:00`, confirmer: { name: "高橋 誠" } },
    completeConfirm: { confirmedAt: `${addDays(TODAY, -1)}T17:20:00`, confirmer: { name: USERS.general.name }, signature: null },
  }),
  sheet({
    id: 5,
    status: "NotStarted",
    workDate: addDays(TODAY, 1),
    firstCompany: "佐藤工務店",
    foreperson: "佐藤 実",
    occupation: { id: 42, text: "" },
    workContent: "3階柱・壁型枠の建込",
    place: "3階 東側",
    workerCount: 5,
    startTime: "08:00",
    machines: [{ id: 91, text: "" }, { id: 94, text: "" }],
    qualified: { id: 101, text: "" },
    riskAssessments: [
      {
        workSteps: [
          { step: "型枠パネルの揚重", risk: risk("玉掛け不良でパネルが落下する", "有資格者が玉掛けし、吊り荷の下に立ち入らない", 3, 2, 3, 1) },
          { step: "パネルの建込・固定", risk: risk("建込中のパネルが倒れて挟まれる", "サポートで仮固定してから手を離す", 3, 2, 2, 1) },
          { step: "セパレーターの取付", risk: risk("脚立から転落する", "脚立は天板に乗らず、2人で支えて作業する", 2, 2, 1, 1) },
        ],
        actionGoal: "吊り荷の下には絶対に入らない、ヨシ！",
      },
    ],
    workerChecklists: [],
  }),
  sheet({
    id: 6,
    status: "Provisional",
    workDate: TODAY,
    firstCompany: "伊藤設備",
    foreperson: "",
    occupation: null,
    workContent: "地下ピット配管",
    place: "",
    workerCount: 2,
    machines: [],
    qualified: null,
    riskAssessments: [{ workSteps: [], actionGoal: "" }],
    workerChecklists: [],
    createSourceType: "WorkAdjust", // 作業間調整proの作業予定から自動作成された仮作成シート
  }),
  sheet({
    id: 7,
    status: "InProgress",
    workDate: addDays(TODAY, -8),
    firstCompany: "田中建設工業",
    foreperson: "田中 健",
    occupation: { id: 41, text: "" },
    workContent: "1階床スラブ配筋",
    place: "1階 北側スパン",
    workerCount: 6,
    startTime: "08:00",
    machines: [{ id: 94, text: "" }],
    qualified: { id: 102, text: "" },
    riskAssessments: [
      {
        workSteps: [
          { step: "鉄筋の小運搬", risk: risk("鉄筋を担いで移動中につまずき転倒する", "通路を整理し、2人で声を掛け合って運搬する", 2, 2, 1, 1) },
          { step: "配筋・結束", risk: risk("結束線の端部で手を切る", "手袋を着用し、結束線の端部は内側に折り込む", 1, 3, 1, 1) },
          { step: "スペーサーの設置", risk: risk("鉄筋上を歩行中に足を挟む", "歩み板を敷設し、鉄筋上を直接歩かない", 2, 2, 1, 1) },
        ],
        actionGoal: "鉄筋上は歩み板の上を歩こう、ヨシ！",
      },
    ],
    workerChecklists: [wc(71, "高橋 四郎", [0, 1], 6), wc(72, "斎藤 九郎", [1, 2], 7)],
    createConfirm: { confirmedAt: `${addDays(TODAY, -8)}T08:30:00`, confirmer: { name: USERS.general.name }, signature: { path: SIGNATURE_IMG } },
  }),
  sheet({
    id: 8,
    status: "Completed",
    workDate: addDays(TODAY, -15),
    firstCompany: "鈴木塗装",
    foreperson: "鈴木 塗",
    occupation: { id: 45, text: "塗装工" },
    workContent: "外壁下地処理・下塗り",
    place: "北面 全層",
    workerCount: 3,
    startTime: "08:30",
    machines: [{ id: 92, text: "" }],
    qualified: { id: 101, text: "" },
    riskAssessments: [
      {
        workSteps: [
          { step: "ゴンドラの点検・搭乗", risk: risk("ゴンドラのワイヤー損傷で落下する", "始業前点検を実施し、異常時は使用しない", 3, 1, 3, 1) },
          { step: "下地処理（ケレン）", risk: risk("粉じんを吸い込み健康障害を起こす", "防じんマスクを着用し、集じん機を併用する", 2, 3, 2, 1) },
          { step: "下塗り塗布", risk: risk("有機溶剤で中毒・引火する", "換気を行い、火気厳禁の表示をする", 3, 2, 3, 1) },
        ],
        actionGoal: "ゴンドラに乗る前に安全帯のフックを掛けよう、ヨシ！",
      },
    ],
    workerChecklists: [wc(81, "加藤 十郎", [0, 1, 2], 7), wc(82, "吉田 十一", [1, 2], 6), wc(83, "山本 十二", [0, 2], 7)],
    createConfirm: { confirmedAt: `${addDays(TODAY, -15)}T09:00:00`, confirmer: { name: USERS.general.name }, signature: { path: SIGNATURE_IMG } },
    workCompleteConfirm: { confirmedAt: `${addDays(TODAY, -15)}T17:00:00`, confirmer: { name: "鈴木 塗" } },
    completeConfirm: { confirmedAt: `${addDays(TODAY, -15)}T17:30:00`, confirmer: { name: USERS.general.name }, signature: null },
  }),
];

// ---------- ダイレクト連携 ----------
export const INITIAL_DIRECT_APPLICATIONS = [
  {
    id: 1,
    name: "現場連絡用（direct）",
    connectStatus: "Connected", // Connected | Disconnected | Error
    note: "安全担当・所長と共有",
    scope: { fileWrite: true },
    notifications: [
      { id: 1, notificationType: "KYNextSheetList", talkRoom: "安全連絡", note: "毎朝8時に一覧を通知" },
      { id: 2, notificationType: "KYNextWorkerChecklistAnswerAlert", talkRoom: "安全連絡", note: "" },
    ],
  },
  {
    id: 2,
    name: "協力会社連絡用",
    connectStatus: "Disconnected",
    note: "再連携が必要",
    scope: { fileWrite: false },
    notifications: [],
  },
];

export const DIRECT_TALK_ROOMS = [
  { domainName: "株式会社Arch", talkRooms: [{ id: "r1", name: "安全連絡" }, { id: "r2", name: "工程会議" }] },
  { domainName: "テストプロジェクト_星野", talkRooms: [{ id: "r3", name: "全体連絡" }, { id: "r4", name: "職長会" }] },
];

export const DIRECT_NOTIFICATION_JA = {
  KYNextSheetList: "KYシート一覧",
  KYNextChecklistAnswerAlert: "職長チェックリスト回答アラート",
  KYNextWorkerChecklistAnswerAlert: "作業員チェックリスト回答アラート",
  SafetyDocumentApplication: "安全書類申請",
  WorkPlanApplication: "作業計画書申請",
  EmployerPatrolCompletion: "事業者パトロール完了",
};

export const DIRECT_STATUS_JA = {
  Connected: "接続中",
  Disconnected: "未接続",
  Error: "エラー",
};

// LINE 共有先グループ（本番はユーザーの LINE 連携から取得）
export const LINE_GROUPS = [
  { id: 1, name: "星野現場 職長会" },
  { id: 2, name: "株式会社テスト 安全連絡" },
];

// ---------- 計算ユーティリティ（本番 riskCalculation） ----------
export const calcScore = (severity, possibility, scoreType = "Multiplication") => {
  if (!severity || !possibility) return 0;
  return scoreType === "Addition" ? severity + possibility : severity * possibility;
};

export const findEvaluation = (score, evaluations = []) =>
  evaluations.find((e) => score >= e.scoreMin && score <= e.scoreMax) || null;

// 評価の表示 { label, color }。記号評価（Symbol）にも対応。
export const evaluationOf = (riskCatalog, severity, possibility) => {
  const scoreType = riskCatalog?.scoreType ?? "Multiplication";
  if (riskCatalog?.scoreTableType === "Symbol" && riskCatalog.evaluationsBySymbol?.length) {
    if (!severity || !possibility) return { label: "-", color: "transparent", score: 0 };
    const entry = riskCatalog.evaluationsBySymbol.find((e) =>
      e.pair.some((p) => p.possibility === possibility && p.severity === severity)
    );
    if (!entry) return { label: "-", color: "transparent", score: 0 };
    return { label: `${entry.score}${entry.evaluation ? `(${entry.evaluation})` : ""}`, color: "transparent", score: entry.score };
  }
  const score = calcScore(severity, possibility, scoreType);
  if (!score) return { label: "-", color: "transparent", score: 0 };
  const ev = findEvaluation(score, riskCatalog?.evaluations ?? []);
  return { label: `${score} (${ev?.evaluation ?? "-"})`, color: ev?.color ?? "transparent", score };
};

// 基本情報の回答を表示用の文字列にする（本番 getDisplayValue 相当）
export const displayAnswer = (item, value) => {
  if (value == null || value === "") return "";
  if (item.type === "ButtonSelection") {
    const opt = item.options?.find((o) => o.id === value.id);
    if (!opt) return "";
    return value.text ? `${opt.name}(${opt.textLabel ? `${opt.textLabel}: ` : ""}${value.text})` : opt.name;
  }
  if (item.type === "CheckboxSelection") {
    if (!Array.isArray(value) || value.length === 0) return "";
    return value
      .map((v) => {
        const opt = item.options?.find((o) => o.id === v.id);
        if (!opt) return "";
        return v.text ? `${opt.name}(${opt.textLabel ? `${opt.textLabel}: ` : ""}${v.text})` : opt.name;
      })
      .filter(Boolean)
      .join("、");
  }
  if (item.type === "Date") return fmtDate(value);
  if (item.type === "File") return Array.isArray(value) ? value.map((f) => f.name).join("、") : "";
  return String(value);
};

// 条件付き表示の判定（settings.condition があれば、参照項目の回答が一致するときだけ表示）
export const isItemVisible = (item, values, group) => {
  if (item.omit) return false;
  const cond = item.settings?.condition;
  if (!cond?.option) return true;
  const v = values?.[cond.item];
  if (!v) return false;
  if (Array.isArray(v)) return v.some((x) => x?.id === cond.option);
  if (typeof v === "object") return v.id === cond.option;
  return String(v) === String(cond.option);
};

// カタログから作成フローのステップを組み立てる（本番 buildVirtualSteps）
export const buildVirtualSteps = (catalog) => {
  const steps = [{ id: "basic-details", name: "基本情報", stepperName: "基本情報", content: "Custom" }];
  const RISK_NAME = { Safety: "安全リスク評価", Quality: "品質リスク評価", Other: "リスク評価" };
  const PREFIX = { Safety: "safety", Quality: "quality", Other: "other" };
  selectRiskCatalogs(catalog).forEach((rc, riskIndex) => {
    const label = rc.title || (rc.type === "Quality" ? "品質KY" : "");
    const withTitle = (n) => (label ? `${label}（${n}）` : n);
    const prefix = PREFIX[rc.type] ?? "other";
    const sectionTitle = rc.title || RISK_NAME[rc.type];
    if (rc.assessmentType !== "WithoutProcedure" && rc.type === "Safety") {
      steps.push({ id: `${prefix}-procedures`, name: "作業手順", stepperName: withTitle("作業手順"), content: "WorkStepInput", riskIndex });
    }
    steps.push({ id: `${prefix}-risks`, name: rc.title ? "リスク評価" : RISK_NAME[rc.type], stepperName: sectionTitle, content: "WorkRiskAssessment", riskIndex });
    if (rc.hasPointingAndCalling) {
      steps.push({ id: `${prefix}-pointing`, name: "指差呼称", stepperName: withTitle("指差呼称"), content: "PointingAndCalling", riskIndex });
    }
  });
  steps.push({ id: "confirmation", name: "確認", stepperName: "確認", content: "Confirmation" });
  return steps;
};

// リスク評価セクションの見出し（本番 riskAssessmentSectionTitle）
export const riskSectionTitle = (rc) => rc.title || { Safety: "安全リスク評価", Quality: "品質リスク評価", Other: "リスク評価" }[rc.type];
// 作業内容をリスク評価カードの中で入力するパターン（品質KY・その他KY）
export const isMergedProcedure = (rc) => !!rc && rc.assessmentType !== "WithoutProcedure" && rc.type !== "Safety";

// 新しいシートIDを払い出す
export const newSheetId = (sheets) => Math.max(0, ...sheets.map((s) => s.id)) + 1;
export const newId = nextId;

// ---------- テンプレート編集画面用（設定・テンプレート編集・一括適用） ----------
// 一覧・検索で参照する内部項目の表示名（本番 internalUseTypeLable）。項目名の左に "(作業日)" のように出す。
export const INTERNAL_USE_LABEL = {
  WorkDate: "作業日",
  FirstCompany: "一次会社",
  Foreperson: "職長氏名",
  WorkContent: "作業内容",
  WorkerCount: "作業人数",
};

// 内部項目（作業日・一次会社など API が管理する項目）はタイプ変更・削除できない（本番 item.editable）
export const isCatalogItemEditable = (item) => !item?.internalUseType || item.internalUseType === "None";

// 項目・グループの雛形（本番 settings/constants.ts の emptyItem / emptyGroup）
export const emptyCatalogItem = () => ({
  id: nextId(),
  name: "",
  type: "Text",
  internalUseType: "None",
  optional: true,
  omit: false,
  omittable: true,
  options: [],
});
export const emptyCatalogGroup = () => ({ id: nextId(), name: "", optional: false, items: [emptyCatalogItem()] });
export const emptyCatalogOption = () => ({ id: nextId(), name: "", hasText: false, textLabel: "", textRequired: false });

// 職長チェックリスト・作業員チェックリストを新規作成するときの雛形
export const emptyForepersonChecklist = () => ({
  id: nextId(),
  name: "",
  hasSignature: true,
  itemGroups: [emptyCatalogGroup()],
});
export const emptyWorkerChecklist = () => ({
  id: nextId(),
  name: "",
  selectRiskAssessmentItem: false,
  itemGroups: [emptyCatalogGroup()],
});

// 作業員サインブロック内のリスク評価（作業員が自分の作業1件を評価する）を新規作成するときの雛形
export const WORKER_RISK_CATALOG = {
  ...SAFETY_RISK_CATALOG,
  id: 503,
  type: "Safety",
  hasPointingAndCalling: false,
  hasDoubleSafety: false,
  hasMultipleAiSuggestion: false,
  minProcedureCount: 1,
  maxProcedureCount: 1,
  useArchIntelligence: true,
};

// 元請の他現場のテンプレート適用状況（本番 listProjects → kyNextSettings.currentTemplate）。
// 現在の現場（101）は現場設定側で持つため含めない。値はテンプレート ID（null = 未設定）。
export const INITIAL_PROJECT_TEMPLATE_IDS = { 98: 13, 77: null };

// 元請設定（会社共通）。リスクアセスメント AI の追加プロンプト設定（本番 company.settings.kynext）
export const INITIAL_COMPANY_SETTINGS = {
  useRiskAssessmentCustomPrompt: true,
  autoTuneRiskAssessmentSuggestionPrompt: true,
  riskAssessmentAdditionalPrompt:
    "足場・高所作業ではフルハーネスの使用と親綱の先行設置を必ず対策に含めること。\n重機作業では合図者の配置と立入禁止措置を優先して提案すること。",
};
