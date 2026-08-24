import { Fragment, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  IconButton,
  MenuItem,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import FirstPageIcon from "@mui/icons-material/FirstPage";
import LastPageIcon from "@mui/icons-material/LastPage";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { useWpn } from "../components/wpn/WpnContext.jsx";
import PlanDrawer from "../components/wpn/PlanDrawer.jsx";
import { StatusBadge, STATUS_COLOR } from "../components/wpn/PlanDetailContent.jsx";
import {
  APPLICANTS,
  COMPANIES,
  MACHINE_CATEGORIES,
  PLAN_STATUS,
  categoryCounts,
  machineById,
} from "../workPlanNeoPlanData.js";

const STATUS_KEYS = ["applying", "approved", "rejected"];
const EMPTY_COND = { category: "", alias: "", applicant: "", company: "", statuses: STATUS_KEYS };

export default function WorkPlanNeoPlans() {
  const navigate = useNavigate();
  const { plans } = useWpn();
  const [openSearch, setOpenSearch] = useState(true);
  const [span, setSpan] = useState("day"); // day | week
  const [date, setDate] = useState("2026-07-08");
  const [cond, setCond] = useState(EMPTY_COND);
  const [applied, setApplied] = useState(EMPTY_COND);
  const [expanded, setExpanded] = useState({});
  const [drawerId, setDrawerId] = useState(null);
  const [perPage, setPerPage] = useState(50);

  const filtered = plans.filter((p) => {
    if (!applied.statuses.includes(p.status)) return false;
    if (applied.applicant && p.applicant !== applied.applicant) return false;
    if (applied.company && p.company !== applied.company) return false;
    if (applied.category && !categoryCounts(p.machineIds).some((c) => c.category === applied.category)) return false;
    if (applied.alias) {
      const hit = p.machineIds.some((id) => (machineById(id)?.alias || "").includes(applied.alias));
      if (!hit) return false;
    }
    return true;
  });
  const rows = filtered.slice(0, perPage);

  function toggleStatus(key) {
    setCond((c) => ({
      ...c,
      statuses: c.statuses.includes(key) ? c.statuses.filter((s) => s !== key) : [...c.statuses, key],
    }));
  }
  function shiftDate(days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    setDate(d.toISOString().slice(0, 10));
  }

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
            <Typography variant="h1">作業計画書一覧</Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              sx={{ ml: "auto" }}
              onClick={() => navigate("/workplan-neo/plans/new")}
            >
              新規作成
            </Button>
          </Box>

          {/* 検索条件 */}
          <Accordion
            expanded={openSearch}
            onChange={() => setOpenSearch((o) => !o)}
            disableGutters
            elevation={0}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, mb: 2, "&:before": { display: "none" } }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ minHeight: 44 }}>
              <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>検索条件</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5, flexWrap: "wrap" }}>
                <ToggleButtonGroup
                  exclusive
                  size="small"
                  value={span}
                  onChange={(_, v) => v && setSpan(v)}
                  aria-label="表示単位"
                >
                  <ToggleButton value="day">日</ToggleButton>
                  <ToggleButton value="week">週</ToggleButton>
                </ToggleButtonGroup>
                <IconButton size="small" onClick={() => shiftDate(-7)} aria-label="前週">
                  <FirstPageIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => shiftDate(-1)} aria-label="前日">
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <TextField type="date" value={date} onChange={(e) => setDate(e.target.value)} sx={{ width: 165 }} />
                <IconButton size="small" onClick={() => shiftDate(1)} aria-label="翌日">
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => shiftDate(7)} aria-label="翌週">
                  <LastPageIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
                <Select
                  displayEmpty
                  value={cond.category}
                  onChange={(e) => setCond({ ...cond, category: e.target.value })}
                  sx={{ width: 240 }}
                >
                  <MenuItem value="">持込/レンタル機械カテゴリ</MenuItem>
                  {MACHINE_CATEGORIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
                <TextField
                  placeholder="現場内呼称"
                  value={cond.alias}
                  onChange={(e) => setCond({ ...cond, alias: e.target.value })}
                  sx={{ width: 200 }}
                />
                <Select
                  displayEmpty
                  value={cond.applicant}
                  onChange={(e) => setCond({ ...cond, applicant: e.target.value })}
                  sx={{ width: 180 }}
                >
                  <MenuItem value="">申請者</MenuItem>
                  {APPLICANTS.map((a) => (
                    <MenuItem key={a} value={a}>{a}</MenuItem>
                  ))}
                </Select>
                <Select
                  displayEmpty
                  value={cond.company}
                  onChange={(e) => setCond({ ...cond, company: e.target.value })}
                  sx={{ width: 180 }}
                >
                  <MenuItem value="">協力会社名</MenuItem>
                  {COMPANIES.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                    申請ステータス
                  </Typography>
                  <Box sx={{ display: "flex", gap: 0.75 }}>
                    {STATUS_KEYS.map((k) => {
                      const on = cond.statuses.includes(k);
                      return (
                        <Chip
                          key={k}
                          size="small"
                          label={PLAN_STATUS[k].label}
                          color={STATUS_COLOR[k]}
                          variant={on ? "filled" : "outlined"}
                          onClick={() => toggleStatus(k)}
                          sx={{ opacity: on ? 1 : 0.55 }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: "flex", gap: 1.25, mt: 2 }}>
                <Button variant="contained" size="small" onClick={() => setApplied(cond)}>
                  検索
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setCond(EMPTY_COND);
                    setApplied(EMPTY_COND);
                  }}
                >
                  条件をリセット
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>

          {/* 一覧 */}
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 42 }}>
                    <Checkbox size="small" slotProps={{ input: { "aria-label": "全選択" } }} />
                  </TableCell>
                  <TableCell sx={{ width: "18%" }}>作業計画書名</TableCell>
                  <TableCell>持込/レンタル機械カテゴリ</TableCell>
                  <TableCell sx={{ width: 130 }}>申請者</TableCell>
                  <TableCell sx={{ width: 140 }}>協力会社名</TableCell>
                  <TableCell sx={{ width: 120 }}>申請ステータス</TableCell>
                  <TableCell sx={{ width: 60 }}>詳細</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ color: "text.secondary", py: 4 }}>
                      条件に一致する作業計画書はありません。
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((p) => {
                  const cats = categoryCounts(p.machineIds);
                  const open = !!expanded[p.id];
                  return (
                    <Fragment key={p.id}>
                      <TableRow hover>
                        <TableCell align="center">
                          <Checkbox size="small" slotProps={{ input: { "aria-label": "選択" } }} />
                        </TableCell>
                        <TableCell>{p.name}</TableCell>
                        <TableCell>
                          <Button
                            size="small"
                            endIcon={
                              <ExpandMoreIcon
                                sx={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }}
                              />
                            }
                            onClick={() => setExpanded((e) => ({ ...e, [p.id]: !open }))}
                          >
                            {p.machineIds.length}台
                          </Button>
                          {cats.length > 0 && (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                              {cats.map((c) => (
                                <Chip
                                  key={c.category}
                                  size="small"
                                  variant="outlined"
                                  label={`${c.category}（${c.count}台）`}
                                />
                              ))}
                            </Box>
                          )}
                        </TableCell>
                        <TableCell>{p.applicant}</TableCell>
                        <TableCell>{p.company}</TableCell>
                        <TableCell>
                          <StatusBadge status={p.status} />
                        </TableCell>
                        <TableCell align="center">
                          <IconButton size="small" onClick={() => setDrawerId(p.id)} aria-label="詳細">
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                          <Collapse in={open} unmountOnExit>
                            <Box sx={{ px: 2, py: 1.5, bgcolor: "#f7f8fb" }}>
                              <Table size="small">
                                <TableHead>
                                  <TableRow>
                                    <TableCell>機械名</TableCell>
                                    <TableCell sx={{ width: "26%" }}>現場内呼称</TableCell>
                                    <TableCell sx={{ width: "22%" }}>カテゴリ</TableCell>
                                    <TableCell sx={{ width: 100 }}>始業前点検</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {p.machineIds.length === 0 && (
                                    <TableRow>
                                      <TableCell colSpan={4} align="center" sx={{ color: "text.secondary", py: 3 }}>
                                        機械は登録されていません。
                                      </TableCell>
                                    </TableRow>
                                  )}
                                  {p.machineIds.map((id) => {
                                    const m = machineById(id);
                                    if (!m) return null;
                                    return (
                                      <TableRow key={id}>
                                        <TableCell>{m.name}</TableCell>
                                        <TableCell>{m.alias}</TableCell>
                                        <TableCell>{m.category}</TableCell>
                                        <TableCell>
                                          <Chip size="small" label="未" variant="outlined" />
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filtered.length}
            page={0}
            onPageChange={() => {}}
            rowsPerPage={perPage}
            rowsPerPageOptions={[25, 50, 100]}
            onRowsPerPageChange={(e) => setPerPage(Number(e.target.value))}
            labelRowsPerPage="ページあたりの行数:"
            labelDisplayedRows={({ from, to, count }) => `${from}〜${to} / ${count}`}
          />
        </CardContent>
      </Card>

      {drawerId && <PlanDrawer planId={drawerId} onClose={() => setDrawerId(null)} />}
    </>
  );
}
