// ===== ブロックごとの項目定義 =====
// ゼネコン17社54様式の棚卸し（docs/workplan/05）から起こした。
// adoption は17社中の採用社数。既定でONにする項目の判定にだけ使う（画面には出さない）。
// options は各社の選択肢を統合したもので、テンプレート設定でこの中から実際に表示するものを選ぶ。

export const BASIC_ITEMS = [
  { key: "f8d41c598", label: "作業内容", type: "textarea", adoption: 16 },
  { key: "f2492e5e2", label: "作業場所", type: "text", adoption: 12 },
  { key: "f9fcd0ea4", label: "作業時間", type: "timeRange", adoption: 12 },
  { key: "f2c4990cd", label: "打合せ日", type: "date", adoption: 6 },
];

export const STAFFING_ITEMS = [
  { key: "f2b128f44", label: "運転者", type: "worker", adoption: 16 },
  { key: "f506809e9", label: "作業責任者", type: "worker", adoption: 9 },
  { key: "f9d4082b5", label: "作業指揮者", type: "worker", adoption: 14 },
  { key: "fdd4ae3e5", label: "合図者", type: "worker", adoption: 15 },
  { key: "fb3bfec03", label: "玉掛者", type: "worker", adoption: 14 },
  { key: "fb5b9535b", label: "作業主任者", type: "worker", adoption: 6 },
  { key: "f8dac677e", label: "監視人", type: "worker", adoption: 5 },
  { key: "fc330e462", label: "立入禁止措置者", type: "worker", adoption: 4 },
  { key: "f4f8b73a9", label: "誘導者", type: "worker", adoption: 14 },
  { key: "f5276a6e0", label: "資格・免許", type: "select", adoption: 13, options: [{ label: "免許(免許証)", n: 12 }, { label: "技能講習", n: 11 }, { label: "特別教育", n: 10 }, { label: "建設機械施工技術検定合格", n: 2 }, { label: "職業訓練修了", n: 1 }, { label: "大型自動車免許", n: 1 }, { label: "中型自動車免許", n: 1 }, { label: "普通自動車免許", n: 1 }, { label: "大型特殊自動車免許", n: 1 }, { label: "小型特殊自動車免許", n: 1 }, { label: "その他", n: 3 }] },
  { key: "fed06321c", label: "資格証確認", type: "multiSelect", adoption: 5, options: [{ label: "免許証", n: 4 }, { label: "技能講習修了証", n: 4 }, { label: "特別教育修了証", n: 4 }, { label: "本証の携帯を確認", n: 1 }, { label: "原本で確認", n: 1 }] },
];

