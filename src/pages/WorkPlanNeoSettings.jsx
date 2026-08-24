import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Snackbar,
  Switch,
  Typography,
} from "@mui/material";
import SaveIcon from "@mui/icons-material/SaveOutlined";
import { useWpn } from "../components/wpn/WpnContext.jsx";

function SettingCard({ title, label, note, checked, onChange }) {
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h2" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <FormControlLabel
          control={<Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />}
          label={label}
          slotProps={{ typography: { sx: { fontSize: 13 } } }}
          sx={{ ml: 0, gap: 1.5 }}
        />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>
          {note}
        </Typography>
      </CardContent>
    </Card>
  );
}

/**
 * 現場（プロジェクト）単位の機能設定。
 * テンプレートではなく現場全体に効くため、テンプレート設定とは別画面にしている。
 */
export default function WorkPlanNeoSettings() {
  const { settings, saveSettings } = useWpn();
  const [draft, setDraft] = useState(settings);
  const [saved, setSaved] = useState(false);
  const set = (patch) => setDraft((s) => ({ ...s, ...patch }));

  function save() {
    saveSettings(draft);
    setSaved(true);
  }

  return (
    <Box>
      <Typography variant="h1" sx={{ mb: 2 }}>
        設定
      </Typography>

      <SettingCard
        title="作業計画書・指示書の元請確認"
        label="元請確認機能を利用する"
        note="有効にすると、承認済みの作業計画書・指示書に対して元請確認の操作ができるようになります。"
        checked={draft.primeConfirm}
        onChange={(v) => set({ primeConfirm: v })}
      />
      <SettingCard
        title="打合せ参加者サイン"
        label="打合せ参加者サイン機能を利用する"
        note="有効にすると、承認済みの作業計画書・指示書に対して打合せ参加者サインの操作ができるようになります。"
        checked={draft.meetingSign}
        onChange={(v) => set({ meetingSign: v })}
      />

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
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
