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
import { useWpn } from "../components/wpn/WpnContext.jsx";
import { WPN_PROJECT } from "../workPlanNeoData.js";

// 発行できるQRコードの種類。needs 付きは設定でその機能がONのときだけ選べる。
const QR_KINDS = [
  {
    key: "plans",
    label: "作業計画書一覧",
    path: "/workplan-neo/plans",
    login: true,
    note: "承認済みの作業計画書を一覧から探して閲覧します",
  },
  {
    key: "sign",
    label: "打合せサイン用",
    path: "/workplan-neo/sign",
    login: false,
    note: "打合せ参加者が作業計画書を選んで手書きサインします",
    needs: "meetingSign",
  },
];

/**
 * QRコード発行。現場に掲示する用のQRを種類ごとに選び、1枚にまとめて印刷する。
 * 構成は作業間調整pro（/workadjust/qr）に合わせている。
 */
export default function WorkPlanNeoQr() {
  const navigate = useNavigate();
  const { settings } = useWpn();
  const kinds = QR_KINDS.filter((k) => !k.needs || settings[k.needs]);
  const [checked, setChecked] = useState(() => QR_KINDS.map((k) => k.key));
  const shown = kinds.filter((k) => checked.includes(k.key));

  const toggle = (key) =>
    setChecked((c) => (c.includes(key) ? c.filter((x) => x !== key) : [...c, key]));
  // 読み取り用は絶対URL（現場のスマホから開けるように）。クリックはSPA内遷移。
  const urlOf = (path) => (typeof window !== "undefined" ? window.location.origin : "") + path;

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>
        QRコード
      </Typography>

      <Box className="wpn-qr-toolbar" sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          {kinds.map((k) => (
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

      <Card className="wpn-qr-sheet">
        <CardContent sx={{ textAlign: "center", py: 4 }}>
          <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{WPN_PROJECT}</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 13, mt: 0.5 }}>
            作業計画書
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
                gridTemplateColumns: `repeat(${Math.min(shown.length, 2)}, minmax(0, 1fr))`,
                gap: 4,
                justifyItems: "center",
              }}
            >
              {shown.map((k) => (
                <Box key={k.key}>
                  <Typography sx={{ fontSize: 15, fontWeight: 700 }}>{k.label}</Typography>
                  <Typography color="text.secondary" sx={{ fontSize: 11.5, mt: 0.25 }}>
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
                    <QRCodeSVG value={urlOf(k.path)} size={220} level="M" marginSize={2} />
                  </Box>
                  <Typography color="text.secondary" sx={{ fontSize: 11.5, mt: 1 }}>
                    {k.note}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      <Typography color="text.secondary" sx={{ fontSize: 12, mt: 2 }}>
        QRを読み取る、またはクリックすると各画面へ移動します（デモ用）。チェックを外した種類は印刷されません。
      </Typography>
    </Box>
  );
}