export const LOAD_ITEMS = [
  { key: "fb60b2e6f", label: "荷の重量", type: "number", adoption: 15, unit: "t" },
  { key: "f890a64a9", label: "荷の種類/荷姿", type: "select", adoption: 14, options: [{ label: "土砂", n: 7 }, { label: "型枠材", n: 2 }, { label: "鉄筋", n: 5 }, { label: "仮設材", n: 3 }, { label: "平積", n: 3 }, { label: "緊結状態", n: 1 }, { label: "パレット積", n: 2 }, { label: "軽量コンクリート", n: 1 }, { label: "普通コンクリート", n: 1 }, { label: "NV(高流動)コンクリート", n: 1 }, { label: "その他", n: 5 }] },
  { key: "ffe76d013", label: "玉掛用具(ワイヤー)", type: "text", adoption: 12 },
  { key: "fc536cf9d", label: "最大積載量", type: "number", adoption: 9, unit: "kg" },
  { key: "f0d7844df", label: "フック/吊具重量", type: "number", adoption: 9, unit: "t" },
  { key: "fa73e6d8e", label: "荷崩れ防止措置", type: "select", adoption: 7, options: [{ label: "無し(危険なし)", n: 4 }, { label: "有り(措置を実施)", n: 4 }, { label: "良", n: 2 }, { label: "否", n: 2 }, { label: "計画した", n: 1 }, { label: "計画しない", n: 1 }] },
  { key: "f0bf60b32", label: "数量", type: "number", adoption: 4 },
  { key: "f8ff0060d", label: "玉掛用具(スリング)", type: "select", adoption: 4, options: [{ label: "ワイヤロープ", n: 4 }, { label: "ベルトスリング(ナイロンスリング)", n: 4 }, { label: "チェーンスリング", n: 3 }, { label: "その他", n: 2 }] },
  { key: "f9d7436d5", label: "玉掛方法/掛け本数", type: "select", adoption: 4, options: [{ label: "目通し2本吊り(2本2点目通し)", n: 4 }, { label: "くくり4本吊り", n: 1 }, { label: "半掛け(2本4点半掛け)", n: 4 }, { label: "目掛け4本吊り", n: 2 }, { label: "あだ巻き4本吊り(2本4点あだ巻き)", n: 4 }, { label: "あや掛け吊り", n: 2 }, { label: "クランプ吊り(4本4点クランプ)", n: 4 }, { label: "ハッカー吊り", n: 2 }, { label: "3点調整", n: 1 }, { label: "その他", n: 3 }] },
  { key: "f6f30c6df", label: "積載方法", type: "select", adoption: 4, options: [{ label: "フォークリフト(フォーク)", n: 2 }, { label: "バックホウ", n: 3 }, { label: "クレーン", n: 3 }, { label: "ダンプアップ", n: 3 }, { label: "その他", n: 3 }] },
];

export const CRANE_ITEMS = [
  { key: "f39a80c4d", label: "アウトリガー張出", type: "select", adoption: 13, options: [{ label: "可(最大張出し可)", n: 9 }, { label: "不可", n: 9 }, { label: "一部不可(一部張出し制限)", n: 1 }, { label: "対策実施(不可時の措置あり)", n: 3 }, { label: "有", n: 1 }, { label: "無", n: 1 }] },
  { key: "fa37d06a7", label: "作業半径", type: "number", adoption: 13, unit: "m" },
  { key: "faa6bb7f9", label: "地盤養生/敷鉄板", type: "multiSelect", adoption: 12, options: [{ label: "敷鉄板", n: 12 }, { label: "専用敷板(敷板)", n: 2 }, { label: "皿板", n: 5 }, { label: "サドル", n: 4 }, { label: "枕木", n: 1 }, { label: "砕石敷", n: 1 }, { label: "砂利敷", n: 1 }, { label: "地盤改良", n: 7 }, { label: "良質盛土", n: 5 }, { label: "無し(養生不要)", n: 3 }, { label: "その他", n: 3 }] },
  { key: "fc0866ab5", label: "地盤強度", type: "select", adoption: 12, options: [{ label: "堅固", n: 9 }, { label: "普通", n: 10 }, { label: "軟弱", n: 7 }, { label: "軟土(盛土・埋戻土)", n: 3 }, { label: "埋設物あり", n: 1 }, { label: "その他", n: 2 }] },
  { key: "f806bf483", label: "定格荷重", type: "number", adoption: 12, unit: "t" },
  { key: "fa5ebf6c2", label: "ジブ/ブーム長さ", type: "number", adoption: 11, unit: "m" },
  { key: "f9dfe7734", label: "必要な高さ/揚程", type: "number", adoption: 10, unit: "m" },
  { key: "fe7cbfb7d", label: "転倒防止措置", type: "select", adoption: 8, options: [{ label: "無し(危険箇所なし)", n: 5 }, { label: "有り(措置を実施)", n: 5 }, { label: "良", n: 1 }, { label: "否", n: 1 }] },
  { key: "f199e7435", label: "定格総荷重", type: "number", adoption: 7, unit: "t" },
  { key: "f7976caf4", label: "荷重率", type: "number", adoption: 7, unit: "%" },
];

