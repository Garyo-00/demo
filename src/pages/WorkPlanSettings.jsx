import { Link } from "react-router-dom";
import { Box, Card, CardActionArea, CardContent, Typography } from "@mui/material";

const ITEMS = [
  {
    to: "/workplan/settings/floor-plan",
    title: "作業平面図登録",
    desc: "作業エリアの平面図を登録・管理します。",
  },
  {
    to: "/workplan/settings/approval-flow",
    title: "承認フロー設定",
    desc: "申請の承認ステップと承認者を設定します。",
  },
];

export default function WorkPlanSettings() {
  return (
    <Box>
      <Typography variant="h2" color="text.secondary" sx={{ letterSpacing: ".04em", mb: 1.25 }}>
        設定
      </Typography>
      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
        {ITEMS.map((it) => (
          <Card key={it.to} sx={{ "&:hover": { borderColor: "primary.main" } }}>
            <CardActionArea component={Link} to={it.to} sx={{ height: "100%" }}>
              <CardContent>
                <Typography sx={{ fontSize: 16, fontWeight: 700, mb: 0.75 }}>{it.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                  {it.desc}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
