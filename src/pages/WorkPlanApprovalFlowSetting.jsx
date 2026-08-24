import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/EditOutlined";

// サンプル承認フロー（申請種別ごとの承認ステップ）
const FLOWS = [
  {
    type: "作業計画書",
    steps: [
      ["1次承認", "現場代理人", "山田 太郎"],
      ["2次承認", "監理技術者", "田中 部長"],
    ],
  },
  {
    type: "承認（作業間調整）",
    steps: [
      ["1次承認", "職長", "佐藤 健"],
      ["2次承認", "現場代理人", "山田 太郎"],
    ],
  },
];

export default function WorkPlanApprovalFlowSetting() {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
        設定 ＞ 承認フロー設定
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
        <Button
          component={Link}
          to="/workplan/settings"
          size="small"
          variant="outlined"
          color="inherit"
          startIcon={<ArrowBackIcon />}
        >
          設定へ戻る
        </Button>
        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>承認フロー設定</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ my: 1.75 }}>
        申請種別ごとに承認ステップと承認者を設定します。承認は設定した順に行われます。
      </Typography>

      {FLOWS.map((flow) => (
        <Box key={flow.type} sx={{ mb: 2.75 }}>
          <Typography variant="h2" color="text.secondary" sx={{ letterSpacing: ".04em", mb: 1.25 }}>
            {flow.type}
          </Typography>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>承認ステップ</TableCell>
                  <TableCell>役割</TableCell>
                  <TableCell>承認者</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flow.steps.map(([step, role, approver]) => (
                  <TableRow key={step}>
                    <TableCell>{step}</TableCell>
                    <TableCell>{role}</TableCell>
                    <TableCell>{approver}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      <Button variant="contained" startIcon={<EditIcon />}>
        承認フローを編集
      </Button>
    </Box>
  );
}
