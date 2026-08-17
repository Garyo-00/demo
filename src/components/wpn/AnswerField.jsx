/**
 * 回答形式ごとの入力欄。作成画面（編集可）と詳細画面（閲覧）で共用する。
 * テンプレートで定義した「回答形式」が、作業計画書のどの入力UIになるかを示す。
 */
export default function AnswerField({ item, value, onChange, readOnly = false }) {
  const set = (v) => onChange && onChange(v);
  const opts = (item.options || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  switch (item.type) {
    case "checkbox":
      return (
        <input
          type="checkbox"
          className="wpn-check"
          checked={!!value}
          disabled={readOnly}
          onChange={(e) => set(e.target.checked)}
        />
      );
    case "select":
    case "machine":
    case "worker":
      return (
        <select className="wpn-select" value={value || ""} disabled={readOnly} onChange={(e) => set(e.target.value)}>
          <option value=""></option>
          {(item.type === "machine"
            ? ["移動式クレーン（クローラー式）", "ブレーカ（油圧式）", "ホイールローダ"]
            : item.type === "worker"
              ? ["門脇_管理者", "星野 恵河", "職長 佐藤"]
              : opts
          ).map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    case "multiSelect":
      return (
        <select
          className="wpn-select"
          multiple
          size={1}
          value={value || []}
          disabled={readOnly}
          onChange={(e) => set([...e.target.selectedOptions].map((o) => o.value))}
        >
          {opts.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      );
    case "textarea":
      return (
        <textarea
          className="wpn-input wpn-textarea"
          value={value || ""}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => set(e.target.value)}
        />
      );
    case "number":
      return (
        <input
          className="wpn-input"
          type="number"
          value={value || ""}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => set(e.target.value)}
        />
      );
    case "time":
      return (
        <input
          className="wpn-input"
          type={readOnly ? "text" : "time"}
          placeholder="hh:mm"
          value={value || ""}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => set(e.target.value)}
        />
      );
    case "timeRange":
      return (
        <div className="wpn-range">
          <input
            className="wpn-input"
            type={readOnly ? "text" : "time"}
            placeholder="hh:mm"
            value={value?.[0] || ""}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={(e) => set([e.target.value, value?.[1] || ""])}
          />
          <span>〜</span>
          <input
            className="wpn-input"
            type={readOnly ? "text" : "time"}
            placeholder="hh:mm"
            value={value?.[1] || ""}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={(e) => set([value?.[0] || "", e.target.value])}
          />
        </div>
      );
    case "datetime":
      return (
        <input
          className="wpn-input"
          type={readOnly ? "text" : "datetime-local"}
          placeholder="YYYY/MM/DD hh:mm"
          value={value || ""}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => set(e.target.value)}
        />
      );
    case "date":
      return (
        <input
          className="wpn-input"
          type={readOnly ? "text" : "date"}
          placeholder="YYYY/MM/DD"
          value={value || ""}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => set(e.target.value)}
        />
      );
    case "dateRange":
      return (
        <div className="wpn-range">
          <input
            className="wpn-input"
            type={readOnly ? "text" : "date"}
            placeholder="YYYY/MM/DD"
            value={value?.[0] || ""}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={(e) => set([e.target.value, value?.[1] || ""])}
          />
          <span>〜</span>
          <input
            className="wpn-input"
            type={readOnly ? "text" : "date"}
            placeholder="YYYY/MM/DD"
            value={value?.[1] || ""}
            readOnly={readOnly}
            disabled={readOnly}
            onChange={(e) => set([value?.[0] || "", e.target.value])}
          />
        </div>
      );
    case "photo":
    case "file":
      return (
        <div className="wpn-fileline">
          <button className="wpn-btn primary sm" type="button" disabled={readOnly}>ファイルを選択</button>
          {item.type === "photo" && <span className="wpn-camera">📷</span>}
        </div>
      );
    default:
      return (
        <input
          className="wpn-input"
          value={value || ""}
          readOnly={readOnly}
          disabled={readOnly}
          onChange={(e) => set(e.target.value)}
        />
      );
  }
}

// 項目 / 回答内容 / 備考 の3列テーブル（作成・詳細で共用）
export function AnswerTable({ items, values, onChange, readOnly = false, leadingRow = null }) {
  if (!items?.length && !leadingRow) {
    return <div className="wpn-empty">項目がありません。</div>;
  }
  return (
    <table className="wpn-table wpn-answer-table">
      <thead>
        <tr>
          <th style={{ width: "26%" }}>項目</th>
          <th>回答内容</th>
          <th style={{ width: "18%" }}>備考</th>
        </tr>
      </thead>
      <tbody>
        {leadingRow}
        {items?.map((it) => (
          <tr key={it.id}>
            <td>
              {it.label}
              {it.required && <span className="wpn-req-mark">*</span>}
            </td>
            <td>
              <AnswerField
                item={it}
                value={values?.[it.id]}
                readOnly={readOnly}
                onChange={(v) => onChange && onChange(it.id, v)}
              />
            </td>
            <td className="wpn-note-cell">{it.note || "備考"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
