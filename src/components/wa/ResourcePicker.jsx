import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  InputLabel,
  ListItemText,
  MenuItem,
  OutlinedInput,
  Select,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import {
  RSV_KIND_LABEL,
  resKey,
  linkState,
  rsvTimeLabel,
  defaultTimes,
  scheduleLabel,
} from "./scheduleLinks.js";

// 作業予定フォームの「使用する資機材・ゲート」。
// 選んだ資源ごとに、その日・その協力会社の予約があるかを表示し、
// 無ければその場で予約を作成できる。
export default function ResourcePicker({
  options, // [{kind, name}] 予約表示ONの資源
  value, // [{kind, name, rsvId}]
  onChange,
  reservations,
  date,
  company,
  onCreateReservation, // (res, {start, end, vehicleType}) => 予約ID
  timeOptions,
  vehicleTypes,
  claims, // 予約ID → その予約を掴んでいる作業予定（1予約＝1予定の判定用）
  selfId, // 編集中の作業予定ID
}) {
  const [creating, setCreating] = useState(null); // 予約作成中の資源キー
  const [draft, setDraft] = useState(null);

  const selectedKeys = value.map((v) => resKey(v.kind, v.name));

  // 選択済みの並び順は保つ。選択肢から外れた資源（予約表示OFF等）は残したまま扱う。
  function handleSelect(e) {
    const keys = new Set(e.target.value);
    const isOption = (kind, name) => options.some((o) => o.kind === kind && o.name === name);
    const kept = value.filter(
      (v) => !isOption(v.kind, v.name) || keys.has(resKey(v.kind, v.name))
    );
    const added = options
      .filter(
        (o) =>
          keys.has(resKey(o.kind, o.name)) &&
          !kept.some((v) => v.kind === o.kind && v.name === o.name)
      )
      .map((o) => ({ kind: o.kind, name: o.name, rsvId: null }));
    onChange([...kept, ...added]);
    setCreating(null);
  }

  function startCreate(res) {
    setCreating(resKey(res.kind, res.name));
    setDraft({
      ...defaultTimes(timeOptions),
      vehicleType: res.kind === "gate" ? vehicleTypes[0] : "",
    });
  }
  function commitCreate(res) {
    if (draft.start >= draft.end) {
      window.alert("終了時刻は開始時刻より後にしてください。");
      return;
    }
    const rsvId = onCreateReservation(res, draft);
    onChange(
      value.map((v) => (v.kind === res.kind && v.name === res.name ? { ...v, rsvId } : v))
    );
    setCreating(null);
  }

  return (
    <Box sx={{ gridColumn: "1 / -1" }}>
      <FormControl fullWidth size="small" disabled={options.length === 0}>
        {/* 未選択でも案内文を出すため、ラベルは常に縮小表示（notched）にする */}
        <InputLabel shrink id="res-picker-label">
          使用する資機材・ゲート
        </InputLabel>
        <Select
          multiple
          labelId="res-picker-label"
          input={<OutlinedInput notched label="使用する資機材・ゲート" />}
          value={selectedKeys}
          onChange={handleSelect}
          displayEmpty
          renderValue={() =>
            options.length === 0
              ? "予約表示ONの資機材・ゲートがありません"
              : value.length === 0
              ? "使用しない"
              : value.map((v) => v.name).join("、")
          }
        >
          <MenuItem disabled value="">
            <Typography variant="caption" color="text.secondary">
              使用する資機材・ゲートを選ぶと、その日の予約と紐づきます
            </Typography>
          </MenuItem>
          {options.map((o) => {
            const key = resKey(o.kind, o.name);
            return (
              <MenuItem key={key} value={key} dense>
                <Checkbox size="small" checked={selectedKeys.includes(key)} sx={{ mr: 0.5 }} />
                <ListItemText primary={o.name} slotProps={{ primary: { sx: { fontSize: 13 } } }} />
                <Chip size="small" label={RSV_KIND_LABEL[o.kind]} sx={{ ml: 1 }} />
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>

      {value.length > 0 && (
        <Box sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 0.75 }}>
          {value.map((res) => {
            const { reservation, state, dateMismatch, owner } = linkState(
              reservations,
              { date, company, claims, selfId },
              res
            );
            const key = resKey(res.kind, res.name);
            return (
              <Box
                key={key}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1.5,
                  p: 1.25,
                  bgcolor: "action.hover",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700 }}>{res.name}</Typography>
                  <Chip size="small" label={RSV_KIND_LABEL[res.kind]} />
                  {state === "linked" ? (
                    <Chip
                      size="small"
                      color={dateMismatch ? "warning" : "primary"}
                      variant="outlined"
                      label={
                        `予約 ${rsvTimeLabel(reservation)} に紐づけ` +
                        (dateMismatch ? `（予約日 ${reservation.date}）` : "")
                      }
                    />
                  ) : state === "claimed" ? (
                    // 1つの予約に紐づけられる作業予定は1件まで
                    <>
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label={
                          `${rsvTimeLabel(reservation)} の予約は` +
                          (owner ? `「${scheduleLabel(owner)}」` : "他の作業予定") +
                          "に紐づけ済み"
                        }
                      />
                      {creating !== key && (
                        <Button size="small" startIcon={<AddIcon />} onClick={() => startCreate(res)}>
                          別の予約を作成
                        </Button>
                      )}
                    </>
                  ) : state === "nocompany" ? (
                    // 予約は会社単位で持つため、協力会社名が決まるまで照合できない
                    <Chip size="small" label="協力会社名を入力すると予約を照合します" />
                  ) : (
                    <>
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label={state === "others" ? "自社の予約なし（他社の予約あり）" : "予約なし"}
                      />
                      {creating !== key && (
                        <Button size="small" startIcon={<AddIcon />} onClick={() => startCreate(res)}>
                          予約を作成
                        </Button>
                      )}
                    </>
                  )}
                </Box>

                {creating === key && (
                  <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                    <Select
                      size="small"
                      value={draft.start}
                      onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
                    >
                      {timeOptions.map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </Select>
                    <Typography variant="body2">〜</Typography>
                    <Select
                      size="small"
                      value={draft.end}
                      onChange={(e) => setDraft((d) => ({ ...d, end: e.target.value }))}
                    >
                      {timeOptions.map((t) => (
                        <MenuItem key={t} value={t}>
                          {t}
                        </MenuItem>
                      ))}
                    </Select>
                    {res.kind === "gate" && (
                      <Select
                        size="small"
                        value={draft.vehicleType}
                        onChange={(e) => setDraft((d) => ({ ...d, vehicleType: e.target.value }))}
                      >
                        {vehicleTypes.map((v) => (
                          <MenuItem key={v} value={v}>
                            {v}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                    <Button size="small" variant="contained" onClick={() => commitCreate(res)}>
                      作成
                    </Button>
                    <Button size="small" variant="outlined" onClick={() => setCreating(null)}>
                      やめる
                    </Button>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
