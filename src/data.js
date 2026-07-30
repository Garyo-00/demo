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

// ログインユーザーが承認者で、承認待ちの件数（サイドメニュー／タブのバッジ用）
export const MY_PENDING_APPROVALS = REQUESTS.filter(
  (r) => r.approver === CURRENT_USER.name && r.status === "pending"
).length;

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

// ===== 作業計画書（別プロダクト）=====
// サイドバーメニュー（作り込みに合わせて項目を追加していく）
export const WORKPLAN_MENU = [
  "ダッシュボード", "作業計画書項目編集", "作業計画書一覧", "承認（作業間調整）",
  "承認・申請", "設定",
];

// ===== 作業間調整pro（別プロダクト）=====
// 帳票（出力）用の工事情報
export const WA_PROJECT = {
  number: "7100499600",
  name: "千代田放送会館空調機器更新工事（2期）",
};

// サイドバーメニュー（作り込みに合わせて項目を追加していく）
// サイドメニュー（「設定」はアコーディオン。配下に各設定をまとめる）
export const WORKADJUST_NAV = [
  { label: "作業予定一覧" },
  { label: "予約" },
  { label: "配置図作成" },
  {
    label: "QRコード発行",
    children: ["作業実績入力用QR発行", "資機材・ゲート予約用QR発行"],
  },
  {
    label: "設定",
    children: ["作業配置図設定", "資機材・ゲート登録", "協力会社設定", "予約設定"],
  },
];

// 別ドメインのページへ遷移するメニュー（外部リンク）
// ※URLはデモ用のプレースホルダー。実運用では各システムのURLに差し替える。
export const WORKADJUST_EXTERNAL_LINKS = {
  "安全セーフティ": "https://safety.example.com/",
  "出面・日報管理": "https://daily-report.example.com/",
  "KY NEXT": "https://ky-next.example.com/",
  "作業計画書NEO": "https://work-plan-neo.example.com/",
};

