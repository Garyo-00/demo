import { Alert, Box, Button, ScopedCssBaseline, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { usePatrol } from "../components/patrol/PatrolContext.jsx";
import NoAccountQr from "./NoAccountQr.jsx";

// 巡回のQR発行画面。協力会社（職長）は閲覧できない。
export default function PatrolQrSheet() {
  const { role } = usePatrol();
  if (role === "prime") return <NoAccountQr />;

  return (
    <ScopedCssBaseline sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Box sx={{ maxWidth: 560, mx: "auto", p: { xs: 2, sm: "40px 24px" } }}>
        <Alert severity="warning" sx={{ fontSize: 12.5 }}>
          この画面は元請ユーザーのみ閲覧できます。
        </Alert>
        <Box sx={{ textAlign: "center", mt: 3 }}>
          <Button size="small" component={Link} to="/patrol/records" startIcon={<ArrowBackIcon />}>
            巡回パトロール一覧へ
          </Button>
        </Box>
      </Box>
    </ScopedCssBaseline>
  );
}
