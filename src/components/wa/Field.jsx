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

// 複数行テキスト
export function TextAreaField({ label, value, onChange, hint, full, placeholder }) {
  return (
    <div className={"field" + (full ? " full" : "")}>
      <label>{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}
