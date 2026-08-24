import { useNavigate, useParams } from "react-router-dom";
import { useWpn } from "../components/wpn/WpnContext.jsx";
import PlanDetailContent from "../components/wpn/PlanDetailContent.jsx";
import PlanDecisionActions from "../components/wpn/PlanDecisionActions.jsx";
import SafetyInstructionEditor from "../components/wpn/SafetyInstructionEditor.jsx";

export default function WorkPlanNeoPlanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getPlan, savePlan, role } = useWpn();
  const plan = getPlan(id);

  if (!plan) {
    return (
      <div className="wpn-blank">
        <strong>作業計画書が見つかりません</strong>
        <button className="wpn-linkbtn" onClick={() => navigate("/workplan-neo/plans")}>一覧に戻る</button>
      </div>
    );
  }

  // 安全指示事項は承認者が承認前に入力する（docs/workplan/02）
  const safetyEditable = role === "prime" && plan.status === "applying";

  return (
    <div>
      <div className="wpn-detail-bar">
        <button className="wpn-linkbtn wpn-back-btn" onClick={() => navigate("/workplan-neo/plans")}>
          ← 一覧に戻る
        </button>
        <span className="wpn-detail-title">作業計画書詳細</span>
        <div className="wpn-detail-actions">
          <button className="wpn-btn ghost sm">⭳ 出力</button>
          <button className="wpn-btn plain sm">✎ 編集</button>
          <PlanDecisionActions plan={plan} />
        </div>
      </div>

      <PlanDetailContent
        plan={plan}
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
  );
}
