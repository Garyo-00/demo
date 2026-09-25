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
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import CancelIcon from "@mui/icons-material/Cancel";
import UploadIcon from "@mui/icons-material/CloudUpload";
import { RequiredMark, useIsMobile } from "./KynextCommon.jsx";
import { PHOTO_C, newId } from "../../kynextData.js";
import { MAX_FILES, TEXT_MAX_LENGTH } from "./CreateSheetLib.js";

// ===== KYシート作成フォームの入力部品（本番 FormItem / ButtonSelection / CheckboxSelection /
//       NumberPickerSelection / FileAnswerField / RiskScoreToggleRow の移植） =====

// 左にタイトル＋必須マーク、右に入力（本番 features/form/FormItem）。スマホでは縦並び
export function FormItem({ title, required, element, titleSuffix }) {
  const isMobile = useIsMobile();
  return (
    <Box sx={{ width: "100%" }}>
      <Stack direction={isMobile ? "column" : "row"} spacing={1}>
        <Box sx={{ minWidth: 160, maxWidth: isMobile ? null : 160, flexShrink: 0, wordBreak: "break-word" }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Typography variant="body2">
              {title}
              {required && <RequiredMark />}
            </Typography>
            {titleSuffix}
          </Stack>
        </Box>
        {element}
      </Stack>
    </Box>
  );
}

const errorCaptionSx = { color: "#FF1943", fontWeight: "bold" };

// 選択肢ボタン群による単一選択（本番 ButtonSelection）。value: { id, text } | null
export function ButtonSelectionField({ value, onChange, options = [], optional = false, error }) {
  const selected = value ?? null;
  return (
    <FormControl fullWidth error={!!error}>
      <Stack spacing={1} sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {options.map((option) => {
            const isSelected = selected?.id === option.id;
            const textTooLong = isSelected && (selected.text?.length ?? 0) > TEXT_MAX_LENGTH;
            const textMissing = isSelected && error?.type === "textRequired" && !!option.textRequired && !selected.text;
            return (
              <Stack key={option.id} direction="row" spacing={2} sx={{ alignItems: "center", ...(option.hasText ? { width: "100%" } : {}) }}>
                <ToggleButton
                  value={option.id}
                  selected={isSelected}
                  onChange={() => {
                    if (isSelected) {
                      // 必須項目は選択を外せない（本番と同じ）
                      if (!optional) return;
                      onChange(null);
                    } else {
                      onChange({ id: option.id, text: "" });
                    }
                  }}
                  sx={{ minWidth: 80, overflow: "hidden", whiteSpace: "normal", wordBreak: "break-word", height: "auto", textAlign: "left", border: "1px solid", borderColor: "divider", borderRadius: 1 }}
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
                      error={textTooLong || textMissing}
                      helperText={textTooLong ? `${TEXT_MAX_LENGTH}文字以下で入力してください` : textMissing ? "入力してください" : undefined}
                      value={isSelected ? selected.text : ""}
                      onChange={(e) => onChange({ ...selected, text: e.target.value })}
                    />
                  </>
                )}
              </Stack>
            );
          })}
        </Box>
        {error && error.type !== "textRequired" && error.type !== "textMaxLength" && (
          <Typography variant="caption" sx={errorCaptionSx}>
            {error.message || "選択してください"}
          </Typography>
        )}
      </Stack>
    </FormControl>
  );
}

// チェックボックスによる複数選択（本番 CheckboxSelection）。value: [{ id, text }]
export function CheckboxSelectionField({ value, onChange, options = [], error }) {
  const selectedValues = Array.isArray(value) ? value : [];
  return (
    <FormControl fullWidth>
      <FormGroup sx={{ width: "100%" }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1 }}>
          {options.map((option) => {
            const selectedItem = selectedValues.find((v) => v.id === option.id);
            const isChecked = !!selectedItem;
            const textTooLong = isChecked && (selectedItem.text?.length ?? 0) > TEXT_MAX_LENGTH;
            const textMissing = isChecked && error?.type === "textRequired" && !!option.textRequired && !selectedItem.text;
            return (
              <Stack key={option.id} direction="row" spacing={1.5} sx={{ alignItems: "center", ...(option.hasText ? { width: "100%" } : {}) }}>
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
                      error={textTooLong || textMissing}
                      helperText={textTooLong ? `${TEXT_MAX_LENGTH}文字以下で入力してください` : textMissing ? "入力してください" : undefined}
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
      {error && error.type !== "textRequired" && error.type !== "textMaxLength" && (
        <Typography variant="caption" sx={errorCaptionSx}>
          {error.message || "選択してください"}
        </Typography>
      )}
    </FormControl>
  );
}

// 数値選択（本番 NumberPickerSelection）。min〜max を step 刻みで並べた Select
export function NumberPickerField({ value, onChange, settings = {}, error, ariaLabel }) {
  const min = settings.min ?? 0;
  const max = settings.max ?? 100;
  const decimalPlaces = settings.decimalPlaces ?? 0;
  const step = settings.step ?? 10 ** -decimalPlaces;
  const options = [];
  for (let v = min; v <= max + 1e-9; v += step) options.push(v.toFixed(decimalPlaces));
  return (
    <FormControl fullWidth error={!!error}>
      <Select
        size="small"
        displayEmpty
        value={value != null && value !== "" ? Number(value).toFixed(decimalPlaces) : ""}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        error={!!error}
        inputProps={{ "aria-label": ariaLabel }}
        sx={{ fontSize: "body1.fontSize" }}
        MenuProps={{ sx: { "& .MuiMenuItem-root.MuiButtonBase-root": { fontSize: "body1.fontSize", minHeight: "auto", py: 0.75 } } }}
      >
        <MenuItem value="">選択してください</MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt} value={opt}>
            {opt}
          </MenuItem>
        ))}
      </Select>
      {error && <FormHelperText>{error.message}</FormHelperText>}
    </FormControl>
  );
}

