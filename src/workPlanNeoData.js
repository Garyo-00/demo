// ===== 作業計画書NEO デモ用データ =====
// 画面デモのためのサンプル値。バックエンドは不要。

export const WPN_PROJECT = "令和7年度福山道路赤坂ランプ橋PC上部工事";

// 回答形式（テンプレートで項目ごとに指定する入力方法）
// needsOptions: 選択肢の入力が必要な形式
export const ANSWER_TYPES = [
  { value: "text", label: "自由入力" },
  { value: "textarea", label: "自由入力（複数行）" },
  { value: "number", label: "数値入力" },
  { value: "date", label: "日付" },
  { value: "dateRange", label: "日付範囲" },
  { value: "datetime", label: "日時" },
  { value: "time", label: "時刻" },
  { value: "timeRange", label: "時間帯" },
  { value: "select", label: "単一選択", needsOptions: true },
  { value: "multiSelect", label: "複数選択", needsOptions: true },
  { value: "checkbox", label: "チェックボックス" },
  { value: "photo", label: "写真添付" },
  { value: "file", label: "ファイル添付" },
  { value: "machine", label: "持込機械選択" },
  { value: "worker", label: "作業員選択" },
];

export function needsOptions(list, value) {
  return !!list.find((t) => t.value === value)?.needsOptions;
}

// 全テンプレート共通の必須項目（編集不可・必ず作業計画書の先頭に入る）
export const FIXED_ITEMS = [
  { label: "作業計画書名", type: "自由入力" },
  { label: "作業期間", type: "日付範囲" },
];

// 専用ブロック（項目テーブルとは別に、機能単位で計画書に載せるまとまり）
// 詳細仕様は未定のため、現時点では使用可否のみをテンプレートで設定する。
export const TEMPLATE_BLOCKS = [
  {
    key: "floorPlan",
    label: "作業配置図",
    hint: "作業配置図設定で登録した図面上に、当日の作業範囲を配置します",
    // 共通項目より前（必須項目の直後）に配置
    slot: "before",
  },
  {
    key: "craneAuto",
    label: "クレーンの自動入力",
    hint: "クレーン諸元から作業半径・定格荷重などを自動で入力します",
    slot: "after",
  },
  {
    key: "meetingSign",
    label: "打合せ参加者サイン",
    hint: "作業前打合せの参加者がサインを記入します",
    slot: "after",
  },
  {
    key: "safetyInstruction",
    label: "安全指示事項",
    // ONのとき、承認画面で元請が「作業内容＋安全指示事項」を任意の数だけ入力できる（docs/workplan/02 参照）
    hint: "ONにすると、承認時に元請が作業内容ごとの安全指示事項を入力できます（OFFなら承認のみ）",
    slot: "after",
  },
];

export function defaultBlocks(on = []) {
  return Object.fromEntries(TEMPLATE_BLOCKS.map((b) => [b.key, on.includes(b.key)]));
}

// 業務フロー（デモの位置づけを示す補助表示）
export const WPN_FLOW = [
  { step: "1", label: "テンプレート設定（元請）", key: "template" },
  { step: "2", label: "作業計画書の作成（職長）", key: "plan" },
  { step: "3", label: "承認・否認（元請）", key: "approval" },
  { step: "4", label: "点検QRから閲覧・チェックリスト実施（作業員）", key: "run" },
];

let seq = 100;
export function newId(prefix = "r") {
  seq += 1;
  return `${prefix}${seq}`;
}

// 共通項目・作業内容の1行
export function makeRow(patch = {}) {
  return {
    id: newId(),
    label: "",
    type: "text",
    required: false,
    note: "",
    options: "",
    ...patch,
  };
}

// チェックリストの1行（回答形式は持たず、確認内容のみ）
export function makeCheckRow(patch = {}) {
  return { id: newId("c"), label: "", required: false, note: "", ...patch };
}

// チェックリスト（1テンプレートに複数持てる）
export function makeChecklist(patch = {}) {
  return {
    id: newId("cl"),
    name: "",
    role: "",
    rows: [makeCheckRow()],
    ...patch,
  };
}

// ===== 初期サンプルテンプレート =====
// kind: "master" … サービス標準のマスタテンプレート（編集・削除不可／複製して使う）
//       "custom" … 現場（元請）が作成したテンプレート
function master(name, patch = {}) {
  return {
    id: newId("tpl"),
    name,
    kind: "master",
    updatedAt: "2026/04/01",
    updatedBy: "システム",
    blocks: defaultBlocks(["floorPlan", "meetingSign", "safetyInstruction"]),
    common: [
      makeRow({ label: "使用する持込機械", type: "machine", required: true, note: "ASに登録済みの機械から選択" }),
      makeRow({ label: "作業場所", type: "text", required: true }),
      makeRow({ label: "作業責任者", type: "worker", required: true }),
    ],
    work: [
      makeRow({ label: "作業手順", type: "textarea", required: true }),
      makeRow({ label: "想定される危険", type: "textarea", required: true }),
      makeRow({ label: "安全対策", type: "textarea", required: true }),
    ],
    checklists: [
      makeChecklist({
        name: "運転前チェックリスト",
        role: "運転者",
        rows: [makeCheckRow({ label: "作業計画書を確認しましたか", required: true })],
      }),
    ],
    files: [],
    ...patch,
  };
}

