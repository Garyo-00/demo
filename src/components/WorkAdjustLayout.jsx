import { useState } from "react";
import { Outlet, useNavigate, useLocation, Link } from "react-router-dom";
import { WORKADJUST_NAV, WORKADJUST_EXTERNAL_LINKS, formatDateStr } from "../data.js";
import { WaSettingsProvider, useWaSettings } from "./wa/WaSettingsContext.jsx";
import DatePager from "./wa/DatePager.jsx";
import { listOverlaps, KIND_LABEL, fmtHour } from "./wa/rsvTimeline.js";
import bellIcon from "../assets/icons/notifications.svg";

// ヘッダーの共通日付送り（作業日を共有）。
// 日付が意味を持つ「予約」「作業予定一覧」以外のページでは非アクティブにする。
function HeaderDatePager() {
  const { date, setDate, confirmLeave } = useWaSettings();
  const { pathname } = useLocation();
  const dateActive =
    pathname === "/workadjust" ||
    pathname === "/workadjust/" ||
    pathname.startsWith("/workadjust/reservation") ||
    pathname === "/workadjust/floor-plan" ||
    pathname.startsWith("/workadjust/floor-plan/");
  return (
    <DatePager
      value={date}
      onChange={(d) => {
        if (confirmLeave()) setDate(d);
      }}
      disabled={!dateActive}
    />
  );
}

