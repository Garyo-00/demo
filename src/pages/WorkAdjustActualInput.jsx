import { useState } from "react";
import { Link } from "react-router-dom";
import {
  WA_PROJECT,
  WA_WORK_SCHEDULES,
  WA_DEFAULT_DATE,
  WA_DNN_ATTENDANCE,
  formatDateStr,
} from "../data.js";

// QR読み取り後の「作業実績入力」画面（協力会社の作業員／職長が現場で開く想定）。
// デモ用に「アカウントあり」「アカウントなし」の2ビューを切り替えられる。
// - アカウントなし：会社名を選択 → その会社の実績入力
// - アカウントあり：会社選択は省略し、ログインユーザーの会社（今回は青木工業と仮定）の実績入力
// 送信後は「ブラウザを閉じてください」の完了画面へ遷移する。

const TARGET_DATE = WA_DEFAULT_DATE; // デモは7/9固定
const WORKER_OPTS = Array.from({ length: 31 }, (_, i) => i); // 0〜30名
// アカウントありビューでログイン中と仮定する会社
const ACCOUNT_COMPANY = "青木工業";

// 対象日に作業登録のある会社（重複なし）
const COMPANIES = [
  ...new Set(
    WA_WORK_SCHEDULES.filter((w) => w.date === TARGET_DATE).map((w) => w.company)
  ),
];

function worksForCompany(company) {
  return WA_WORK_SCHEDULES.filter(
    (w) => w.date === TARGET_DATE && w.company === company
  );
}

// 通常作業／早出・残業作業 の1パターン分（予定を左に表示し、実績を入力）
function PatternRow({ label, planned, item, patch, wKey, hKey }) {
  return (
    <div className="wg-row has-planned">
      <span className="wg-label">{label}</span>
      <div className="wg-cell wg-planned">
        <small>作業人数（予定）</small>
        <span className="wg-planned-val">{planned}</span>
      </div>
      <label className="wg-cell">
        <small>作業人数（実績）</small>
        <select
          value={item[wKey] ?? 0}
          onChange={(e) => patch({ [wKey]: Number(e.target.value) })}
        >
          {WORKER_OPTS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="wg-cell">
        <small>工数</small>
        <span className="wg-hours">
          <input
            type="number"
            min="0"
            step="0.5"
            value={item[hKey] ?? 0}
            onChange={(e) => patch({ [hKey]: Number(e.target.value) })}
          />
          <em>h</em>
        </span>
      </label>
    </div>
  );
}

// 1社ぶんの実績入力フォーム（元請の実績入力画面と同じ構成を単一会社に絞ったもの）
function CompanyActualForm({ company, onSubmit, onBack }) {
  const [rows, setRows] = useState(() =>
    worksForCompany(company).map((w) => ({
      id: w.id,
      jobType: w.jobType,
      content: w.content,
      planned: Number(w.normalWorkers) || 0,
      plannedNormal: Number(w.normalWorkers) || 0,
      plannedOvertime: Number(w.overtimeWorkers) || 0,
      actualNormalWorkers: w.actualNormalWorkers ?? 0,
      actualNormalHours: w.actualNormalHours ?? 0,
      actualOvertimeWorkers: w.actualOvertimeWorkers ?? 0,
      actualOvertimeHours: w.actualOvertimeHours ?? 0,
    }))
  );
  const plannedTotal = rows.reduce((s, r) => s + r.planned, 0);
  // 入場人数：DNN連携があればその値、無ければ予定人数の合計
  const attendance = WA_DNN_ATTENDANCE[company] ?? plannedTotal;

  const patchItem = (i) => (partial) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...partial } : r)));

  return (
    <div className="ai-step">
      <div className="batch-company">
        <div className="batch-company-head">
          <span className="bc-name">{company}</span>
          <span className="bc-attend" title="DNN（出面管理）連携の入場人数">
            入場人数 <strong>{attendance}</strong> 名
          </span>
        </div>
        {rows.map((d, i) => (
          <div className="batch-item" key={d.id}>
            <div className="batch-head">
              {d.jobType}／{d.content}
            </div>
            <div className="worker-grid">
              <PatternRow
                label="通常作業"
                planned={d.plannedNormal}
                item={d}
                patch={patchItem(i)}
                wKey="actualNormalWorkers"
                hKey="actualNormalHours"
              />
              <PatternRow
                label="早出・残業作業"
                planned={d.plannedOvertime}
                item={d}
                patch={patchItem(i)}
                wKey="actualOvertimeWorkers"
                hKey="actualOvertimeHours"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="ai-actions">
        {onBack && (
          <button className="ghost-btn" onClick={onBack}>
            ← 会社を選び直す
          </button>
        )}
        <button className="primary-btn big spacer" onClick={onSubmit}>
          送信
        </button>
      </div>
    </div>
  );
}

// アカウントなし：会社選択 → 実績入力
function NoAccountView({ onSubmit }) {
  const [company, setCompany] = useState(null);

  if (!company) {
    return (
      <div className="ai-step">
        <h3 className="ai-step-title">会社名を選択してください</h3>
        <div className="ai-company-list">
          {COMPANIES.map((c) => (
            <button key={c} className="ai-company-btn" onClick={() => setCompany(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <CompanyActualForm
      company={company}
      onSubmit={onSubmit}
      onBack={() => setCompany(null)}
    />
  );
}

// アカウントあり：会社選択を省略し、ログインユーザーの会社の実績入力のみ
function WithAccountView({ onSubmit }) {
  return <CompanyActualForm company={ACCOUNT_COMPANY} onSubmit={onSubmit} />;
}

// 送信後の完了画面
function DoneScreen() {
  return (
    <div className="ai-screen">
      <div className="ai-card ai-done">
        <div className="ai-done-check" aria-hidden="true">
          ✓
        </div>
        <h1 className="ai-done-title">送信が完了しました</h1>
        <p className="ai-done-text">ブラウザ画面を閉じてください。</p>
      </div>
    </div>
  );
}

export default function WorkAdjustActualInput() {
  const [view, setView] = useState("none"); // "none" | "with"
  const [submitted, setSubmitted] = useState(false);

  if (submitted) return <DoneScreen />;

  const submit = () => setSubmitted(true);

  return (
    <div className="ai-screen">
      <div className="ai-card">
        {/* デモ用：アカウントあり／なしの切替 */}
        <div className="ai-viewswitch" role="group" aria-label="ビュー切替">
          <button
            className={"ai-seg" + (view === "with" ? " active" : "")}
            onClick={() => setView("with")}
            aria-pressed={view === "with"}
          >
            アカウントあり
          </button>
          <button
            className={"ai-seg" + (view === "none" ? " active" : "")}
            onClick={() => setView("none")}
            aria-pressed={view === "none"}
          >
            アカウントなし
          </button>
        </div>

        <div className="ai-head">
          <h1 className="ai-project">{WA_PROJECT.name}</h1>
          <h2 className="ai-title">作業実績入力</h2>
          <div className="ai-date">
            {formatDateStr(TARGET_DATE)}
            {view === "with" && <>／{ACCOUNT_COMPANY}</>}
          </div>
        </div>

        {view === "none" ? (
          <NoAccountView onSubmit={submit} />
        ) : (
          <WithAccountView onSubmit={submit} />
        )}

        <Link to="/workadjust/actual-qr" className="ai-back">
          ← QR発行画面へ戻る（デモ用）
        </Link>
      </div>
    </div>
  );
}
