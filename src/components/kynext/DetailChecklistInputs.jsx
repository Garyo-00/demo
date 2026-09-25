import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  IconButton,
  Stack,
  TextField,
  ToggleButton,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import ClearIcon from "@mui/icons-material/Clear";
import { PHOTO_C, isItemVisible, newId } from "../../kynextData.js";
import { RequiredMark } from "./KynextCommon.jsx";

// ===== チェックリスト（職長チェックリスト・作業員チェックリスト）の入力部品 =====
// 本番 features/kySheet/checklist/components/* を useState ベースで再現する。
// 回答値の形は基本情報と同じ:
//   ButtonSelection → { id, text } | null、CheckboxSelection → [{ id, text }]、
//   NumberPicker/Number → 数値 | null、Text/HourMinutes/Date → 文字列、File → [{ id, name, path }]

const ERROR_COLOR = "#FF1943";
const TEXT_MAX = 100;

// 項目タイプごとの初期値
export const initialValueOf = (item) => {
  switch (item.type) {
    case "ButtonSelection":
      return null;
    case "CheckboxSelection":
      return [];
    case "NumberPicker": {
      const dv = item.settings?.numberPickerSettings?.defaultValue;
      return dv != null && dv !== "" ? Number(dv) : null;
    }
    case "Number": {
      const dv = item.settings?.numberSettings?.defaultValue;
      return dv != null && dv !== "" ? Number(dv) : null;
    }
    case "File":
      return [];
    default:
      return "";
  }
};

// カタログの itemGroups から入力 state の初期値を組み立てる
export const initChecklistValues = (itemGroups = []) => {
  const values = {};
  const notUse = {};
  itemGroups.forEach((g) => {
    if (g.optional) notUse[g.id] = false;
    (g.items ?? []).forEach((item) => {
      values[item.id] = initialValueOf(item);
    });
  });
  return { values, notUse };
};

const isEmptyValue = (item, v) => {
  if (v == null) return true;
  if (item.type === "CheckboxSelection" || item.type === "File") return !Array.isArray(v) || v.length === 0;
  if (typeof v === "string") return v.trim() === "";
  return false;
};

/**
 * 必須・文字数・時刻形式のチェック（本番 createWorkerChecklistSchema / zod スキーマ相当）。
 * 戻り値は { itemId: メッセージ }。条件付き項目は条件を満たしているときだけ、該当なしのグループは対象外。
 */
export const validateChecklistValues = (itemGroups = [], values = {}, notUse = {}) => {
  const errors = {};
  itemGroups.forEach((g) => {
    if (g.optional && notUse[g.id]) return;
    (g.items ?? []).forEach((item) => {
      if (!isItemVisible(item, values)) return;
      const v = values[item.id];
      const required = !item.optional;
      if (required && isEmptyValue(item, v)) {
        errors[item.id] = item.type === "ButtonSelection" || item.type === "CheckboxSelection" || item.type === "NumberPicker" ? "選択してください" : "入力してください";
        return;
      }
      if (item.type === "Text" && typeof v === "string" && v.length > TEXT_MAX) {
        errors[item.id] = `${TEXT_MAX}文字以下で入力してください`;
        return;
      }
      if (item.type === "HourMinutes" && v && !/^([01]\d|2[0-3]):[0-5]\d$/.test(v)) {
        errors[item.id] = "HH:MM の形式で入力してください";
        return;
      }
      // 選択肢の自由記述（textRequired）
      const selectedList = item.type === "ButtonSelection" ? (v ? [v] : []) : item.type === "CheckboxSelection" ? v ?? [] : [];
      for (const sel of selectedList) {
        const opt = item.options?.find((o) => o.id === sel.id);
        if (opt?.hasText && opt.textRequired && !sel.text?.trim()) {
          errors[item.id] = "入力してください";
          return;
        }
        if (opt?.hasText && (sel.text?.length ?? 0) > TEXT_MAX) {
          errors[item.id] = `${TEXT_MAX}文字以下で入力してください`;
          return;
        }
      }
    });
  });
  return errors;
};

// ---------- 各タイプの入力 ----------

