import { newId } from "../../workPlanNeoData.js";

function nowStr() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}/${p(d.getMonth() + 1)}/${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/**
 * 安全指示事項の入力（承認画面）。docs/workplan/02-安全指示事項.md 準拠。
 * 「作業内容＋安全指示事項」のかたまりを、承認者が任意の数だけ追加する。
 * 他の承認者が登録した内容も上書きできる（更新者・更新日時を表示して気づけるようにする）。
 */
export default function SafetyInstructionEditor({ plan, template, onChange }) {
  const list = plan.safetyInstructions || [];
  // 作業内容の選択肢：作業内容タブ（作業1・作業2…）＋テンプレートの作業内容項目名
  const workOptions = plan.works.map((w, i) => ({
    id: w.id,
    label: `作業${i + 1}${template?.work?.[0]?.label ? `（${template.work[0].label}）` : ""}`,
  }));

  const update = (id, patch) =>
    onChange(
      list.map((si) =>
        si.id === id ? { ...si, ...patch, updatedAt: nowStr(), updatedBy: "元請 田中" } : si
      )
    );

  return (
    <div className="wpn-card">
      <div className="wpn-card-head">
        <h2 className="wpn-card-title">
          安全指示事項
          <span className="wpn-hint">作業内容ごとに、任意の数だけ登録できます</span>
        </h2>
        <button
          className="wpn-linkbtn"
          onClick={() =>
            onChange([
              ...list,
              {
                id: newId("si"),
                workId: workOptions[0]?.id || "",
                workLabel: workOptions[0]?.label || "",
                text: "",
                updatedAt: nowStr(),
                updatedBy: "元請 田中",
                version: 1,
              },
            ])
          }
        >
          ＋ 追加
        </button>
      </div>

      {list.length === 0 && (
        <div className="wpn-none">
          安全指示事項は入力されていません。「＋ 追加」で作業内容ごとに登録できます。
        </div>
      )}

      {list.map((si, i) => (
        <div className="wpn-si edit" key={si.id}>
          <div className="wpn-si-head">
            <span className="wpn-si-no">No.{i + 1}</span>
            <select
              className="wpn-select wpn-si-select"
              value={si.workId}
              onChange={(e) => {
                const opt = workOptions.find((o) => o.id === e.target.value);
                update(si.id, { workId: e.target.value, workLabel: opt?.label || "" });
              }}
            >
              <option value="">作業内容を選択</option>
              {workOptions.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
            <button
              className="wpn-icon-btn"
              onClick={() => onChange(list.filter((x) => x.id !== si.id))}
              aria-label="削除"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 7h16M10 11v6M14 11v6" />
                <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13M9 7V4h6v3" />
              </svg>
            </button>
          </div>
          <textarea
            className="wpn-input wpn-textarea"
            placeholder="安全指示事項を入力"
            value={si.text}
            onChange={(e) => update(si.id, { text: e.target.value })}
          />
          <div className="wpn-si-meta">
            最終更新：{si.updatedAt} {si.updatedBy}
          </div>
        </div>
      ))}
    </div>
  );
}
