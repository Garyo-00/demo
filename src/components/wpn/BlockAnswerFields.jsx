import {
  Box,
  Checkbox,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { itemConfig } from "./BlockItemEditor.jsx";
import { BLOCK_ITEM_DEFS } from "../../workPlanNeoBlockItems.js";
import { useIsNarrow } from "./Responsive.jsx";

// 日付・時刻は閲覧時にピッカーを出さないよう text に落とす
const nativeType = (t, readOnly) => (readOnly ? "text" : t);

function Field({ item, options, value, onChange, readOnly }) {
  const base = { fullWidth: true, disabled: readOnly, value: value ?? "" };

  switch (item.type) {
    case "select":
      return (
        <Select {...base} displayEmpty onChange={(e) => onChange(e.target.value)}>
          <MenuItem value=""><em>未選択</em></MenuItem>
          {options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
        </Select>
      );
    case "multiSelect":
      return (
        <Select
          {...base}
          multiple
          displayEmpty
          value={value || []}
          onChange={(e) => onChange(e.target.value)}
          renderValue={(v) => (v.length === 0 ? "0 件選択" : v.join("、"))}
        >
          {options.map((o) => (
            <MenuItem key={o} value={o}>
              <Checkbox size="small" checked={(value || []).includes(o)} />
              {o}
            </MenuItem>
          ))}
        </Select>
      );
    case "checkbox":
      return <Checkbox size="small" checked={!!value} disabled={readOnly} onChange={(e) => onChange(e.target.checked)} />;
    case "worker":
      return (
        <Select {...base} displayEmpty onChange={(e) => onChange(e.target.value)}>
          <MenuItem value=""><em>未選択</em></MenuItem>
          {["門脇_管理者", "星野 恵河", "職長 佐藤", "建設 太郎"].map((o) => (
            <MenuItem key={o} value={o}>{o}</MenuItem>
          ))}
        </Select>
      );
    case "textarea":
      return <TextField {...base} multiline minRows={2} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return <TextField {...base} type="number" onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return (
        <TextField {...base} type={nativeType("date", readOnly)}
          slotProps={{ inputLabel: { shrink: true } }} onChange={(e) => onChange(e.target.value)} />
      );
    case "dateRange":
    case "timeRange": {
      const t = item.type === "dateRange" ? "date" : "time";
      const v = value || ["", ""];
      return (
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <TextField fullWidth type={nativeType(t, readOnly)} disabled={readOnly} value={v[0] || ""}
            slotProps={{ inputLabel: { shrink: true } }}
            onChange={(e) => onChange([e.target.value, v[1] || ""])} />
          <Box component="span" sx={{ flex: "none", color: "text.secondary" }}>〜</Box>
          <TextField fullWidth type={nativeType(t, readOnly)} disabled={readOnly} value={v[1] || ""}
            slotProps={{ inputLabel: { shrink: true } }}
            onChange={(e) => onChange([v[0] || "", e.target.value])} />
        </Box>
      );
    }
    default:
      return <TextField {...base} onChange={(e) => onChange(e.target.value)} />;
  }
}

/**
 * ブロック項目への入力欄。テンプレートで「使用する」にした項目だけを出し、
 * 選択式は絞り込んだ選択肢だけを候補にする。
 */
export default function BlockAnswerFields({ blockKey, config, values, onChange, readOnly = false }) {
  const narrow = useIsNarrow();
  const defs = BLOCK_ITEM_DEFS[blockKey] || [];
  const shown = defs.filter((d) => itemConfig(config, d).on);

  if (shown.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
        テンプレートでこのブロックの項目が選択されていません。
      </Typography>
    );
  }

  const set = (key, v) => onChange({ ...(values || {}), [key]: v });

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: narrow ? "1fr" : "minmax(180px, 240px) 1fr",
        columnGap: 2,
        rowGap: narrow ? 2 : 1.5,
        alignItems: narrow ? "stretch" : "start",
      }}
    >
      {shown.map((item) => {
        const c = itemConfig(config, item);
        return (
          <Box key={item.key} sx={{ display: "contents" }}>
            <Box sx={{ pt: narrow ? 0 : 1 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>
                {item.label}
                {item.unit && (
                  <Typography component="span" variant="caption" color="text.secondary">
                    （{item.unit}）
                  </Typography>
                )}
              </Typography>
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Field
                item={item}
                options={c.options}
                value={values?.[item.key]}
                onChange={(v) => set(item.key, v)}
                readOnly={readOnly}
              />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
