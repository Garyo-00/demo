import { useState } from "react";
import {
  Box,
  Checkbox,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControlLabel,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import AddIcon from "@mui/icons-material/Add";
import { makeCheckRow, makeChecklist } from "../../workPlanNeoData.js";
import { useIsNarrow } from "./Responsive.jsx";

/**
 * チェックリスト編集（タブで複数リストを切り替え）。
 * 1テンプレートに複数のチェックリストを持たせ、リストごとに実施者の役割を設定する。
 */
export default function ChecklistEditor({ lists, onChange }) {
  const [active, setActive] = useState(0);
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  const narrow = useIsNarrow();

  const cur = lists[active];

  function updateList(patch) {
    onChange(lists.map((l, i) => (i === active ? { ...l, ...patch } : l)));
  }
  function addList() {
    onChange([...lists, makeChecklist()]);
    setActive(lists.length);
  }
  function removeList(idx) {
    const next = lists.filter((_, i) => i !== idx);
    onChange(next);
    setActive((a) => Math.max(0, Math.min(a, next.length - 1)));
  }
  const updateRow = (id, patch) =>
    updateList({ rows: cur.rows.map((r) => (r.id === id ? { ...r, ...patch } : r)) });
  const removeRow = (id) => updateList({ rows: cur.rows.filter((r) => r.id !== id) });

  function drop(to) {
    if (dragIdx === null || dragIdx === to) return;
    const rows = [...cur.rows];
    const [moved] = rows.splice(dragIdx, 1);
    rows.splice(to, 0, moved);
    updateList({ rows });
    setDragIdx(null);
    setOverIdx(null);
  }

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          value={Math.min(active, Math.max(0, lists.length - 1))}
          onChange={(_, v) => setActive(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ flex: 1, minWidth: 0 }}
        >
          {lists.map((l, i) => (
            <Tab
              key={l.id}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  {l.name?.trim() || `チェックリスト${i + 1}`}
                  {i === active && (
                    <DeleteOutlinedIcon
                      role="button"
                      aria-label="このチェックリストを削除"
                      sx={{ fontSize: 15, "&:hover": { color: "error.main" } }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("このチェックリストを削除しますか？")) removeList(i);
                      }}
                    />
                  )}
                </Box>
              }
            />
          ))}
        </Tabs>
        <IconButton size="small" onClick={addList} aria-label="チェックリストを追加">
          <AddIcon fontSize="small" />
        </IconButton>
      </Box>

      {!cur ? (
        <Typography align="center" color="text.secondary" sx={{ py: 4, fontSize: 12.5 }}>
          チェックリストがありません。「＋」で追加してください。
        </Typography>
      ) : (
        <>
          <TextField
            fullWidth
            sx={{ mb: 1 }}
            value={cur.name}
            placeholder="チェックリスト名"
            onChange={(e) => updateList({ name: e.target.value })}
          />
          <TextField
            fullWidth
            sx={{ mb: 2 }}
            value={cur.role}
            placeholder="実施者の役割"
            onChange={(e) => updateList({ role: e.target.value })}
          />

          {narrow ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {cur.rows.length === 0 && (
                <Typography align="center" color="text.secondary" sx={{ py: 4, fontSize: 12.5 }}>
                  確認項目がありません。「＋」で追加してください。
                </Typography>
              )}
              {cur.rows.map((r, i) => (
                <Box key={r.id} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {i + 1}
                    </Typography>
                    <IconButton size="small" sx={{ ml: "auto" }} onClick={() => removeRow(r.id)} aria-label="行を削除">
                      <DeleteOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <TextField
                    fullWidth
                    label="内容"
                    value={r.label}
                    placeholder="例：作業計画書を確認しましたか"
                    onChange={(e) => updateRow(r.id, { label: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <TextField
                    fullWidth
                    label="備考"
                    value={r.note}
                    onChange={(e) => updateRow(r.id, { note: e.target.value })}
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox size="small" checked={r.required} onChange={(e) => updateRow(r.id, { required: e.target.checked })} />
                    }
                    label="必須"
                    slotProps={{ typography: { sx: { fontSize: 12.5 } } }}
                  />
                </Box>
              ))}
            </Box>
          ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 34 }} />
                  <TableCell>内容</TableCell>
                  <TableCell align="center" sx={{ width: 84 }}>必須</TableCell>
                  <TableCell sx={{ width: "34%" }}>備考</TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {cur.rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ color: "text.secondary", py: 4 }}>
                      確認項目がありません。「＋」で追加してください。
                    </TableCell>
                  </TableRow>
                )}
                {cur.rows.map((r, i) => (
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
                    <TableCell>
                      <TextField
                        fullWidth
                        value={r.label}
                        placeholder="例：作業計画書を確認しましたか"
                        onChange={(e) => updateRow(r.id, { label: e.target.value })}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Checkbox
                        size="small"
                        checked={r.required}
                        onChange={(e) => updateRow(r.id, { required: e.target.checked })}
                        slotProps={{ input: { "aria-label": "必須" } }}
                      />
                    </TableCell>
                    <TableCell>
                      <TextField
                        fullWidth
                        value={r.note}
                        onChange={(e) => updateRow(r.id, { note: e.target.value })}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => removeRow(r.id)} aria-label="行を削除">
                        <DeleteOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          )}

          <Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
            <IconButton
              size="small"
              onClick={() => updateList({ rows: [...cur.rows, makeCheckRow()] })}
              aria-label="行を追加"
            >
              <AddIcon fontSize="small" />
            </IconButton>
          </Box>
        </>
      )}
    </Box>
  );
}
