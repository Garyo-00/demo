// ===== 作業計画書NEO デモ用データ =====
// 画面デモのためのサンプル値。バックエンドは不要。
import { defaultBlockItems } from "./workPlanNeoBlockItems.js";

export const WPN_PROJECT = "テストプロジェクト";

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
export const FIXED_ITEMS = [{ label: "作業計画書名", type: "自由入力" }];

// 基本情報ブロックの中身（ブロック固有のため編集不可）
export const BASIC_ITEMS = [
  { label: "作業配置図", type: "図面配置", hint: "作業配置図設定で登録した図面上に作業範囲を配置" },
  { label: "作業期間", type: "日付範囲", hint: "" },
];

// 作業計画書はブロック単位で構成する。テンプレートでは使用するブロックを選ぶ。
// 中身の詳細仕様が決まっているブロック（基本情報・クレーン・その他）はブロック内に表示し、
// 未定のものは使用可否のみ設定できる。
export const TEMPLATE_BLOCKS = [
  {
    key: "basic",
    label: "基本情報ブロック",
    hint: "作業配置図と作業期間。作業計画書の先頭に入ります",
  },
  {
    key: "machine",
    label: "機械ブロック",
    hint: "使用する持込機械・レンタル機械に関する項目",
  },
  {
    key: "load",
    label: "積荷ブロック",
    hint: "積荷・吊り荷に関する項目",
  },
  {
    key: "staffing",
    label: "人員配置ブロック",
    hint: "作業責任者・運転者・誘導者などの配置",
  },
  {
    key: "crane",
    label: "クレーンブロック",
    hint: "クレーン諸元から作業半径・定格荷重などを自動で入力します",
  },
  {
    key: "survey",
    label: "調査ブロック",
    hint: "地盤・架空線・埋設物などの事前調査結果",
  },
  {
    key: "rules",
    label: "厳守事項・周知事項ブロック",
    hint: "作業前に周知する厳守事項・周知事項",
  },
  {
    key: "other",
    label: "その他ブロック",
    hint: "上記ブロックに当てはまらない項目を自由に設定します（仮）",
  },
];

export function defaultBlocks(on = []) {
  return Object.fromEntries(TEMPLATE_BLOCKS.map((b) => [b.key, on.includes(b.key)]));
}

// ===== クレーンブロックの中身 =====
// 職長が作業計画書で入力する項目。ブロック固有のため、テンプレートでは編集できない。
export const CRANE_INPUT_ITEMS = [
  { label: "クレーンの種類", type: "単一選択" },
  { label: "クレーンのメーカー", type: "単一選択" },
  { label: "作業半径（m）", type: "数値" },
  { label: "吊荷重量（t）", type: "数値" },
  { label: "フック重量（t）", type: "数値" },
  { label: "吊具重量（t）", type: "数値" },
];

// 入力項目から自動で埋まる項目。テンプレートごとに使用／未使用を選べる。
export const CRANE_AUTO_ITEMS = [
  { key: "ratedMax", label: "定格荷重最大（m）(t)", source: "クレーンのメーカー・種類から取得" },
  { key: "ratedMin", label: "定格荷重最小（m）(t)", source: "クレーンのメーカー・種類から取得" },
  { key: "outrigger", label: "アウトリガー全幅張出（m）", source: "クレーンのメーカー・種類から取得" },
  { key: "boomMax", label: "ブーム長さ最大（m）", source: "クレーンのメーカー・種類から取得" },
  { key: "radiusMax", label: "最大作業半径（m）", source: "クレーンのメーカー・種類から取得" },
  { key: "radiusMin", label: "最小作業半径（m）", source: "クレーンのメーカー・種類から取得" },
  { key: "totalRated", label: "定格総荷重 (t)", source: "クレーンのメーカー・種類・作業半径から取得" },
  { key: "loadRate", label: "荷重率（%）", source: "総荷重 ÷ 定格総荷重 × 100" },
  { key: "judge", label: "判定", source: "荷重率 ≦ 安全率 →「◯」／ 荷重率 ＞ 安全率 →「✕」" },
];

export const CRANE_DEFAULT_SAFETY_RATE = 90;

