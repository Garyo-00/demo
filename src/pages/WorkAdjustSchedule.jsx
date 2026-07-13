import { useState } from "react";
import {
  WA_WORK_SCHEDULES,
  WA_COMPANIES,
  WA_INDUSTRIES,
  WA_JOBTYPES_BY_INDUSTRY,
  WA_FOREMEN,
  WA_HISTORY,
  WA_STATUS_LABEL,
  WA_STATUS_PILL,
  WA_PRIME_USERS,
  formatDateStr,
} from "../data.js";
import Modal from "../components/wa/Modal.jsx";
import PrintPreview from "../components/wa/PrintPreview.jsx";
import SchedulePrint from "../components/wa/SchedulePrint.jsx";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";
import printIcon from "../assets/icons/print.svg";
import {
  SuggestField,
  ReadonlyField,
  TextAreaField,
} from "../components/wa/Field.jsx";

function emptyRow(date) {
  return {
    id: "",
    date,
    status: "draft",
    company: "",
    industry: "",
    jobType: "",
    foreman: "",
    building: "",
    floor: "",
    area: "",
    zone: "",
    content: "",
    normalWorkers: 1,
    normalHours: 8,
    overtimeWorkers: 0,
    overtimeHours: 0,
    safetyNote: "",
    // 実績（元請が確定後に入力。新規作成時は未入力）
    actualNormalWorkers: null,
    actualNormalHours: null,
    actualOvertimeWorkers: null,
    actualOvertimeHours: null,
  };
}

// 各パターンの作業人数の選択肢（0〜30名）
const WORKER_OPTS = Array.from({ length: 31 }, (_, i) => i);
// 予定の合計作業人数（テーブル表示用）
function totalWorkers(r) {
  return (Number(r.normalWorkers) || 0) + (Number(r.overtimeWorkers) || 0);
}
// 実績の合計作業人数（未入力なら null）
function actualTotal(r) {
  if (r.actualNormalWorkers == null && r.actualOvertimeWorkers == null) return null;
  return (Number(r.actualNormalWorkers) || 0) + (Number(r.actualOvertimeWorkers) || 0);
}

