// 作業間調整pro 用のフォーム部品（MUI）
import { Autocomplete, Box, Chip, MenuItem, TextField, Typography } from "@mui/material";

// full=true はフォームグリッド（2カラム）の全幅を占める
const fieldSx = (full) => ({ gridColumn: full ? "1 / -1" : undefined, minWidth: 0 });

// フォームの2カラムグリッド（狭い画面は1カラム）
export function FormGrid({ children, sx }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
        gap: "14px 18px",
        alignItems: "start",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}

// 自由記述＋サジェスト（履歴／別システム設定を候補に出す）
export function SuggestField({ label, value, onChange, options = [], required, hint, full, maxLength }) {
  return (
    <Box sx={fieldSx(full)}>
      <Autocomplete
        freeSolo
        size="small"
        options={options}
        inputValue={value || ""}
        onInputChange={(_, v) => onChange(v)}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            required={required}
            placeholder="入力／選択"
            helperText={hint}
            // Autocomplete が渡す slotProps に maxLength だけ足す（上書きするとrefが外れる）
            slotProps={{
              ...params.slotProps,
              htmlInput: { ...params.slotProps?.htmlInput, maxLength },
            }}
          />
        )}
      />
    </Box>
  );
}

// 選択式
export function SelectField({ label, value, onChange, options = [], required, hint, full }) {
  return (
    <Box sx={fieldSx(full)}>
      <TextField
        select
        fullWidth
        size="small"
        label={label}
        required={required}
        helperText={hint}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => {
          const val = o && typeof o === "object" ? o.value : o;
          const text = o && typeof o === "object" ? o.label : o;
          return (
            <MenuItem key={String(val)} value={val}>
              {text}
            </MenuItem>
          );
        })}
      </TextField>
    </Box>
  );
}

// 読み取り専用（自動反映項目）
export function ReadonlyField({ label, value, hint, full }) {
  return (
    <Box sx={fieldSx(full)}>
      <TextField
        fullWidth
        size="small"
        label={label}
        value={value || ""}
        helperText={hint}
        slotProps={{ input: { readOnly: true }, htmlInput: { tabIndex: -1 } }}
        sx={{ "& .MuiOutlinedInput-root": { bgcolor: "action.hover" } }}
      />
    </Box>
  );
}

// 日付（編集可能）
export function DateField({ label, value, onChange, required, hint, full }) {
  return (
    <Box sx={fieldSx(full)}>
      <TextField
        fullWidth
        size="small"
        type="date"
        label={label}
        required={required}
        helperText={hint}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Box>
  );
}

// 複数行テキスト（必須・文字数上限・履歴サジェスト対応）
export function TextAreaField({ label, value, onChange, hint, full, placeholder, required, maxLength, history }) {
  // 文字数カウンタとヒントは1つの helperText にまとめる（MUIは1行しか出せないため）
  const counter = maxLength ? `${(value || "").length} / ${maxLength}` : "";
  return (
    <Box sx={fieldSx(full)}>
      {history && history.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 0.75, mb: 0.75 }}>
          <Typography variant="caption" color="text.secondary">
            履歴：
          </Typography>
          {history.map((h) => (
            <Chip
              key={h}
              size="small"
              variant="outlined"
              label={h}
              title="クリックで入力"
              onClick={() => onChange(h)}
              sx={{ maxWidth: "100%" }}
            />
          ))}
        </Box>
      )}
      <TextField
        fullWidth
        multiline
        minRows={3}
        size="small"
        label={label}
        required={required}
        placeholder={placeholder}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        slotProps={{ htmlInput: { maxLength } }}
        helperText={[hint, counter].filter(Boolean).join("　")}
        sx={{ "& .MuiFormHelperText-root": { textAlign: counter && !hint ? "right" : "left" } }}
      />
    </Box>
  );
}
