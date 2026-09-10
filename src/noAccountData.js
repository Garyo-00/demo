// ===== 「アカウントなし」画面群のデモ用定義 =====
// 現場に掲示したQRコードから開く画面をまとめたカテゴリ。
// 各画面は「ログイン必須」「ログイン不要」の2種類のQRコードを発行できる。

export const NO_ACCOUNT_PROJECT = "テストプロジェクト_星野";

// QRコードの種別。読み取り後にログインを求めるかどうかだけが違う。
export const QR_KINDS = [
  {
    key: "login",
    label: "ログイン必須",
    login: true,
    note: "アカウントを持つユーザーが、ログインしてから入力します",
  },
  {
    key: "guest",
    label: "ログイン不要",
    login: false,
    note: "アカウントを持たないユーザーが、ログインせずそのまま入力します",
  },
];

// カテゴリに並ぶ画面。qr: true の画面はQRコード発行画面を持つ。
// title … 一覧・読み取り先の画面名／qrTitle … QR発行画面の見出しと印刷シートの表題
export const NO_ACCOUNT_PAGES = [
  {
    key: "owner-patrol",
    to: "/no-account/owner-patrol",
    title: "巡回/パトロール",
    qrTitle: "巡回/パトロール実施用QRコード",
    desc: "協力会社の事業主が現場を巡回し、その結果を登録する画面です。",
    qr: true,
  },
  {
    key: "fire-permit",
    to: "/no-account/fire-permit",
    title: "火気使用届",
    qrTitle: "火気使用届作成用QRコード",
    desc: "溶接・溶断などの火気を使用する作業について、使用届を提出する画面です。",
    qr: true,
  },
  {
    key: "work-plan",
    to: "/no-account/work-plan",
    title: "作業計画書",
    desc: "職長が当日の作業計画書を作成し、作業所へ提出する画面です。",
    qr: false,
  },
];

// QRコードを読み取った先に開く画面（種別ごとに1つ）
export const qrTargets = (page) =>
  QR_KINDS.map((k) => ({
    ...k,
    path: `${page.to}/${k.key}`,
    title: `${page.title}（${k.label}）`,
  }));

export const pageByPath = (pathname) => NO_ACCOUNT_PAGES.find((p) => p.to === pathname) || null;

// パスから画面の見出し・説明を引く。QR読み取り後の画面も含めて解決する。
export function viewByPath(pathname) {
  const page = pageByPath(pathname);
  if (page) return { title: page.title, desc: page.desc, login: null };
  for (const p of NO_ACCOUNT_PAGES) {
    const target = qrTargets(p).find((t) => t.path === pathname);
    if (target) return { title: target.title, desc: `${p.desc}${target.note}。`, login: target.login };
  }
  return { title: "準備中", desc: "", login: null };
}
