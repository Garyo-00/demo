import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWpn } from "../components/wpn/WpnContext.jsx";
import PlanDrawer from "../components/wpn/PlanDrawer.jsx";
import { StatusBadge } from "../components/wpn/PlanDetailContent.jsx";
import {
  APPLICANTS,
  COMPANIES,
  MACHINE_CATEGORIES,
  PLAN_STATUS,
  categoryCounts,
  machineById,
} from "../workPlanNeoPlanData.js";

const STATUS_KEYS = ["applying", "approved", "rejected"];
const EMPTY_COND = { category: "", alias: "", applicant: "", company: "", statuses: STATUS_KEYS };

export default function WorkPlanNeoPlans() {
  const navigate = useNavigate();
  const { plans } = useWpn();
  const [openSearch, setOpenSearch] = useState(true);
  const [span, setSpan] = useState("day"); // day | week
  const [date, setDate] = useState("2026-07-08");
  const [cond, setCond] = useState(EMPTY_COND);
  const [applied, setApplied] = useState(EMPTY_COND);
  const [expanded, setExpanded] = useState({});
  const [drawerId, setDrawerId] = useState(null);
  const [perPage, setPerPage] = useState(50);

  const filtered = plans.filter((p) => {
    if (!applied.statuses.includes(p.status)) return false;
    if (applied.applicant && p.applicant !== applied.applicant) return false;
    if (applied.company && p.company !== applied.company) return false;
    if (applied.category && !categoryCounts(p.machineIds).some((c) => c.category === applied.category)) return false;
    if (applied.alias) {
      const hit = p.machineIds.some((id) => (machineById(id)?.alias || "").includes(applied.alias));
      if (!hit) return false;
    }
    return true;
  });
  const rows = filtered.slice(0, perPage);

  function toggleStatus(key) {
    setCond((c) => ({
      ...c,
      statuses: c.statuses.includes(key) ? c.statuses.filter((s) => s !== key) : [...c.statuses, key],
    }));
  }
  function shiftDate(days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  }

  return (
    <>
      <div className="wpn-card">
        <div className="wpn-page-head">
          <h1 className="wpn-page-title">作業計画書一覧</h1>
          <button
            className="wpn-btn primary sm"
            style={{ marginLeft: "auto" }}
            onClick={() => navigate("/workplan-neo/plans/new")}
          >
            ＋ 新規作成
          </button>
        </div>

        {/* 検索条件 */}
        <div className="wpn-search">
          <button className="wpn-search-head" onClick={() => setOpenSearch((o) => !o)}>
            検索条件
            <span className={"wpn-caret" + (openSearch ? " open" : "")}>⌃</span>
          </button>
          {openSearch && (
            <>
              <div className="wpn-search-row">
                <div className="wpn-seg">
                  <button className={span === "day" ? "active" : ""} onClick={() => setSpan("day")}>日</button>
                  <button className={span === "week" ? "active" : ""} onClick={() => setSpan("week")}>週</button>
                </div>
                <button className="wpn-pager-btn" onClick={() => shiftDate(-7)} aria-label="前週">|‹</button>
                <button className="wpn-pager-btn" onClick={() => shiftDate(-1)} aria-label="前日">‹</button>
                <input className="wpn-input wpn-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                <button className="wpn-pager-btn" onClick={() => shiftDate(1)} aria-label="翌日">›</button>
                <button className="wpn-pager-btn" onClick={() => shiftDate(7)} aria-label="翌週">›|</button>
              </div>
              <div className="wpn-search-row wrap">
                <select
                  className="wpn-select wpn-field"
                  value={cond.category}
                  onChange={(e) => setCond({ ...cond, category: e.target.value })}
                >
                  <option value="">持込/レンタル機械カテゴリ</option>
                  {MACHINE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <input
                  className="wpn-input wpn-field"
                  placeholder="現場内呼称"
                  value={cond.alias}
                  onChange={(e) => setCond({ ...cond, alias: e.target.value })}
                />
                <select
                  className="wpn-select wpn-field"
                  value={cond.applicant}
                  onChange={(e) => setCond({ ...cond, applicant: e.target.value })}
                >
                  <option value="">申請者</option>
                  {APPLICANTS.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <select
                  className="wpn-select wpn-field"
                  value={cond.company}
                  onChange={(e) => setCond({ ...cond, company: e.target.value })}
                >
                  <option value="">協力会社名</option>
                  {COMPANIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <div className="wpn-field wpn-statusfield">
                  <span className="wpn-field-label">申請ステータス</span>
                  <div className="wpn-statuschips">
                    {STATUS_KEYS.map((k) => (
                      <button
                        key={k}
                        className={"wpn-status " + PLAN_STATUS[k].cls + (cond.statuses.includes(k) ? "" : " off")}
                        onClick={() => toggleStatus(k)}
                      >
                        {PLAN_STATUS[k].label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="wpn-search-actions">
                <button className="wpn-btn primary sm" onClick={() => setApplied(cond)}>検索</button>
                <button
                  className="wpn-btn ghost sm"
                  onClick={() => {
                    setCond(EMPTY_COND);
                    setApplied(EMPTY_COND);
                  }}
                >
                  条件をリセット
                </button>
              </div>
            </>
          )}
        </div>

        {/* 一覧 */}
        <table className="wpn-table wpn-plan-table">
          <thead>
            <tr>
              <th style={{ width: 42 }}>
                <input type="checkbox" className="wpn-check" aria-label="全選択" />
              </th>
              <th style={{ width: "18%" }}>作業計画書名</th>
              <th>持込/レンタル機械カテゴリ</th>
              <th style={{ width: 130 }}>申請者</th>
              <th style={{ width: 140 }}>協力会社名</th>
              <th style={{ width: 120 }}>申請ステータス</th>
              <th style={{ width: 60 }}>詳細</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="wpn-empty">条件に一致する作業計画書はありません。</td>
              </tr>
            )}
            {rows.map((p) => {
              const cats = categoryCounts(p.machineIds);
              const open = !!expanded[p.id];
              return (
                <Fragment key={p.id}>
                  <tr>
                    <td className="center">
                      <input type="checkbox" className="wpn-check" aria-label="選択" />
                    </td>
                    <td>{p.name}</td>
                    <td>
                      <button
                        className="wpn-count-toggle"
                        onClick={() => setExpanded((e) => ({ ...e, [p.id]: !open }))}
                      >
                        {p.machineIds.length}台 <span className={"wpn-caret" + (open ? " open" : "")}>⌄</span>
                      </button>
                      {cats.length > 0 && (
                        <div className="wpn-catchips">
                          {cats.map((c) => (
                            <span className="wpn-catchip" key={c.category}>
                              {c.category}（{c.count}台）
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>{p.applicant}</td>
                    <td>{p.company}</td>
                    <td>
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="center">
                      <button className="wpn-icon-btn wpn-detail-btn" onClick={() => setDrawerId(p.id)} aria-label="詳細">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 5h5v5M19 5l-8 8M11 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                  {open && (
                    <tr className="wpn-exp-row">
                      <td colSpan={7}>
                        <table className="wpn-table wpn-inner-table">
                          <thead>
                            <tr>
                              <th>機械名</th>
                              <th style={{ width: "26%" }}>現場内呼称</th>
                              <th style={{ width: "22%" }}>カテゴリ</th>
                              <th style={{ width: 100 }}>始業前点検</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.machineIds.length === 0 && (
                              <tr>
                                <td colSpan={4} className="wpn-empty">機械は登録されていません。</td>
                              </tr>
                            )}
                            {p.machineIds.map((id) => {
                              const m = machineById(id);
                              if (!m) return null;
                              return (
                                <tr key={id}>
                                  <td>{m.name}</td>
                                  <td>{m.alias}</td>
                                  <td>{m.category}</td>
                                  <td>
                                    <span className="wpn-tag gray">未</span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>

        <div className="wpn-pager">
          <span>ページあたりの行数:</span>
          <select
            className="wpn-select wpn-perpage"
            value={perPage}
            onChange={(e) => setPerPage(Number(e.target.value))}
          >
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="wpn-pager-range">
            {filtered.length === 0 ? 0 : 1}〜{rows.length} / {filtered.length}
          </span>
          <button className="wpn-pager-btn" disabled aria-label="前のページ">‹</button>
          <button className="wpn-pager-btn" disabled aria-label="次のページ">›</button>
        </div>
      </div>

      {drawerId && <PlanDrawer planId={drawerId} onClose={() => setDrawerId(null)} />}
    </>
  );
}
