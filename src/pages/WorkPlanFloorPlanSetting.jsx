import { Link } from "react-router-dom";
import {
  Box,
  Button,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";

// サンプル登録済み平面図
const PLANS = [
  ["FP-001", "1階 躯体工事エリア", "A工区", "2026-05-20", "公開"],
  ["FP-002", "2階 配筋エリア", "B工区", "2026-05-24", "公開"],
  ["FP-003", "地下 山留エリア", "C工区", "2026-05-28", "下書き"],
];

export default function WorkPlanFloorPlanSetting() {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75 }}>
        設定 ＞ 作業平面図登録
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
        <Typography sx={{ fontSize: 15, fontWeight: 700 }}>作業平面図登録</Typography>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ my: 1.75 }}>
        作業エリアの平面図を登録します。登録した平面図は作業計画書の作成時に選択できます。
      </Typography>

      <Box sx={{ my: 1.5 }}>
        <Button variant="contained" startIcon={<AddIcon />}>
          平面図を登録
        </Button>
      </Box>

      <TableContainer component={Paper} variant="outlined">
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>図面番号</TableCell>
              <TableCell>平面図名</TableCell>
              <TableCell>対象工区</TableCell>
              <TableCell>登録日</TableCell>
              <TableCell>状態</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {PLANS.map(([id, name, area, date, status]) => (
              <TableRow key={id}>
                <TableCell>{id}</TableCell>
                <TableCell>{name}</TableCell>
                <TableCell>{area}</TableCell>
                <TableCell>{date}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={status}
                    sx={(t) => {
                      const c = status === "公開" ? t.palette.success.main : t.palette.warning.main;
                      return { bgcolor: alpha(c, 0.12), color: c };
                    }}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