// 単一選択（本番 ButtonSelection）。hasText の選択肢を選ぶと横にテキスト欄が出る
export function ButtonSelectionInput({ item, value, error, onChange }) {
  const selected = value ?? null;
  return (
    <FormControl fullWidth error={!!error}>
      <Stack spacing={1} sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {item.options?.map((option) => {
            const isSelected = selected?.id === option.id;
            const textError = isSelected && ((selected.text?.length ?? 0) > TEXT_MAX || (!!option.textRequired && !selected.text && !!error));
            return (
              <Stack key={option.id} direction="row" spacing={2} sx={[{ alignItems: "center" }, option.hasText ? { width: "100%" } : undefined]}>
                <ToggleButton
                  value={option.id}
                  selected={isSelected}
                  onChange={() => {
                    if (isSelected) {
                      // 必須項目は選択解除させない
                      if (!item.optional) return;
                      onChange(null);
                    } else {
                      onChange({ id: option.id, text: "" });
                    }
                  }}
                  sx={{
                    minWidth: 80,
                    overflow: "hidden",
                    whiteSpace: "normal",
                    wordBreak: "break-word",
                    height: "auto",
                    textAlign: "left",
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    "&.Mui-selected": { bgcolor: "primary.light", color: "primary.main", borderColor: "primary.main" },
                  }}
                >
                  {option.name}
                </ToggleButton>
                {option.hasText && (
                  <>
                    {(option.textLabel || option.textRequired) && (
                      <Typography component="span" variant="body2" sx={{ maxWidth: "30%", color: isSelected ? "text.primary" : "text.disabled" }}>
                        {option.textLabel}
                        {option.textRequired && <RequiredMark disabled={!isSelected} />}
                      </Typography>
                    )}
                    <TextField
                      size="small"
                      sx={{ flex: 1, minWidth: 80 }}
                      disabled={!isSelected}
                      required={option.textRequired}
                      error={textError}
                      helperText={isSelected && (selected.text?.length ?? 0) > TEXT_MAX ? `${TEXT_MAX}文字以下で入力してください` : textError ? "入力してください" : undefined}
                      value={isSelected ? selected.text ?? "" : ""}
                      onChange={(e) => onChange({ ...selected, text: e.target.value })}
                    />
                  </>
                )}
              </Stack>
            );
          })}
        </Box>
        {error && !selected && (
          <Typography variant="caption" sx={{ color: ERROR_COLOR, fontWeight: "bold" }}>
            {error}
          </Typography>
        )}
      </Stack>
    </FormControl>
  );
}

// 複数選択（本番 CheckboxSelection）
export function CheckboxSelectionInput({ item, value, error, onChange }) {
  const selectedValues = Array.isArray(value) ? value : [];
  return (
    <FormControl fullWidth>
      <FormGroup sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          {item.options?.map((option) => {
            const selectedItem = selectedValues.find((v) => v.id === option.id);
            const isChecked = !!selectedItem;
            const textError = isChecked && ((selectedItem.text?.length ?? 0) > TEXT_MAX || (!!option.textRequired && !selectedItem.text && !!error));
            return (
              <Stack key={option.id} direction="row" spacing={1.5} sx={[{ alignItems: "center" }, option.hasText ? { width: "100%" } : undefined]}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) onChange([...selectedValues, { id: option.id, text: "" }]);
                        else onChange(selectedValues.filter((v) => v.id !== option.id));
                      }}
                    />
                  }
                  label={option.name}
                  sx={{ minWidth: 80, ...(option.hasText && { maxWidth: "35%" }), mr: 0, "& .MuiFormControlLabel-label": { wordBreak: "break-word" } }}
                />
                {option.hasText && (
                  <>
                    {(option.textLabel || option.textRequired) && (
                      <Typography component="span" variant="body2" sx={{ maxWidth: "30%", color: isChecked ? "text.secondary" : "text.disabled" }}>
                        {option.textLabel}
                        {option.textRequired && <RequiredMark disabled={!isChecked} />}
                      </Typography>
                    )}
                    <TextField
                      size="small"
                      sx={{ flex: 1, minWidth: 0 }}
                      disabled={!isChecked}
                      required={option.textRequired}
                      error={textError}
                      helperText={isChecked && (selectedItem.text?.length ?? 0) > TEXT_MAX ? `${TEXT_MAX}文字以下で入力してください` : textError ? "入力してください" : undefined}
                      value={selectedItem?.text || ""}
                      onChange={(e) => onChange(selectedValues.map((v) => (v.id === option.id ? { ...v, text: e.target.value } : v)))}
                    />
                  </>
                )}
              </Stack>
            );
          })}
        </Box>
      </FormGroup>
      {error && selectedValues.length === 0 && (
        <Typography variant="caption" sx={{ color: ERROR_COLOR, fontWeight: "bold" }}>
          {error}
        </Typography>
      )}
    </FormControl>
  );
}

