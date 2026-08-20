import {
  CRANE_AUTO_ITEMS,
  CRANE_INPUT_ITEMS,
  defaultCraneAuto,
} from "../../workPlanNeoData.js";

/**
 * 「クレーンの自動入力」ブロックの設定。
 * 入力項目はブロック固有のため表示のみ（編集不可）。
 * 自動反映項目は使用／未使用をテンプレートごとに選び、安全率はこの画面で設定する。
 */
export default function CraneAutoBlock({ value, onChange }) {
  const cfg = value || defaultCraneAuto();
  const auto = cfg.auto || {};
  const setAuto = (key, on) =>
    onChange({ ...cfg, auto: { ...auto, [key]: on } });

  return (
    <div>
      {/* 入力項目（職長が作業計画書で入力する。編集不可） */}
      <div className="wpn-subcard">
        <div className="wpn-sub-title">
          入力項目
          <span className="wpn-hint">職長が作業計画書で入力します（編集不可）</span>
        </div>
        <table className="wpn-table">
          <thead>
            <tr>
              <th>項目</th>
              <th style={{ width: "34%" }}>回答形式</th>
              <th className="wpn-col-req">必須</th>
            </tr>
          </thead>
          <tbody>
            {CRANE_INPUT_ITEMS.map((it) => (
              <tr key={it.label}>
                <td>{it.label}</td>
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
      </div>

      {/* 自動反映（使用／未使用のみ選べる） */}
      <div className="wpn-subcard">
        <div className="wpn-sub-title">
          自動反映
          <span className="wpn-hint">入力項目から自動で計算・取得します</span>
        </div>
        <table className="wpn-table">
          <thead>
            <tr>
              <th>項目</th>
              <th style={{ width: "42%" }}>反映元</th>
              <th className="wpn-col-req center">使用</th>
            </tr>
          </thead>
          <tbody>
            {CRANE_AUTO_ITEMS.map((it) => (
              <tr key={it.key}>
                <td>{it.label}</td>
                <td className="wpn-note-cell">{it.source}</td>
                <td className="center">
                  <input
                    type="checkbox"
                    className="wpn-check"
                    checked={!!auto[it.key]}
                    onChange={(e) => setAuto(it.key, e.target.checked)}
                    aria-label={`${it.label}を使用する`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 設定（このテンプレートの判定基準） */}
      <div className="wpn-subcard">
        <div className="wpn-sub-title">
          設定
          <span className="wpn-hint">荷重率がこの値以下なら判定は「◯」になります</span>
        </div>
        <label className="wpn-label" htmlFor="wpn-crane-safety">
          安全率（％）
        </label>
        <input
          id="wpn-crane-safety"
          className="wpn-input wpn-narrow"
          type="number"
          min="0"
          max="100"
          value={cfg.safetyRate ?? ""}
          onChange={(e) =>
            onChange({
              ...cfg,
              safetyRate: e.target.value === "" ? "" : Number(e.target.value),
            })
          }
        />
      </div>
    </div>
  );
}
