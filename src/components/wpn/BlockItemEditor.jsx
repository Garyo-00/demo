import { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  Collapse,
  FormControlLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ANSWER_TYPES } from "../../workPlanNeoData.js";
import { useIsNarrow } from "./Responsive.jsx";

const typeLabel = (t) => ANSWER_TYPES.find((x) => x.value === t)?.label || t;
const isChoice = (t) => t === "select" || t === "multiSelect";

// 項目1つぶんの設定値。未設定なら「使用する・選択肢は全部」を既定にする。
export function itemConfig(cfg, item) {
  const c = cfg?.[item.key];
  return {
    on: c ? !!c.on : true,
    options: c?.options ?? (item.options || []).map((o) => o.label ?? o),
  };
}

// 選択肢の絞り込み。各社の選択肢をすべて出し、使うものだけ残す。
function OptionPicker({ item, picked, onChange }) {
  const all = (item.options || []).map((o) => (typeof o === "string" ? { label: o } : o));
  const toggle = (label) =>
    onChange(picked.includes(label) ? picked.filter((x) => x !== label) : [...picked, label]);

  return (
    <Box sx={{ p: 1.5, bgcolor: "#f7f8fb", borderRadius: 2, mt: 1 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1, flexWrap: "wrap" }}>
        <Typography variant="caption" color="text.secondary">
          作業計画書で表示する選択肢を選んでください（各社の様式にあった選択肢をすべて挙げています）
        </Typography>
        <Box sx={{ ml: "auto", display: "flex", gap: 0.5 }}>
          <Button size="small" onClick={() => onChange(all.map((o) => o.label))}>
            すべて選ぶ
          </Button>
          <Button size="small" color="inherit" onClick={() => onChange([])}>
            すべて外す
          </Button>
        </Box>
      </Box>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
        {all.map((o) => {
          const on = picked.includes(o.label);
          return (
            <Chip
              key={o.label}
              size="small"
              label={o.n ? `${o.label}（${o.n}社）` : o.label}
              color={on ? "primary" : "default"}
              variant={on ? "filled" : "outlined"}
              onClick={() => toggle(o.label)}
              sx={{ opacity: on ? 1 : 0.6 }}
            />
          );
        })}
        {all.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            選択肢が登録されていません。
          </Typography>
        )}
      </Box>
    </Box>
  );
}

/**
 * ブロックの中身（項目の使用可否と、選択式項目の選択肢）を設定する。
 * 項目の定義は各社様式の棚卸しから起こしたもので、テンプレートでは
 * 「使うかどうか」と「どの選択肢を出すか」だけを決める。
 */
export default function BlockItemEditor({ items, value, onChange }) {
  const [open, setOpen] = useState({});
  const narrow = useIsNarrow();
  const cfg = value || {};

  const set = (item, patch) =>
    onChange({ ...cfg, [item.key]: { ...itemConfig(cfg, item), ...patch } });

  const row = (item) => {
    const c = itemConfig(cfg, item);
    const choice = isChoice(item.type);
    const total = (item.options || []).length;
    return { c, choice, total };
  };

  if (narrow) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
        {items.map((item) => {
          const { c, choice, total } = row(item);
          return (
            <Box key={item.key} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5 }}>
              <FormControlLabel
                control={<Checkbox size="small" checked={c.on} onChange={(e) => set(item, { on: e.target.checked })} />}
                label={item.label}
                slotProps={{ typography: { sx: { fontSize: 13, fontWeight: 600 } } }}
              />
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", ml: 3.75, flexWrap: "wrap" }}>
                <Chip size="small" variant="outlined" label={typeLabel(item.type)} />
                {item.unit && <Typography variant="caption" color="text.secondary">単位 {item.unit}</Typography>}
              </Box>
              {choice && c.on && (
                <>
                  <Button
                    size="small"
                    sx={{ ml: 3.25, mt: 0.5 }}
                    endIcon={<ExpandMoreIcon sx={{ transform: open[item.key] ? "rotate(180deg)" : "none" }} />}
                    onClick={() => setOpen((o) => ({ ...o, [item.key]: !o[item.key] }))}
                  >
                    選択肢 {c.options.length}/{total}
                  </Button>
                  <Collapse in={!!open[item.key]} unmountOnExit>
                    <OptionPicker item={item} picked={c.options} onChange={(v) => set(item, { options: v })} />
                  </Collapse>
                </>
              )}
            </Box>
          );
        })}
      </Box>
    );
  }

  return (
    <TableContainer sx={{ overflowX: "auto" }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={{ width: 64 }}>使用</TableCell>
            <TableCell>項目</TableCell>
            <TableCell sx={{ width: "22%" }}>回答形式</TableCell>
            <TableCell sx={{ width: "30%" }}>選択肢</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {items.map((item) => {
            const { c, choice, total } = row(item);
            return (
              <TableRow key={item.key} hover>
                <TableCell align="center" sx={{ verticalAlign: "top" }}>
                  <Checkbox
                    size="small"
                    checked={c.on}
                    onChange={(e) => set(item, { on: e.target.checked })}
                    slotProps={{ input: { "aria-label": `${item.label}を使用する` } }}
                  />
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  <Typography sx={{ fontSize: 12.5, fontWeight: 500 }}>{item.label}</Typography>
                  {/* 選択肢の絞り込みは行内で開く */}
                  <Collapse in={!!open[item.key] && c.on} unmountOnExit>
                    <OptionPicker item={item} picked={c.options} onChange={(v) => set(item, { options: v })} />
                  </Collapse>
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  {typeLabel(item.type)}
                  {item.unit && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      （{item.unit}）
                    </Typography>
                  )}
                </TableCell>
                <TableCell sx={{ verticalAlign: "top" }}>
                  {choice ? (
                    <Button
                      size="small"
                      disabled={!c.on}
                      endIcon={<ExpandMoreIcon sx={{ transform: open[item.key] ? "rotate(180deg)" : "none", transition: "transform .15s" }} />}
                      onClick={() => setOpen((o) => ({ ...o, [item.key]: !o[item.key] }))}
                    >
                      {c.options.length}/{total} 件を表示
                    </Button>
                  ) : (
                    <Typography variant="caption" color="text.secondary">—</Typography>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
