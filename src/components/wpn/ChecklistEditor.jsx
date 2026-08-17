import { useState } from "react";
import { makeCheckRow, makeChecklist } from "../../workPlanNeoData.js";

function TrashIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M10 11v6M14 11v6" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3" />
    </svg>
  );
}

/**
 * チェックリスト編集（タブで複数リストを切り替え）。
 * 1テンプレートに複数のチェックリストを持たせ、リストごとに実施者の役割を設定する。
 */
export default function ChecklistEditor({ lists, onChange }) {
  const [active, setActive] = useState(0);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const cur = lists[active];

  function updateList(patch) {
    onChange(lists.map((l, i) => (i === active ? { ...l, ...patch } : l)));
  }
  function addList() {
    onChange([...lists, makeChecklist()]);
    setActive(lists.length);
  }
  function removeList(idx) {
    const next = lists.filter((_, i) => i !== idx);
    onChange(next);
    setActive((a) => Math.max(0, Math.min(a, next.length - 1)));
  }
  const updateRow = (id, patch) =>
    updateList({ rows: cur.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const removeRow = (id) => updateList({ rows: cur.rows.filter((r) => r.id !== id) });

  function drop(to) {
    if (dragIdx === null || dragIdx === to) return;
    const rows = [...cur.rows];
    const [moved] = rows.splice(dragIdx, 1);
    rows.splice(to, 0, moved);
    updateList({ rows });
    setDragIdx(null);
    setOverIdx(null);
  }

  return (
    <>
      <div className="wpn-tabs">
        {lists.map((l, i) => (
          <button
            key={l.id}
            className={"wpn-tab" + (i === active ? " active" : "")}
            onClick={() => setActive(i)}
          >
            {l.name?.trim() || `チェックリスト${i + 1}`}
            {i === active && (
              <span
                className="wpn-tab-del"
                role="button"
                tabIndex={0}
                aria-label="このチェックリストを削除"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm("このチェックリストを削除しますか？")) removeList(i);
                }}
              >
                <TrashIcon size={13} />
              </span>
            )}
          </button>
        ))}
        <button className="wpn-tab-add" onClick={addList} aria-label="チェックリストを追加">
          ＋
        </button>
      </div>

      {!cur ? (
        <div className="wpn-empty">
          チェックリストがありません。「＋」で追加してください。
        </div>
      ) : (
        <>
          <input
            className="wpn-input wpn-mb8"
            value={cur.name}
            placeholder="チェックリスト名"
            onChange={(e) => updateList({ name: e.target.value })}
          />
          <input
            className="wpn-input wpn-mb8"
            value={cur.role}
            placeholder="実施者の役割"
            onChange={(e) => updateList({ role: e.target.value })}
          />

          <table className="wpn-table">
            <thead>
              <tr>
                <th className="wpn-col-handle" />
                <th>内容</th>
                <th className="wpn-col-req center">必須</th>
                <th style={{ width: "34%" }}>備考</th>
                <th className="wpn-col-del" />
              </tr>
            </thead>
            <tbody>
              {cur.rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="wpn-empty">
                    確認項目がありません。「＋」で追加してください。
                  </td>
                </tr>
              )}
              {cur.rows.map((r, i) => (
                <tr
                  key={r.id}
                  className={
                    (dragIdx === i ? "wpn-row-dragging " : "") +
                    (overIdx === i && dragIdx !== i ? "wpn-row-over" : "")
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
                  <td>
                    <input
                      className="wpn-input sm"
                      value={r.label}
                      placeholder="例：作業計画書を確認しましたか"
                      onChange={(e) => updateRow(r.id, { label: e.target.value })}
                    />
                  </td>
                  <td className="center">
                    <input
                      type="checkbox"
                      className="wpn-check"
                      checked={r.required}
                      onChange={(e) => updateRow(r.id, { required: e.target.checked })}
                      aria-label="必須"
                    />
                  </td>
                  <td>
                    <input
                      className="wpn-input sm"
                      value={r.note}
                      onChange={(e) => updateRow(r.id, { note: e.target.value })}
                    />
                  </td>
                  <td className="center">
                    <button
                      type="button"
                      className="wpn-icon-btn"
                      onClick={() => removeRow(r.id)}
                      aria-label="行を削除"
                    >
                      <TrashIcon />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            type="button"
            className="wpn-addrow"
            onClick={() => updateList({ rows: [...cur.rows, makeCheckRow()] })}
            aria-label="行を追加"
          >
            ＋
          </button>
        </>
      )}
    </>
  );
}
