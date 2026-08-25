import { Link } from "react-router-dom";
import {
  Box,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  ScopedCssBaseline,
  Typography,
} from "@mui/material";

const DEMOS = [
  {
    to: "/app",
    badge: "点検",
    title: "ダッシュボード",
    ready: true,
  },
  // 旧「作業計画書 ダッシュボード」（/workplan）は一覧から外した。
  // 作業計画書NEOに置き換わったため。ルート自体は残してあるので直接URLでは開ける。
  {
    to: "/workplan-neo",
    badge: "作業計画書NEO",
    title: "作業計画書一覧・テンプレート設定",
    ready: true,
  },
  {
    to: "/workadjust",
    badge: "作業間調整pro",
    title: "作業予定一覧",
    ready: true,
  },
  {
    to: "/inspection-run",
    badge: "点検",
    title: "点検実施画面",
    ready: true,
  },
  {
    to: "/workplan/output-preview",
    badge: "作業計画書",
    title: "作業計画書出力イメージ",
    ready: true,
  },
];

// カードの中身。準備中はリンクにしないため CardActionArea の外に切り出す。
function DemoBody({ badge, title }) {
  return (
    <CardContent>
      <Chip
        size="small"
        label={badge}
        sx={{ bgcolor: "primary.light", color: "primary.main", mb: 1.25 }}
      />
      <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{title}</Typography>
    </CardContent>
  );
}

export default function DemoList() {
  return (
    <ScopedCssBaseline sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ maxWidth: 880, mx: "auto", p: "48px 24px" }}>
        <Typography component="h1" sx={{ fontSize: 24, fontWeight: 700, mb: 0.5 }}>
          デモ画面一覧
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: 14, mb: 4 }}>
          デジタル点検システムの画面デモ集。各リンクから個別のデモ画面へ移動します。
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}
        >
          {DEMOS.map((d, i) =>
            d.ready ? (
              <Card
                key={i}
                sx={{
                  transition: "box-shadow .15s, transform .15s, border-color .15s",
                  "&:hover": { transform: "translateY(-2px)", borderColor: "primary.main" },
                }}
              >
                <CardActionArea component={Link} to={d.to} sx={{ height: "100%" }}>
                  <DemoBody badge={d.badge} title={d.title} />
                </CardActionArea>
              </Card>
            ) : (
              <Card key={i} sx={{ opacity: 0.55, pointerEvents: "none" }}>
                <DemoBody badge={d.badge} title={`${d.title}（準備中）`} />
              </Card>
            )
          )}
        </Box>

        <Typography color="text.secondary" sx={{ fontSize: 12, mt: 5 }}>
          ※ デモ用。データはすべてブラウザ上のサンプル値です。
        </Typography>
      </Box>
    </ScopedCssBaseline>
  );
}
