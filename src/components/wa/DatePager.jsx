import { formatDateStr, shiftDate } from "../../data.js";

// ページ全体を日付単位で切り替えるための日付送りUI
export default function DatePager({ value, onChange }) {
  return (
    <div className="datepager">
      <button
        className="dp-arrow"
        onClick={() => onChange(shiftDate(value, -1))}
        aria-label="前日"
      >
        ‹ 前日
      </button>
      <label className="dp-current">
        <span className="dp-label">{formatDateStr(value)}</span>
        <input
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
      <button
        className="dp-arrow"
        onClick={() => onChange(shiftDate(value, 1))}
        aria-label="翌日"
      >
        翌日 ›
      </button>
    </div>
  );
}
