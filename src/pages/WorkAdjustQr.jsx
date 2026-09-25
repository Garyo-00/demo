import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  FormControlLabel,
  Typography,
} from "@mui/material";
import PrintIcon from "@mui/icons-material/PrintOutlined";
import { WA_PROJECT } from "../data.js";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";

// QRコード発行（元請ビューのみ）。作業予定一覧／作業実績入力／資機材・ゲート予約の
// 3種類をチェックボックスで選び、選んだぶんを1枚にまとめて掲示・印刷する。
const QR_KINDS = [
  {
    key: "schedule",
    label: "作業予定一覧",
    path: "/workadjust",
    access: { view: "required", input: "required" },
  },
  {
    key: "actual",
    label: "作業実績入力",
    path: "/workadjust/actual-input",
    access: { view: "none", input: "none" },
  },
  {
    key: "reserve",
    label: "資機材・ゲート予約",
    path: "/workadjust/reserve",
    // 入力は資源種別で要否が分かれる。資機材・その他は予約権限設定の値を読んで表示する
    // （掲示物は現場ごとに印刷するため、「設定による」ではなくその現場の答えを出す）
    access: (perm) => ({
      view: "none",
      input: [
        { target: "揚重機・ゲート", level: "required" },
        { target: "資機材・その他", level: perm.other === "アカウント不要" ? "none" : "required" },
      ],
    }),
  },
];
// 種類のログイン要否。設定連動のものは関数になっている
const accessOf = (kind, perm) => (typeof kind.access === "function" ? kind.access(perm) : kind.access);

// ログイン要否の表示。必須だけ塗りつぶしにして、掲示物でも一目で区別できるようにする
const LEVEL = {
  required: { label: "ログイン必須", color: "primary", variant: "filled" },
  none: { label: "ログイン不要", color: "default", variant: "outlined" },
};
function LevelChip({ level }) {
  const l = LEVEL[level];
  return <Chip size="small" label={l.label} color={l.color} variant={l.variant} sx={{ fontWeight: 700 }} />;
}
// 「閲覧」「入力」の1行。入力が資源種別で分かれる場合は種別ごとに段を分ける
function AccessRow({ title, value }) {
  const rows = Array.isArray(value) ? value : [{ target: null, level: value }];
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: "32px 1fr", columnGap: 1, rowGap: 0.5, alignItems: "center" }}>
      <Typography sx={{ fontSize: 12.5, fontWeight: 700, color: "text.secondary" }}>{title}</Typography>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {rows.map((r, i) => (
          <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {r.target && (
              <Typography sx={{ fontSize: 12.5, minWidth: 92, textAlign: "left" }}>{r.target}</Typography>
            )}
            <LevelChip level={r.level} />
          </Box>
        ))}
      </Box>
    </Box>
  );
}

// 印刷時に隠す要素（掲示物にはQRシートだけを載せる）
const PRINT_HIDDEN = { "@media print": { display: "none" } };

export default function WorkAdjustQr() {
  const navigate = useNavigate();
  const { perm } = useWaSettings(); // 予約権限設定（資機材・その他のログイン要否に使う）
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
                <Box key={k.key} sx={{ width: 264 }}>
                  <Typography sx={{ fontSize: 19, fontWeight: 700, mb: 1.5 }}>{k.label}</Typography>
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
                  {/* ログイン要否はQRの下にまとめる。閲覧と入力で要否が違う種類があるため分けて示す */}
                  <Box
                    sx={{
                      mt: 1.5,
                      textAlign: "left",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1.5,
                      px: 1.5,
                      py: 1.25,
                      display: "flex",
                      flexDirection: "column",
                      gap: 1,
                    }}
                  >
                    <AccessRow title="閲覧" value={accessOf(k, perm).view} />
                    <AccessRow title="入力" value={accessOf(k, perm).input} />
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
