// ===== 機械ブロックの機種別セクション =====
// 各社様式の機械欄は、機種ごとに必要な諸元が異なる（高所作業車なら作業床高、
// ポンプ車なら圧送方式）。共通項目は少ないため、機種セクションに分けて持つ。
// 括弧内の数字は17社調査での採用社数。

// どの機種でも書かせる項目。機種そのものは各セクションの選択肢として持つ。
export const MACHINE_COMMON = [
  { key: "spec", label: "規格・性能", type: "text", adoption: 15 },
  { key: "owner", label: "所有者・リース会社", type: "text", adoption: 14 },
  { key: "count", label: "台数", type: "number", unit: "台", adoption: 8 },
  { key: "modelNo", label: "型式", type: "text", adoption: 5 },
  { key: "selfInspection", label: "特定自主検査", type: "date", adoption: 5 },
  { key: "dailyCheck", label: "始業前点検", type: "checkbox", adoption: 3 },
  { key: "certificate", label: "検査証・検査標章", type: "text", adoption: 3 },
];

// 機種セクション。plan 側では「機械を行・諸元を列」の表で入力する。
export const MACHINE_TYPES = [
  {
    key: "crane",
    label: "移動式クレーン",
    companies: 14,
    items: [
      { key: "model", label: "機種", type: "select", adoption: 17,
        options: ["ラフテレーンクレーン", "オールテレーンクレーン", "トラッククレーン", "クローラークレーン", "クローラータワークレーン", "車両積載型クレーン（ユニック車）", "その他"] },
      { key: "capacity", label: "吊上荷重", type: "number", unit: "t", adoption: 10 },
      { key: "maker", label: "メーカー", type: "text", adoption: 2 },
      { key: "ropeChangeDate", label: "ワイヤロープ取替日", type: "date", adoption: 2 },
      { key: "hourMeter", label: "取替時アワーメータ", type: "number", unit: "h", adoption: 2 },
    ],
  },
  {
    key: "aerial",
    label: "高所作業車",
    companies: 11,
    items: [
      { key: "model", label: "機種", type: "select", adoption: 17,
        options: ["自走式高所作業車", "トラック式高所作業車", "垂直昇降式高所作業車", "その他"] },
      { key: "maxHeight", label: "最大作業床高", type: "number", unit: "m", adoption: 7 },
      { key: "deckCapacity", label: "作業床定員", type: "number", unit: "人", adoption: 5 },
      { key: "liftType", label: "昇降方式", type: "select", adoption: 5,
        options: ["垂直昇降型", "ブーム型", "シザース型", "混合型"] },
      { key: "operatePos", label: "操作位置", type: "select", adoption: 4,
        options: ["作業床上", "下部操作", "床上・下部両方"] },
      { key: "driveType", label: "走行方式", type: "select", adoption: 2,
        options: ["自走式", "トラック式", "けん引式"] },
      { key: "maxLoad", label: "最大積載荷重", type: "number", unit: "kg", adoption: 1 },
      { key: "boomLen", label: "アーム・ブーム長さ", type: "number", unit: "m", adoption: 1 },
    ],
  },
  {
    key: "pump",
    label: "コンクリートポンプ車",
    companies: 8,
    items: [
      { key: "model", label: "機種", type: "select", adoption: 17,
        options: ["ブーム車", "配管車", "シリンダ車", "その他"] },
      { key: "output", label: "理論吐出量", type: "number", unit: "m3/h", adoption: 4 },
      { key: "operateMethod", label: "操作方法", type: "select", adoption: 3,
        options: ["手元操作", "リモコン操作", "有線リモコン", "無線リモコン"] },
      { key: "pumpType", label: "圧送方式", type: "select", adoption: 2,
        options: ["ピストン式", "スクイズ式"] },
      { key: "pipeFix", label: "縦配管の固定方法", type: "textarea", adoption: 1 },
    ],
  },
  {
    key: "excavator",
    label: "車両系掘削機械",
    companies: 10,
    items: [
      { key: "model", label: "機種", type: "select", adoption: 17,
        options: ["油圧ショベル（バックホウ）", "ドラグライン", "クラムシェル", "トレンチャー", "ブルドーザー", "トラクターショベル", "その他"] },
      { key: "bucket", label: "バケット容量", type: "number", unit: "m3", adoption: 1 },
      { key: "bodyWeight", label: "機体質量", type: "number", unit: "t", adoption: 1 },
      { key: "attachName", label: "アタッチメント名称・形式", type: "text", adoption: 2 },
      { key: "attachPower", label: "アタッチメント能力・破壊力", type: "text", adoption: 1 },
      { key: "attachOwner", label: "アタッチメント所有者", type: "text", adoption: 1 },
      { key: "rops", label: "転倒時保護構造（ROPS）", type: "select", adoption: 2, options: ["有", "無"] },
      { key: "runaway", label: "逸走防止装置", type: "select", adoption: 1, options: ["有", "無"] },
      { key: "headGuard", label: "ヘッドガード", type: "select", adoption: 1, options: ["有", "無"] },
      { key: "backMonitor", label: "バックモニタ・バックセンサ", type: "multiSelect", adoption: 1,
        options: ["バックモニタ", "バックセンサ", "バックアイカメラ", "無し"] },
    ],
  },
  {
    key: "cargo",
    label: "荷役運搬機械",
    companies: 10,
    items: [
      { key: "model", label: "機種", type: "select", adoption: 17,
        options: ["フォークリフト", "ショベルローダー", "フォークローダー", "ストラドルキャリア", "貨物自動車", "その他"] },
      { key: "maxLoad", label: "最大荷重", type: "number", unit: "t", adoption: 4 },
      { key: "powerType", label: "動力方式", type: "select", adoption: 1,
        options: ["エンジン式（ディーゼル）", "エンジン式（ガソリン・LPG）", "バッテリー式"] },
      { key: "controlType", label: "操縦方式", type: "select", adoption: 1,
        options: ["座席式", "立席式", "床上操作式"] },
      { key: "backrest", label: "バックレスト", type: "select", adoption: 1, options: ["有", "無"] },
      { key: "headGuard", label: "ヘッドガード", type: "select", adoption: 1, options: ["有", "無"] },
      { key: "pallet", label: "パレット・スキッド", type: "text", adoption: 1 },
      { key: "rops", label: "転倒時保護構造（ROPS）", type: "select", adoption: 1, options: ["有", "無"] },
    ],
  },
  {
    key: "demolition",
    label: "解体用機械",
    companies: 3,
    items: [
      { key: "model", label: "機種", type: "select", adoption: 17,
        options: ["ブレーカ", "鉄骨切断機", "コンクリート圧砕機", "解体用つかみ機", "その他"] },
      { key: "attachWeight", label: "アタッチメント質量", type: "number", unit: "t", adoption: 2 },
      { key: "attachMax", label: "装着可能質量", type: "number", unit: "t", adoption: 1 },
      { key: "bodyWeight", label: "機体質量", type: "number", unit: "t", adoption: 1 },
      { key: "boomLen", label: "アーム・ブーム長さ", type: "number", unit: "m", adoption: 1 },
      { key: "guard", label: "防護措置", type: "textarea", adoption: 1 },
      { key: "radio", label: "無線機の有無", type: "select", adoption: 1, options: ["有", "無"] },
    ],
  },
  {
    key: "transport",
    label: "車両系運搬機械（不整地運搬車）",
    companies: 1,
    items: [
      { key: "model", label: "機種", type: "select", adoption: 17,
        options: ["不整地運搬車", "クローラダンプ", "ダンプトラック", "その他"] },
      { key: "maxLoad", label: "最大積載量", type: "number", unit: "t", adoption: 1 },
      { key: "backMonitor", label: "バックモニタ・バックセンサ", type: "multiSelect", adoption: 1,
        options: ["バックモニタ", "バックセンサ", "無し"] },
    ],
  },
  {
    key: "foundation",
    label: "基礎工事用機械（杭打機等）",
    companies: 2,
    items: [
      { key: "model", label: "機種", type: "select", adoption: 17,
        options: ["杭打機", "杭抜機", "アースドリル", "アースオーガー", "リバースサーキュレーションドリル", "その他"] },
      { key: "pileSpec", label: "杭径・杭長", type: "text", adoption: 1 },
      { key: "certificate", label: "検査証・検査標章", type: "text", adoption: 1 },
    ],
  },
];

export function machineTypeByKey(key) {
  return MACHINE_TYPES.find((t) => t.key === key) || null;
}
