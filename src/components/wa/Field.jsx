// 作業間調整pro 用のフォーム部品

let uid = 0;
function useId(prefix) {
  // レンダー間で安定なID（デモ用の簡易実装）
  return prefix + "-" + (uid++);
}

// 自由記述＋サジェスト（履歴／別システム設定を datalist で表示）
export function SuggestField({ label, value, onChange, options = [], required, hint, full, maxLength }) {
  const id = useId("dl");
  return (
    <div className={"field" + (full ? " full" : "")}>
      <label>
        {label}
        {required && <span className="req">*</span>}
      </label>
      <input
        list={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="入力／選択"
        maxLength={maxLength}
      />
      <datalist id={id}>
        {options.map((o) => (
          <option key={o} value={o} />
        ))}
      </datalist>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

// 選択式
export function SelectField({ label, value, onChange, options = [], required, hint, full }) {
  return (
    <div className={"field" + (full ? " full" : "")}>
      <label>
        {label}
        {required && <span className="req">*</span>}
      </label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => {
          const val = o && typeof o === "object" ? o.value : o;
          const text = o && typeof o === "object" ? o.label : o;
          return (
            <option key={String(val)} value={val}>
              {text}
            </option>
          );
        })}
      </select>
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

// 読み取り専用（自動反映項目）
export function ReadonlyField({ label, value, hint, full }) {
  return (
    <div className={"field readonly" + (full ? " full" : "")}>
      <label>{label}</label>
      <input value={value || ""} readOnly tabIndex={-1} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

// 日付（編集可能）
export function DateField({ label, value, onChange, required, hint, full }) {
  return (
    <div className={"field" + (full ? " full" : "")}>
      <label>
        {label}
        {required && <span className="req">*</span>}
      </label>
      <input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

// 複数行テキスト（必須・文字数上限・履歴サジェスト対応）
export function TextAreaField({ label, value, onChange, hint, full, placeholder, required, maxLength, history }) {
  return (
    <div className={"field" + (full ? " full" : "")}>
      <label>
        {label}
        {required && <span className="req">*</span>}
      </label>
      {history && history.length > 0 && (
        <div className="field-history">
          <span className="field-history-label">履歴：</span>
          {history.map((h) => (
            <button
              type="button"
              className="field-history-chip"
              key={h}
              onClick={() => onChange(h)}
              title="クリックで入力"
            >
              {h}
            </button>
          ))}
        </div>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
      />
      {maxLength && (
        <span className="field-count">
          {(value || "").length} / {maxLength}
        </span>
      )}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}
