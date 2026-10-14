// 仮設・その他（デジタル点検システム）のデモデータ。
// 持込機械と違い、使用期間や使用届の概念はない。

export const TP_TYPES = [
  "わく組足場",
  "わく組式の作業構台",
  "吊り棚足場",
  "荷受けフォークリフト足場",
  "点検表タイトル",
  "点検表タイトル2",
  "点検表タイトル（始業前）",
  "現場火気作業確認表",
  "車両使用 兼 始業前点検 報告書",
  "テスト２",
];
export const TP_TAGS = ["重点管理", "長期"];
// 点検記録で選べる点検表の種類
export const TP_INSPECTION_TYPES = ["始業前点検", "組立後等点検", "月例点検", "悪天候後点検", "地震後点検"];
// 点検者の指名（2区分）
export const TP_INSPECTOR_GROUPS = [
  { key: "daily", label: "始業前点検（元請・協力会社）" },
  { key: "afterBuild", label: "組立後等、悪天候後、地震後（元請・協力会社）" },
];

export function fmt(ymd) {
  return ymd ? ymd.replaceAll("-", "/") : "";
}

let seq = 0;
function tp(archId, type, name, place, mgmtNo, registeredAt, registrant, extra = {}) {
  seq += 1;
  return {
    id: `tp${seq}`,
    archId,
    type,
    name,
    place,
    mgmtNo,
    company: "",
    registrant,
    registeredAt,
    tags: [],
    archived: false,
    inspectors: { daily: [], afterBuild: [] },
    inspections: [],
    ...extra,
  };
}

const insp = (name, company) => ({ id: `p${++seq}`, name, company });

export const INITIAL_TEMPORARIES = [
  tp(51520, "点検表タイトル", "1", "1", "12345", "2025-06-29", "1"),
  tp(113615, "わく組足場", "1", "2", "", "2026-04-16", "1"),
  tp(124291, "現場火気作業確認表", "1", "1", "", "2026-05-24", "かわい"),
  tp(66847, "現場火気作業確認表", "10", "1", "", "2025-09-29", "1"),
  tp(127927, "点検表タイトル2", "11", "12", "12345", "2026-06-01", "12"),
  tp(124283, "点検表タイトル（始業前）", "234", "設置場所*", "", "2026-05-24", "Arch管理者", { tags: ["重点管理"] }),
  tp(51516, "点検表タイトル", "あ", "あ", "", "2025-06-29", "あ"),
  tp(47258, "点検表タイトル", "テスト", "テスト", "", "2025-06-03", "テスト"),
  tp(124446, "テスト２", "テスト", "テスト", "", "2026-05-25", "七尾晃輝"),
  tp(124452, "テスト２", "テスト5/25", "テスト", "", "2026-05-25", "七尾晃輝"),
  tp(118083, "テスト２", "テスト名称", "御堂筋筋イルミネーション", "", "2026-05-01", "登録者ですけど"),
  tp(15860, "荷受けフォークリフト足場", "フォークリフト足場", "現場事務所前", "", "2024-08-07", "中島"),
  tp(142827, "車両使用 兼 始業前点検 報告書", "ライトバン240", "ー", "", "2026-07-09", "Arch管理者"),
  tp(35474, "わく組式の作業構台", "わく組3/7", "事務所", "", "2025-03-07", "テスト"),
  tp(35475, "わく組式の作業構台", "わく組3/7(コピー)", "事務所", "", "2025-03-07", "テスト"),
  tp(35476, "わく組式の作業構台", "わく組3/7(コピー)", "事務所", "", "2025-03-07", "テスト"),
  tp(20882, "テスト２", "現場火気作業確認_①前日確認16時まで", "火気使用場所", "", "2024-09-27", "テスト"),
  tp(15571, "わく組足場", "足場", "現場事務所前", "", "2024-08-05", "中島"),
  tp(15709, "テスト２", "足場", "現場事務所前", "", "2024-08-06", "中島"),
  tp(27460, "吊り棚足場", "棚", "1階", "", "2024-12-05", "山田太郎"),
  tp(9849, "わく組足場", "法面足場", "西エリア", "", "2024-05-23", "野崎", {
    company: "株式会社テスト",
    inspectors: {
      daily: [insp("野崎", "株式会社ゼネコン")],
      afterBuild: [insp("野崎", "株式会社ゼネコン")],
    },
  }),
  tp(16298, "わく組足場", "法面足場", "北面", "", "2024-08-20", "鈴木"),
  tp(175725, "テスト２", "門脇_テスト", "門脇_テスト", "", "2026-10-09", "Arch管理者", {
    inspectors: { daily: [insp("かどわき", "株式会社Arch")], afterBuild: [] },
  }),
  // アーカイブ済み
  tp(51518, "点検表タイトル", "あ", "あ", "", "2025-06-29", "あ", { archived: true }),
  tp(3918, "わく組足場", "テスト", "テスト", "", "2024-02-16", "あーち", { archived: true }),
];

export const TP_REGISTRANTS = [...new Set(INITIAL_TEMPORARIES.map((t) => t.registrant))];

export function newInspector() {
  return { id: `p${Date.now()}${++seq}`, name: "", company: "" };
}
export function newInspection() {
  return { id: `i${Date.now()}${++seq}`, type: "", month: "", file: "" };
}
export function emptyTemporary() {
  return {
    id: `tp${Date.now()}`,
    archId: 180000 + Math.floor(Math.random() * 9000),
    type: "",
    name: "",
    place: "",
    mgmtNo: "",
    company: "",
    registrant: "Arch管理者",
    registeredAt: "",
    tags: [],
    archived: false,
    inspectors: { daily: [newInspector()], afterBuild: [newInspector()] },
    inspections: [newInspection()],
  };
}
