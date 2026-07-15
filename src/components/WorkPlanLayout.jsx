import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { WORKPLAN_MENU, MY_PENDING_APPROVALS, todayStr } from "../data.js";

// メニュー名 → 画面タイトル
function pageTitle(pathname) {
  if (pathname === "/workplan" || pathname === "/workplan/") return "ダッシュボード";
  if (pathname.startsWith("/workplan/approval")) return "承認・申請";
  if (pathname.startsWith("/workplan/settings/floor-plan")) return "作業平面図登録";
  if (pathname.startsWith("/workplan/settings/approval-flow")) return "承認フロー設定";
  if (pathname.startsWith("/workplan/settings")) return "設定";
  if (pathname.startsWith("/workplan/placeholder/")) {
    return decodeURIComponent(pathname.split("/workplan/placeholder/")[1] || "");
  }
  return "作業計画書";
}

export default function WorkPlanLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  // 現在アクティブなメニュー判定
  let active = "ダッシュボード";
  if (location.pathname.startsWith("/workplan/approval")) active = "承認・申請";
  else if (location.pathname.startsWith("/workplan/settings")) active = "設定";
  else if (location.pathname.startsWith("/workplan/placeholder/")) {
    active = decodeURIComponent(
      location.pathname.split("/workplan/placeholder/")[1] || ""
    );
  }

  const [navOpen, setNavOpen] = useState(false);

  function selectMenu(m) {
    setNavOpen(false);
    if (m === "ダッシュボード") navigate("/workplan");
    else if (m === "承認・申請") navigate("/workplan/approval");
    else if (m === "設定") navigate("/workplan/settings");
    else navigate("/workplan/placeholder/" + encodeURIComponent(m));
  }

  return (
    <div className="layout">
      {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}
      <aside className={"side" + (navOpen ? " open" : "")}>
        <Link to="/workplan" className="brand" onClick={() => setNavOpen(false)}>
          作業計画書システム<small>新産業の森作業所</small>
        </Link>
        <nav>
          {WORKPLAN_MENU.map((m) => (
            <button
              key={m}
              className={"item" + (active === m ? " active" : "")}
              onClick={() => selectMenu(m)}
            >
              <span className="dot" />
              {m}
              {m === "承認・申請" && MY_PENDING_APPROVALS > 0 && (
                <span className="menu-badge">{MY_PENDING_APPROVALS}</span>
              )}
            </button>
          ))}
        </nav>
        <Link to="/" className="back-link" onClick={() => setNavOpen(false)}>← デモ画面一覧へ戻る</Link>
      </aside>
      <div className="main">
        <div className="topbar">
          <button className="nav-toggle" onClick={() => setNavOpen(true)} aria-label="メニューを開く">
            ☰
          </button>
          <h1>{pageTitle(location.pathname)}</h1>
          <span className="date">{todayStr()} 時点</span>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
