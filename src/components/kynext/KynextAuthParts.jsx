import { Link } from "react-router-dom";
import { Box, Button, Container, Paper, ScopedCssBaseline, Stack, Typography } from "@mui/material";
import { KynextToasts } from "./KynextCommon.jsx";

// ===== サイドバー無しの画面（ログイン・現場選択）で共有する部品（本番 @repo/ui の LoginPaper / SiteName / Logo 相当） =====

// 画面中央に寄せる枠（本番 CenterWrapperBox）。KY-NEXT の背景色に合わせる。
export function CenterWrapper({ maxWidth = "sm", children }) {
  return (
    <ScopedCssBaseline sx={{ minHeight: "100vh", bgcolor: "#f5f6fa", display: "flex", alignItems: "center", justifyContent: "center", py: 4 }}>
      <Container maxWidth={maxWidth}>{children}</Container>
      <KynextToasts />
    </ScopedCssBaseline>
  );
}

// 中央の白い紙（本番 LoginWrapper / ProjectWrapper: padding 36px 0, text-align center）
export function CenterPaper({ children, sx }) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        p: "36px 0",
        my: "36px",
        textAlign: "center",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 1px 2px rgba(23,27,48,.06), 0 4px 14px rgba(23,27,48,.04)",
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
}

// ロゴ（本番 Logo。画像の代わりに KY の文字マーク。レイアウトの KyLogo と同じ見た目）
export function KyLogoMark({ size = 60, to = "/kynext" }) {
  return (
    <Box
      component={Link}
      to={to}
      aria-label="KY-NEXT"
      sx={{
        width: size,
        height: size,
        borderRadius: 1.5,
        bgcolor: "#1f2437",
        color: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * 0.32,
        fontWeight: 800,
        letterSpacing: ".02em",
        textDecoration: "none",
        flex: "none",
      }}
    >
      KY
    </Box>
  );
}

// サイト名とサブタイトル（本番 SiteName。title 20px bold / subTitle 13px）
export function SiteName({ title, subTitle }) {
  return (
    <Box sx={{ textAlign: "left" }}>
      <Typography component="div" sx={{ fontSize: "20px", fontWeight: "bold", lineHeight: 1.3 }}>
        {title}
      </Typography>
      <Typography component="div" sx={{ fontSize: "13px", color: "text.secondary" }}>
        {subTitle}
      </Typography>
    </Box>
  );
}

// ロゴ＋サイト名の並び（ログイン・現場選択の見出し部分）
export function BrandHeader({ title, subTitle = "建設会社様向け", logoSize = 60 }) {
  return (
    <Stack spacing={2} direction="row" sx={{ mb: 2, justifyContent: "center", alignItems: "center" }}>
      <KyLogoMark size={logoSize} />
      <SiteName title={title} subTitle={subTitle} />
    </Stack>
  );
}

// LINE のブランドアイコン（本番は /line/LINE_Brand_icon.png。画像が無いので SVG で吹き出しを描く）
function LineIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M10 2.5C5.6 2.5 2 5.4 2 9c0 3.2 2.8 5.9 6.7 6.4.3.1.6.2.7.5.1.2 0 .6 0 .9l-.1.7c0 .2-.2.8.7.4.9-.4 4.8-2.8 6.5-4.8C17.5 12.9 18 11 18 9c0-3.6-3.6-6.5-8-6.5z" fill="#fff" />
      <path d="M6.4 7.4h.9v3.2h1.6v.8H6.4V7.4zm3.2 0h.9v4h-.9v-4zm1.7 0h.9l1.6 2.5V7.4h.9v4h-.9L12.2 9v2.4h-.9v-4zm4.6 0h2.6v.8h-1.7v.8h1.7v.8h-1.7v.8h1.7v.8h-2.6v-4z" fill="#06C755" />
    </svg>
  );
}

// LINE でログイン（本番 components/Line/LoginButton/Button.tsx と同じ配色）
export function LineLoginButton({ onClick }) {
  return (
    <Button
      onClick={onClick}
      startIcon={<LineIcon />}
      sx={{
        backgroundColor: "#06C755",
        color: "#FFFFFF",
        "&:hover": { backgroundColor: "#05B34D" },
        "&:active": { backgroundColor: "#048B3C" },
      }}
    >
      LINEでログイン
    </Button>
  );
}