export const SURVEY_ITEMS = [
  { key: "f7f7fdd9b", label: "地形", type: "select", adoption: 13, options: [{ label: "平坦地(平地)", n: 13 }, { label: "傾斜地", n: 13 }, { label: "勾配地(角度記入)", n: 9 }, { label: "段差地", n: 9 }, { label: "路肩部", n: 2 }, { label: "山地", n: 2 }, { label: "作業面が広い", n: 2 }, { label: "作業面が狭い", n: 2 }, { label: "その他", n: 5 }] },
  { key: "ff9e0a8d8", label: "立入禁止措置", type: "multiSelect", adoption: 13, options: [{ label: "バリケード", n: 13 }, { label: "トラロープ", n: 7 }, { label: "ロープ", n: 8 }, { label: "カラーコーン", n: 12 }, { label: "警報装置", n: 9 }, { label: "見張員(監視員)", n: 12 }, { label: "誘導員配置", n: 8 }, { label: "感知バー", n: 2 }, { label: "注意喚起看板・標識", n: 4 }, { label: "メガホン・サイレン", n: 1 }, { label: "クラクション", n: 5 }, { label: "立入禁止区域の表示", n: 4 }, { label: "無し(接触のおそれなし)", n: 6 }, { label: "その他", n: 10 }] },
  { key: "fc2030672", label: "架空線", type: "multiSelect", adoption: 12, options: [{ label: "近接なし(無)", n: 12 }, { label: "近接あり(有)", n: 12 }, { label: "高圧", n: 5 }, { label: "低圧", n: 2 }, { label: "通信", n: 3 }, { label: "防災", n: 1 }, { label: "防護あり", n: 3 }, { label: "移設", n: 2 }, { label: "絶縁用防具", n: 1 }, { label: "監視員配置", n: 3 }, { label: "その他", n: 4 }] },
  { key: "fe79542df", label: "地下埋設物", type: "multiSelect", adoption: 11, options: [{ label: "なし(無)", n: 11 }, { label: "あり(有)", n: 11 }, { label: "電気", n: 4 }, { label: "通信", n: 3 }, { label: "水道", n: 3 }, { label: "ガス", n: 3 }, { label: "下水", n: 3 }, { label: "移設", n: 3 }, { label: "監視員配置", n: 3 }, { label: "その他", n: 5 }] },
  { key: "fcddbd30e", label: "地盤調査", type: "select", adoption: 10, options: [{ label: "硬岩", n: 5 }, { label: "軟岩", n: 5 }, { label: "礫", n: 5 }, { label: "砂礫", n: 5 }, { label: "砂", n: 5 }, { label: "シルト", n: 5 }, { label: "粘性土", n: 4 }, { label: "泥炭", n: 5 }, { label: "瓦礫", n: 3 }, { label: "舗装", n: 4 }, { label: "土間コン", n: 2 }, { label: "敷鉄板", n: 2 }, { label: "砂利敷", n: 3 }, { label: "地山", n: 4 }, { label: "盛土", n: 2 }, { label: "その他", n: 6 }] },
  { key: "f0bd752ca", label: "中止基準", type: "textarea", adoption: 8 },
  { key: "f44ce58cd", label: "高低差/勾配", type: "select", adoption: 6, options: [{ label: "平坦(段差なし)", n: 5 }, { label: "勾配(傾斜あり)", n: 5 }, { label: "段差あり", n: 4 }, { label: "その他", n: 2 }] },
  { key: "fbd971338", label: "接触防止措置", type: "multiSelect", adoption: 6, options: [{ label: "誘導員の配置", n: 5 }, { label: "監視人(専任監視員)の配置", n: 4 }, { label: "バリケードによる立入禁止措置", n: 3 }, { label: "ハザードマップ", n: 1 }, { label: "注意喚起看板", n: 1 }, { label: "のぼり旗", n: 1 }, { label: "高さ制限ゲート", n: 1 }, { label: "「架空線近接作業中」ステッカー", n: 1 }, { label: "手掘りによる現物確認", n: 1 }, { label: "現地表示・見える化", n: 1 }, { label: "手順の周知", n: 1 }, { label: "バックミラー", n: 1 }, { label: "カメラ(バックモニタ)", n: 1 }, { label: "警報装置", n: 2 }, { label: "クラクション", n: 2 }, { label: "無し(接触のおそれなし)", n: 4 }, { label: "その他", n: 4 }] },
  { key: "f4482f08e", label: "高さ制限", type: "select", adoption: 4, options: [{ label: "あり", n: 4 }, { label: "なし", n: 4 }] },
  { key: "f506982bf", label: "運搬路の幅員", type: "number", adoption: 4, unit: "m" },
  { key: "f222f9c75", label: "運搬路の状態", type: "select", adoption: 4, options: [{ label: "舗装道", n: 3 }, { label: "砂利道", n: 3 }, { label: "土道", n: 2 }, { label: "鉄板道", n: 2 }, { label: "床板", n: 1 }, { label: "乾燥", n: 1 }, { label: "その他", n: 3 }] },
  { key: "f3296969c", label: "待避場所", type: "select", adoption: 4, options: [{ label: "無し", n: 4 }, { label: "有り", n: 4 }] },
];

