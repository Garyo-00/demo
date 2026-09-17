import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlineOutlined";
import { usePatrol } from "../components/patrol/PatrolContext.jsx";
import PrimeOnly from "../components/patrol/PrimeOnly.jsx";

/**
 * 巡回/パトロール回答編集。
 * 巡回項目に対する回答（評価）の選択肢を設定する（元請のみ）。
 * 選択肢ごとに「追加入力」（回答時にコメント欄を出す）と「必須」（その入力を必須にする）を持つ。
 */
export default function PatrolAnswerSettings() {
  const { answerOptions, answerSettings, saveAnswerConfig } = usePatrol();
  const [options, setOptions] = useState(answerOptions);
  const [hearingRequired, setHearingRequired] = useState(answerSettings.hearingRequired);
  const [label, setLabel] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => setOptions(answerOptions), [answerOptions]);
  useEffect(() => setHearingRequired(answerSettings.hearingRequired), [answerSettings]);

  const name = label.trim();
  const duplicated = options.some((o) => o.label === name);

  const patch = (id, v) => setOptions((list) => list.map((o) => (o.id === id ? { ...o, ...v } : o)));
  const remove = (id) => setOptions((list) => list.filter((o) => o.id !== id));

  function add() {
    if (!name || duplicated) return;
    setOptions((list) => [...list, { id: `a${Date.now()}`, label: name, extra: true, required: false }]);
    setLabel("");
  }

  return (
    <PrimeOnly title="巡回/パトロール回答編集">
      <Card>
        <CardContent>
          <Typography color="text.secondary" sx={{ fontSize: 11.5, mb: 1 }}>
            選択肢
          </Typography>

          <Box sx={{ display: "flex", flexDirection: "column" }}>
            {options.map((o) => (
              <Box
                key={o.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  flexWrap: "wrap",
                  py: 0.75,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Typography sx={{ flex: 1, minWidth: 120, fontSize: 13 }}>{o.label}</Typography>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={o.extra}
                      // 追加入力を外すと必須も外す（入力欄が無いのに必須にはできない）
                      onChange={(e) => patch(o.id, { extra: e.target.checked, required: e.target.checked && o.required })}
                    />
                  }
                  label="追加入力"
                  slotProps={{ typography: { sx: { fontSize: 12.5 } } }}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={o.required}
                      disabled={!o.extra}
                      onChange={(e) => patch(o.id, { required: e.target.checked })}
                    />
                  }
                  label="必須"
                  slotProps={{ typography: { sx: { fontSize: 12.5 } } }}
                />
                <IconButton size="small" onClick={() => remove(o.id)} aria-label={`${o.label}を削除`}>
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Box>

          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1, mt: 2 }}>
            <TextField
              placeholder="選択肢を入力"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && add()}
              error={!!name && duplicated}
              helperText={name && duplicated ? "同じ選択肢が既にあります。" : " "}
              sx={{ width: { xs: "100%", sm: 260 } }}
            />
            <Button variant="outlined" onClick={add} disabled={!name || duplicated} sx={{ mt: 0.25 }}>
              追加
            </Button>
          </Box>

          {/* 巡回実施入力の「ヒアリング・所見」を必須にするかどうか */}
          <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid", borderColor: "divider" }}>
            <Typography color="text.secondary" sx={{ fontSize: 11.5, mb: 0.5 }}>
              ヒアリング・所見
            </Typography>
            <RadioGroup
              row
              value={hearingRequired ? "required" : "optional"}
              onChange={(e) => setHearingRequired(e.target.value === "required")}
              sx={{ gap: 2 }}
            >
              <FormControlLabel
                value="required"
                control={<Radio size="small" />}
                label="必須回答"
                slotProps={{ typography: { sx: { fontSize: 12.5 } } }}
              />
              <FormControlLabel
                value="optional"
                control={<Radio size="small" />}
                label="任意回答"
                slotProps={{ typography: { sx: { fontSize: 12.5 } } }}
              />
            </RadioGroup>
            <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>
              巡回実施時の「ヒアリング・所見」の入力を必須にするかを選びます。
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            {/* 選択肢が無いと巡回実施入力で回答できなくなるため、0件では登録させない */}
            <Button
              variant="contained"
              disabled={options.length === 0}
              onClick={() => {
                saveAnswerConfig(options, { hearingRequired });
                setToast("登録しました。");
              }}
            >
              登録
            </Button>
            {options.length === 0 && (
              <Typography color="error" sx={{ fontSize: 11.5, mt: 1 }}>
                選択肢を1つ以上登録してください。
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        message={toast}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </PrimeOnly>
  );
}