// --- サジェスト候補（DNN等 別システムの設定を参照する想定。デモは固定値）---
export const WA_COMPANIES = [
  "大和建設", "青木工業", "みらい電気", "東洋設備", "渡辺工務店", "山本電気", "林基礎",
];
// 業種（上位階層）→ 職種（下位階層）の対応
export const WA_JOBTYPES_BY_INDUSTRY = {
  "土木・舗装": [
    "アンカー工", "ウエルポイント工", "グラウト工", "コンクリート型入工（建設）", "コンクリート打工",
    "シールド掘進機運転工", "ずい道技術者", "ずい道工", "ダム掘削工", "ダム掘進工", "トンネル掘削工",
    "フェンス取付工（土木工事の一環）", "ボーリング機械運転工", "ボーリング工（土木工事に付随するもの）",
    "わく入員", "河川改修設計技術者", "河川土木技術者", "軌条作業員", "軌道作業員", "軌道舗石作業員",
    "橋りょう（梁）技術者", "橋りょう（梁）設計技術者", "空港建設技術者", "建設・土木作業員", "建設技術士",
    "護岸工事作業員", "港湾技術者", "港湾設計技術者", "支柱員", "治山・治水技術者", "消波ブロック据付作業員",
    "上下水道技術士", "上下水道設計工事監督者", "浄化槽埋設工", "森林土木技術者", "水中調査・潜水士（建設工事）",
    "水道建設技術者", "水道工事設計技術者", "潜函工", "線路工事作業者", "測量士（土木工事に付随しておこなうもの）",
    "大型掘進機操作員", "鉄道工事設計技師", "土工", "土木技術者", "土木工事現場監督", "土木施工管理技術者",
    "土木施設設計技術者", "道路技術者", "道路区画線設置作業員（シート張り付けによるもの）", "道路建設設計技術者",
    "道路標識取付工", "道路付帯設備取付作業員", "農業土木技術者", "保坑員", "保線作業員", "舗装工", "舗装切断工",
    "法面保護作業員（コンクリート張り工事）", "林業土木技術者", "林道道付作業員",
  ],
  "造園": [
    "林道道付作業員", "芝植付作業員（造園業）", "植木手入作業者", "植木職", "生垣手入作業者", "造園技能士",
    "造園工", "造園師", "造園施工管理技術者", "造園設計技術者", "造園土木工", "築庭作業者", "庭園設計技術者",
    "庭師", "庭木屋", "法面保護工（芝張り工事）",
  ],
  "建築・大工": [
    "ＡＬＣパネル施工工", "カーテンウォール設計技術者", "サイディング工", "プラント建設工事施工管理技術者",
    "プラント設計技術者", "プレハブ住宅組立工", "営繕大工", "外壁工", "宮大工", "橋りょう（梁）大工", "建築技師",
    "建築技術者", "建築工事現場監督", "建築士（建築・大工）", "建築施工管理技術者", "建築設計監督技術者（建築・大工）",
    "建築設備設計技術者（建築・大工）", "工事監理技術者", "数寄屋大工", "造作大工", "大工", "大道具係（演劇）",
    "町大工", "堂宮大工", "舞台製作大工", "墨出し工",
  ],
  "型枠大工": [
    "コンクリート型枠組工", "仮枠大工", "型枠解体工", "型枠工", "型枠大工",
  ],
  "とび": [
    "足場組立工", "とび", "ひき家とび工", "橋りょう（梁）とび工", "建築とび工", "重量物とび職", "鉄骨とび工",
  ],
  "鉄骨": [
    "こうびょう工", "びょう打工", "橋りょう（梁）工", "建築鉄工", "構造物鉄工",
    "切断工（ガス・酸素・プラズマ・レーザーなどによる切断）", "組立鉄工", "鉄工", "鉄骨工",
    "溶接工（ガス・酸素・テルミット・アセチレンガス・アーク・プラズマ・レーザーなどによる溶接）",
  ],
  "鉄筋": [
    "ガス圧接工（鉄筋工事）", "建築鉄筋工", "鉄筋工", "鉄筋組立工", "土木鉄筋工", "配筋工",
  ],
  "石工": [
    "かすがい入工", "石たたき仕上工", "石縁取工", "石穴あけ工", "石研磨工", "石工", "石荒仕上工", "石積工",
    "石切工", "石切旋盤工", "石張工", "石彫工", "石碑工", "敷石切工", "墓石工", "墨出し工（石材）",
  ],
  "れんが・タイル": [
    "タイル床・壁張工", "タイル張工", "テラコッタ取付工", "モザイクタイル張工", "れんが積工", "れんが塀作工",
    "取べ（鍋）れんが積工",
  ],
  "ブロック": [
    "エクステリア工事人", "フェンス取付工（フェンスのみ）", "ブロック積工", "建築ブロック工",
  ],
  "左官": [
    "モルタル塗り工", "ラス張工", "屋根左官", "擬木工", "左官", "左官吹付工", "漆喰塗り工", "土間工",
    "壁塗り工", "木舞かき工",
  ],
  "防水": [
    "アスファルト防水工", "シート防水工", "シーリング工（防水工事）", "モルタル防水工", "建築工事防水工",
    "止水工", "吹付防水工", "塗布防水工", "塗膜防水工", "土木工事防水工", "防水工",
  ],
  "屋根": [
    "かや屋根ふき工", "かわらふき工", "かわら屋根ふき工", "かわら揚工", "スレートかわら屋根ふき工",
    "スレート屋根ふき工", "セメントかわらふき工", "トタン屋根ふき工", "めんど（面戸）塗工", "屋根ふき工",
    "金属屋根ふき工",
  ],
  "板金": [
    "トタンとい（樋）職", "ブリキ屋", "銅工（板金作業）", "板金屋根ふき工", "板金加工職", "板金工",
  ],
  "建築金物": [
    "金属製バルコニー取付工", "金属製手すり（摺）取付工", "装飾金物取付工", "装飾鉄工",
  ],
  "塗装": [
    "ペンキ職", "吹付塗装工", "塗装工", "道路区画線・路面標示設置作業員",
  ],
  "ガラス": [
    "ガラスはめ込工", "ショーウィンドーガラスはめ込工", "ステンドグラスはめ込工", "建具ガラスはめ込工",
    "板ガラスはめ込み工", "防犯フィルム張工",
  ],
  "建具": [
    "サッシ取付工", "シャッター取付工", "つりこみ工", "雨戸仕上工", "家具工（注文家具）", "金属製ドア取付工",
    "建具工", "建具取付工", "指物大工", "自動ドア取付工", "障子取付工", "錠前師（建具）", "木工（注文家具を主とする）",
  ],
  "床・内装": [
    "ガラス用フィルム施工員（建設用）", "クロス張り職", "ゴム・プラスチック床張工", "じゅうたん張工",
    "プラスチックタイル張工", "ボード張り工", "リノリウム床張工", "鏡取付工", "軽天・ボード工", "鋼製下地組立工",
    "室内装飾工", "内装工事施工管理技術者", "内装仕上工", "壁装工", "壁装飾工",
  ],
  "はつり・解体": [
    "コアボーリング工", "コンクリートはつり工",
    "コンクリート切断穿孔作業員（ワイヤーソーイング工法・コアドリリング工法・フラットソーイング工法・ウォールソーイング工法などによるもの）",
    "解体工（建造物）", "建築解体工",
  ],
  "表具": [
    "襖貼職", "経師", "障子貼職", "表具工", "壁紙貼職",
  ],
  "畳": [
    "畳屋", "畳工", "畳仕立工", "畳表替工",
  ],
  "電気": [
    "オール電化工事作業員", "トランス据付工（配電線）", "ネオンサイン取付工", "屋内電気工事作業者", "外線電工",
    "高圧電気工事技術者", "産業用電気装置据付作業員", "弱電工事技術者", "照明器取付工", "送電線工事作業員",
    "送電線電工", "太陽光発電パネル据付作業員", "太陽光発電装置据付作業員（電気工事）", "地下ケーブル配線工（送電線）",
    "地下ケーブル配線工（配電線）", "地中送電線敷設作業員", "地中配電線工", "地中配電線敷設作業員", "電気機械据付工",
    "電気技術者", "電気工事技術者", "電気工事作業者", "電気工事士", "電気工事施工管理技術者", "電気工事設計監督",
    "電気施設施工管理技術者", "電気主任技術者", "電気設計技術員", "電気設備工", "電気設備工事施工管理技術者",
    "電気設備設計技術者", "電気保安工", "電工（電気配線工事）", "電灯線修理工", "内線電工", "配電線架線作業員",
  ],
  "通信": [
    "屋外通信線架線作業員", "海底ケーブル敷設工", "外線工（通信線）", "携帯電話基地局工事施工管理技術者",
    "携帯電話基地局保守作業員", "交換機据付・保守工", "自動火災報知設備取付作業員", "信号装置据付・保守工",
    "送・受信機据付工", "地下通信線配線工", "中継機据付・保守工", "通信線架線工", "通信線配線工（屋内）",
    "通信装置据付・保守工", "電気通信技術者", "電気通信施設技術者", "電気通信主任技術者", "電気通信設備作業員",
    "電信機据付・保守工", "電話架線工", "電話機据付・保守工", "放送装置据付・保守作業員", "防犯装置据付・保守工",
    "無線通信機据付作業員",
  ],
  "冷暖房": [
    "スチーム配管工", "ソーラーシステム取付工（冷暖房）", "ダクト工（冷暖房）", "ダクト断熱工", "パイプ工（冷暖房）",
    "パイプ被覆工", "ビニール配管工（冷暖房）", "ボイラー設置・保守工", "ボイラー被覆工", "鉛管工（冷暖房）",
    "鉛工（冷暖房）", "管曲（かんまげ）工（冷暖房）", "管工事施工管理技士（冷暖房）", "管工事設計技術者（冷暖房）",
    "空調衛生設備施工管理技術者", "空調設備据付工", "空調配管工", "建物断熱工", "耐火被膜工", "熱絶縁工",
    "配管工（冷暖房）", "配管修理工（冷暖房）", "保温工", "保冷工", "防熱工",
  ],
  "給排水・衛生・ガス": [
    "ガス管配管工", "ガス器具取付・修理工", "コンクリート管配管工", "さくせい（井）機械運転工", "さくせい（井）工",
    "システムキッチン取付工", "ソーラーシステム取付工（給排水・衛生・ガス）", "ダクト工（給排水・衛生・ガス）",
    "パイプ工（給排水・衛生・ガス）", "ビニール配管工（給排水・衛生・ガス）", "ヒューム管接続工", "プラント配管工",
    "プラント保全工", "ユニットバス取付工", "井戸ボーリング掘工", "井戸機械掘工（油井・ガス井を除く）", "井戸手掘工",
    "衛生配管工", "鉛管工（給排水・衛生・ガス）", "鉛工（給排水・衛生・ガス）", "換気装置取付工",
    "管曲（かんまげ）工（給排水・衛生・ガス）", "管工事施工管理技士（給排水・衛生・ガス）",
    "管工事設計技術者（給排水・衛生・ガス）", "給排水衛生工事設計技術者", "給排水設備工事施工管理者", "受水槽取付工",
    "住宅水回り設備取付工", "上下水浄化設備設置・保守工", "浄化槽清掃員（給排水・衛生・ガス）", "浄化槽設備士",
    "厨房設備施工工", "水道管配管作業員", "水道工事工", "洗面器取付工", "貯水槽清掃員（給排水・衛生・ガス）",
    "土管敷設工", "配管工（給排水・衛生・ガス）", "配管修理工（給排水・衛生・ガス）", "便器取付工", "揚水ポンプ工事工",
    "浴槽設備施工工",
  ],
  "建設機械運転": [
    "アスファルトフィニッシャ運転工", "エキスカベーター運転工", "キャリオール運転工", "クレーン運転工",
    "コンクリートフィニッシャ運転工", "コンクリートポンプ車運転工", "コンクリートミキサー運転工",
    "コンクリートミキサー車運転手", "コンクリート打設機械運転工", "コンプレッサー運転工", "コンベア運転工",
    "さく岩機械運転工", "しゅんせつ機械運転工", "ショベルカー運転工", "ショベルマシン運転工", "ショベルローダー運転工",
    "スクレーパー運転工", "ダンプ運転手", "ディーゼルパイルハンマー運転工", "デリック運転工", "トラクター運転工（建設用）",
    "トラッククレーン運転工", "ブルドーザー運転工", "ブレーカ運転工", "ホイールクレーン運転工", "ホイスト運転工",
    "ホイルローダー運転工", "モータグレーダー運転工", "ロードローラー運転工", "巻上機（ウインチ）運転工",
    "機械ローラー運転工", "起重機運転工", "玉掛技能工", "掘削機械運転工", "建設機械オペレーター",
    "建設資材運搬・搬入工", "建柱車操作員", "杭打機運転工", "整地機械運転工", "舗装機械運転工", "揚貨装置運転工",
  ],
  "ビルメンテナンス": [
    "ガス設備保安点検員", "ガラス・壁面清掃作業員（ビルメンテ）", "トイレ清掃員", "ビル清掃員", "ボイラー工",
    "ボイラー洗浄員", "営繕作業員（施設補修・清掃）", "機械式駐車装置保守点検員", "受水槽洗浄員", "床磨き作業員",
    "昇降機修理工", "消防設備士", "浄化槽清掃員（ビルメンテ）", "洗面所清掃作業員", "太陽光発電装置修理作業員（電気工事）",
    "貯水槽清掃員（ビルメンテ）", "動力室電気工配電員", "排水管洗浄作業員（建物内配管）", "発電機運転工",
  ],
  "建物サービス": [
    "ガラス・壁面清掃作業員（建物サービス）", "ハウスクリーニング工", "建設警備員", "建設現場交通誘導員",
    "消毒・害虫防除作業員", "道路工事現場交通誘導員", "白あり駆除作業員",
  ],
  "設計・製図": [
    "ＣＡＤオペレーター（建築製図）", "ＣＡＤトレーサー（建築・土木製図）", "インテリアコーディネーター",
    "インテリアデザイナー", "エクステリアプランナー", "空間デザイナー", "建築構造設計技術者", "建築士（設計・製図）",
    "建築写図工", "建築製図工", "建築積算士", "建築設計監督技術者（設計・製図）", "建築設計士",
    "建築設備設計技術者（設計・製図）", "建築透視図制作工（建築パース制作人）", "建築模型製作工",
    "建物検査員（建築士であるもの）", "現図工", "構造物現図工", "製図トレーサー（建築・土木製図）", "鉄工現図工",
    "鉄構現図工", "鉄鋼現図工", "鉄骨構造物現図工", "土木製図工", "福祉住環境コーディネーター", "木工現図工",
  ],
  "土木建築サービス": [
    "コンクリート検査工", "雨漏り調査員", "気密測定技能者", "建築物石綿含有建材調査者", "港湾測量技術者",
    "試すい（錐）工", "測量技術者", "測量作業者", "測量士（土木建築サービスとして専門におこなうもの）", "測量士補",
    "測量製図工", "地質調査技術者", "地盤調査員（建設工事）", "非破壊検査工（土木構造物・建築物）",
    "非破壊検査総合監理技術者",
  ],
  "機械器具設置": [
    "エスカレーター組付工", "エレベーター組付工", "クレーン組立工", "リフト組立工", "機械器具取付工", "機械据付工",
    "昇降機取付工", "冷却塔組立工",
  ],
  "テント・看板取付": [
    "テント張り工事人", "屋外広告物設置作業員", "看板（取付）工",
  ],
  "その他": [
    "一般土木建築工事者（ゼネコン）", "砂吹工（サンドブラスト工）", "築炉工", "電気防触工", "防音工", "炉修工",
  ],
};

