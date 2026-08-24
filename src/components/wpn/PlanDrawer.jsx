import { useNavigate } from "react-router-dom";
import { useWpn } from "./WpnContext.jsx";
import PlanDetailContent from "./PlanDetailContent.jsx";
import PlanDecisionActions from "./PlanDecisionActions.jsx";
import SafetyInstructionEditor from "./SafetyInstructionEditor.jsx";

// 一覧の「詳細」から開く右ドロワー。内容は詳細ページと共通。
export default function PlanDrawer({ planId, onClose }) {
  const navigate = useNavigate();
  const { getPlan, savePlan, role } = useWpn();
  const plan = getPlan(planId);
  if (!plan) return null;
  // 2ペイン（ドロワー）でも承認・否認・取下、および安全指示事項の入力ができる
  const safetyEditable = role === "prime" && plan.status === "applying";

  return (
    <>
      <div className="wpn-drawer-backdrop" onClick={onClose} />
      <aside className="wpn-drawer" role="dialog" aria-label="作業計画書詳細">
        <div className="wpn-drawer-top">
          <button
            className="wpn-btn ghost sm"
            onClick={() => navigate(`/workplan-neo/plans/${plan.id}`)}
          >
            ⧉ 詳細ページを開く
          </button>
        </div>
        <div className="wpn-drawer-head">
          <button className="wpn-linkbtn wpn-back-btn" onClick={onClose}>← 閉じる</button>
          <span className="wpn-drawer-title">作業計画書詳細</span>
          <button className="wpn-btn ghost sm">⭳ 出力</button>
        </div>
        <div className="wpn-drawer-actions">
          <button className="wpn-btn plain sm">✎ 編集</button>
          <PlanDecisionActions plan={plan} />
        </div>
        <div className="wpn-drawer-body">
          <PlanDetailContent
            plan={plan}
            compact
            safetyEditor={
              safetyEditable ? (
                <SafetyInstructionEditor
                  plan={plan}
                  onChange={(list) => savePlan({ ...plan, safetyInstructions: list })}
                />
              ) : null
            }
          />
        </div>
      </aside>
    </>
  );
}