export default function WorkAdjustSchedule() {
  const { date } = useWaSettings(); // 共通の作業日（ヘッダーで操作）
  const [rows, setRows] = useState(WA_WORK_SCHEDULES);
  const [editing, setEditing] = useState(null); // 作成/編集中の行
  const [confirmDraft, setConfirmDraft] = useState(null); // 確定ダイアログ（全未確定の下書き）
  const [actualDraft, setActualDraft] = useState(null); // 実績入力ダイアログ（全確定の下書き）
  const [seq, setSeq] = useState(WA_WORK_SCHEDULES.length);
  const [showPrint, setShowPrint] = useState(false);

  // 表示中の日付の作業予定のみ。並び順は業種を基準にする
  const dayRows = rows
    .filter((r) => r.date === date)
    .slice()
    .sort((a, b) => a.industry.localeCompare(b.industry, "ja"));

  // 確定状態の集計（確定・実績・出力は全作業共通）
  const pendingRows = dayRows.filter((r) => r.status !== "approved");
  const approvedRows = dayRows.filter((r) => r.status === "approved");
  const hasPending = pendingRows.length > 0;
  const allConfirmed = dayRows.length > 0 && !hasPending;

  function openCreate() {
    setEditing(emptyRow(date));
  }
  function openEdit(row) {
    if (row.status === "approved") return; // 確定中は編集不可（要・確定解除）
    setEditing({ ...row });
  }
  function remove(row) {
    if (row.status === "approved") return; // 確定中は削除不可
    if (window.confirm(`作業予定「${row.content || row.id}」を削除しますか？`)) {
      setRows((rs) => rs.filter((r) => r.id !== row.id));
    }
  }

  function save() {
    const row = editing;
    if (row.id) {
      setRows((rs) => rs.map((r) => (r.id === row.id ? row : r)));
    } else {
      const n = seq + 1;
      setSeq(n);
      const id = "W-" + String(n).padStart(3, "0");
      setRows((rs) => [...rs, { ...row, id, status: "pending" }]);
    }
    setEditing(null);
  }

  // 職長は協力会社から自動反映
  function setCompany(company) {
    setEditing((e) => ({ ...e, company, foreman: WA_FOREMEN[company] || "" }));
  }

  // 確定（全未確定を対象に、元請安全指示事項を入力するダイアログを開く）
  function openConfirm() {
    if (!hasPending) return;
    setConfirmDraft(
      pendingRows.map((r) => ({
        id: r.id, company: r.company, jobType: r.jobType, content: r.content,
        building: r.building, floor: r.floor, safetyNote: r.safetyNote || "",
      }))
    );
  }
  function commitConfirm() {
    const map = new Map(confirmDraft.map((d) => [d.id, d.safetyNote]));
    setRows((rs) =>
      rs.map((r) =>
        map.has(r.id) ? { ...r, status: "approved", safetyNote: map.get(r.id) } : r
      )
    );
    setConfirmDraft(null);
  }
  // 確定解除（全確定済みを未確定に戻す）
  function releaseAll() {
    const ids = new Set(approvedRows.map((r) => r.id));
    setRows((rs) => rs.map((r) => (ids.has(r.id) ? { ...r, status: "pending" } : r)));
  }
  // 実績入力（全確定済みを対象にダイアログを開く）
  function openActual() {
    setActualDraft(
      approvedRows.map((r) => ({
        id: r.id, company: r.company, jobType: r.jobType, content: r.content,
        planned: totalWorkers(r),
        actualNormalWorkers: r.actualNormalWorkers ?? 0,
        actualNormalHours: r.actualNormalHours ?? 0,
        actualOvertimeWorkers: r.actualOvertimeWorkers ?? 0,
        actualOvertimeHours: r.actualOvertimeHours ?? 0,
      }))
    );
  }
  function commitActual() {
    const map = new Map(actualDraft.map((d) => [d.id, d]));
    setRows((rs) =>
      rs.map((r) => {
        const a = map.get(r.id);
        return a
          ? {
              ...r,
              actualNormalWorkers: a.actualNormalWorkers,
              actualNormalHours: a.actualNormalHours,
              actualOvertimeWorkers: a.actualOvertimeWorkers,
              actualOvertimeHours: a.actualOvertimeHours,
            }
          : r;
      })
    );
    setActualDraft(null);
  }
  // ダイアログ内の配列アイテム更新用セッター
  const setDraftItem = (setter) => (i) => (updater) =>
    setter((d) => d.map((it, idx) => (idx === i ? updater(it) : it)));
  const setConfirmItem = setDraftItem(setConfirmDraft);
  const setActualItem = setDraftItem(setActualDraft);

  // 作業人数・工数の1パターン分の行（任意のstateに対して）
  function patternRow(obj, setObj, label, wKey, hKey) {
    return (
      <div className="wg-row" key={wKey}>
        <span className="wg-label">{label}</span>
        <label className="wg-cell">
          <small>作業人数</small>
          <select
            value={obj[wKey] ?? 0}
            onChange={(e) => setObj((x) => ({ ...x, [wKey]: Number(e.target.value) }))}
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
              value={obj[hKey] ?? 0}
              onChange={(e) => setObj((x) => ({ ...x, [hKey]: Number(e.target.value) }))}
            />
            <em>h</em>
          </span>
        </label>
      </div>
    );
  }

  return (
    <div>
      <div className="crumb">作業予定一覧</div>
      <div className="toolbar">
        <span className="subtle">{dayRows.length} 件</span>
        <button
          className="ghost-btn spacer"
          onClick={() => setShowPrint(true)}
          disabled={approvedRows.length === 0}
          title={approvedRows.length === 0 ? "確定済みの作業予定がありません" : "確定済みのみ出力します"}
        >
          <img className="ic-btn" src={printIcon} alt="" />出力
        </button>
        <button className="primary-btn" onClick={openCreate}>
          ＋ 新規作成
        </button>
      </div>

      <p className="wa-note">
        ※ 並び順は業種を基準に並べます。
        <br />
        ※ 運用フロー：職長が予定を作成 → 元請が確定（元請安全指示事項を入力）→ 元請が実績を入力。
        <br />
        ※ 確定後のレコードは「編集」で確定を解除するまで編集・削除できません。
      </p>

      {dayRows.length === 0 ? (
        <div className="empty">この日の作業予定はありません。</div>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th>ステータス</th>
                <th>協力会社名</th>
                <th>業種</th>
                <th>職種</th>
                <th>作業場所（棟/階/エリア/工区）</th>
                <th>作業内容</th>
                <th>作業人数（予定）</th>
                <th>作業人数（実績）</th>
                <th>元請安全指示事項</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {dayRows.map((r) => (
                <tr key={r.id}>
                  <td>
                    <span className={"pill " + WA_STATUS_PILL[r.status]}>
                      {WA_STATUS_LABEL[r.status]}
                    </span>
                  </td>
                  <td>{r.company}</td>
                  <td>{r.industry}</td>
                  <td>{r.jobType}</td>
                  <td className="loc-cell">
                    {r.building} / {r.floor} / {r.area} /{" "}
                    <span className="muted">{r.zone}</span>
                  </td>
                  <td>{r.content}</td>
                  <td>{totalWorkers(r)} 名</td>
                  <td>
                    {actualTotal(r) != null ? (
                      actualTotal(r) + " 名"
                    ) : (
                      <span className="subtle">—</span>
                    )}
                  </td>
                  <td>
                    {r.safetyNote ? r.safetyNote : <span className="subtle">—</span>}
                  </td>
                  <td>
                    {r.status === "approved" ? (
                      <span className="subtle">確定済</span>
                    ) : (
                      <div className="row-actions">
                        <button className="mini-btn" onClick={() => openEdit(r)}>
                          編集
                        </button>
                        <button className="mini-btn danger" onClick={() => remove(r)}>
                          削除
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* テーブル下：全作業共通の確定／確定解除／実績入力 */}
          <div className="confirm-bar">
            {allConfirmed ? (
              <>
                <button className="ghost-btn" onClick={releaseAll}>
                  確定解除
                </button>
                <button className="primary-btn big" onClick={openActual}>
                  実績入力
                </button>
              </>
            ) : (
              <button
                className="primary-btn big"
                onClick={openConfirm}
                disabled={!hasPending}
              >
                確定
              </button>
            )}
          </div>
        </>
      )}

      {/* 新規作成／編集 */}
      {editing && (
        <Modal
          wide
          title={editing.id ? "作業予定の編集" : "作業予定の新規作成"}
          onClose={() => setEditing(null)}
          footer={
            <>
              <button className="ghost-btn" onClick={() => setEditing(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={save}>
                保存
              </button>
            </>
          }
        >
          <div className="form-grid">
            <ReadonlyField
              label="日付"
              value={formatDateStr(editing.date)}
              hint="ページの日付送りで管理"
            />
            <SuggestField
              label="協力会社名"
              required
              value={editing.company}
              onChange={setCompany}
              options={WA_COMPANIES}
              hint="選択式＋自由記述（DNNの設定を参照）"
            />
            <SuggestField
              label="業種"
              value={editing.industry}
              onChange={(v) =>
                // 業種を変えたら職種はリセット（下位階層のため）
                setEditing((x) => ({ ...x, industry: v, jobType: "" }))
              }
              options={WA_INDUSTRIES}
              hint="選択式＋自由記述（上位階層）"
            />
            <SuggestField
              label="職種"
              required
              value={editing.jobType}
              onChange={(v) => setEditing((x) => ({ ...x, jobType: v }))}
              options={WA_JOBTYPES_BY_INDUSTRY[editing.industry] || []}
              hint={
                editing.industry
                  ? "選択中の業種に紐づく職種から選択＋自由記述"
                  : "先に業種を選択してください（自由記述も可）"
              }
            />
            <ReadonlyField
              label="職長"
              value={editing.foreman}
              hint="協力会社名から自動反映（DNNの設定を参照）"
            />
            <SuggestField
              label="棟"
              value={editing.building}
              onChange={(v) => setEditing((x) => ({ ...x, building: v }))}
              options={WA_HISTORY.building}
              hint="自由記述＋履歴から選択"
            />
            <SuggestField
              label="階"
              value={editing.floor}
              onChange={(v) => setEditing((x) => ({ ...x, floor: v }))}
              options={WA_HISTORY.floor}
              hint="自由記述＋履歴から選択"
            />
            <SuggestField
              label="エリア"
              value={editing.area}
              onChange={(v) => setEditing((x) => ({ ...x, area: v }))}
              options={WA_HISTORY.area}
              hint="自由記述＋履歴から選択"
            />
            <SuggestField
              label="工区"
              value={editing.zone}
              onChange={(v) => setEditing((x) => ({ ...x, zone: v }))}
              options={WA_HISTORY.zone}
              hint="自由記述＋履歴から選択"
            />
            <SuggestField
              full
              label="作業内容"
              value={editing.content}
              onChange={(v) => setEditing((x) => ({ ...x, content: v }))}
              options={WA_HISTORY.content}
              hint="自由記述＋履歴から選択"
            />
            <div className="field full">
              <label>作業人数・工数</label>
              <div className="worker-grid">
                {patternRow(editing, setEditing, "通常作業", "normalWorkers", "normalHours")}
                {patternRow(editing, setEditing, "早出・残業作業", "overtimeWorkers", "overtimeHours")}
              </div>
              <span className="hint">
                作業人数は数値の選択式、工数は数値入力（単位：h）。テーブルには合計人数（
                {totalWorkers(editing)} 名）のみ表示します（工数は非表示）。
              </span>
            </div>
            <div className="field full">
              <span className="hint">
                ※ 元請安全指示事項は、元請ユーザーが「確定」時に入力します。
              </span>
            </div>
          </div>
        </Modal>
      )}

      {/* 確定ダイアログ（全未確定を一括確定・元請安全指示事項を入力） */}
      {confirmDraft && (
        <Modal
          wide
          title="作業予定の確定"
          onClose={() => setConfirmDraft(null)}
          footer={
            <>
              <button className="ghost-btn" onClick={() => setConfirmDraft(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={commitConfirm}>
                確定する（{confirmDraft.length} 件）
              </button>
            </>
          }
        >
          <p className="subtle" style={{ marginTop: 0 }}>
            未確定の作業予定をまとめて確定します。各作業の元請安全指示事項を入力してください。
          </p>
          <div className="batch-list">
            {confirmDraft.map((d, i) => (
              <div className="batch-item" key={d.id}>
                <div className="batch-head">
                  {d.company}／{d.jobType}／{d.content}（{d.building} {d.floor}）
                </div>
                <TextAreaField
                  full
                  label="元請安全指示事項"
                  value={d.safetyNote}
                  onChange={(v) =>
                    setConfirmItem(i)((x) => ({ ...x, safetyNote: v }))
                  }
                  placeholder="確定にあたっての安全指示を記入"
                />
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* 実績入力ダイアログ（全確定済みを一括入力） */}
      {actualDraft && (
        <Modal
          wide
          title="作業人数（実績）の入力"
          onClose={() => setActualDraft(null)}
          footer={
            <>
              <button className="ghost-btn" onClick={() => setActualDraft(null)}>
                キャンセル
              </button>
              <button className="primary-btn" onClick={commitActual}>
                保存（{actualDraft.length} 件）
              </button>
            </>
          }
        >
          <p className="subtle" style={{ marginTop: 0 }}>
            確定済みの各作業について、作業人数（実績）を入力してください。
          </p>
          <div className="batch-list">
            {actualDraft.map((d, i) => (
              <div className="batch-item" key={d.id}>
                <div className="batch-head">
                  {d.company}／{d.jobType}／{d.content}（予定 {d.planned} 名）
                </div>
                <div className="worker-grid">
                  {patternRow(d, setActualItem(i), "通常作業", "actualNormalWorkers", "actualNormalHours")}
                  {patternRow(d, setActualItem(i), "早出・残業作業", "actualOvertimeWorkers", "actualOvertimeHours")}
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* 出力プレビュー（確定済みのみ） */}
      {showPrint && (
        <PrintPreview
          title="作業予定一覧 － 出力プレビュー"
          onClose={() => setShowPrint(false)}
        >
          <SchedulePrint
            date={date}
            rows={approvedRows}
            manager={WA_PRIME_USERS[0].name}
          />
        </PrintPreview>
      )}
    </div>
  );
}
