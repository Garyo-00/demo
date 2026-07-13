import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { WORKADJUST_MENU, WORKADJUST_EXTERNAL_LINKS, formatDateStr } from "../data.js";
import { WaSettingsProvider, useWaSettings } from "./wa/WaSettingsContext.jsx";
import DatePager from "./wa/DatePager.jsx";
import { listOverlaps, KIND_LABEL, fmtHour } from "./wa/rsvTimeline.js";

// ヘッダーの共通日付送り（全ページで作業日を共有）
function HeaderDatePager() {
  const { date, setDate } = useWaSettings();
  return <DatePager value={date} onChange={setDate} />;
}

// 予約の重複通知ベル（通常予約のみ・スポットは対象外）
function OverlapBell() {
  const { reservations, date } = useWaSettings();
  const [open, setOpen] = useState(false);
  const overlaps = listOverlaps(reservations, date);
  const n = overlaps.length;
  return (
    <div className="bell-wrap">
      <button className="bell-btn" onClick={() => setOpen((o) => !o)} title="予約の重複通知">
        🔔
        {n > 0 && <span className="bell-badge">{n}</span>}
      </button>
      {open && (
        <div className="bell-menu">
          <div className="bell-head">
            予約の重複通知（{formatDateStr(date)}）
            <button className="bell-x" onClick={() => setOpen(false)}>×</button>
          </div>
          {n === 0 ? (
            <div className="bell-empty">重複している通常予約はありません。</div>
          ) : (
            <>
              <div className="bell-count">
                通常予約が <strong>{n}</strong> 件重複しています。
              </div>
              <ul className="bell-list">
                {overlaps.map((o, i) => (
                  <li key={i}>
                    <span className="bell-kind">{KIND_LABEL[o.kind]}／{o.resource}</span>
                    <div className="bell-pair">
                      {o.a.company}（{o.a.start}〜{o.a.end}）
                      <span className="bell-x2">×</span>
                      {o.b.company}（{o.b.start}〜{o.b.end}）
                    </div>
                    <div className="bell-range">重複 {fmtHour(o.os)}〜{fmtHour(o.oe)}</div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// 別ドメインへの遷移を示す外部リンクアイコン
function ExternalIcon() {
  return (
    <svg className="ext-icon" viewBox="0 0 24 24" width="13" height="13" aria-hidden="true">
      <path fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        d="M14 5h5v5M19 5l-8 8M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
    </svg>
  );
}

// パス → メニュー名（画面タイトル／アクティブ判定に使用）
// ルート（/workadjust）は作業予定一覧
const ROUTES = [
  ["/workadjust/reservation", "予約"],
  ["/workadjust/floor-plan-setting", "作業配置図設定"],
  ["/workadjust/floor-plan", "配置図確認"],
  ["/workadjust/registry", "資機材・ゲート登録"],
  ["/workadjust/companies", "協力会社一覧"],
  ["/workadjust/settings", "設定"],
];

function currentMenu(pathname) {
  for (const [path, name] of ROUTES) {
    if (pathname.startsWith(path)) return name;
  }
  return "作業予定一覧";
}

export default function WorkAdjustLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = currentMenu(location.pathname);

  function selectMenu(m) {
    if (m === "作業予定一覧") navigate("/workadjust");
    else if (m === "予約") navigate("/workadjust/reservation");
    else if (m === "配置図確認") navigate("/workadjust/floor-plan");
    else if (m === "作業配置図設定") navigate("/workadjust/floor-plan-setting");
    else if (m === "資機材・ゲート登録") navigate("/workadjust/registry");
    else if (m === "協力会社一覧") navigate("/workadjust/companies");
    else if (m === "設定") navigate("/workadjust/settings");
  }

  return (
    <WaSettingsProvider>
    <div className="layout">
      <aside className="side">
        <Link to="/workadjust" className="brand">
          作業間調整pro<small>新産業の森作業所</small>
        </Link>
        <nav>
          {WORKADJUST_MENU.map((m) =>
            WORKADJUST_EXTERNAL_LINKS[m] ? (
              <a
                key={m}
                className="item external"
                href={WORKADJUST_EXTERNAL_LINKS[m]}
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
          <h1>{active}</h1>
          <div className="topbar-right">
            <OverlapBell />
            <HeaderDatePager />
          </div>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </div>
    </WaSettingsProvider>
  );
}
