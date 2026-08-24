import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/PrintOutlined";
import { WA_PROJECT } from "../data.js";

// QRコード発行（元請ビューのみ）。作業予定一覧／作業実績入力／資機材・ゲート予約の
// 3種類をチェックボックスで選び、選んだぶんを1枚にまとめて掲示・印刷する。
const QR_KINDS = [
  {
    key: "schedule",
    label: "作業予定一覧",
    path: "/workadjust",
    login: true, // 読み取り後にログインが必要
  },
  {
    key: "actual",
    label: "作業実績入力",
    path: "/workadjust/actual-input",
    login: false,
  },
  {
    key: "reserve",
    label: "資機材・ゲート予約",
    path: "/workadjust/reserve",
    login: false,
  },
];

// 印刷時に隠す要素（掲示物にはQRシートだけを載せる）
const PRINT_HIDDEN = { "@media print": { display: "none" } };

export default function WorkAdjustQr() {
  const navigate = useNavigate();
  // 既定は全種類にチェック
  const [checked, setChecked] = useState(() => QR_KINDS.map((k) => k.key));
  const shown = QR_KINDS.filter((k) => checked.includes(k.key));

  function toggle(key) {
    setChecked((c) => (c.includes(key) ? c.filter((x) => x !== key) : [...c, key]));
  }
  // 読み取り用は絶対URL（現場のスマホから開けるように）。クリックはSPA内遷移。
  const urlOf = (path) =>
    (typeof window !== "undefined" ? window.location.origin : "") + path;

  return (
    // className="qr-page" は @page（A4横）指定に使うため残す
    <Box className="qr-page">
      <Box
        sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", my: 2, ...PRINT_HIDDEN }}
      >
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {QR_KINDS.map((k) => (
            <FormControlLabel
              key={k.key}
              control={
                <Checkbox
                  size="small"
                  checked={checked.includes(k.key)}
                  onChange={() => toggle(k.key)}
                />
              }
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

      <Card sx={{ "@media print": { border: 0, boxShadow: "none" } }}>
        <CardContent sx={{ textAlign: "center", py: 5 }}>
          <Typography sx={{ fontSize: 26, fontWeight: 700 }}>{WA_PROJECT.name}</Typography>
          <Typography sx={{ fontSize: 22, mt: 1.5, mb: 3.5, color: "#1e2a5a" }}>
            作業間調整pro
          </Typography>

          {shown.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4, fontSize: 13 }}>
              発行するQRコードを選択してください。
            </Typography>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                alignItems: "flex-start",
                gap: "40px 56px",
              }}
            >
              {shown.map((k) => (
                <Box key={k.key}>
                  <Typography sx={{ fontSize: 19, fontWeight: 700 }}>{k.label}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.75, mb: 2 }}>
                    （ログイン{k.login ? "必要" : "不要"}）
                  </Typography>
                  <Box
                    component="button"
                    type="button"
                    onClick={() => navigate(k.path)}
                    title={`クリックで「${k.label}」の画面へ移動します`}
                    aria-label={`${k.label}の画面を開く`}
                    sx={{
                      display: "inline-block",
                      p: 1.25,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1.5,
                      bgcolor: "background.paper",
                      lineHeight: 0,
                      cursor: "pointer",
                      "&:hover": { borderColor: "primary.main" },
                    }}
                  >
                    <QRCodeSVG value={urlOf(k.path)} size={240} level="M" marginSize={2} />
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Typography color="text.secondary" sx={{ fontSize: 13, mt: 3, ...PRINT_HIDDEN }}>
        QRを読み取る、またはクリックすると各画面へ移動します。チェックを外した種類は印刷されません。
      </Typography>
    </Box>
  );
}
