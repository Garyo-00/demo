import { useNavigate, useParams } from "react-router-dom";
import { Box, Button, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
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
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography sx={{ fontWeight: 700, mb: 1 }}>作業計画書が見つかりません</Typography>
        <Button onClick={() => navigate("/workplan-neo/plans")}>一覧に戻る</Button>
      </Box>
    );
  }

  // 安全指示事項は承認者が承認前に入力する（docs/workplan/02）
  const safetyEditable = role === "prime" && plan.status === "applying";

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={() => navigate("/workplan-neo/plans")}>
          一覧に戻る
        </Button>
        <Typography variant="h1">作業計画書詳細</Typography>
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>
            出力
          </Button>
          <Button size="small" startIcon={<EditIcon />}>
            編集
          </Button>
          <PlanDecisionActions plan={plan} />
        </Box>
      </Box>

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
    </Box>
  );
}
