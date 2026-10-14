import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  Menu,
  MenuItem,
  Select,
  Switch,
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
import WarningIcon from "@mui/icons-material/Warning";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useMachines } from "../components/BroughtMachineContext.jsx";
import {
  BM_CATEGORIES,
  BM_COMPANIES,
  BM_OPERATORS,
  BM_PRIMARY,
  BM_PROJECT,
  BM_SCOPES,
  BM_TAGS,
  NOTIFY_DAYS_BEFORE,
  annualAlert,
  fmt,
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
};

// 表示対象（検索条件とは独立。切り替えると即反映）。
// 使用期間内／外は複数選択（いずれか1つは必ずON）、
// アーカイブはONにすると他を無視してアーカイブ済みだけを表示する
const DEFAULT_SCOPE = { scopes: { inPeriod: true, outPeriod: true }, archivedOnly: false };

/**
 * 一覧のアラート列。年次点検・特定自主検査の次回期限で出し分ける。
 * 期限が設定されていれば通知アイコン、30日以内または期限超過なら警告アイコン。
 */
function AlertIcon({ machine }) {
  const { state, items } = annualAlert(machine);
  if (state === "none") return null;

  // ツールチップには種別ごとの期限を並べる
  const title = items
    .map((i) => {
      const when = i.days < 0 ? `${Math.abs(i.days)}日超過` : `あと${i.days}日`;
      return `${i.label}：${fmt(i.due)}（${when}）`;
    })
    .join(" / ");

  return (
    <Tooltip title={title}>
      {state === "warn" ? (
        <WarningIcon fontSize="small" sx={{ color: "#EA3323", display: "block", mx: "auto" }} />
      ) : (
        <NotificationsActiveIcon fontSize="small" sx={{ display: "block", mx: "auto" }} />
      )}
    </Tooltip>
  );
}

export default function MachineList() {
  const navigate = useNavigate();
  const { machines, patchMachines } = useMachines();
  const [params, setParams] = useSearchParams();
  const [cond, setCond] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [scope, setScope] = useState(DEFAULT_SCOPE);
  const [selected, setSelected] = useState([]);
  const [perPage, setPerPage] = useState(50);
  // 一括操作メニューと「使用期間延長」ダイアログ
  const [bulkAnchor, setBulkAnchor] = useState(null);
  const [extendOpen, setExtendOpen] = useState(false);
  // ダッシュボードから「要対応だけ」で遷移してくる
  const attentionOnly = params.get("attention") === "1";

  const summary = inspectionSummary(machines);

  const rows = machines.filter((m) => {
    if (scope.archivedOnly) {
      if (!m.archived) return false;
    } else {
      if (m.archived) return false;
      if (!scope.scopes[inPeriod(m) ? "inPeriod" : "outPeriod"]) return false;
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

      {/* 年次点検・特定自主検査の通知。期限の30日前から出す */}
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
          年次点検・特定自主検査の期限が近い機械があります。
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
          年次点検・特定自主検査の対応が必要な機械だけを表示しています。
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

      <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2">表示対象</Typography>
          {BM_SCOPES.map((s) => {
            const checked = !!scope.scopes[s.value];
            // 最後の1つはOFFにできない（アーカイブのみ表示中は選択自体を無効化）
            const lastOne = checked && BM_SCOPES.every((o) => o.value === s.value || !scope.scopes[o.value]);
            return (
              <Tooltip key={s.value} title={lastOne && !scope.archivedOnly ? "いずれか1つは選択が必要です" : ""}>
                <FormControlLabel
                  label={s.label}
                  control={
                    <Checkbox
                      size="small"
                      checked={checked}
                      disabled={scope.archivedOnly || lastOne}
                      onChange={(e) => setScope((v) => ({ ...v, scopes: { ...v.scopes, [s.value]: e.target.checked } }))}
                    />
                  }
                />
              </Tooltip>
            );
          })}
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <FormControlLabel
            label="アーカイブのみ表示"
            control={
              <Switch size="small" checked={scope.archivedOnly} onChange={(e) => {
                  setScope((v) => ({ ...v, archivedOnly: e.target.checked }));
                  setSelected([]);
                }} />
            }
          />
        </Box>
        <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={selected.length === 0}
            endIcon={<ArrowDropDownIcon />}
            onClick={(e) => setBulkAnchor(e.currentTarget)}
          >
            一括操作{selected.length > 0 && `（${selected.length}件）`}
          </Button>
          <Menu anchorEl={bulkAnchor} open={!!bulkAnchor} onClose={() => setBulkAnchor(null)}>
            {!scope.archivedOnly && (
              <MenuItem
                onClick={() => {
                  setBulkAnchor(null);
                  setExtendOpen(true);
                }}
              >
                使用期間延長
              </MenuItem>
            )}
            <MenuItem onClick={() => setBulkAnchor(null)}>タグを追加</MenuItem>
            <Divider />
            {/* アーカイブ一覧を表示しているときは解除操作に切り替える */}
            <MenuItem
              onClick={() => {
                setBulkAnchor(null);
                patchMachines(selected, { archived: !scope.archivedOnly });
                setSelected([]);
              }}
            >
              {scope.archivedOnly ? "アーカイブ解除" : "アーカイブにする"}
            </MenuItem>
          </Menu>
          <Button variant="outlined" size="small">インポート</Button>
          <Button variant="contained" size="small" onClick={() => navigate("/app/machines/new")}>
            新規登録
          </Button>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ mb: 1 }}>持込機械総数：{rows.length}</Typography>

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
                <TableCell sx={{ width: 64 }} align="center">アラート</TableCell>
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
                  <TableCell colSpan={13} align="center" sx={{ color: "text.secondary", py: 5 }}>
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
                  <TableCell align="center">
                    <AlertIcon machine={m} />
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

      <ExtendPeriodDialog
        open={extendOpen}
        machines={machines.filter((m) => selected.includes(m.id))}
        onClose={() => setExtendOpen(false)}
        onApply={(useTo) => {
          patchMachines(selected, { useTo });
          setSelected([]);
          setExtendOpen(false);
        }}
      />
    </Box>
  );
}