// 自由記述（本番 TextAnswer）
export function TextAnswerInput({ value, error, onChange }) {
  return (
    <FormControl fullWidth>
      <TextField size="small" value={value ?? ""} onChange={(e) => onChange(e.target.value)} error={!!error} helperText={error || ""} />
    </FormControl>
  );
}

// 時刻（本番 HourMinutes）。デモでは type="time" で入力する
export function HourMinutesInput({ value, error, onChange }) {
  return (
    <FormControl fullWidth>
      <TextField
        type="time"
        size="small"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        error={!!error}
        helperText={error || ""}
        placeholder="HH:MM"
        sx={{ width: 160 }}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </FormControl>
  );
}

// 日付（本番 DateAnswer）
export function DateAnswerInput({ value, error, onChange }) {
  return (
    <FormControl fullWidth>
      <TextField type="date" size="small" sx={{ width: 200 }} value={value ?? ""} onChange={(e) => onChange(e.target.value)} error={!!error} helperText={error || ""} slotProps={{ inputLabel: { shrink: true } }} />
    </FormControl>
  );
}

// 数値選択（本番 NumberPickerSelection）。−/＋ ボタンで min〜max を step 刻みで選ぶ
export function NumberPickerInput({ settings = {}, value, error, onChange }) {
  const min = settings.min ?? 0;
  const max = settings.max ?? 100;
  const decimalPlaces = settings.decimalPlaces ?? 0;
  const step = settings.step ?? 10 ** -decimalPlaces;
  const round = (n) => Number(n.toFixed(decimalPlaces));
  const current = value == null || value === "" ? null : Number(value);
  const dec = () => onChange(current == null ? min : Math.max(min, round(current - step)));
  const inc = () => onChange(current == null ? min : Math.min(max, round(current + step)));
  return (
    <FormControl fullWidth error={!!error}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <IconButton size="small" onClick={dec} disabled={current != null && current <= min} sx={{ border: "1px solid", borderColor: "divider" }} aria-label="減らす">
          <RemoveIcon fontSize="small" />
        </IconButton>
        <TextField
          size="small"
          value={current == null ? "" : current.toFixed(decimalPlaces)}
          placeholder="選択してください"
          error={!!error}
          onChange={(e) => {
            const v = e.target.value;
            if (v === "") return onChange(null);
            const n = Number(v);
            if (!Number.isNaN(n)) onChange(Math.min(max, Math.max(min, n)));
          }}
          sx={{ width: 120, "& input": { textAlign: "center" } }}
          slotProps={{ htmlInput: { inputMode: "decimal" } }}
        />
        <IconButton size="small" onClick={inc} disabled={current != null && current >= max} sx={{ border: "1px solid", borderColor: "divider" }} aria-label="増やす">
          <AddIcon fontSize="small" />
        </IconButton>
        {settings.unit && <Typography variant="body2">{settings.unit}</Typography>}
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </FormControl>
  );
}

// 数値入力（本番 ChecklistNumberInput）
export function NumberAnswerInput({ settings = {}, value, error, onChange }) {
  return (
    <FormControl fullWidth>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <TextField
          type="number"
          size="small"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          error={!!error}
          sx={{ flex: 1 }}
          slotProps={{ htmlInput: { min: settings.min ?? undefined, max: settings.max ?? undefined, step: settings.decimalPlaces ? 10 ** -settings.decimalPlaces : 1 } }}
        />
        {settings.unit && <Typography variant="body2">{settings.unit}</Typography>}
      </Box>
      {error && <FormHelperText error>{error}</FormHelperText>}
    </FormControl>
  );
}

