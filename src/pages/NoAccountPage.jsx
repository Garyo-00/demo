import { Link, useLocation } from "react-router-dom";
import { Box, Button, Card, CardContent, Chip, ScopedCssBaseline, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { viewByPath } from "../noAccountData.js";

// QRコードを読み取った後に開く画面（中身は後日実装）。
// ログイン必須／不要のどちらの導線から来たかを見出しに出す。
export default function NoAccountPage() {
  const { pathname } = useLocation();
  const info = viewByPath(pathname);

  return (
    <ScopedCssBaseline sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ maxWidth: 560, mx: "auto", p: { xs: 2, sm: "40px 24px" } }}>
        <Box sx={{ textAlign: "center", mb: 2.5 }}>
          <Typography component="h1" sx={{ fontSize: 18, fontWeight: 700 }}>
            {info.title}
          </Typography>
          {info.login !== null && (
            <Chip
              size="small"
              variant="outlined"
              color={info.login ? "primary" : "default"}
              label={info.login ? "ログイン必須" : "ログイン不要"}
              sx={{ mt: 1 }}
            />
          )}
        </Box>

        <Card>
          <CardContent sx={{ textAlign: "center", py: 8 }}>
            <Typography sx={{ fontWeight: 700, mb: 1 }}>この画面は後日実装予定です</Typography>
            <Typography variant="body2" color="text.secondary">
              {info.desc}
            </Typography>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button size="small" component={Link} to="/" startIcon={<ArrowBackIcon />}>
            デモ画面一覧へ戻る
          </Button>
        </Box>
      </Box>
    </ScopedCssBaseline>
  );
}
