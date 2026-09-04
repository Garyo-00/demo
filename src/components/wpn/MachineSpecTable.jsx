import {
  Box,
  Checkbox,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { itemConfig } from "./BlockItemEditor.jsx";
import { machineConfig } from "./MachineBlockEditor.jsx";
import { MACHINE_COMMON, MACHINE_TYPES } from "../../workPlanNeoMachineTypes.js";
import { machineById } from "../../workPlanNeoPlanData.js";
import { useIsNarrow } from "./Responsive.jsx";

// 1セルぶんの入力欄。テンプレートで絞った選択肢だけを出す。
function SpecField({ item, options, value, onChange, readOnly }) {
  const common = { fullWidth: true, disabled: readOnly, value: value ?? "" };
  if (item.type === "select") {
    return (
      <Select {...common} displayEmpty onChange={(e) => onChange(e.target.value)}>
        <MenuItem value=""><em>未選択</em></MenuItem>
        {options.map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}
      </Select>
    );
  }
  if (item.type === "multiSelect") {
    return (
      <Select
        {...common}
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
  }
  if (item.type === "checkbox") {
    return <Checkbox size="small" checked={!!value} disabled={readOnly} onChange={(e) => onChange(e.target.checked)} />;
  }
  const type = item.type === "number" ? "number" : item.type === "date" ? "date" : "text";
  return (
    <TextField
      {...common}
      type={readOnly && type === "date" ? "text" : type}
      multiline={item.type === "textarea"}
      minRows={item.type === "textarea" ? 2 : undefined}
      slotProps={item.type === "date" ? { inputLabel: { shrink: true } } : undefined}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * 機械ブロックの入力。機械を行・諸元を列に置いたピボット表で、
 * 選択した機種セクションぶんだけ表が並ぶ。
 */
export default function MachineSpecTable({ config, machineIds, values, onChange, readOnly = false }) {
  const cfg = machineConfig(config);
  const narrow = useIsNarrow();
  const machines = (machineIds || []).map(machineById).filter(Boolean);

  const enabled = (defs, itemCfg) => defs.filter((d) => itemConfig(itemCfg, d).on);
  const optionsOf = (item, itemCfg) => itemConfig(itemCfg, item).options;
  const val = (mid, key) => values?.[mid]?.[key];
  const setVal = (mid, key, v) =>
    onChange({ ...values, [mid]: { ...(values?.[mid] || {}), [key]: v } });

  // 共通項目＋選択された機種セクションを、それぞれ1つの表にする
  const groups = [
    { key: "common", label: "共通項目", items: enabled(MACHINE_COMMON, cfg.common), itemCfg: cfg.common },
    ...MACHINE_TYPES.filter((t) => cfg.types.includes(t.key)).map((t) => ({
      key: t.key,
      label: t.label,
      items: enabled(t.items, cfg.byType[t.key]),
      itemCfg: cfg.byType[t.key],
    })),
  ].filter((g) => g.items.length > 0);

  if (machines.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
        機械が選択されていません。上の「機械の選択」で選ぶと、ここに諸元の入力欄が出ます。
      </Typography>
    );
  }
  if (groups.length === 0) {
    return (
      <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
        テンプレートで機械ブロックの項目が設定されていません。
      </Typography>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      {groups.map((g) => (
        <Box key={g.key}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 700, mb: 1 }}>
            {g.label}
            <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1, fontWeight: 400 }}>
              {machines.length}台 × {g.items.length}項目
            </Typography>
          </Typography>

          {/* 狭い画面では列が入らないため、機械ごとに縦積みへ切り替える */}
          {narrow ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              {machines.map((m) => (
                <Box key={m.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5 }}>
                  <Typography sx={{ fontSize: 13, fontWeight: 700, mb: 1 }}>{m.alias || m.name}</Typography>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
                    {g.items.map((it) => (
                      <Box key={it.key}>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.25 }}>
                          {it.label}{it.unit ? `（${it.unit}）` : ""}
                        </Typography>
                        <SpecField
                          item={it}
                          options={optionsOf(it, g.itemCfg)}
                          value={val(m.id, `${g.key}.${it.key}`)}
                          onChange={(v) => setVal(m.id, `${g.key}.${it.key}`, v)}
                          readOnly={readOnly}
                        />
                      </Box>
                    ))}
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 150, position: "sticky", left: 0, bgcolor: "#f7f8fb", zIndex: 1 }}>
                      機械
                    </TableCell>
                    {g.items.map((it) => (
                      <TableCell key={it.key} sx={{ minWidth: 150 }}>
                        {it.label}
                        {it.unit && (
                          <Typography component="span" variant="caption" color="text.secondary">
                            （{it.unit}）
                          </Typography>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {machines.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell sx={{ position: "sticky", left: 0, bgcolor: "background.paper", zIndex: 1 }}>
                        <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>{m.alias || m.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{m.category}</Typography>
                      </TableCell>
                      {g.items.map((it) => (
                        <TableCell key={it.key}>
                          <SpecField
                            item={it}
                            options={optionsOf(it, g.itemCfg)}
                            value={val(m.id, `${g.key}.${it.key}`)}
                            onChange={(v) => setVal(m.id, `${g.key}.${it.key}`, v)}
                            readOnly={readOnly}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      ))}
    </Box>
  );
}
