import { Box, Paper, Typography } from "@mui/material";

export default function WorkPlanDashboard() {
  return (
    <Box>
      <Typography variant="h2" color="text.secondary" sx={{ letterSpacing: ".04em", mb: 1.25 }}>
        作業計画書 ｜ ダッシュボード
      </Typography>
      <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderStyle: "dashed" }}>
        <Typography variant="body2" color="text.secondary">
          作業計画書ダッシュボードの作成を始めます。ここに表示する内容を順次追加していきます。
        </Typography>
      </Paper>
    </Box>
  );
}