export const INITIAL_TEMPLATES = [
  // 画面確認用：専用ブロックを全てONにし、回答形式を一通り並べたデモテンプレート。
  // 「テンプレートの内容が作成画面にどう反映されるか」を確認するために用意している。
  {
    id: "tplDemo",
    name: "【デモ】全ブロック・全回答形式",
    kind: "custom",
    updatedAt: "2026/08/06",
    updatedBy: "元請 田中",
    blocks: defaultBlocks(["floorPlan", "craneAuto", "meetingSign", "safetyInstruction"]),
    common: [
      makeRow({ label: "フォークリフトの種類", type: "select", required: true, options: "カウンタ式, リーチ式, サイド式" }),
      makeRow({ label: "型式・能力", type: "text", required: true }),
      makeRow({ label: "自由入力（複数行）", type: "textarea" }),
      makeRow({ label: "数値", type: "number" }),
      makeRow({ label: "チェック", type: "checkbox" }),
      makeRow({ label: "複数選択式", type: "multiSelect", options: "フルハーネス, 保護帽, 安全靴" }),
      makeRow({ label: "使用する持込機械", type: "machine", note: "ASに登録済みの機械から選択" }),
      makeRow({ label: "作業責任者", type: "worker" }),
      makeRow({ label: "時間", type: "time" }),
      makeRow({ label: "時間範囲", type: "timeRange" }),
      makeRow({ label: "日付", type: "date" }),
      makeRow({ label: "日付範囲", type: "dateRange" }),
      makeRow({ label: "日時", type: "datetime" }),
      makeRow({ label: "写真添付", type: "photo" }),
      makeRow({ label: "ファイル添付", type: "file" }),
    ],
    work: [
      makeRow({ label: "運搬材料", type: "text", required: true }),
      makeRow({ label: "運転者（正）", type: "worker", required: true }),
      makeRow({ label: "作業指揮者", type: "worker", required: true }),
      makeRow({ label: "合図方法等", type: "select", required: true, options: "手信号, laser, 無線" }),
      makeRow({ label: "作業安全指示事項", type: "text", required: true }),
    ],
    checklists: [
      makeChecklist({
        name: "運転前チェックリスト",
        role: "運転者",
        rows: [makeCheckRow({ label: "作業計画書を確認しましたか", required: true })],
      }),
    ],
    files: [{ id: "fdemo", name: "作業手順書.pdf" }],
  },
  master("【テンプレート用】コンクリートポンプ車"),
  master("【テンプレート用】トラック搭載型クレーン・ユニック車"),
  master("【テンプレート用】フォークリフト"),
  master("【テンプレート用】定置式クレーン"),
  master("【テンプレート用】移動式クレーン", {
    blocks: defaultBlocks(["floorPlan", "craneAuto", "meetingSign", "safetyInstruction"]),
  }),
  master("【テンプレート用】車両系建設機械（掘削用機械）"),
  master("【テンプレート用】車両系建設機械（整地・積込用機械・その他）"),
  master("【テンプレート用】車両系荷役運搬機械（不整地運搬車）"),
  master("【テンプレート用】高所作業車"),
  {
    id: "tplPump",
    name: "コンクリートポンプ車作業計画書",
    kind: "custom",
    updatedAt: "2026/07/30",
    updatedBy: "元請 田中",
    blocks: defaultBlocks(["floorPlan", "meetingSign", "safetyInstruction"]),
    common: [
      makeRow({ label: "使用する持込機械", type: "machine", required: true }),
      makeRow({ label: "圧送箇所", type: "text", required: true }),
      makeRow({ label: "配管経路", type: "textarea", required: false }),
    ],
    work: [
      makeRow({ label: "作業手順", type: "textarea", required: true }),
      makeRow({ label: "圧送量（m3）", type: "number", required: true }),
    ],
    checklists: [
      makeChecklist({
        name: "設置前チェックリスト",
        role: "運転者",
        rows: [
          makeCheckRow({ label: "作業計画書を確認しましたか", required: true }),
          makeCheckRow({ label: "アウトリガーは最大張り出しになっているか", required: true }),
          makeCheckRow({ label: "架空線との離隔を確保しているか", required: true }),
        ],
      }),
    ],
    files: [],
  },
  {
    id: "tplCrane",
    name: "移動式クレーン作業計画書",
    kind: "custom",
    updatedAt: "2026/07/28",
    updatedBy: "元請 田中",
    blocks: defaultBlocks(["floorPlan", "craneAuto", "meetingSign", "safetyInstruction"]),
    common: [
      makeRow({ label: "使用する持込機械", type: "machine", required: true, note: "ASに登録済みの機械から選択" }),
      makeRow({ label: "作業場所", type: "text", required: true }),
      makeRow({ label: "作業責任者", type: "worker", required: true }),
      makeRow({
        label: "天候中止基準",
        type: "select",
        required: false,
        options: "風速10m/s以上, 降雨時, 該当なし",
      }),
    ],
    work: [
      makeRow({ label: "作業手順", type: "textarea", required: true }),
      makeRow({ label: "吊り荷重量（t）", type: "number", required: true }),
      makeRow({ label: "作業半径（m）", type: "number", required: true }),
      makeRow({ label: "想定される危険", type: "textarea", required: true }),
      makeRow({ label: "安全対策", type: "textarea", required: true }),
    ],
    checklists: [
      makeChecklist({
        name: "運転前チェックリスト",
        role: "運転者",
        rows: [
          makeCheckRow({ label: "作業計画書を確認しましたか", required: true }),
          makeCheckRow({ label: "アウトリガーは最大張り出しになっているか", required: true }),
          makeCheckRow({ label: "地盤の支持力・敷き鉄板の状態を確認したか", required: true }),
        ],
      }),
      makeChecklist({
        name: "玉掛け者チェックリスト",
        role: "玉掛け者・合図者",
        rows: [
          makeCheckRow({ label: "作業半径内の立入禁止措置を実施したか", required: true }),
          makeCheckRow({ label: "合図者との合図方法を確認したか", required: true }),
        ],
      }),
    ],
    files: [{ id: "f1", name: "移動式クレーン作業手順書.pdf" }],
  },
  {
    id: "tplMachine",
    name: "車両系建設機械作業計画・指示書",
    kind: "custom",
    updatedAt: "2026/07/22",
    updatedBy: "元請 佐藤",
    blocks: defaultBlocks(["floorPlan", "safetyInstruction"]),
    common: [
      makeRow({ label: "使用する持込機械", type: "machine", required: true }),
      makeRow({ label: "掘削深さ（m）", type: "number", required: true }),
    ],
    work: [
      makeRow({ label: "作業手順", type: "textarea", required: true }),
      makeRow({ label: "誘導者の配置", type: "worker", required: true }),
    ],
    checklists: [
      makeChecklist({
        name: "運転前チェックリスト",
        role: "運転者",
        rows: [
          makeCheckRow({ label: "作業計画書を確認しましたか", required: true }),
          makeCheckRow({ label: "土留め・法面の状態を確認したか", required: true }),
        ],
      }),
    ],
    files: [],
  },
  {
    id: "tplCarry",
    name: "車両系荷役運搬機械作業計画書",
    kind: "custom",
    updatedAt: "2026/07/10",
    updatedBy: "元請 佐藤",
    blocks: defaultBlocks(["floorPlan", "safetyInstruction"]),
    common: [makeRow({ label: "使用する持込機械", type: "machine", required: true })],
    work: [makeRow({ label: "運搬経路・作業手順", type: "textarea", required: true })],
    checklists: [
      makeChecklist({
        name: "運転前チェックリスト",
        role: "運転者",
        rows: [makeCheckRow({ label: "作業計画書を確認しましたか", required: true })],
      }),
    ],
    files: [],
  },
  {
    id: "tplAerial",
    name: "高所作業車作業計画・指示書",
    kind: "custom",
    updatedAt: "2026/07/15",
    updatedBy: "元請 佐藤",
    blocks: defaultBlocks(["floorPlan", "meetingSign", "safetyInstruction"]),
    common: [
      makeRow({ label: "使用する持込機械", type: "machine", required: true }),
      makeRow({ label: "作業高さ（m）", type: "number", required: true }),
    ],
    work: [
      makeRow({ label: "作業内容", type: "textarea", required: true }),
      makeRow({ label: "使用する保護具", type: "multiSelect", required: true, options: "フルハーネス, 保護帽, 安全靴" }),
    ],
    checklists: [
      makeChecklist({
        name: "運転前チェックリスト",
        role: "運転者",
        rows: [
          makeCheckRow({ label: "作業計画書を確認しましたか", required: true }),
          makeCheckRow({ label: "フルハーネスを使用しているか", required: true }),
          makeCheckRow({ label: "路肩・段差の有無を確認したか", required: true }),
        ],
      }),
    ],
    files: [],
  },
];
