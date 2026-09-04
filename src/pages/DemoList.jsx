import { Link } from "react-router-dom";
import { Box, Card, CardActionArea, CardContent, ScopedCssBaseline, Typography } from "@mui/material";

// サービスのカテゴリごとに画面をまとめる
const GROUPS = [
  {
    category: "点検",
    items: [
      { to: "/app", title: "ダッシュボード" },
      { to: "/inspection-run", title: "点検実施画面" },
      { to: "/app/machines", title: "持込機械" },
    ],
  },
  {
    category: "作業計画書",
    items: [
      { to: "/workplan-neo", title: "作業計画書NEO" },
      { to: "/workplan/output-preview", title: "作業計画書出力イメージ" },
    ],
  },
  {
    category: "巡回/パトロール",
    items: [{ to: "/patrol/records", title: "巡回パトロール一覧" }],
  },
  {
    category: "作業間調整pro",
    items: [{ to: "/workadjust", title: "作業予定一覧" }],
  },
];

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

        {GROUPS.map((g) => (
          <Box key={g.category} sx={{ mb: 4 }}>
            <Typography
              component="h2"
              sx={{ fontSize: 13, fontWeight: 700, color: "text.secondary", letterSpacing: ".04em", mb: 1.5 }}
            >
              {g.category}
            </Typography>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              }}
            >
              {g.items.map((d) => {
                const ready = d.ready !== false;
                return (
                  <Card
                    key={d.title}
                    sx={
                      ready
                        ? {
                            transition: "box-shadow .15s, transform .15s, border-color .15s",
                            "&:hover": { transform: "translateY(-2px)", borderColor: "primary.main" },
                          }
                        : { opacity: 0.55, pointerEvents: "none" }
                    }
                  >
                    {ready ? (
                      <CardActionArea component={Link} to={d.to} sx={{ height: "100%" }}>
                        <CardContent>
                          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{d.title}</Typography>
                        </CardContent>
                      </CardActionArea>
                    ) : (
                      <CardContent>
                        <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{d.title}（準備中）</Typography>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </Box>
          </Box>
        ))}

        <Typography color="text.secondary" sx={{ fontSize: 12, mt: 5 }}>
          ※ デモ用。データはすべてブラウザ上のサンプル値です。
        </Typography>
      </Box>
    </ScopedCssBaseline>
  );
}
