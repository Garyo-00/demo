import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  ScopedCssBaseline,
  ToggleButton,
  ToggleButtonGroup,
  Toolbar,
  Typography,
} from "@mui/material";
import { WaSettingsProvider } from "../components/wa/WaSettingsContext.jsx";
import WorkAdjustReservation from "./WorkAdjustReservation.jsx";
import { WA_PROJECT } from "../data.js";

// 資機材・ゲート予約用QRを読み取った先の予約ポータル（サイドバー無しの独立ページ）。
// デモではアカウントあり／なしのビューを切り替えられる。
// - アカウントなし：資機材・その他タブのみ・出力/確定なし（ゲスト予約）
// - アカウントあり：通常の予約画面（全タブ）
function ReservePortalInner() {
  const [account, setAccount] = useState(false);
  return (
    <ScopedCssBaseline
      sx={{ minHeight: "100vh", display: "flex", flexDirection: "column", bgcolor: "background.default" }}
    >
      <Toolbar
        component="header"
        sx={{
          bgcolor: "background.paper",
          borderBottom: "1px solid",
          borderColor: "divider",
          gap: 1.5,
          flexWrap: "wrap",
          rowGap: 1,
          py: 1.25,
        }}
      >
        <Box>
          <Typography sx={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>
            資機材・ゲート予約
          </Typography>
          <Typography sx={{ fontSize: 11 }} color="text.secondary">
            {WA_PROJECT.name}
          </Typography>
        </Box>
        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
          <Typography
            component={Link}
            to="/"
            sx={{ fontSize: 12, fontWeight: 600, color: "primary.main", textDecoration: "none" }}
          >
            ← デモ画面一覧へ戻る
          </Typography>
          <Typography sx={{ fontSize: 12 }} color="text.secondary">
            デモ表示切替：
          </Typography>
          <ToggleButtonGroup
            exclusive
            size="small"
            value={account ? "yes" : "no"}
            onChange={(_, v) => v && setAccount(v === "yes")}
            aria-label="アカウント有無の切替"
          >
            <ToggleButton value="no">アカウントなし</ToggleButton>
            <ToggleButton value="yes">アカウントあり</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Toolbar>

      <Box sx={{ flex: 1, p: 2.5, width: "100%", maxWidth: 1120, mx: "auto", boxSizing: "border-box" }}>
        <Card>
          <CardContent sx={{ p: { xs: "16px 14px", md: "22px 24px" } }}>
            <WorkAdjustReservation restrictAerial={!account} guest={!account} />
          </CardContent>
        </Card>
      </Box>
    </ScopedCssBaseline>
  );
}

export default function WorkAdjustReservePortal() {
  return (
    <WaSettingsProvider>
      <ReservePortalInner />
    </WaSettingsProvider>
  );
}