/**
 * 使用期間延長ダイアログ。選択した機械の使用期間「終了日」だけを一括で変更する。
 * 「工期末に設定」でプロジェクト情報の工期終了日を反映できる。
 */
function ExtendPeriodDialog({ open, machines, onClose, onApply }) {
  const [useTo, setUseTo] = useState("");
  // 開くたびに入力をリセット
  const handleEnter = () => setUseTo("");
  // 現在の終了日より前に戻す機械があれば注意を出す（延長ではなく短縮になる）
  const shortened = useTo ? machines.filter((m) => m.useTo > useTo) : [];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" TransitionProps={{ onEnter: handleEnter }}>
      <DialogTitle>使用期間延長</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          選択した {machines.length} 台の使用期間の終了日を一括で変更します。開始日は変更されません。
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5 }}>
          <Typography variant="body2" sx={{ minWidth: 96 }}>新しい終了日</Typography>
          <TextField
            type="date"
            size="small"
            value={useTo}
            onChange={(e) => setUseTo(e.target.value)}
            inputProps={{ min: BM_PROJECT.periodFrom }}
          />
          <Button variant="outlined" size="small" onClick={() => setUseTo(BM_PROJECT.periodTo)}>
            工期末に設定
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: "112px", mb: 2 }}>
          工期：{fmt(BM_PROJECT.periodFrom)}〜{fmt(BM_PROJECT.periodTo)}（プロジェクト情報より）
        </Typography>
        {shortened.length > 0 && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {shortened.length} 台は現在の終了日より前の日付になります（使用期間が短縮されます）。
          </Alert>
        )}
        <TableContainer sx={{ maxHeight: 240 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>機械名</TableCell>
                <TableCell>現場内呼称</TableCell>
                <TableCell>現在の終了日</TableCell>
                <TableCell>変更後</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {machines.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>{m.name}</TableCell>
                  <TableCell>{m.alias}</TableCell>
                  <TableCell>{fmt(m.useTo)}</TableCell>
                  <TableCell sx={{ color: useTo ? "primary.main" : "text.disabled" }}>{useTo ? fmt(useTo) : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>キャンセル</Button>
        <Button variant="contained" disabled={!useTo} onClick={() => onApply(useTo)}>
          変更する
        </Button>
      </DialogActions>
    </Dialog>
  );
}
