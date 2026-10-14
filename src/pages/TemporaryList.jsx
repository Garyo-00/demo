import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Menu,
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
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import { useTemporaries } from "../components/TemporaryContext.jsx";
import { TP_REGISTRANTS, TP_TAGS, TP_TYPES, fmt } from "../temporaryData.js";

const EMPTY = {
  keyword: "",
  type: "",
  registrant: "",
  from: "",
  to: "",
  tag: "",
};

// 表示対象（検索条件とは独立。切り替えると即反映）
const SCOPES = [
  { value: "active", label: "使用中" },
  { value: "archived", label: "アーカイブ" },
];

export default function TemporaryList() {
  const navigate = useNavigate();
  const { items, patchItems } = useTemporaries();
  const [cond, setCond] = useState(EMPTY);
  const [applied, setApplied] = useState(EMPTY);
  const [scope, setScope] = useState("active");
  const [selected, setSelected] = useState([]);
  const [perPage, setPerPage] = useState(50);
  const [bulkAnchor, setBulkAnchor] = useState(null);

  const rows = items.filter((t) => {
    if (t.archived !== (scope === "archived")) return false;
    if (applied.type && t.type !== applied.type) return false;
    if (applied.registrant && t.registrant !== applied.registrant) return false;
    if (applied.tag && !t.tags.includes(applied.tag)) return false;
    if (applied.from && t.registeredAt < applied.from) return false;
    if (applied.to && t.registeredAt > applied.to) return false;
    if (applied.keyword) {
      const hay = `${t.name}${t.place}${t.mgmtNo}${t.archId}`;
      if (!hay.includes(applied.keyword)) return false;
    }
    return true;
  });
  const page = rows.slice(0, perPage);
  const allChecked = page.length > 0 && page.every((t) => selected.includes(t.id));
  const archivedView = scope === "archived";

  const set = (patch) => setCond((c) => ({ ...c, ...patch }));
  const toggle = (id) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <Box>
      <Typography variant="h1" align="center" sx={{ mb: 2 }}>
        仮設・その他一覧
      </Typography>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "auto 1fr auto 1fr" },
              gap: 1.5,
              alignItems: "center",
            }}
          >
            <Typography variant="body2">キーワード</Typography>
            <TextField value={cond.keyword} onChange={(e) => set({ keyword: e.target.value })} />
            <Typography variant="body2">種類</Typography>
            <Select displayEmpty value={cond.type} onChange={(e) => set({ type: e.target.value })}>
              <MenuItem value="">すべて</MenuItem>
              {TP_TYPES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
            <Typography variant="body2">登録者</Typography>
            <Select displayEmpty value={cond.registrant} onChange={(e) => set({ registrant: e.target.value })}>
              <MenuItem value="">すべて</MenuItem>
              {TP_REGISTRANTS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
            <Typography variant="body2">登録日</Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField type="date" value={cond.from} onChange={(e) => set({ from: e.target.value })} />
              <Typography variant="body2">〜</Typography>
              <TextField type="date" value={cond.to} onChange={(e) => set({ to: e.target.value })} />
            </Box>
            <Typography variant="body2">タグ</Typography>
            <Select displayEmpty value={cond.tag} onChange={(e) => set({ tag: e.target.value })} sx={{ maxWidth: 400 }}>
              <MenuItem value="">すべて</MenuItem>
              {TP_TAGS.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </Box>

          <Box sx={{ display: "flex", justifyContent: "center", gap: 1.5, mt: 2 }}>
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
          <RadioGroup
            row
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setSelected([]);
            }}
          >
            {SCOPES.map((s) => (
              <FormControlLabel key={s.value} value={s.value} control={<Radio size="small" />} label={s.label} />
            ))}
          </RadioGroup>
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
            <MenuItem onClick={() => setBulkAnchor(null)}>タグを追加</MenuItem>
            <Divider />
            {/* アーカイブ一覧を表示しているときは解除操作に切り替える */}
            <MenuItem
              onClick={() => {
                setBulkAnchor(null);
                patchItems(selected, { archived: !archivedView });
                setSelected([]);
              }}
            >
              {archivedView ? "アーカイブ解除" : "アーカイブにする"}
            </MenuItem>
          </Menu>
          <Button variant="outlined" size="small">インポート</Button>
          <Button variant="contained" size="small" onClick={() => navigate("/app/temporary/new")}>
            新規登録
          </Button>
        </Box>
      </Box>
      <Typography variant="body2" sx={{ mb: 1 }}>持込仮設・その他総数：{rows.length}</Typography>

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
                          ? s.filter((id) => !page.some((t) => t.id === id))
                          : [...new Set([...s, ...page.map((t) => t.id)])]
                      )
                    }
                    slotProps={{ input: { "aria-label": "全選択" } }}
                  />
                </TableCell>
                <TableCell>種類</TableCell>
                <TableCell sx={{ width: "28%" }}>名称</TableCell>
                <TableCell>設置場所</TableCell>
                <TableCell>現場内管理番号</TableCell>
                <TableCell>Arch ID</TableCell>
                <TableCell>登録日</TableCell>
                <TableCell>登録者</TableCell>
                <TableCell sx={{ width: 44 }}>タグ</TableCell>
                <TableCell sx={{ width: 44 }}>詳細</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {page.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ color: "text.secondary", py: 5 }}>
                    条件に一致する仮設・その他はありません。
                  </TableCell>
                </TableRow>
              )}
              {page.map((t) => (
                <TableRow key={t.id} hover>
                  <TableCell align="center">
                    <Checkbox
                      size="small"
                      checked={selected.includes(t.id)}
                      onChange={() => toggle(t.id)}
                      slotProps={{ input: { "aria-label": t.name } }}
                    />
                  </TableCell>
                  <TableCell>{t.type}</TableCell>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.place}</TableCell>
                  <TableCell align="center">{t.mgmtNo}</TableCell>
                  <TableCell align="center">{t.archId}</TableCell>
                  <TableCell>{fmt(t.registeredAt)}</TableCell>
                  <TableCell>{t.registrant}</TableCell>
                  <TableCell align="center">
                    {t.tags.length > 0 && (
                      <Tooltip title={t.tags.join("、")}>
                        <LocalOfferOutlinedIcon fontSize="small" sx={{ color: "text.secondary" }} />
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" aria-label="詳細" onClick={() => navigate(`/app/temporary/${t.id}`)}>
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
    </Box>
  );
}
