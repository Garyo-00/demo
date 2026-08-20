import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWpn } from "../components/wpn/WpnContext.jsx";
import { newId } from "../workPlanNeoData.js";

const PER_PAGE_OPTIONS = [25, 50, 100];

// 行ごとの操作メニュー（⋮）。マスタは編集・削除不可で、複製して自現場用に使う。
function RowMenu({ template, onEdit, onDuplicate, onDelete }) {
  const [open, setOpen] = useState(false);
  const isMaster = template.kind === "master";
  return (
    <div className="wpn-menu-wrap">
      <button className="wpn-kebab" onClick={() => setOpen((o) => !o)} aria-label="操作メニュー">
        ⋮
      </button>
      {open && (
        <>
          <div className="wpn-menu-backdrop" onClick={() => setOpen(false)} />
          <div className="wpn-menu">
            <button
              onClick={() => {
                setOpen(false);
                onEdit();
              }}
            >
              {isMaster ? "内容を確認" : "編集"}
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onDuplicate();
              }}
            >
              複製
            </button>
            {!isMaster && (
              <button
                className="danger"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
              >
                削除
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default function WorkPlanNeoTemplates() {
  const navigate = useNavigate();
  const { templates, saveTemplate, removeTemplate } = useWpn();
  const [perPage, setPerPage] = useState(50);
  const [page, setPage] = useState(1);

  const total = templates.length;
  const maxPage = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, maxPage);
  const start = (current - 1) * perPage;
  const rows = templates.slice(start, start + perPage);

  function duplicate(t) {
    saveTemplate({
      ...t,
      id: newId("tpl"),
      kind: "custom",
      name: `${t.name.replace(/^【テンプレート用】/, "")}（コピー）`,
      updatedBy: "元請 田中",
    });
  }

  return (
    <div className="wpn-card">
      <div className="wpn-page-head">
        <h1 className="wpn-page-title">作業計画書テンプレート設定一覧</h1>
        <button
          className="wpn-btn primary sm"
          style={{ marginLeft: "auto" }}
          onClick={() => navigate("/workplan-neo/templates/new")}
        >
          ＋ 追加
        </button>
      </div>

      <table className="wpn-table">
        <thead>
          <tr>
            <th>テンプレート名</th>
            <th style={{ width: 220 }}>種別</th>
            <th style={{ width: 60 }} />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={3} className="wpn-empty">テンプレートがありません。</td>
            </tr>
          )}
          {rows.map((t) => (
            <tr key={t.id}>
              <td>
                <button
                  className={"wpn-name-btn" + (t.kind === "master" ? " master" : "")}
                  onClick={() => navigate(`/workplan-neo/templates/${t.id}`)}
                >
                  {t.name}
                </button>
              </td>
              <td>{t.kind === "master" && <span className="wpn-tag master">マスタ</span>}</td>
              <td className="center">
                <RowMenu
                  template={t}
                  onEdit={() => navigate(`/workplan-neo/templates/${t.id}`)}
                  onDuplicate={() => duplicate(t)}
                  onDelete={() => {
                    if (confirm(`「${t.name}」を削除しますか？`)) removeTemplate(t.id);
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="wpn-pager">
        <span>ページあたりの行数:</span>
        <select
          className="wpn-select wpn-perpage"
          value={perPage}
          onChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(1);
          }}
        >
          {PER_PAGE_OPTIONS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span className="wpn-pager-range">
          {total === 0 ? 0 : start + 1}〜{Math.min(start + perPage, total)} / {total}
        </span>
        <button
          className="wpn-pager-btn"
          disabled={current <= 1}
          onClick={() => setPage(current - 1)}
          aria-label="前のページ"
        >
          ‹
        </button>
        <button
          className="wpn-pager-btn"
          disabled={current >= maxPage}
          onClick={() => setPage(current + 1)}
          aria-label="次のページ"
        >
          ›
        </button>
      </div>
    </div>
  );
}