// 画像添付（本番 ChecklistItemFileField）。デモでは「撮影」でダミー画像を添付する
export function FileAnswerInput({ value, error, onChange }) {
  const files = Array.isArray(value) ? value : [];
  return (
    <FormControl fullWidth>
      <Stack spacing={1}>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          {files.map((f) => (
            <Box key={f.id} sx={{ position: "relative", display: "inline-block" }}>
              <Box component="img" src={f.path} alt={f.name} sx={{ width: 96, height: 96, objectFit: "cover", borderRadius: 1, display: "block" }} />
              <IconButton
                size="small"
                onClick={() => onChange(files.filter((x) => x.id !== f.id))}
                sx={{ position: "absolute", top: 2, right: 2, bgcolor: "rgba(0,0,0,.5)", color: "#fff", p: "2px", "&:hover": { bgcolor: "rgba(0,0,0,.7)" } }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Box>
          ))}
        </Stack>
        <Box>
          <Button variant="outlined" size="small" startIcon={<PhotoCameraIcon />} onClick={() => onChange([...files, { id: newId(), name: `photo_${files.length + 1}.jpg`, path: PHOTO_C }])}>
            撮影
          </Button>
        </Box>
        {error && <FormHelperText error>{error}</FormHelperText>}
      </Stack>
    </FormControl>
  );
}

// ---------- 項目・グループ ----------

// 1項目（本番 ChecklistItem）: 項目名＋必須マーク｜入力部品。参考画像があれば「(参考画像)」で拡大表示
export function ChecklistItemInput({ item, value, error, onChange, isMobile }) {
  const [previewSrc, setPreviewSrc] = useState(null);
  const input = (() => {
    switch (item.type) {
      case "ButtonSelection":
        return <ButtonSelectionInput item={item} value={value} error={error} onChange={onChange} />;
      case "CheckboxSelection":
        return <CheckboxSelectionInput item={item} value={value} error={error} onChange={onChange} />;
      case "HourMinutes":
        return <HourMinutesInput value={value} error={error} onChange={onChange} />;
      case "Date":
        return <DateAnswerInput value={value} error={error} onChange={onChange} />;
      case "NumberPicker":
        return <NumberPickerInput settings={item.settings?.numberPickerSettings ?? {}} value={value} error={error} onChange={onChange} />;
      case "Number":
        return <NumberAnswerInput settings={item.settings?.numberSettings ?? {}} value={value} error={error} onChange={onChange} />;
      case "File":
        return <FileAnswerInput value={value} error={error} onChange={onChange} />;
      default:
        return <TextAnswerInput value={value} error={error} onChange={onChange} />;
    }
  })();

  return (
    <>
      <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 1 : 4}>
        <Box sx={{ mb: isMobile ? 0 : 1, width: "100%" }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
            <Typography variant="h6" sx={{ fontSize: 15, fontWeight: 600 }}>
              {item.name}
              {!item.optional && <RequiredMark />}
            </Typography>
            {item.attachment?.path && (
              <Button variant="text" size="small" sx={{ minWidth: 0, p: 0.5, fontWeight: "normal" }} onClick={() => setPreviewSrc(item.attachment.path)}>
                (参考画像)
              </Button>
            )}
          </Stack>
        </Box>
        {input}
      </Stack>
      <Dialog open={previewSrc !== null} onClose={() => setPreviewSrc(null)} maxWidth="md">
        {previewSrc && <Box component="img" src={previewSrc} alt="" sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />}
      </Dialog>
    </>
  );
}

/**
 * グループ（本番 ChecklistGroup）。optional なグループは「該当なし」チェックで項目を畳む。
 * 条件付き項目（settings.condition）は参照項目の回答が一致するときだけ出す。
 */
export function ChecklistGroupInput({ group, values, notUse = {}, errors = {}, onChange, onNotUseChange, isMobile }) {
  const hidden = group.optional && !!notUse[group.id];
  return (
    <Stack spacing={2}>
      {!!group.name &&
        (group.optional ? (
          <Stack direction={isMobile ? "column" : "row"} spacing={isMobile ? 1 : 4}>
            <Box sx={{ mb: isMobile ? 0 : 1, width: "100%" }}>
              <Typography variant="h4" sx={{ fontSize: 18, fontWeight: 700 }}>
                {group.name}
              </Typography>
            </Box>
            <Box sx={{ width: "100%", display: "flex", alignItems: "center" }}>
              <Typography variant="h6" sx={{ mr: 1, fontSize: 15 }}>
                該当なし
              </Typography>
              <Checkbox checked={!!notUse[group.id]} onChange={(e) => onNotUseChange?.(group.id, e.target.checked)} />
            </Box>
          </Stack>
        ) : (
          <Typography variant="h5" sx={{ fontSize: 17, fontWeight: 700 }}>
            {group.name}
          </Typography>
        ))}
      <Stack spacing={1.5}>
        {!hidden &&
          (group.items ?? []).map((item) => {
            if (!isItemVisible(item, values)) return null;
            return <ChecklistItemInput key={item.id} item={item} value={values[item.id]} error={errors[item.id]} onChange={(v) => onChange(item.id, v)} isMobile={isMobile} />;
          })}
      </Stack>
    </Stack>
  );
}