const THUMB_SIZE = 80;

// 画像添付（本番 FileAnswerField）。デモではアップロードの代わりに固定のサンプル画像（PHOTO_C）を追加する。
// value: [{ id, name, path }]
export function FileAnswerField({ value = [], onChange, errorMessage, disabled = false }) {
  const [previewSrc, setPreviewSrc] = useState(null);
  const buttonDisabled = disabled || value.length >= MAX_FILES;
  const handleAdd = () => {
    if (buttonDisabled) return;
    onChange([...value, { id: newId(), name: `photo_${value.length + 1}.jpg`, path: PHOTO_C }]);
  };
  return (
    <Stack spacing={1} sx={{ width: "100%" }}>
      {value.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
          {value.map((a, index) => (
            <Box key={a.id} sx={{ position: "relative", display: "inline-block" }}>
              <Box
                component="img"
                src={a.path}
                alt={a.name}
                onClick={() => setPreviewSrc(a.path)}
                sx={{ width: THUMB_SIZE, height: THUMB_SIZE, objectFit: "cover", border: "1px solid", borderColor: "divider", borderRadius: 1, cursor: "pointer", "&:hover": { opacity: 0.8 } }}
              />
              {!disabled && (
                <IconButton
                  size="small"
                  aria-label="削除"
                  onClick={() => onChange(value.filter((_, i) => i !== index))}
                  sx={{ position: "absolute", top: -8, right: -8, bgcolor: "background.paper", p: 0, "&:hover": { bgcolor: "background.paper" } }}
                >
                  <CancelIcon fontSize="small" color="error" />
                </IconButton>
              )}
            </Box>
          ))}
        </Box>
      )}
      <Box>
        <Button variant="outlined" size="small" startIcon={<UploadIcon />} disabled={buttonDisabled} onClick={handleAdd}>
          画像を追加
        </Button>
      </Box>
      {errorMessage && <FormHelperText error>{errorMessage}</FormHelperText>}
      <Dialog open={previewSrc !== null} onClose={() => setPreviewSrc(null)} maxWidth="md">
        {previewSrc && <Box component="img" src={previewSrc} alt="" sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain" }} />}
      </Dialog>
    </Stack>
  );
}

// 重大性・可能性のトグルと評価の表示（本番 RiskScoreToggleRow の layout="form"）。
// 点数は大きい順に並べる。symbolMap を渡すと記号（×△◯）で表示する
export function RiskScoreToggleRow({
  severityLabel = "重大性",
  possibilityLabel = "可能性",
  severityOptions,
  possibilityOptions,
  severity,
  possibility,
  onSeverityChange,
  onPossibilityChange,
  required = false,
  evaluation,
  symbolMap,
  severityError,
  possibilityError,
}) {
  const requiredMark = required && <RequiredMark />;
  const toggle = (options, value, onChange, label) => (
    <ToggleButtonGroup value={value || null} exclusive size="small" aria-label={label} onChange={(_e, v) => v !== null && onChange(v)}>
      {[...options]
        .sort((a, b) => b - a)
        .map((score) => (
          <ToggleButton key={score} value={score} sx={{ minWidth: 32, padding: "4px 8px" }}>
            {symbolMap ? (symbolMap[score] ?? score) : score}
          </ToggleButton>
        ))}
    </ToggleButtonGroup>
  );
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90, pt: 0.75 }}>
          {severityLabel}
          {requiredMark}
        </Typography>
        <FormControl error={!!severityError}>
          {toggle(severityOptions, severity, onSeverityChange, severityLabel)}
          {severityError && <FormHelperText>{severityError}</FormHelperText>}
        </FormControl>
      </Stack>
      <Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90, pt: 0.75 }}>
          {possibilityLabel}
          {requiredMark}
        </Typography>
        <FormControl error={!!possibilityError}>
          {toggle(possibilityOptions, possibility, onPossibilityChange, possibilityLabel)}
          {possibilityError && <FormHelperText>{possibilityError}</FormHelperText>}
        </FormControl>
      </Stack>
      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
        <Typography variant="body2" color="text.secondary" sx={{ minWidth: 90 }}>
          評価
        </Typography>
        <Box sx={{ display: "inline-block", px: 2, py: 0.5, borderRadius: 1, backgroundColor: evaluation?.color || undefined, fontWeight: "bold" }}>{evaluation?.text ?? "-"}</Box>
      </Stack>
    </Stack>
  );
}
