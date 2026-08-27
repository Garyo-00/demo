import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import { useMachines } from "../components/BroughtMachineContext.jsx";
import {
  BM_CATEGORIES,
  BM_COMPANIES,
  BM_OPERATORS,
  BM_PRIMARY,
  BM_SCOPES,
  BM_TAGS,
  NOTIFY_DAYS_BEFORE,
  inPeriod,
  inspectionSummary,
  needsAttention,
} from "../broughtMachineData.js";

const EMPTY = {
  keyword: "",
  category: "",
  company: "",
  primary: "",
  operator: "",
  from: "",
  to: "",
  tag: "",
  scope: "inPeriod",
};

export default function MachineList() {
  const navigate = useNavigate();
  const { machines, patchMachines } = useMachines();
  const [params, setParams] = useSearchParams();
  const [cond, setCond] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [selected, setSelected] = useState([]);
  const [perPage, setPerPage] = useState(50);
  // ダッシュボードから「要対応だけ」で遷移してくる
  const attentionOnly = params.get("attention") === "1";

  const summary = inspectionSummary(machines);

  const rows = machines.filter((m) => {
    if (applied.scope === "archived") {
      if (!m.archived) return false;
    } else {
      if (m.archived) return false;
      if (applied.scope === "inPeriod" && !inPeriod(m)) return false;
      if (applied.scope === "outPeriod" && inPeriod(m)) return false;
    }
    if (attentionOnly && !needsAttention(m)) return false;
    if (applied.category && m.category !== applied.category) return false;
    if (applied.company && m.company !== applied.company) return false;
    if (applied.primary && m.primary !== applied.primary) return false;
    if (applied.operator && m.operator !== applied.operator) return false;
    if (applied.tag && !m.tags.includes(applied.tag)) return false;
    if (applied.from && m.useFrom < applied.from) return false;
    if (applied.to && m.useFrom > applied.to) return false;
    if (applied.keyword) {
      const hay = `${m.name}${m.alias}${m.mgmtNo}${m.archId}`;
      if (!hay.includes(applied.keyword)) return false;
    }
    return true;
  });
  const page = rows.slice(0, perPage);
  const allChecked = page.length > 0 && page.every((m) => selected.includes(m.id));

  const set = (patch) => setCond((c) => ({ ...c, ...patch }));
  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Box>
      <Typography variant="h1" align="center" sx={{ mb: 2 }}>
        持込機械一覧
      </Typography>

      {/* 特定自主検査の通知。期限の30日前から出す */}
      {(summary.overdue > 0 || summary.due > 0) && !attentionOnly && (
        <Alert
          severity={summary.overdue > 0 ? "error" : "warning"}
          sx={{ mb: 2 }}
          action={
            <Button size="small" color="inherit" onClick={() => setParams({ attention: "1" })}>
              対象を表示
            </Button>
          }
        >
          特定自主検査の期限が近い機械があります。
          {summary.overdue > 0 && `期限超過 ${summary.overdue} 台。`}
          {summary.due > 0 && `${NOTIFY_DAYS_BEFORE}日以内 ${summary.due} 台。`}
        </Alert>
      )}
      {attentionOnly && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button size="small" color="inherit" onClick={() => setParams({})}>
              解除
            </Button>
          }
        >
          特定自主検査の対応が必要な機械だけを表示しています。
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "auto 1fr auto 1fr auto 1fr" },
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <Typography variant="body2">キーワード</Typography>
            <TextField value={cond.keyword} onChange={(e) => set({ keyword: e.target.value })} />
            <Typography variant="body2">カテゴリ</Typography>
            <Select displayEmpty value={cond.category} onChange={(e) => set({ category: e.target.value })}>
              <MenuItem value="">すべて</MenuItem>
              {BM_CATEGORIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
            <Typography variant="body2">持込会社</Typography>
            <Select displayEmpty value={cond.company} onChange={(e) => set({ company: e.target.value })}>
              <MenuItem value="">すべて</MenuItem>
              {BM_COMPANIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>

            <Typography variant="body2">一次会社</Typography>
            <Select displayEmpty value={cond.primary} onChange={(e) => set({ primary: e.target.value })}>
              <MenuItem value="">すべて</MenuItem>
              {BM_PRIMARY.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
            <Typography variant="body2">運転者</Typography>
            <Select displayEmpty value={cond.operator} onChange={(e) => set({ operator: e.target.value })}>
              <MenuItem value="">すべて</MenuItem>
              {BM_OPERATORS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
            <Typography variant="body2">持込日</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                fullWidth
                type="date"
                value={cond.from}
                onChange={(e) => set({ from: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
              <Box component="span" sx={{ color: "text.secondary" }}>〜</Box>
              <TextField
                fullWidth
                type="date"
                value={cond.to}
                onChange={(e) => set({ to: e.target.value })}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Box>

            <Typography variant="body2">タグ</Typography>
            <Select displayEmpty value={cond.tag} onChange={(e) => set({ tag: e.target.value })}>
              <MenuItem value="">すべて</MenuItem>
              {BM_TAGS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 1.5 }}>
            <Typography variant="body2">表示対象</Typography>
            <RadioGroup row value={cond.scope} onChange={(e) => set({ scope: e.target.value })}>
              {BM_SCOPES.map((s) => (
                <FormControlLabel key={s.value} value={s.value} control={<Radio size="small" />} label={s.label} />
              ))}
            </RadioGroup>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 1 }}>
            <Button variant="contained" onClick={() => setApplied(cond)}>検索</Button>
            <Button
              variant="outlined"
              onClick={() => {
                setCond(EMPTY);
                setApplied(EMPTY);
              }}
            >
              クリア
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        <Typography variant="body2">持込機械総数：{rows.length}</Typography>
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <Button variant="outlined" size="small">インポート</Button>
          <Button variant="contained" size="small" onClick={() => navigate("/app/machines/new")}>
            新規登録
          </Button>
        </Box>
      </Box>

      <Card>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 42 }}>
                  <Checkbox
                    size="small"
                    checked={allChecked}
                    onChange={() =>
                      setSelected((s) =>
                        allChecked
                          ? s.filter((id) => !page.some((m) => m.id === id))
                          : [...new Set([...s, ...page.map((m) => m.id)])]
                      )
                    }
                    slotProps={{ input: { "aria-label": "全選択" } }}
                  />
                </TableCell>
                <TableCell>カテゴリ</TableCell>
                <TableCell>機械名</TableCell>
                <TableCell>現場内呼称</TableCell>
                <TableCell>現場内管理番号</TableCell>
                <TableCell>Arch ID</TableCell>
                <TableCell>一次会社</TableCell>
                <TableCell>持込会社</TableCell>
                <TableCell>運転者(取扱者)</TableCell>
                <TableCell>持込日</TableCell>
                <TableCell sx={{ width: 44 }}>タグ</TableCell>
                <TableCell sx={{ width: 44 }}>詳細</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {page.length === 0 && (
                <TableRow>
                  <TableCell colSpan={12} align="center" sx={{ color: "text.secondary", py: 5 }}>
                    条件に一致する持込機械はありません。
                  </TableCell>
                </TableRow>
              )}
              {page.map((m) => (
                <TableRow key={m.id} hover>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={selected.includes(m.id)}
                      onChange={() => toggle(m.id)}
                      slotProps={{ input: { "aria-label": m.name } }}
                    />
                  </TableCell>
                  <TableCell>{m.category}</TableCell>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.alias}</TableCell>
                  <TableCell>{m.mgmtNo}</TableCell>
                  <TableCell>{m.archId}</TableCell>
                  <TableCell>{m.primary}</TableCell>
                  <TableCell>{m.company}</TableCell>
                  <TableCell>{m.operator}</TableCell>
                  <TableCell>{m.bringDate}</TableCell>
                  <TableCell align="center">
                    {m.tags.length > 0 && (
                      <Tooltip title={m.tags.join("、")}>
                        <LocalOfferOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" aria-label="詳細" onClick={() => navigate(`/app/machines/${m.id}`)}>
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={rows.length}
          page={0}
          onPageChange={() => {}}
          rowsPerPage={perPage}
          rowsPerPageOptions={[25, 50, 100]}
          onRowsPerPageChange={(e) => setPerPage(Number(e.target.value))}
          labelRowsPerPage="ページあたりの行数:"
          labelDisplayedRows={({ from, to, count }) => `${from}〜${to} / ${count}`}
        />
      </Card>

      <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 2 }}>
        <Button variant="outlined" size="small" disabled={selected.length === 0}>
          タグを追加
        </Button>
        <Button
          variant="outlined"
          size="small"
          disabled={selected.length === 0}
          onClick={() => {
            patchMachines(selected, { archived: true });
            setSelected([]);
          }}
        >
          アーカイブにする
        </Button>
      </Box>
    </Box>
  );
}
