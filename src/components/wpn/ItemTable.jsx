import { useState } from "react";
import { makeRow, needsOptions } from "../../workPlanNeoData.js";

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3" />
    </svg>
  );
}

/**
 * テンプレートの項目行テーブル（共通項目／作業内容／チェックリストで共用）。
 * 行の並べ替え（ドラッグ）・追加・削除・回答形式の切替に対応する。
 */
export default function ItemTable({
  rows,
  onChange,
  types,
  labelHeader = "項目",
  labelPlaceholder = "項目名を入力",
  emptyText = "項目がありません。「＋」または「5行追加」で追加してください。",
}) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const update = (id, patch) =>
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id) => onChange(rows.filter((r) => r.id !== id));
  const addRows = (n) =>
    onChange([...rows, ...Array.from({ length: n }, () => makeRow({ type: types[0].value }))]);

  function drop(to) {
    if (dragIdx === null || dragIdx === to) return;
    const next = [...rows];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setDragIdx(null);
    setOverIdx(null);
  }

  return (
    <>
      <div className="wpn-card-head">
        <button type="button" className="wpn-linkbtn" onClick={() => addRows(5)}>
          5行追加
        </button>
      </div>
      <table className="wpn-table">
        <thead>
          <tr>
            <th className="wpn-col-handle" />
            <th className="num">No</th>
            <th>{labelHeader}</th>
            <th style={{ width: "22%" }}>回答形式</th>
            <th className="wpn-col-req center">必須</th>
            <th style={{ width: "26%" }}>備考</th>
            <th className="wpn-col-del" />
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={7} className="wpn-empty">
                {emptyText}
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr
              key={r.id}
              className={
                (dragIdx === i ? "wpn-row-dragging " : "") + (overIdx === i && dragIdx !== i ? "wpn-row-over" : "")
              }
              onDragOver={(e) => {
                e.preventDefault();
                setOverIdx(i);
              }}
              onDrop={() => drop(i)}
            >
              <td>
                <button
                  type="button"
                  className="wpn-drag"
                  draggable
                  onDragStart={() => setDragIdx(i)}
                  onDragEnd={() => {
                    setDragIdx(null);
                    setOverIdx(null);
                  }}
                  aria-label="行を並べ替え"
                >
                  ⠿
                </button>
              </td>
              <td className="num">{i + 1}</td>
              <td>
                <input
                  className="wpn-input sm"
                  value={r.label}
                  placeholder={labelPlaceholder}
                  onChange={(e) => update(r.id, { label: e.target.value })}
                />
                {needsOptions(types, r.type) && (
                  <input
                    className="wpn-input sm wpn-opts"
                    value={r.options}
                    placeholder="選択肢をカンマ区切りで入力（例：晴, 曇, 雨）"
                    onChange={(e) => update(r.id, { options: e.target.value })}
                  />
                )}
              </td>
              <td>
                <select
                  className="wpn-select"
                  style={{ height: 32, fontSize: "12.5px" }}
                  value={r.type}
                  onChange={(e) => update(r.id, { type: e.target.value })}
                >
                  {types.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="center">
                <input
                  type="checkbox"
                  className="wpn-check"
                  checked={r.required}
                  onChange={(e) => update(r.id, { required: e.target.checked })}
                  aria-label="必須"
                />
              </td>
              <td>
                <input
                  className="wpn-input sm"
                  value={r.note}
                  onChange={(e) => update(r.id, { note: e.target.value })}
                />
              </td>
              <td className="center">
                <button type="button" className="wpn-icon-btn" onClick={() => remove(r.id)} aria-label="行を削除">
                  <TrashIcon />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button type="button" className="wpn-addrow" onClick={() => addRows(1)} aria-label="行を追加">
        ＋
      </button>
    </>
  );
}