export const RULES_ITEMS = [
  { key: "f15388dd6", label: "合図の方法", type: "multiSelect", adoption: 16, options: [{ label: "手合図(手)", n: 12 }, { label: "手旗", n: 5 }, { label: "旗", n: 10 }, { label: "笛", n: 12 }, { label: "無線", n: 15 }, { label: "有線", n: 1 }, { label: "クラクション(警笛)", n: 7 }, { label: "停止合図棒(合図棒)", n: 2 }, { label: "その他", n: 9 }] },
  { key: "f934ba40e", label: "安全指示事項", type: "textarea", adoption: 15 },
  { key: "fd6336489", label: "作業手順", type: "textarea", adoption: 10 },
  { key: "f0aa951d8", label: "制限速度", type: "number", adoption: 8, unit: "km/h" },
  { key: "f2e454159", label: "KY/危険予知", type: "textarea", adoption: 7 },
  { key: "f5e2dc9c8", label: "保護具", type: "multiSelect", adoption: 6, options: [{ label: "ヘルメット(保護帽)", n: 5 }, { label: "安全靴", n: 2 }, { label: "墜落制止用器具(安全帯)", n: 5 }, { label: "フルハーネス型", n: 2 }, { label: "胴ベルト型", n: 2 }, { label: "2丁掛け", n: 2 }, { label: "保護メガネ", n: 2 }, { label: "防じんマスク", n: 2 }, { label: "手袋", n: 2 }, { label: "耳栓", n: 2 }, { label: "救命胴衣", n: 2 }, { label: "反射ベスト", n: 2 }, { label: "シートベルト", n: 4 }, { label: "有", n: 3 }, { label: "無", n: 3 }, { label: "良", n: 2 }, { label: "否", n: 2 }, { label: "その他", n: 3 }] },
];

// ブロックキー → 項目定義
export const BLOCK_ITEM_DEFS = {
  basic: BASIC_ITEMS,
  staffing: STAFFING_ITEMS,
  load: LOAD_ITEMS,
  crane: CRANE_ITEMS,
  survey: SURVEY_ITEMS,
  rules: RULES_ITEMS,
};

/**
 * テンプレート新規作成時の既定値。
 * 採用12社以上（A層）の項目だけをONにし、選択肢は全件を初期選択にする。
 * B・C層は「使う」にすれば出せるので、まずは共通度の高いものだけで始める。
 */
export function defaultBlockItems(threshold = 12) {
  const out = {};
  for (const [blk, defs] of Object.entries(BLOCK_ITEM_DEFS)) {
    out[blk] = {};
    for (const d of defs) {
      out[blk][d.key] = {
        on: d.adoption >= threshold,
        options: (d.options || []).map((o) => o.label),
      };
    }
  }
  return out;
}
