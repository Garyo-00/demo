import { useNavigate, useParams } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { Box, Button, Container, GlobalStyles, ScopedCssBaseline, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/Print";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { KynextToasts } from "../../components/kynext/KynextCommon.jsx";

/**
 * KYシート単体のQRコード（本番 pages/kySheets/qrCode/index.tsx）。サイドバー無しの独立ページ。
 * 本番は表示1秒後に自動で window.print() するが、デモでは自動印刷せず「印刷」ボタンを置く。
 */
export default function KynextSheetQr() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getSheet } = useKynext();
  const sheet = getSheet(id);
  // 読み取り用は絶対URL（現場のスマホから開けるように）
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${origin}/kynext/ky-sheets/${id}`;

  return (
    <ScopedCssBaseline className="kynext-sheet-qr-root" sx={{ minHeight: "100vh", bgcolor: "#fff" }}>
      {/* 印刷は A4 縦。index.css の帳票用ルール（body *{visibility:hidden}）が全ページに掛かるため、
          この画面の要素は表示を戻したうえで用紙の先頭に寄せる。上部のボタンは出さない。 */}
      <GlobalStyles
        styles={{
          "@page": { size: "A4 portrait", margin: "10mm" },
          "@media print": {
            ".kynext-sheet-qr-root, .kynext-sheet-qr-root *": { visibility: "visible" },
            ".kynext-sheet-qr-root": { position: "absolute", left: 0, top: 0, width: "100%", minHeight: 0 },
            ".kynext-sheet-qr-toolbar": { display: "none !important" },
          },
        }}
      />
      <Container>
        <Stack className="kynext-sheet-qr-toolbar" direction="row" spacing={1} sx={{ justifyContent: "space-between", pt: 2 }}>
          <Button variant="text" startIcon={<ArrowBackIcon />} onClick={() => navigate(`/kynext/ky-sheets/${id}`)}>
            詳細に戻る
          </Button>
          <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>
            印刷
          </Button>
        </Stack>
        <Box
          sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, width: "210mm", maxWidth: "100%", height: "297mm", mx: "auto", pageBreakAfter: "always" }}
        >
          <Typography variant="h1" sx={{ fontSize: "2.5rem" }}>
            KYシート QRコード
          </Typography>
          {sheet && (
            <Typography color="text.secondary" sx={{ fontSize: 16, textAlign: "center" }}>
              {sheet.firstCompanyName}
              <br />
              {sheet.workContent}
            </Typography>
          )}
          <Box component="a" href={url} sx={{ cursor: "pointer", lineHeight: 0 }}>
            <QRCodeSVG value={url} size={280} level="M" />
          </Box>
        </Box>
      </Container>
      <KynextToasts />
    </ScopedCssBaseline>
  );
}
