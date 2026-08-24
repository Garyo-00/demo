import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/SaveOutlined";
import { useWaSettings } from "../components/wa/WaSettingsContext.jsx";

// 予約時間設定の対象
const TIME_RESOURCES = [
  { key: "lift", label: "揚重機" },
  { key: "gate", label: "ゲート" },
  { key: "material", label: "資機材・その他" },
];

// 開始時間 0〜6時 / 終了時間 24〜30時（1時間単位）
const START_OPTS = [0, 1, 2, 3, 4, 5, 6];
const END_OPTS = [24, 25, 26, 27, 28, 29, 30];
const MAX_SPAN = 24; // 1日の予約可能時間は24時間まで
const fmtStart = (h) => `${h}時`;
const fmtEnd = (h) => `${h}時（翌${h - 24}時）`;

// 選択式設定（権限・種類・時間間隔）の対象と選択肢
const INTERVAL_OPTS = ["15分", "30分", "60分"];
const PERM_ROWS = [
  { key: "lift", label: "揚重機", options: ["アカウント必須"] },
  { key: "gate", label: "ゲート", options: ["アカウント必須"] },
  { key: "other", label: "資機材・その他", options: ["アカウント必須", "アカウント不要"] },
];
const INTERVAL_ROWS = [
  { key: "lift", label: "揚重機", options: INTERVAL_OPTS },
  { key: "gate", label: "ゲート", options: INTERVAL_OPTS },
  { key: "other", label: "資機材・その他", options: INTERVAL_OPTS },
];

// 設定1行（ラベル＋入力）の共通レイアウト
function SettingRow({ label, children, last }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "120px 1fr" },
        gap: { xs: 1, sm: 1.75 },
        alignItems: { xs: "start", sm: "center" },
        py: 2,
        borderBottom: last ? 0 : "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{label}</Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
        {children}
      </Box>
    </Box>
  );
}

// 選択式設定の共通表示（揚重機・ゲートは選択肢1つ＝固定、その他は選択式）
function ChoiceSettings({ rows, values, onChange }) {
  return (
    <Card sx={{ mt: 1.75, maxWidth: 640 }}>
      <CardContent sx={{ py: 0.75 }}>
        {rows.map((r, i) => {
          const fixed = r.options.length === 1;
          return (
            <SettingRow key={r.key} label={r.label} last={i === rows.length - 1}>
              {fixed ? (
                <>
                  <Typography
                    sx={{
                      border: "1px solid",
                      borderColor: "divider",
                      bgcolor: "action.hover",
                      color: "text.secondary",
                      borderRadius: 2,
                      px: 1.5,
                      py: 1,
                      fontSize: 13,
                    }}
                  >
                    {r.options[0]}
                  </Typography>
                  <Typography sx={{ fontSize: 12, fontWeight: 600, color: "primary.main" }}>
                    固定
                  </Typography>
                </>
              ) : (
                <TextField
                  select
                  size="small"
                  value={values[r.key]}
                  onChange={(e) => onChange(r.key, e.target.value)}
                  sx={{ minWidth: 180 }}
                >
                  {r.options.map((o) => (
                    <MenuItem key={o} value={o}>
                      {o}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </SettingRow>
          );
        })}
      </CardContent>
    </Card>
  );
}

export default function WorkAdjustSettings() {
  const { time, setTime, perm, setPerm, interval, setInterval } = useWaSettings();
  const [tab, setTab] = useState("time");
  const [saved, setSaved] = useState(false);

  function switchTab(t) {
    setSaved(false);
    setTab(t);
  }
  function setTimeStart(key, start) {
    setSaved(false);
    setTime((s) => ({ ...s, [key]: { start, end: Math.min(s[key].end, start + MAX_SPAN) } }));
  }
  function setTimeEnd(key, end) {
    setSaved(false);
    setTime((s) => ({ ...s, [key]: { ...s[key], end } }));
  }
  function setChoice(setter) {
    return (key, val) => {
      setSaved(false);
      setter((s) => ({ ...s, [key]: val }));
    };
  }
  const save = () => setSaved(true);

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 1.75 }}>
        予約設定
      </Typography>

      <Tabs
        value={tab}
        onChange={(_, v) => switchTab(v)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ borderBottom: "1px solid", borderColor: "divider" }}
      >
        <Tab value="time" label="予約時間設定" />
        <Tab value="auth" label="予約権限設定" />
        <Tab value="interval" label="予約時間間隔設定" />
      </Tabs>

      {tab === "time" && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
            ※ 各対象の1日の予約可能時間を1時間単位で設定します。開始は0〜6時、終了は24〜30時（翌0〜6時）。
            <br />※ 予約可能時間が<strong>24時間を超える設定はできません</strong>（終了時間の選択肢が自動で制限されます）。
          </Typography>
          <Card sx={{ mt: 1.75, maxWidth: 640 }}>
            <CardContent sx={{ py: 0.75 }}>
              {TIME_RESOURCES.map((r, i) => {
                const { start, end } = time[r.key];
                const endOpts = END_OPTS.filter((e) => e - start <= MAX_SPAN);
                return (
                  <SettingRow key={r.key} label={r.label} last={i === TIME_RESOURCES.length - 1}>
                    <TextField
                      select
                      size="small"
                      label="開始"
                      value={start}
                      onChange={(e) => setTimeStart(r.key, Number(e.target.value))}
                      sx={{ minWidth: 110 }}
                    >
                      {START_OPTS.map((h) => (
                        <MenuItem key={h} value={h}>
                          {fmtStart(h)}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Typography color="text.secondary">〜</Typography>
                    <TextField
                      select
                      size="small"
                      label="終了"
                      value={end}
                      onChange={(e) => setTimeEnd(r.key, Number(e.target.value))}
                      sx={{ minWidth: 150 }}
                    >
                      {endOpts.map((h) => (
                        <MenuItem key={h} value={h}>
                          {fmtEnd(h)}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Typography sx={{ fontSize: 12, fontWeight: 600, color: "primary.main" }}>
                      予約可能 {end - start} 時間
                    </Typography>
                  </SettingRow>
                );
              })}
            </CardContent>
          </Card>
        </>
      )}

      {tab === "auth" && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
            ※ 予約時のアカウント要否を設定します。揚重機・ゲートは「アカウント必須」で固定です。
          </Typography>
          <ChoiceSettings rows={PERM_ROWS} values={perm} onChange={setChoice(setPerm)} />
        </>
      )}

      {tab === "interval" && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
            ※ 予約枠の時間間隔を設定します（15分／30分／60分）。
          </Typography>
          <ChoiceSettings rows={INTERVAL_ROWS} values={interval} onChange={setChoice(setInterval)} />
        </>
      )}

      <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={save}>
          保存
        </Button>
      </Box>

      <Snackbar
        open={saved}
        autoHideDuration={2500}
        onClose={() => setSaved(false)}
        message="設定を保存しました"
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
}
