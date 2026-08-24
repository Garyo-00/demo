import { useLocation } from "react-router-dom";
import { Box, Card, CardContent, Typography } from "@mui/material";

// 未実装メニュー用の空ページ（後日実装予定）
const TITLES = {
  "/workplan-neo/plans": {
    title: "作業計画書一覧",
    desc: "職長ユーザーがテンプレートを選んで作業計画書を新規作成し、承認状況を確認する画面です。",
  },
  "/workplan-neo/floor-plan": {
    title: "作業配置図設定",
    desc: "作業計画書で使用する作業平面図を登録・管理する画面です。",
  },
  "/workplan-neo/approval-flow": {
    title: "承認フロー設定",
    desc: "承認者と承認ステップを設定する画面です。フローは複数登録でき、職長が作成時に選択します。",
  },
  "/workplan-neo/manual": {
    title: "マニュアル",
    desc: "操作マニュアルを掲載する画面です。",
  },
};

export default function WorkPlanNeoBlank() {
  const { pathname } = useLocation();
  const info = TITLES[pathname] || { title: "準備中", desc: "" };
  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>
        {info.title}
      </Typography>
      <Card>
        <CardContent sx={{ textAlign: "center", py: 8 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>この画面は後日実装予定です</Typography>
          <Typography variant="body2" color="text.secondary">
            {info.desc}
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