// 閲覧ロール切替（元請 / 職長）。現状は切替の器のみで表示内容は共通。
function RoleSwitch() {
  const { role, setRole } = useWaSettings();
  return (
    <div className="role-switch" role="group" aria-label="閲覧ロール切替">
      <button
        className={"role-seg" + (role === "prime" ? " active" : "")}
        onClick={() => setRole("prime")}
        aria-pressed={role === "prime"}
      >
        元請
      </button>
      <button
        className={"role-seg" + (role === "foreman" ? " active" : "")}
        onClick={() => setRole("foreman")}
        aria-pressed={role === "foreman"}
      >
        職長
      </button>
    </div>
  );
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
        <img className="ic-bell" src={bellIcon} alt="通知" />
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
                通常予約の重複が <strong>{n}</strong> 件あります。
              </div>
              <ul className="bell-list">
                {overlaps.map((o, i) => (
                  <li key={i}>
                    <span className="bell-kind">{KIND_LABEL[o.kind]}／{o.resource}</span>
                    <ul className="bell-members">
                      {o.members.map((m, k) => (
                        <li key={k}>
                          {m.company}（{m.start}〜{m.end}）
                        </li>
                      ))}
                    </ul>
                    <div className="bell-range">重複時間帯 {fmtHour(o.os)}〜{fmtHour(o.oe)}</div>
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
  ["/workadjust/reserve-export", "予約実績出力"],
  ["/workadjust/reservation", "予約"],
  ["/workadjust/floor-plan-setting", "作業配置図設定"],
  ["/workadjust/floor-plan", "配置図作成"],
  ["/workadjust/actual-qr", "作業実績入力用QR発行"],
  ["/workadjust/reserve-qr", "資機材・ゲート予約用QR発行"],
  ["/workadjust/registry", "資機材・ゲート登録"],
  ["/workadjust/companies", "協力会社設定"],
  ["/workadjust/settings", "予約設定"],
];

function currentMenu(pathname) {
  for (const [path, name] of ROUTES) {
    if (pathname.startsWith(path)) return name;
  }
  return "作業予定一覧";
}

function WorkAdjustLayoutInner() {
  const navigate = useNavigate();
  const location = useLocation();
  const active = currentMenu(location.pathname);
  const { role, confirmLeave } = useWaSettings();
  // 職長ビューでは「設定」グループ（＝childrenを持つ項目）と「配置図作成」を非表示にする
  const HIDDEN_FOR_FOREMAN = ["配置図作成", "作業実績入力用QR発行"];
  const navItems = WORKADJUST_NAV.filter(
    (n) => !(role === "foreman" && (n.children || HIDDEN_FOR_FOREMAN.includes(n.label)))
  );
  // アコーディオン（children を持つグループ）の開閉。配下にいるグループは初期展開
  const [openGroups, setOpenGroups] = useState(() => {
    const init = {};
    WORKADJUST_NAV.forEach((n) => {
      if (n.children) init[n.label] = n.children.includes(active);
    });
    return init;
  });
  const toggleGroup = (label) =>
    setOpenGroups((o) => ({ ...o, [label]: !o[label] }));
  // モバイル：サイドメニュー（ドロワー）の開閉
  const [navOpen, setNavOpen] = useState(false);
  // サイドバー最下部のアカウントメニューの開閉（遷移先はデモのため未実装）
  const [userOpen, setUserOpen] = useState(false);

  function selectMenu(m) {
    if (!confirmLeave()) return; // 未保存の編集があれば確認
    setNavOpen(false); // 遷移したらドロワーを閉じる
    if (m === "作業予定一覧") navigate("/workadjust");
    else if (m === "予約") navigate("/workadjust/reservation");
    else if (m === "予約実績出力") navigate("/workadjust/reserve-export");
    else if (m === "配置図作成") navigate("/workadjust/floor-plan");
    else if (m === "作業実績入力用QR発行") navigate("/workadjust/actual-qr");
    else if (m === "資機材・ゲート予約用QR発行") navigate("/workadjust/reserve-qr");
    else if (m === "作業配置図設定") navigate("/workadjust/floor-plan-setting");
    else if (m === "資機材・ゲート登録") navigate("/workadjust/registry");
    else if (m === "協力会社設定") navigate("/workadjust/companies");
    else if (m === "予約設定") navigate("/workadjust/settings");
  }

  return (
    <div className="layout">
      {navOpen && <div className="nav-backdrop" onClick={() => setNavOpen(false)} />}
      <aside className={"side" + (navOpen ? " open" : "")}>
        <Link
          to="/workadjust"
          className="brand"
          onClick={(e) => {
            if (!confirmLeave()) {
              e.preventDefault();
              return;
            }
            setNavOpen(false);
          }}
        >
          作業間調整pro<small>新産業の森作業所</small>
        </Link>
        <nav>
          {navItems.map((item) =>
            item.children ? (
              <div className="nav-group" key={item.label}>
                <button
                  className={
                    "item accordion" +
                    (item.children.includes(active) ? " active-parent" : "")
                  }
                  onClick={() => toggleGroup(item.label)}
                  aria-expanded={!!openGroups[item.label]}
                >
                  <span className="dot" />
                  {item.label}
                  <span className={"acc-caret" + (openGroups[item.label] ? " open" : "")}>▾</span>
                </button>
                {openGroups[item.label] &&
                  item.children.map((c) => (
                    <button
                      key={c}
                      className={"item sub" + (active === c ? " active" : "")}
                      onClick={() => selectMenu(c)}
                    >
                      <span className="dot" />
                      {c}
                    </button>
                  ))}
              </div>
            ) : (
              <button
                key={item.label}
                className={"item" + (active === item.label ? " active" : "")}
                onClick={() => selectMenu(item.label)}
              >
                <span className="dot" />
                {item.label}
              </button>
            )
          )}
          {Object.keys(WORKADJUST_EXTERNAL_LINKS).map((m) => (
            <a
              key={m}
              className="item external"
              href={WORKADJUST_EXTERNAL_LINKS[m]}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setNavOpen(false)}
            >
              <span className="dot" />
              {m}
              <ExternalIcon />
            </a>
          ))}
        </nav>
        <Link
          to="/"
          className="back-link"
          onClick={(e) => {
            if (!confirmLeave()) {
              e.preventDefault();
              return;
            }
            setNavOpen(false);
          }}
        >
          ← デモ画面一覧へ戻る
        </Link>

        {/* 最下部：アカウント（クリックで上方向にメニューを展開。遷移先はデモのため未実装） */}
        <div className="side-account">
          <button
            className="side-user"
            onClick={() => setUserOpen((o) => !o)}
            aria-expanded={userOpen}
          >
            <span className="side-user-avatar">A</span>
            <span className="side-user-info">
              <strong>Arch管理者</strong>
              <small>テストプロジェクト</small>
            </span>
            <span className={"side-user-caret" + (userOpen ? " open" : "")}>⌄</span>
          </button>

          {userOpen && (
            <>
              <div className="side-user-backdrop" onClick={() => setUserOpen(false)} />
              <div className="side-user-menu">
                <div className="side-user-head">
                  <span className="side-user-avatar lg">A</span>
                  <div className="side-user-head-txt">
                    <div className="su-sub">株式会社Arch</div>
                    <div className="su-sub">テストプロジェクト</div>
                    <div className="su-sub">Arch管理者</div>
                    <div className="su-name">Arch管理者</div>
                  </div>
                </div>

                <div className="side-user-sec">
                  <button className="su-item" type="button">
                    <span className="su-ico">🪪</span>
                    <span className="su-label">アカウント設定</span>
                    <ExternalIcon />
                  </button>
                  <button className="su-item" type="button">
                    <span className="su-ico">👥</span>
                    <span className="su-label">ユーザー一覧</span>
                    <ExternalIcon />
                  </button>
                  <button className="su-item" type="button">
                    <span className="su-ico">📋</span>
                    <span className="su-label">現場情報</span>
                  </button>
                  <button className="su-item" type="button">
                    <span className="su-ico">🗂️</span>
                    <span className="su-label">現場選択</span>
                  </button>
                </div>

                <div className="side-user-sec">
                  <button className="su-item" type="button">
                    <span className="su-ico">📄</span>
                    <span className="su-label">見積依頼サービス</span>
                    <ExternalIcon />
                  </button>
                  <button className="su-item" type="button">
                    <span className="su-ico">🛒</span>
                    <span className="su-label">発注サービス</span>
                    <ExternalIcon />
                  </button>
                  <button className="su-item" type="button">
                    <span className="su-ico">📦</span>
                    <span className="su-label">在庫管理サービス</span>
                    <ExternalIcon />
                  </button>
                  <button className="su-item" type="button">
                    <span className="su-ico">📝</span>
                    <span className="su-label">利用規約</span>
                    <ExternalIcon />
                  </button>
                  <button className="su-item" type="button">
                    <span className="su-ico">🛡️</span>
                    <span className="su-label">プライバシーポリシー</span>
                    <ExternalIcon />
                  </button>
                </div>

                <div className="side-user-sec">
                  <button className="su-logout" type="button">
                    🔒 ログアウト
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
      <div className="main">
        <div className="topbar">
          <button className="nav-toggle" onClick={() => setNavOpen(true)} aria-label="メニューを開く">
            ☰
          </button>
          <span className="topbar-project">新産業の森作業所</span>
          <div className="topbar-right">
            <RoleSwitch />
            {role === "prime" && <OverlapBell />}
            <HeaderDatePager />
          </div>
        </div>
        <div className="content">
          <div className="content-card">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WorkAdjustLayout() {
  return (
    <WaSettingsProvider>
      <WorkAdjustLayoutInner />
    </WaSettingsProvider>
  );
}
