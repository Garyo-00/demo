import { useState } from "react";
import { PLAN_STATUS, machineById } from "../../workPlanNeoPlanData.js";
import { useWpn } from "./WpnContext.jsx";
import { AnswerTable } from "./AnswerField.jsx";

export function StatusBadge({ status }) {
  const s = PLAN_STATUS[status] || PLAN_STATUS.applying;
  return <span className={"wpn-status " + s.cls}>{s.label}</span>;
}

/**
 * 作業計画書の詳細本文。詳細ページとドロワーで共用する。
 * compact=true でドロワー向けの詰めたレイアウトになる。
 */
export default function PlanDetailContent({ plan, compact = false, safetyEditor = null }) {
  const { getTemplate } = useWpn();
  const tpl = getTemplate(plan.templateId);
  const [workTab, setWorkTab] = useState(0);
  const machines = plan.machineIds.map(machineById).filter(Boolean);
  const blocks = tpl?.blocks || {};

  return (
    <div className={"wpn-detail" + (compact ? " compact" : "")}>
      {/* 基本情報 */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">基本情報</h2>
        <table className="wpn-kv">
          <tbody>
            <tr>
              <th>作業計画書名</th>
              <td>{plan.name}</td>
            </tr>
            <tr>
              <th>テンプレート</th>
              <td>{plan.templateName}</td>
            </tr>
            <tr>
              <th>開始日時</th>
              <td>{plan.start}</td>
            </tr>
            <tr>
              <th>終了日時</th>
              <td>{plan.end}</td>
            </tr>
            <tr>
              <th>申請者</th>
              <td>{plan.applicant}</td>
            </tr>
            <tr>
              <th>作成者</th>
              <td>{plan.author}</td>
            </tr>
            <tr>
              <th>申請ステータス</th>
              <td>
                <StatusBadge status={plan.status} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* 使用機材一覧 */}
      <div className="wpn-card">
        <div className="wpn-card-head">
          <h2 className="wpn-card-title">使用機材一覧（{machines.length}台）</h2>
          <button className="wpn-linkbtn wpn-edit-link" type="button">✎ 編集</button>
        </div>
        <table className="wpn-table">
          <thead>
            <tr>
              <th>機械名</th>
              <th style={{ width: "28%" }}>現場内呼称</th>
              <th style={{ width: "22%" }}>カテゴリ</th>
            </tr>
          </thead>
          <tbody>
            {machines.length === 0 && (
              <tr>
                <td colSpan={3} className="wpn-empty">使用機材は登録されていません。</td>
              </tr>
            )}
            {machines.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.alias}</td>
                <td>{m.category}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 作業計画書の内容 */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">作業計画書の内容</h2>

        <div className="wpn-subcard">
          <div className="wpn-sub-title">共通項目</div>
          <AnswerTable
            items={tpl?.common}
            values={plan.common}
            readOnly
            leadingRow={
              blocks.floorPlan ? (
                <tr>
                  <td>
                    作業配置図<span className="wpn-req-mark">*</span>
                  </td>
                  <td>
                    <button className="wpn-btn ghost sm" type="button">図面を表示</button>
                  </td>
                  <td className="wpn-note-cell">備考</td>
                </tr>
              ) : null
            }
          />
        </div>

        <div className="wpn-subcard">
          <div className="wpn-sub-title">作業内容</div>
          <div className="wpn-tabs">
            {plan.works.map((w, i) => (
              <button
                key={w.id}
                className={"wpn-tab" + (i === workTab ? " active" : "")}
                onClick={() => setWorkTab(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <AnswerTable items={tpl?.work} values={plan.works[workTab]?.values} readOnly />
        </div>

        {blocks.craneAuto && (
          <div className="wpn-subcard">
            <div className="wpn-sub-title">クレーンの自動入力</div>
            <div className="wpn-block-body">クレーン諸元から自動入力された値を表示します。</div>
          </div>
        )}
        {blocks.meetingSign && (
          <div className="wpn-subcard">
            <div className="wpn-sub-title">打合せ参加者サイン</div>
            <div className="wpn-block-body">参加者のサインを表示します。</div>
          </div>
        )}
      </div>

      {/* 安全指示事項（テンプレートでONのときのみ。承認時に元請が入力） */}
      {blocks.safetyInstruction && safetyEditor}
      {blocks.safetyInstruction && !safetyEditor && (
        <div className="wpn-card">
          <h2 className="wpn-card-title">
            安全指示事項
            <span className="wpn-hint">承認時に元請が作業内容ごとに入力します</span>
          </h2>
          {plan.safetyInstructions?.length ? (
            plan.safetyInstructions.map((si, i) => (
              <div className="wpn-si" key={si.id}>
                <div className="wpn-si-head">
                  <span className="wpn-si-no">No.{i + 1}</span>
                  <span className="wpn-si-work">{si.workLabel || "作業内容未選択"}</span>
                  <span className="wpn-si-meta">
                    最終更新：{si.updatedAt} {si.updatedBy}
                  </span>
                </div>
                <div className="wpn-si-text">{si.text}</div>
              </div>
            ))
          ) : (
            <div className="wpn-none">安全指示事項は入力されていません</div>
          )}
        </div>
      )}

      {/* 添付書類 */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">添付書類</h2>
        {plan.files.length === 0 ? (
          <div className="wpn-none">添付書類はありません</div>
        ) : (
          <div className="wpn-filechips">
            {plan.files.map((f) => (
              <span className="wpn-filechip" key={f.id}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 16V4m0 0L8 8m4-4 4 4" />
                  <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
                </svg>
                {f.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* チェックリスト */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">チェックリスト</h2>
        {plan.checklistResults?.length ? (
          <table className="wpn-table">
            <thead>
              <tr>
                <th>チェックリスト</th>
                <th style={{ width: "22%" }}>実施者</th>
                <th style={{ width: "22%" }}>実施日時</th>
              </tr>
            </thead>
            <tbody>
              {plan.checklistResults.map((r, i) => (
                <tr key={i}>
                  <td>{r.name}</td>
                  <td>{r.by}</td>
                  <td>{r.at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="wpn-none">実施されたチェックリストはありません</div>
        )}
      </div>

      {/* メモ */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">メモ</h2>
        {plan.memo ? <div className="wpn-memo">{plan.memo}</div> : <div className="wpn-none">メモはありません</div>}
      </div>

      {/* 承認フロー */}
      <div className="wpn-card">
        <h2 className="wpn-card-title">承認フロー</h2>
        {plan.approvals.map((step) => (
          <div className="wpn-step" key={step.no}>
            <div className="wpn-step-head">
              <span className="wpn-step-no">{step.no}</span>
              ステップ {step.no}
              <StatusBadge status={step.status} />
            </div>
            <div className="wpn-step-group">{step.group}</div>
            <table className="wpn-table">
              <thead>
                <tr>
                  <th style={{ width: "18%" }}>決裁日</th>
                  <th>決裁者</th>
                  <th style={{ width: "18%" }}>決裁状況</th>
                  <th style={{ width: "24%" }}>コメント</th>
                </tr>
              </thead>
              <tbody>
                {step.rows.map((r, i) => (
                  <tr key={i}>
                    <td>{r.date || "-"}</td>
                    <td>{r.approver}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td>{r.comment || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
