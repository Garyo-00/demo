import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  GlobalStyles,
  ScopedCssBaseline,
  Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PrintIcon from "@mui/icons-material/PrintOutlined";
import { NO_ACCOUNT_PROJECT, QR_KINDS, pageByPath, qrTargets } from "../noAccountData.js";

/**
 * QRコード発行。現場に掲示する用のQRを種別ごとに選び、1枚にまとめて印刷する。
 * 種別は「ログイン必須」「ログイン不要」の2つで、チェックボックスで表示・非表示を切り替える。
 * 構成は作業計画書NEO（/workplan-neo/qr）に合わせている。
 */
export default function NoAccountQr() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const page = pageByPath(pathname);
  const [checked, setChecked] = useState(() => QR_KINDS.map((k) => k.key));

  if (!page) return null;
  const targets = qrTargets(page);
  const shown = targets.filter((t) => checked.includes(t.key));

  const toggle = (key) => setChecked((c) => (c.includes(key) ? c.filter((x) => x !== key) : [...c, key]));
  // 読み取り用は絶対URL（現場のスマホから開けるように）。クリックはSPA内遷移。
  const urlOf = (path) => (typeof window !== "undefined" ? window.location.origin : "") + path;

  return (
    <ScopedCssBaseline className="na-qr-root" sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* 印刷時はQRシートだけを残す（チェック列・注記・戻るリンクは出さない）。
          index.css の帳票用ルール（body *{visibility:hidden}）が全ページに掛かるため、
          この画面の要素は表示を戻したうえで用紙の先頭に寄せる。 */}
      <GlobalStyles
        styles={{
          "@media print": {
            ".na-qr-root, .na-qr-root *": { visibility: "visible" },
            ".na-qr-root": { position: "absolute", left: 0, top: 0, width: "100%", minHeight: 0 },
            ".na-qr-hide": { display: "none !important" },
          },
        }}
      />
      <Box sx={{ maxWidth: 880, mx: "auto", p: { xs: 2, sm: "40px 24px" } }}>
        <Box className="na-qr-hide" sx={{ mb: 1 }}>
          <Button size="small" component={Link} to="/" startIcon={<ArrowBackIcon />}>
            デモ画面一覧へ戻る
          </Button>
        </Box>

        <Typography component="h1" sx={{ fontSize: 18, fontWeight: 700, mb: 2 }}>
          {page.qrTitle || page.title}
        </Typography>

        <Box className="na-qr-hide" sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", mb: 2 }}>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            {QR_KINDS.map((k) => (
              <FormControlLabel
                key={k.key}
                control={<Checkbox size="small" checked={checked.includes(k.key)} onChange={() => toggle(k.key)} />}
                label={k.label}
                slotProps={{ typography: { sx: { fontSize: 13 } } }}
              />
            ))}
          </Box>
          <Button
            variant="contained"
            startIcon={<PrintIcon />}
            sx={{ ml: "auto" }}
            disabled={shown.length === 0}
            onClick={() => window.print()}
          >
            印刷
          </Button>
        </Box>

        <Card>
          <CardContent sx={{ textAlign: "center", py: 4 }}>
            <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{NO_ACCOUNT_PROJECT}</Typography>
            <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>
              {page.qrTitle || page.title}
            </Typography>

            {shown.length === 0 ? (
              <Typography color="text.secondary" sx={{ mt: 4, fontSize: 12.5 }}>
                発行するQRコードを選択してください。
              </Typography>
            ) : (
              <Box
                sx={{
                  mt: 4,
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: `repeat(${shown.length}, minmax(0, 1fr))` },
                  gap: 4,
                  justifyItems: "center",
                }}
              >
                {shown.map((t) => (
                  <Box key={t.key}>
                    <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{t.label}</Typography>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => navigate(t.path)}
                      title={`クリックで「${t.title}」の画面へ移動します`}
                      aria-label={`${t.title}の画面を開く`}
                      sx={{
                        display: "inline-block",
                        mt: 1.5,
                        p: 1.25,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 1.5,
                        bgcolor: "#fff",
                        lineHeight: 0,
                        cursor: "pointer",
                        "&:hover": { borderColor: "primary.main" },
                      }}
                    >
                      <QRCodeSVG value={urlOf(t.path)} size={220} level="M" marginSize={2} />
                    </Box>
                    <Typography color="text.secondary" sx={{ fontSize: 11.5, mt: 1 }}>
                      {t.note}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        <Typography className="na-qr-hide" color="text.secondary" sx={{ fontSize: 12, mt: 2 }}>
          QRを読み取る、またはクリックすると各画面へ移動します（デモ用）。チェックを外した種別は印刷されません。
        </Typography>
      </Box>
    </ScopedCssBaseline>
  );
}
