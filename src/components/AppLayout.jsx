import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { MENU, todayStr } from "../data.js";

// メニュー名 → 画面タイトル / 遷移先の対応
function menuTitle(pathname, search) {
  if (pathname === "/app" || pathname === "/app/") return "ダッシュボード";
  if (pathname.startsWith("/app/inspection")) return "点検";
  return "デモ";
}

export default function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 現在アクティブなメニュー判定
  let active = "ダッシュボード";
  if (location.pathname.startsWith("/app/inspection")) active = "点検";
  else if (location.pathname.startsWith("/app/placeholder/")) {
    active = decodeURIComponent(location.pathname.split("/app/placeholder/")[1] || "");
  }

  function selectMenu(m) {
    if (m === "ダッシュボード") navigate("/app");
    else if (m === "点検") navigate("/app/inspection");
    else navigate("/app/placeholder/" + encodeURIComponent(m));
  }

  return (
    <div className="layout">
      <aside className="side">
        <Link to="/app" className="brand">
          デジタル点検システム<small>新産業の森作業所</small>
        </Link>
        <nav>
          {MENU.map((m) => (
            <button
              key={m}
              className={"item" + (active === m ? " active" : "")}
              onClick={() => selectMenu(m)}
            >
              <span className="dot" />
              {m}
            </button>
          ))}
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