// 業種の一覧（見出し）
export const WA_INDUSTRIES = Object.keys(WA_JOBTYPES_BY_INDUSTRY);
// 職種の一覧（全業種を横断したフラットな候補）
export const WA_JOBTYPES = Object.values(WA_JOBTYPES_BY_INDUSTRY).flat();

// ===== 作業配置図設定（フロアごとの平面図＝台紙） =====
// デモ用のサンプル平面図（SVGを埋め込み）。実運用はアップロード画像。
const SAMPLE_PLAN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600">
  <rect width="960" height="600" fill="#ffffff"/>
  <g stroke="#e3e8ee" stroke-width="1">
    ${Array.from({ length: 24 }, (_, i) => `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="600"/>`).join("")}
    ${Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${i * 40}" x2="960" y2="${i * 40}"/>`).join("")}
  </g>
  <g fill="none" stroke="#33415a" stroke-width="3">
    <rect x="80" y="70" width="800" height="460"/>
    <line x1="80" y1="270" x2="520" y2="270"/>
    <line x1="520" y1="70" x2="520" y2="530"/>
    <line x1="520" y1="330" x2="880" y2="330"/>
    <line x1="300" y1="270" x2="300" y2="530"/>
  </g>
  <g fill="#8b98a8" font-family="sans-serif" font-size="20">
    <text x="150" y="180">事務所</text>
    <text x="150" y="410">資材置場</text>
    <text x="360" y="410">作業エリアA</text>
    <text x="640" y="210">作業エリアB</text>
    <text x="640" y="440">仮設ヤード</text>
  </g>
  <g fill="#33415a" font-family="sans-serif" font-size="16" font-weight="bold">
    <text x="80" y="55">1F 平面図</text>
  </g>
</svg>`;
export const WA_SAMPLE_PLAN_IMAGE =
  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SAMPLE_PLAN_SVG);

const SAMPLE_PLAN_SVG_2F = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="600" viewBox="0 0 960 600">
  <rect width="960" height="600" fill="#ffffff"/>
  <g stroke="#e3e8ee" stroke-width="1">
    ${Array.from({ length: 24 }, (_, i) => `<line x1="${i * 40}" y1="0" x2="${i * 40}" y2="600"/>`).join("")}
    ${Array.from({ length: 15 }, (_, i) => `<line x1="0" y1="${i * 40}" x2="960" y2="${i * 40}"/>`).join("")}
  </g>
  <g fill="none" stroke="#33415a" stroke-width="3">
    <rect x="80" y="70" width="800" height="460"/>
    <line x1="360" y1="70" x2="360" y2="530"/>
    <line x1="640" y1="70" x2="640" y2="530"/>
    <line x1="360" y1="300" x2="880" y2="300"/>
    <line x1="80" y1="380" x2="360" y2="380"/>
  </g>
  <g fill="#8b98a8" font-family="sans-serif" font-size="20">
    <text x="150" y="200">会議室</text>
    <text x="150" y="460">休憩室</text>
    <text x="430" y="200">内装エリアA</text>
    <text x="430" y="430">内装エリアB</text>
    <text x="700" y="200">電気室</text>
    <text x="700" y="430">設備エリア</text>
  </g>
  <g fill="#33415a" font-family="sans-serif" font-size="16" font-weight="bold">
    <text x="80" y="55">2F 平面図</text>
  </g>
</svg>`;
export const WA_SAMPLE_PLAN_IMAGE_2F =
  "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SAMPLE_PLAN_SVG_2F);

export const WA_FLOORPLAN_SETTINGS = [
  { id: "FP-001", floorName: "1F平面図", note: "躯体・仮設エリア", image: WA_SAMPLE_PLAN_IMAGE, status: "converted" },
  { id: "FP-002", floorName: "2F平面図", note: "内装工事エリア", image: WA_SAMPLE_PLAN_IMAGE_2F, status: "converted" },
];

// ===== 協力会社一覧（出面・日報管理／他サービスで共通利用） =====
// 職長ユーザーの選択肢
export const WA_FOREMAN_USERS = [
  "星野 協力会社（株式会社Arch）",
  "山田 太郎",
  "佐藤 健",
  "鈴木 一郎",
];
// 協力会社（会社ごとに複数の業種・職種を保持）
export const WA_COMPANY_LIST = [
  {
    id: "C-001", name: "テスト",
    entries: [
      { industry: "土木・舗装", jobType: "アンカー工", show: true, foremen: [] },
      { industry: "造園", jobType: "林道道付作業員", show: true, foremen: [] },
    ],
  },
  {
    id: "C-002", name: "七尾建設工業",
    entries: [
      { industry: "はつり・解体", jobType: "解体工（建造物）", show: true, foremen: [] },
    ],
  },
  {
    id: "C-003", name: "星野畳店",
    entries: [
      { industry: "畳", jobType: "畳屋", show: true, foremen: [] },
      { industry: "床・内装", jobType: "じゅうたん張工", show: true, foremen: [] },
    ],
  },
  {
    id: "C-004", name: "星野組",
    entries: [
      { industry: "とび", jobType: "とび", show: true, foremen: ["星野 協力会社（株式会社Arch）", "山田 太郎"] },
    ],
  },
];

// 元請ユーザー（複数）。確定・押印はこのユーザーのみ実施可能。
// ログイン名（id）からフルネーム（name）を表示する。
export const WA_PRIME_USERS = [
  { id: "tanaka", name: "田中 太郎" },
  { id: "sato", name: "佐藤 次郎" },
  { id: "suzuki", name: "鈴木 三郎" },
];
export function primeUserName(id) {
  return WA_PRIME_USERS.find((u) => u.id === id)?.name || id;
}
// 協力会社→職長ユーザー（複数可。協力会社設定＝DNNの設定から自動反映される想定）。
// 配列は表示順（昇順）で、作業予定フォームでは既定で先頭のユーザーを適用する。
export const WA_FOREMEN = {
  "大和建設": ["佐藤 健", "田中 一郎"],
  "青木工業": ["鈴木 一郎"],
  "みらい電気": ["高橋 誠", "中村 敦"],
  "東洋設備": ["伊藤 大輔"],
  "渡辺工務店": ["渡辺 浩", "近藤 隆", "松本 実"],
  "山本電気": ["山本 健太"],
  "林基礎": ["林 大樹"],
};
// 協力会社の既定（先頭）の職長ユーザー
export function defaultForeman(company) {
  const list = WA_FOREMEN[company] || [];
  return list[0] || "";
}
// 作業場所・作業内容の入力履歴（自由記述＋履歴から選択）
export const WA_HISTORY = {
  building: ["A棟", "B棟", "C棟", "管理棟"],
  floor: ["B1F", "1F", "2F", "3F", "R階"],
  area: ["北エリア", "南エリア", "東エリア", "west area", "中央"],
  zone: ["1工区", "2工区", "3工区"],
  content: [
    "配筋作業", "型枠建込み", "コンクリート打設", "鉄骨建方", "電気配線",
    "設備配管", "内装ボード貼り", "外構土工", "足場組立",
  ],
};

export const WA_STATUS_LABEL = {
  draft: "下書き",
  pending: "未確定",
  approved: "確定済",
};
// ステータス→pillクラス（既存の色を流用）
export const WA_STATUS_PILL = {
  draft: "idle",
  pending: "pending",
  approved: "approved",
};

// 作業予定一覧のサンプル
export const WA_WORK_SCHEDULES = [
  {
    id: "W-001", date: "2026-07-09", status: "approved",
    company: "大和建設", industry: "鉄筋", jobType: "鉄筋工", foreman: "佐藤 健",
    building: "A棟", floor: "2F", area: "北エリア", zone: "1工区",
    content: "配筋作業",
    normalWorkers: 6, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "上下作業禁止。開口部養生を確認のこと。",
  },
  {
    id: "W-002", date: "2026-07-09", status: "approved",
    company: "青木工業", industry: "型枠大工", jobType: "型枠大工", foreman: "鈴木 一郎",
    building: "A棟", floor: "2F", area: "南エリア", zone: "1工区",
    content: "型枠建込み",
    normalWorkers: 4, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "",
  },
  {
    id: "W-003", date: "2026-07-09", status: "approved",
    company: "みらい電気", industry: "電気", jobType: "電気工事士", foreman: "高橋 誠",
    building: "B棟", floor: "3F", area: "東エリア", zone: "2工区",
    content: "電気配線",
    normalWorkers: 3, normalHours: 8, overtimeWorkers: 2, overtimeHours: 2,
    safetyNote: "",
  },
  {
    id: "W-006", date: "2026-07-09", status: "approved",
    company: "青木工業", industry: "はつり・解体", jobType: "解体工（建造物）", foreman: "鈴木 一郎",
    building: "A棟", floor: "2F", area: "南エリア", zone: "1工区",
    content: "斫り作業",
    normalWorkers: 1, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "",
  },
  {
    id: "W-004", date: "2026-07-10", status: "pending",
    company: "渡辺工務店", industry: "とび", jobType: "足場組立工", foreman: "渡辺 浩",
    building: "C棟", floor: "1F", area: "中央", zone: "3工区",
    content: "足場組立",
    normalWorkers: 5, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "",
  },
  {
    id: "W-005", date: "2026-07-10", status: "pending",
    company: "東洋設備", industry: "給排水・衛生・ガス", jobType: "配管工（給排水・衛生・ガス）", foreman: "伊藤 大輔",
    building: "B棟", floor: "B1F", area: "北エリア", zone: "2工区",
    content: "設備配管",
    normalWorkers: 4, normalHours: 8, overtimeWorkers: 2, overtimeHours: 3,
    safetyNote: "火気使用時は消火器を配置。近接作業と要調整。",
  },

  // --- 過去の作業予定（「コピー作成」の複製元。すべて確定済・実績入力済の想定）---
  // 2026-07-08
  {
    id: "W-108", date: "2026-07-08", status: "approved",
    company: "大和建設", industry: "鉄筋", jobType: "鉄筋工", foreman: "佐藤 健",
    building: "A棟", floor: "2F", area: "北エリア", zone: "1工区", content: "配筋作業",
    normalWorkers: 6, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "上下作業禁止。開口部養生を確認のこと。",
    actualNormalWorkers: 6, actualNormalHours: 8, actualOvertimeWorkers: 0, actualOvertimeHours: 0,
  },
  {
    id: "W-107", date: "2026-07-08", status: "approved",
    company: "青木工業", industry: "型枠大工", jobType: "型枠大工", foreman: "鈴木 一郎",
    building: "A棟", floor: "2F", area: "南エリア", zone: "1工区", content: "型枠建込み",
    normalWorkers: 4, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "", actualNormalWorkers: 4, actualNormalHours: 8, actualOvertimeWorkers: 0, actualOvertimeHours: 0,
  },
  {
    id: "W-106", date: "2026-07-08", status: "approved",
    company: "みらい電気", industry: "電気", jobType: "電気工事士", foreman: "高橋 誠",
    building: "B棟", floor: "3F", area: "東エリア", zone: "2工区", content: "電気配線",
    normalWorkers: 3, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "", actualNormalWorkers: 3, actualNormalHours: 8, actualOvertimeWorkers: 0, actualOvertimeHours: 0,
  },
  {
    id: "W-105", date: "2026-07-08", status: "approved",
    company: "東洋設備", industry: "給排水・衛生・ガス", jobType: "配管工（給排水・衛生・ガス）", foreman: "伊藤 大輔",
    building: "B棟", floor: "B1F", area: "北エリア", zone: "2工区", content: "設備配管",
    normalWorkers: 4, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "", actualNormalWorkers: 4, actualNormalHours: 8, actualOvertimeWorkers: 0, actualOvertimeHours: 0,
  },
  // 2026-07-07
  {
    id: "W-104", date: "2026-07-07", status: "approved",
    company: "大和建設", industry: "鉄筋", jobType: "鉄筋工", foreman: "佐藤 健",
    building: "A棟", floor: "1F", area: "北エリア", zone: "1工区", content: "配筋作業",
    normalWorkers: 5, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "", actualNormalWorkers: 5, actualNormalHours: 8, actualOvertimeWorkers: 0, actualOvertimeHours: 0,
  },
  {
    id: "W-103", date: "2026-07-07", status: "approved",
    company: "渡辺工務店", industry: "とび", jobType: "足場組立工", foreman: "渡辺 浩",
    building: "C棟", floor: "1F", area: "中央", zone: "3工区", content: "足場組立",
    normalWorkers: 5, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "", actualNormalWorkers: 5, actualNormalHours: 8, actualOvertimeWorkers: 0, actualOvertimeHours: 0,
  },
  {
    id: "W-102", date: "2026-07-07", status: "approved",
    company: "山本電気", industry: "電気", jobType: "電気工事士", foreman: "山本 健太",
    building: "B棟", floor: "2F", area: "東エリア", zone: "2工区", content: "電気配線",
    normalWorkers: 2, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "", actualNormalWorkers: 2, actualNormalHours: 8, actualOvertimeWorkers: 0, actualOvertimeHours: 0,
  },
  // 2026-07-06
  {
    id: "W-101", date: "2026-07-06", status: "approved",
    company: "大和建設", industry: "鉄筋", jobType: "鉄筋工", foreman: "佐藤 健",
    building: "A棟", floor: "1F", area: "南エリア", zone: "1工区", content: "配筋作業",
    normalWorkers: 6, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "", actualNormalWorkers: 6, actualNormalHours: 8, actualOvertimeWorkers: 0, actualOvertimeHours: 0,
  },
  {
    id: "W-100", date: "2026-07-06", status: "approved",
    company: "青木工業", industry: "型枠大工", jobType: "型枠大工", foreman: "鈴木 一郎",
    building: "A棟", floor: "1F", area: "南エリア", zone: "1工区", content: "型枠解体",
    normalWorkers: 3, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "", actualNormalWorkers: 3, actualNormalHours: 8, actualOvertimeWorkers: 0, actualOvertimeHours: 0,
  },
  {
    id: "W-099", date: "2026-07-06", status: "approved",
    company: "林基礎", industry: "土木・舗装", jobType: "土工", foreman: "林 大樹",
    building: "C棟", floor: "1F", area: "中央", zone: "3工区", content: "外構土工",
    normalWorkers: 3, normalHours: 8, overtimeWorkers: 0, overtimeHours: 0,
    safetyNote: "", actualNormalWorkers: 3, actualNormalHours: 8, actualOvertimeWorkers: 0, actualOvertimeHours: 0,
  },
];

// ログイン中の職長ユーザーが所属する協力会社（デモの「職長版」コピー作成で使用）
export const WA_MY_COMPANY = "大和建設";

// DNN（出面管理システム）から連携される「入場人数」（会社単位・当日の実入場者数）。
// 元請はこの人数を参考に実績を入力する想定。
// ここに無い会社は DNN 連携が無いものとして、入場人数を表示しない。
export const WA_DNN_ATTENDANCE = {
  "青木工業": 5, // 仮の入場人数
};
// DNN（出面管理）連携で入場人数が取得できるか（連携有無の判定フラグ）
export function hasDnnAttendance(company) {
  return Object.prototype.hasOwnProperty.call(WA_DNN_ATTENDANCE, company);
}

// 作業員数の選択肢
export const WA_WORKER_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

// --- 予約（揚重機／ゲート／その他）---
export const WA_RESOURCES = {
  lift: { label: "揚重機", items: ["タワークレーン1号", "ラフター25t", "クローラークレーン50t"] },
  gate: { label: "ゲート", items: ["東ゲート", "西ゲート", "北ゲート"] },
  aerial: { label: "その他", items: ["高所作業車 12m", "高所作業車 8m", "ブーム車 15m"] },
};

// ゲート予約の車種（選択肢）
export const WA_VEHICLE_TYPES = [
  "乗用車", "2tトラック", "4tトラック", "8tトラック", "大型トラック",
  "トレーラー", "クレーン車", "ユニック車", "その他",
];

export const WA_RESERVATIONS = [
  { id: "RSV-001", kind: "gate", resource: "東ゲート", company: "大和建設", date: "2026-07-09", start: "08:00", end: "10:00", content: "生コン搬入", vehicleType: "大型トラック", resvType: "normal" },
  { id: "RSV-002", kind: "gate", resource: "東ゲート", company: "青木工業", date: "2026-07-09", start: "13:00", end: "14:00", content: "型枠材搬入", vehicleType: "4tトラック", resvType: "normal" },
  { id: "RSV-003", kind: "gate", resource: "西ゲート", company: "渡辺工務店", date: "2026-07-09", start: "09:00", end: "11:30", content: "足場材搬入", vehicleType: "ユニック車", resvType: "normal" },
  { id: "RSV-004", kind: "lift", resource: "タワークレーン1号", company: "大和建設", date: "2026-07-09", start: "08:00", end: "12:00", content: "鉄骨揚重", vehicleType: "", resvType: "normal" },
  { id: "RSV-005", kind: "lift", resource: "ラフター25t", company: "東洋設備", date: "2026-07-09", start: "13:00", end: "16:00", content: "設備機器揚重", vehicleType: "", resvType: "normal" },
  { id: "RSV-006", kind: "aerial", resource: "高所作業車 4.5m-001号", company: "みらい電気", date: "2026-07-09", start: "09:00", end: "15:00", content: "高所電気配線", vehicleType: "", resvType: "normal" },
  // 同時刻の重なり（東ゲートで最大3件重複＝1.5倍高さの確認用）
  { id: "RSV-007", kind: "gate", resource: "東ゲート", company: "林基礎", date: "2026-07-09", start: "09:00", end: "11:00", content: "残土搬出", vehicleType: "大型トラック", resvType: "normal" },
  // スポット予約（オレンジ表示・30分）
  { id: "RSV-008", kind: "gate", resource: "東ゲート", company: "山本電気", date: "2026-07-09", start: "09:30", end: "10:00", content: "資材搬入", vehicleType: "4tトラック", resvType: "spot" },
  // 西ゲートで3社バッティング（10:30〜11:00に渡辺・みらい・東洋が重複）
  { id: "RSV-009", kind: "gate", resource: "西ゲート", company: "みらい電気", date: "2026-07-09", start: "10:00", end: "12:00", content: "資材搬入", vehicleType: "4tトラック", resvType: "normal" },
  { id: "RSV-010", kind: "gate", resource: "西ゲート", company: "東洋設備", date: "2026-07-09", start: "10:30", end: "11:00", content: "設備搬入", vehicleType: "ユニック車", resvType: "normal" },
  // タワークレーン1号で2社バッティング（10:00〜12:00）
  { id: "RSV-011", kind: "lift", resource: "タワークレーン1号", company: "青木工業", date: "2026-07-09", start: "10:00", end: "13:00", content: "資材揚重", vehicleType: "", resvType: "normal" },
];

// --- ゲート・資機材登録 ---
export const WA_EQUIP_CATEGORIES = [
  "揚重機", "運搬機械", "掘削機械", "高所作業車", "電動工具", "仮設機材", "駐車場",
];
// show: 予約ページに表示するか（元請が資機材・ゲート登録で切替）
export const WA_GATE_REGISTRY = [
  { id: "G-001", name: "東ゲート", location: "敷地北東", note: "大型車両可", show: true },
  { id: "G-002", name: "西ゲート", location: "敷地南西", note: "歩行者・小型車", show: true },
  { id: "G-003", name: "北ゲート", location: "敷地北側", note: "資材搬入専用", show: true },
];
// 揚重機登録（テーブル構成は資機材登録と同じ）
export const WA_LIFT_EQUIPMENT = [
  { id: "L-001", category: "揚重機", name: "タワークレーン1号", bringIn: "大和建設", primary: "大和建設", show: true },
  { id: "L-002", category: "揚重機", name: "ラフター25t", bringIn: "東洋設備", primary: "大和建設", show: true },
  { id: "L-003", category: "揚重機", name: "クローラークレーン50t", bringIn: "大和建設", primary: "大和建設", show: true },
];
// 資機材登録（その他）：高所作業車 4.5m を100台＋駐車場を100区画。
// show=予約ページ（資機材・その他タブ）への表示。デモではタイムラインが長くなり
// すぎないよう各カテゴリ先頭8件のみ表示ON（一覧のチェックで切替可能）。
export const WA_EQUIPMENT = [
  ...Array.from({ length: 100 }, (_, i) => {
    const n = String(i + 1).padStart(3, "0");
    return {
      id: "E-" + n,
      category: "高所作業車",
      name: `高所作業車 4.5m-${n}号`,
      bringIn: WA_COMPANIES[i % WA_COMPANIES.length],
      primary: "大和建設",
      show: true,
      reserveType: "2部制", // 予約方法（既定＝2部制。資機材ごとに時間制/2部制を選択）
    };
  }),
  ...Array.from({ length: 100 }, (_, i) => {
    const n = String(i + 1).padStart(3, "0");
    return {
      id: "P-" + n,
      category: "駐車場",
      name: `駐車場-${n}`,
      bringIn: WA_COMPANIES[i % WA_COMPANIES.length],
      primary: "大和建設",
      show: true,
      reserveType: "2部制",
    };
  }),
];
// 別サービス「安全セーフティ」の持込機械一覧（インポート元。デモ用の固定値）
export const WA_SAFETY_MACHINES = [
  { id: "SS-101", category: "掘削機械", name: "バックホウ SK75", bringIn: "林基礎", primary: "大和建設" },
  { id: "SS-102", category: "高所作業車", name: "高所作業車 8m", bringIn: "みらい電気", primary: "大和建設" },
  { id: "SS-103", category: "運搬機械", name: "ダンプトラック 4t", bringIn: "渡辺工務店", primary: "青木工業" },
  { id: "SS-104", category: "揚重機", name: "ユニック車 4t", bringIn: "東洋設備", primary: "東洋設備" },
  { id: "SS-105", category: "電動工具", name: "エンジン発電機 25kVA", bringIn: "青木工業", primary: "青木工業" },
  { id: "SS-106", category: "仮設機材", name: "仮設ゴンドラ", bringIn: "大和建設", primary: "大和建設" },
];

const WEEK = ["日", "月", "火", "水", "木", "金", "土"];

export function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${WEEK[d.getDay()]}）`;
}

// "YYYY-MM-DD" → "2026年7月10日（木）"
export function formatDateStr(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${y}年${m}月${d}日（${WEEK[dt.getDay()]}）`;
}

// "YYYY-MM-DD" を days 日ずらして返す
export function shiftDate(iso, days) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  const p = (n) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}

// 作業間調整pro 各ページの初期表示日（サンプルデータが存在する日）
export const WA_DEFAULT_DATE = "2026-07-09";
