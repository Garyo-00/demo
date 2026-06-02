import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { MENU, EXTERNAL_LINKS, todayStr } from "../data.js";

// 別ドメインへの遷移を示す外部リンクアイコン
function ExternalIcon() {
  return (
    <svg className="ext-icon" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        d="M14 5h5v5M19 5l-8 8M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
    </svg>
  );
}

// メニュー名 → 画面タイトル / 遷移先の対応
function menuTitle(pathname, search) {
  if (pathname === "/app" || pathname === "/app/") return "ダッシュボード";
  if (pathname.startsWith("/app/inspection")) return "点検";
  if (pathname.startsWith("/app/approval")) return "承認・申請";
  return "デモ";
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 現在アクティブなメニュー判定
  let active = "ダッシュボード";
  if (location.pathname.startsWith("/app/inspection")) active = "点検";
  else if (location.pathname.startsWith("/app/approval")) active = "承認・申請";
  else if (location.pathname.startsWith("/app/placeholder/")) {
    active = decodeURIComponent(location.pathname.split("/app/placeholder/")[1] || "");
  }

  function selectMenu(m) {
    if (m === "ダッシュボード") navigate("/app");
    else if (m === "点検") navigate("/app/inspection");
    else if (m === "承認・申請") navigate("/app/approval");
    else navigate("/app/placeholder/" + encodeURIComponent(m));
  }

  return (
    <div className="layout">
      <aside className="side">
        <Link to="/app" className="brand">
          デジタル点検システム<small>新産業の森作業所</small>
        </Link>
        <nav>
          {MENU.map((m) =>
            EXTERNAL_LINKS[m] ? (
              <a
                key={m}
                className="item external"
                href={EXTERNAL_LINKS[m]}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="dot" />
                {m}
                <ExternalIcon />
              </a>
            ) : (
              <button
                key={m}
                className={"item" + (active === m ? " active" : "")}
                onClick={() => selectMenu(m)}
              >
                <span className="dot" />
                {m}
              </button>
            )
          )}
        </nav>
        <Link to="/" className="back-link">← デモ画面一覧へ戻る</Link>
      </aside>
      <div className="main">
        <div className="topbar">
          <h1>{menuTitle(location.pathname, location.search)}</h1>
          <span className="date">{todayStr()} 時点</span>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
