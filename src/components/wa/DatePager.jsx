import { formatDateStr, shiftDate } from "../../data.js";

// ページ全体を日付単位で切り替えるための日付送りUI
// disabled=true（予約・作業予定以外のページ）では操作不可・グレーアウト表示。
export default function DatePager({ value, onChange, disabled = false }) {
  return (
    <div className={"datepager" + (disabled ? " disabled" : "")} aria-disabled={disabled}>
      <button
        className="dp-arrow"
        onClick={() => onChange(shiftDate(value, -1))}
        aria-label="前日"
        disabled={disabled}
      >
        ‹ 前日
      </button>
      <label className="dp-current">
        <span className="dp-label">{formatDateStr(value)}</span>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      </label>
      <button
        className="dp-arrow"
        onClick={() => onChange(shiftDate(value, 1))}
        aria-label="翌日"
        disabled={disabled}
      >
        翌日 ›
      </button>
    </div>
  );
}