export function defaultCraneAuto(patch = {}) {
  return {
    // 自動反映項目の使用／未使用
    auto: Object.fromEntries(CRANE_AUTO_ITEMS.map((i) => [i.key, true])),
    safetyRate: CRANE_DEFAULT_SAFETY_RATE,
    ...patch,
  };
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
    blocks: defaultBlocks(["basic", "machine", "staffing", "rules", "other"]),
    craneAuto: defaultCraneAuto(),
    blockItems: defaultBlockItems(),
    other: [
      makeRow({ label: "使用する持込機械", type: "machine", required: true, note: "ASに登録済みの機械から選択" }),
      makeRow({ label: "作業場所", type: "text", required: true }),
      makeRow({ label: "作業責任者", type: "worker", required: true }),
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
  // 画面確認用：ブロックを全てONにし、回答形式を一通り並べたデモテンプレート。
  // 「テンプレートの内容が作成画面にどう反映されるか」を確認するために用意している。
  {
    id: "tplDemo",
    name: "【デモ】全ブロック・全回答形式",
    kind: "custom",
    updatedAt: "2026/08/06",
    updatedBy: "元請 田中",
    blocks: defaultBlocks(TEMPLATE_BLOCKS.map((b) => b.key)),
    craneAuto: defaultCraneAuto(),
    blockItems: {
      ...defaultBlockItems(),
      machine: { common: {}, types: ["crane", "aerial", "excavator"], byType: {} },
    },
    other: [
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
  master("【テンプレート用】トラック搭載型クレーン・ユニック車", {
    blocks: defaultBlocks(["basic", "machine", "load", "staffing", "crane", "rules", "other"]),
  }),
  master("【テンプレート用】フォークリフト"),
  master("【テンプレート用】定置式クレーン", {
    blocks: defaultBlocks(["basic", "machine", "load", "staffing", "crane", "rules", "other"]),
  }),
  master("【テンプレート用】移動式クレーン", {
    blocks: defaultBlocks(["basic", "machine", "load", "staffing", "crane", "survey", "rules", "other"]),
    blockItems: { ...defaultBlockItems(), machine: { common: {}, types: ["crane"], byType: {} } },
  }),
  master("【テンプレート用】車両系建設機械（掘削用機械）"),
  master("【テンプレート用】車両系建設機械（整地・積込用機械・その他）"),
  master("【テンプレート用】車両系荷役運搬機械（不整地運搬車）"),
  master("【テンプレート用】高所作業車", {
    blockItems: { ...defaultBlockItems(), machine: { common: {}, types: ["aerial"], byType: {} } },
  }),
  {
    id: "tplPump",
    name: "コンクリートポンプ車作業計画書",
    kind: "custom",
    updatedAt: "2026/07/30",
    updatedBy: "元請 田中",
    blocks: defaultBlocks(["basic", "machine", "staffing", "survey", "rules", "other"]),
    craneAuto: defaultCraneAuto(),
    blockItems: defaultBlockItems(),
    other: [
      makeRow({ label: "使用する持込機械", type: "machine", required: true }),
      makeRow({ label: "圧送箇所", type: "text", required: true }),
      makeRow({ label: "配管経路", type: "textarea", required: false }),
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
    blocks: defaultBlocks(["basic", "machine", "load", "staffing", "crane", "survey", "rules", "other"]),
    craneAuto: defaultCraneAuto(),
    blockItems: { ...defaultBlockItems(), machine: { common: {}, types: ["crane"], byType: {} } },
    other: [
      makeRow({ label: "使用する持込機械", type: "machine", required: true, note: "ASに登録済みの機械から選択" }),
      makeRow({ label: "作業場所", type: "text", required: true }),
      makeRow({ label: "作業責任者", type: "worker", required: true }),
      makeRow({
        label: "天候中止基準",
        type: "select",
        required: false,
        options: "風速10m/s以上, 降雨時, 該当なし",
      }),
      makeRow({ label: "作業手順", type: "textarea", required: true }),
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
    blocks: defaultBlocks(["basic", "machine", "staffing", "survey", "other"]),
    craneAuto: defaultCraneAuto(),
    blockItems: defaultBlockItems(),
    other: [
      makeRow({ label: "使用する持込機械", type: "machine", required: true }),
      makeRow({ label: "掘削深さ（m）", type: "number", required: true }),
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
    blocks: defaultBlocks(["basic", "machine", "load", "other"]),
    craneAuto: defaultCraneAuto(),
    blockItems: defaultBlockItems(),
    other: [
      makeRow({ label: "使用する持込機械", type: "machine", required: true }),
      makeRow({ label: "運搬経路・作業手順", type: "textarea", required: true }),
    ],
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
    blocks: defaultBlocks(["basic", "machine", "staffing", "rules", "other"]),
    craneAuto: defaultCraneAuto(),
    blockItems: defaultBlockItems(),
    other: [
      makeRow({ label: "使用する持込機械", type: "machine", required: true }),
      makeRow({ label: "作業高さ（m）", type: "number", required: true }),
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
