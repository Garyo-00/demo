import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { WpnProvider, useWpn } from "./wpn/WpnContext.jsx";
import { WPN_PROJECT } from "../workPlanNeoData.js";
import "./wpn/wpn.css";

// サイドメニュー（アイコンはキャプチャに合わせた線画）
const NAV = [
  { key: "plans", label: "作業計画書一覧", to: "/workplan-neo/plans", icon: IconDoc },
  { key: "templates", label: "作業計画書テンプレート設定", to: "/workplan-neo/templates", icon: IconTable },
  { key: "floor-plan", label: "作業配置図設定", to: "/workplan-neo/floor-plan", icon: IconMap },
  { key: "approval-flow", label: "承認フロー設定", to: "/workplan-neo/approval-flow", icon: IconFlow },
  { key: "manual", label: "マニュアル", to: "/workplan-neo/manual", icon: IconBook },
];

function IconDoc(props) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}
function IconTable(props) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9h16M9 9v11" />
    </svg>
  );
}
function IconMap(props) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m9 4-5 2v14l5-2 6 2 5-2V4l-5 2z" />
      <path d="M9 4v14M15 6v14" />
    </svg>
  );
}
function IconFlow(props) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="16" width="7" height="5" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
      <path d="M6.5 8v5h11v3M6.5 13v3" />
    </svg>
  );
}
function IconBook(props) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
      <path d="M8 7h7M8 11h7" />
    </svg>
  );
}

function RoleSwitch() {
  const { role, setRole } = useWpn();
  return (
    <div className="wpn-role" role="group" aria-label="閲覧ロール切替">
      <button className={role === "prime" ? "active" : ""} onClick={() => setRole("prime")} aria-pressed={role === "prime"}>
        元請
      </button>
      <button className={role === "foreman" ? "active" : ""} onClick={() => setRole("foreman")} aria-pressed={role === "foreman"}>
        職長
      </button>
    </div>
  );
}

function WorkPlanNeoLayoutInner() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { role } = useWpn();
  const [collapsed, setCollapsed] = useState(false);

  // 設定系メニューは元請（ゼネコン）のみ。職長には一覧とマニュアルのみ見せる。
  const FOREMAN_MENU = ["plans", "manual"];
  const navItems = NAV.filter((n) => role === "prime" || FOREMAN_MENU.includes(n.key));

  return (
    <div className={"wpn" + (collapsed ? " collapsed" : "")}>
      <aside className="wpn-side">
        <div className="wpn-brand">
          <Link to="/workplan-neo" className="wpn-logo" title="作業計画書NEO">
            Arch
          </Link>
          <span className="wpn-brand-name">作業計画書</span>
          <button className="wpn-collapse" onClick={() => setCollapsed(true)} aria-label="メニューを折りたたむ">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>
        <nav className="wpn-nav">
          {navItems.map(({ key, label, to, icon: Icon }) => (
            <button
              key={key}
              className={"wpn-nav-item" + (pathname.startsWith(to) ? " active" : "")}
              onClick={() => navigate(to)}
              title={label}
            >
              <Icon />
              <span className="wpn-nav-label">{label}</span>
            </button>
          ))}
          {collapsed && (
            <button className="wpn-nav-item" onClick={() => setCollapsed(false)} title="メニューを開く">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          )}
        </nav>
        <Link to="/" className="wpn-back">
          ← デモ画面一覧へ戻る
        </Link>
      </aside>

      <div className="wpn-main">
        <div className="wpn-topbar">
          <span className="wpn-project">{WPN_PROJECT}</span>
          <RoleSwitch />
          <span className="wpn-avatar">A</span>
        </div>
        <div className="wpn-content">
          <div className="wpn-inner">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkPlanNeoLayout() {
  return (
    <WpnProvider>
      <WorkPlanNeoLayoutInner />
    </WpnProvider>
  );
}
