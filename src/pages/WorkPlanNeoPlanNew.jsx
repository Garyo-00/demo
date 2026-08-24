import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useWpn } from "../components/wpn/WpnContext.jsx";
import { AnswerTable } from "../components/wpn/AnswerField.jsx";
import { TEMPLATE_BLOCKS, newId } from "../workPlanNeoData.js";
import {
  APPROVAL_FLOWS,
  MACHINES,
  MACHINE_CATEGORIES,
  flowById,
} from "../workPlanNeoPlanData.js";

// 未入力のときはプレースホルダを見せたいので、フォーカス時のみ date 入力にする
function DateField({ placeholder, value, onChange }) {
  const [asDate, setAsDate] = useState(false);
  return (
    <input
      className="wpn-input"
      type={asDate || value ? "date" : "text"}
      placeholder={placeholder}
      value={value}
      onFocus={() => setAsDate(true)}
      onBlur={() => setAsDate(false)}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export default function WorkPlanNeoPlanNew() {
  const navigate = useNavigate();
  const { templates, savePlan } = useWpn();
  const [tab, setTab] = useState("bring"); // bring | rental
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  // 既定でデモ用テンプレートを選択し、全ブロックが反映された状態を確認できるようにする
  const [templateId, setTemplateId] = useState("tplDemo");
  const [flowId, setFlowId] = useState("");
  const [perPage, setPerPage] = useState(50);
  // テンプレート項目（その他ブロック）への回答
  const [other, setOther] = useState({});
  const [floorPlanMode, setFloorPlanMode] = useState("upload"); // draw | upload

  const tpl = templates.find((t) => t.id === templateId) || null;
  const blocks = tpl?.blocks || {};

  const machines = MACHINES.filter((m) => {
    if (m.kind !== tab) return false;
    if (category && m.category !== category) return false;
    if (keyword && !(m.company + m.alias).includes(keyword)) return false;
    return true;
  });
  const rows = machines.slice(0, perPage);
  const allChecked = rows.length > 0 && rows.every((m) => selected.includes(m.id));

  function toggle(id) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }
  function toggleAll() {
    setSelected((s) =>
      allChecked ? s.filter((id) => !rows.some((m) => m.id === id)) : [...new Set([...s, ...rows.map((m) => m.id)])]
    );
  }
  function submit() {
    // 作業期間は基本情報ブロックの中にあるため、ブロックがONのときだけ必須
    if (!name.trim() || !templateId || !flowId || (blocks.basic && (!start || !end))) {
      alert("必須項目（作業計画書名・テンプレート・承認フロー・作業期間）を入力してください。");
      return;
    }
    const flow = flowById(flowId);
    savePlan({
      id: newId("plan"),
      name: name.trim(),
      templateId,
      templateName: tpl?.name || "",
      start: start.replaceAll("-", "/"),
      end: end.replaceAll("-", "/"),
      applicant: "門脇_管理者",
      author: "門脇_管理者",
      company: "株式会社Arch",
      status: "applying",
      machineIds: selected,
      flowId,
      approvals:
        flow?.steps.map((s) => ({
          no: s.no,
          group: s.group,
          status: "applying",
          rows: s.approvers.map((a) => ({ approver: a, date: "", status: "applying", comment: "" })),
        })) || [],
      other,
      files: tpl?.files || [],
      memo: "",
      checklistResults: [],
      safetyInstructions: [],
    });
    navigate("/workplan-neo/plans");
  }

  const actions = (
    <>
      <button className="wpn-btn ghost sm" onClick={() => navigate("/workplan-neo/plans")}>✕ キャンセル</button>
      <button className="wpn-btn primary sm" onClick={submit}>登録</button>
    </>
  );

  return (
    <div>
      <div className="wpn-actions top">{actions}</div>

      {/* 機械の選択 */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">機械の選択</h2>
        <div className="wpn-tabs">
          <button className={"wpn-tab" + (tab === "bring" ? " active" : "")} onClick={() => setTab("bring")}>
            持込機械
          </button>
          <button className={"wpn-tab" + (tab === "rental" ? " active" : "")} onClick={() => setTab("rental")}>
            レンタル機械
          </button>
        </div>

        <div className="wpn-search-row">
          <select className="wpn-select wpn-field" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">カテゴリで絞り込み</option>
            {MACHINE_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            className="wpn-input wpn-field"
            placeholder="協力会社名・現場内呼称で検索"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>

        <table className="wpn-table">
          <thead>
            <tr>
              <th style={{ width: 42 }}>
                <input type="checkbox" className="wpn-check" checked={allChecked} onChange={toggleAll} aria-label="全選択" />
              </th>
              <th style={{ width: "18%" }}>機械カテゴリ</th>
              <th>機械名（仕様）</th>
              <th style={{ width: "16%" }}>現場内呼称</th>
              <th style={{ width: "14%" }}>現場内管理番号</th>
              <th style={{ width: "14%" }}>協力会社</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="wpn-empty tall">行がありません。</td>
              </tr>
            )}
            {rows.map((m) => (
              <tr key={m.id}>
                <td className="center">
                  <input
                    type="checkbox"
                    className="wpn-check"
                    checked={selected.includes(m.id)}
                    onChange={() => toggle(m.id)}
                    aria-label={m.name}
                  />
                </td>
                <td>{m.category}</td>
                <td>{m.name}</td>
                <td>{m.alias}</td>
                <td>{m.mgmtNo}</td>
                <td>{m.company}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="wpn-pager">
          <span>ページあたりの行数:</span>
          <select className="wpn-select wpn-perpage" value={perPage} onChange={(e) => setPerPage(Number(e.target.value))}>
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="wpn-pager-range">
            {machines.length === 0 ? 0 : 1}〜{rows.length} / {machines.length}
          </span>
          <button className="wpn-pager-btn" disabled aria-label="前のページ">‹</button>
          <button className="wpn-pager-btn" disabled aria-label="次のページ">›</button>
        </div>
      </div>

      {/* 必須項目 */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">必須項目</h2>
        <input
          className="wpn-input wpn-mb8"
          placeholder="作業計画書名"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <div className="wpn-floatfield">
          {templateId && <span className="wpn-float-label">作業計画書テンプレート</span>}
          <select
            className="wpn-select"
            value={templateId}
            onChange={(e) => {
              setTemplateId(e.target.value);
              setOther({});
            }}
          >
            <option value="">作業計画書テンプレート</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
        <button className="wpn-linkbtn wpn-copy-link">⧉ 過去の作業計画書からコピー</button>
      </div>

      {/* ここから下はテンプレートでONにしたブロックが順に表示される */}
      {tpl && (
        <>
          {TEMPLATE_BLOCKS.filter((b) => blocks[b.key]).map((b) => (
            <div className="wpn-card" key={b.key}>
              <h2 className="wpn-card-title">
                {b.label}
                <span className="wpn-hint">{b.hint}</span>
              </h2>
              {b.key === "basic" ? (
                <table className="wpn-table wpn-answer-table">
                  <tbody>
                    <tr>
                      <td style={{ width: "30%" }}>
                        作業配置図<span className="wpn-req-mark">*</span>
                      </td>
                      <td>
                        <div className="wpn-radios">
                          <label>
                            <input
                              type="radio"
                              name="floorPlanMode"
                              checked={floorPlanMode === "draw"}
                              onChange={() => setFloorPlanMode("draw")}
                            />
                            作図
                          </label>
                          <label>
                            <input
                              type="radio"
                              name="floorPlanMode"
                              checked={floorPlanMode === "upload"}
                              onChange={() => setFloorPlanMode("upload")}
                            />
                            アップロード
                          </label>
                        </div>
                        {floorPlanMode === "upload" ? (
                          <div className="wpn-fileline right">
                            <button className="wpn-btn primary sm" type="button">ファイルを選択</button>
                            <span className="wpn-camera">📷</span>
                          </div>
                        ) : (
                          <div className="wpn-fileline right">
                            <button className="wpn-btn ghost sm" type="button">配置図を作図する</button>
                          </div>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td>
                        作業期間<span className="wpn-req-mark">*</span>
                      </td>
                      <td>
                        <div className="wpn-2col">
                          <DateField placeholder="作業開始日" value={start} onChange={setStart} />
                          <DateField placeholder="作業終了日" value={end} onChange={setEnd} />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              ) : b.key === "other" ? (
                <AnswerTable
                  items={tpl.other}
                  values={other}
                  onChange={(id, v) => setOther((c) => ({ ...c, [id]: v }))}
                />
              ) : (
                <div className="wpn-block-body">詳細仕様は後日設定予定です。</div>
              )}
            </div>
          ))}

          {/* 書類添付（テンプレートで登録された書類） */}
          <div className="wpn-card">
            <h2 className="wpn-card-title">
              書類添付
              <span className="wpn-hint">テンプレートで登録された書類が添付されます</span>
            </h2>
            {tpl.files?.length ? (
              <div className="wpn-filechips">
                {tpl.files.map((f) => (
                  <span className="wpn-filechip" key={f.id}>{f.name}</span>
                ))}
              </div>
            ) : (
              <div className="wpn-none">添付書類はありません</div>
            )}
            <div className="wpn-file-row">
              <button className="wpn-btn primary sm" type="button">ファイルを選択</button>
            </div>
          </div>
        </>
      )}

      {/* 承認フロー */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">承認フロー</h2>
        <select className="wpn-select" value={flowId} onChange={(e) => setFlowId(e.target.value)}>
          <option value="">承認フロー</option>
          {APPROVAL_FLOWS.map((f) => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div className="wpn-actions">{actions}</div>
    </div>
  );
}
