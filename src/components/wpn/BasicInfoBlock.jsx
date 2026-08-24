import { BASIC_ITEMS } from "../../workPlanNeoData.js";

/**
 * 「基本情報ブロック」の中身。作業配置図と作業期間で構成する。
 * ブロック固有のため、テンプレートでは表示のみ（編集不可）。
 */
export default function BasicInfoBlock() {
  return (
    <table className="wpn-table">
      <thead>
        <tr>
          <th>項目</th>
          <th style={{ width: "34%" }}>回答形式</th>
          <th className="wpn-col-req">必須</th>
        </tr>
      </thead>
      <tbody>
        {BASIC_ITEMS.map((it) => (
          <tr key={it.label}>
            <td>
              {it.label}
              {it.hint && <span className="wpn-hint">{it.hint}</span>}
            </td>
            <td>{it.type}</td>
            <td>
              <input
                type="checkbox"
                className="wpn-check"
                checked
                disabled
                aria-label="必須（固定）"
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
