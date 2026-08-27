import { useNavigate } from "react-router-dom";
import { Box, Button, Drawer, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import DownloadIcon from "@mui/icons-material/FileDownloadOutlined";
import EditIcon from "@mui/icons-material/EditOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
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
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", md: 720 }, bgcolor: "background.default" } } }}
    >
      <Box sx={{ p: 1.5, borderBottom: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
        <Button
          size="small"
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          onClick={() => navigate(`/workplan-neo/plans/${plan.id}`)}
        >
          詳細ページを開く
        </Button>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          flexWrap: "wrap",
          p: 1.5,
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={onClose}>
          閉じる
        </Button>
        <Typography sx={{ fontSize: 13, fontWeight: 700 }}>作業計画書詳細</Typography>
        <Box sx={{ ml: "auto", display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button size="small" variant="outlined" startIcon={<DownloadIcon />}>
            出力
          </Button>
          <Button size="small" startIcon={<EditIcon />}>
            編集
          </Button>
          <PlanDecisionActions plan={plan} />
        </Box>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2 }}>
        <PlanDetailContent
          plan={plan}
          compact
          canSign
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
    </Drawer>
  );
}
