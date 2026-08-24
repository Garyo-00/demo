import { useState } from "react";
import {
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Checkbox,
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AddIcon from "@mui/icons-material/Add";
import { makeRow, needsOptions } from "../../workPlanNeoData.js";

/**
 * テンプレートの項目行テーブル。
 * 行の並べ替え（ドラッグ）・追加・削除・回答形式の切替に対応する。
 */
export default function ItemTable({
  rows,
  onChange,
  types,
  labelHeader = "項目",
  labelPlaceholder = "項目名を入力",
  emptyText = "項目がありません。「＋」または「5行追加」で追加してください。",
}) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const update = (id, patch) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const remove = (id) => onChange(rows.filter((r) => r.id !== id));
  const addRows = (n) =>
    onChange([...rows, ...Array.from({ length: n }, () => makeRow({ type: types[0].value }))]);

  function drop(to) {
    if (dragIdx === null || dragIdx === to) return;
    const next = [...rows];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(to, 0, moved);
    onChange(next);
    setDragIdx(null);
    setOverIdx(null);
  }

  return (
    <Box>
      <Box sx={{ display: "flex", mb: 1 }}>
        <Button size="small" onClick={() => addRows(5)}>
          5行追加
        </Button>
      </Box>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 34 }} />
              <TableCell sx={{ width: 44 }}>No</TableCell>
              <TableCell>{labelHeader}</TableCell>
              <TableCell sx={{ width: "22%" }}>回答形式</TableCell>
              <TableCell align="center" sx={{ width: 84 }}>必須</TableCell>
              <TableCell sx={{ width: "26%" }}>備考</TableCell>
              <TableCell sx={{ width: 48 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 4 }}>
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {rows.map((r, i) => (
              <TableRow
                key={r.id}
                sx={{
                  opacity: dragIdx === i ? 0.4 : 1,
                  ...(overIdx === i && dragIdx !== i
                    ? { boxShadow: "inset 0 2px 0 0 var(--mui-palette-primary-main, #4f5bd5)" }
                    : null),
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverIdx(i);
                }}
                onDrop={() => drop(i)}
              >
                <TableCell>
                  <IconButton
                    size="small"
                    draggable
                    onDragStart={() => setDragIdx(i)}
                    onDragEnd={() => {
                      setDragIdx(null);
                      setOverIdx(null);
                    }}
                    aria-label="行を並べ替え"
                    sx={{ cursor: "grab", color: "#c2c7d2" }}
                  >
                    <DragIndicatorIcon fontSize="small" />
                  </IconButton>
                </TableCell>
                <TableCell sx={{ color: "text.secondary" }}>{i + 1}</TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={r.label}
                    placeholder={labelPlaceholder}
                    onChange={(e) => update(r.id, { label: e.target.value })}
                  />
                  {needsOptions(types, r.type) && (
                    <TextField
                      fullWidth
                      sx={{ mt: 0.75 }}
                      value={r.options}
                      placeholder="選択肢をカンマ区切りで入力（例：晴, 曇, 雨）"
                      onChange={(e) => update(r.id, { options: e.target.value })}
                    />
                  )}
                </TableCell>
                <TableCell>
                  <Select
                    fullWidth
                    value={r.type}
                    onChange={(e) => update(r.id, { type: e.target.value })}
                  >
                    {types.map((t) => (
                      <MenuItem key={t.value} value={t.value} dense>
                        {t.label}
                      </MenuItem>
                    ))}
                  </Select>
                </TableCell>
                <TableCell align="center">
                  <Checkbox
                    size="small"
                    checked={r.required}
                    onChange={(e) => update(r.id, { required: e.target.checked })}
                    slotProps={{ input: { "aria-label": "必須" } }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    fullWidth
                    value={r.note}
                    onChange={(e) => update(r.id, { note: e.target.value })}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton size="small" onClick={() => remove(r.id)} aria-label="行を削除">
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
        <IconButton size="small" onClick={() => addRows(1)} aria-label="行を追加">
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>
    </Box>
  );
}
