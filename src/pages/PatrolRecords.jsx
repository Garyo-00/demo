import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import { usePatrol } from "../components/patrol/PatrolContext.jsx";
import PatrolStatusChip from "../components/patrol/PatrolStatus.jsx";
import { CardList, RecordCard, useIsNarrow } from "../components/wpn/Responsive.jsx";
import {
  COMPANIES,
  PRIMARY_COMPANIES,
  fmtDate,
  fmtMonth,
  isConfirmed,
  shiftMonth,
} from "../patrolData.js";

const EMPTY_COND = { keyword: "", company: "", primaryCompany: "" };
const CSV_HEADER = ["ステータス", "予定日", "実施日", "実施会社", "一次会社", "実施者", "次回予定日", "写真添付"];

export default function PatrolRecords() {
  const navigate = useNavigate();
  const { records } = usePatrol();
  const [month, setMonth] = useState("2026-03");
  const [cond, setCond] = useState(EMPTY_COND);
  const [applied, setApplied] = useState(EMPTY_COND);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const narrow = useIsNarrow();

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        // 巡回月は実施日で絞り込む（未実施の予定は予定日で拾う）
        if (!(r.date || r.plannedDate).startsWith(month)) return false;
        if (applied.company && r.company !== applied.company) return false;
        if (applied.primaryCompany && r.primaryCompany !== applied.primaryCompany) return false;
        if (applied.keyword) {
          const hay = [r.no, r.company, r.primaryCompany, r.inspector, r.accompany, r.hearing].join(" ");
          if (!hay.includes(applied.keyword)) return false;
        }
        return true;
      }),
    [records, month, applied]
  );
  const rows = filtered.slice(page * perPage, page * perPage + perPage);

  function search(next) {
    setCond(next);
    setApplied(next);
    setPage(0);
  }

  // CSVファイル出力（デモ。画面に出ている絞り込み結果をそのまま書き出す）
  function exportCsv() {
    const body = filtered.map((r) => [
      isConfirmed(r) ? "元請確認済み" : "巡回済み",
      fmtDate(r.plannedDate),
      fmtDate(r.date),
      r.company,
      r.primaryCompany,
      r.inspector,
      fmtDate(r.nextDate),
      r.photos.length > 0 ? "あり" : "－",
    ]);
    const csv = [CSV_HEADER, ...body].map((line) => line.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    // Excel で開いたときに文字化けしないよう BOM を付ける
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `巡回パトロール記録_${month}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h1" sx={{ mb: 2 }}>
          巡回/パトロール記録・予定
        </Typography>

        <Alert severity="info" icon={<InfoOutlinedIcon fontSize="small" />} sx={{ mb: 2, fontSize: 12.5, py: 0.5 }}>
          巡回記録は現場のQRコードを読み取ったユーザーのみが作成します。この一覧からは作成できません。
        </Alert>

        {/* 検索条件 */}
        <Box
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 2,
            bgcolor: "#f7f8fb",
            p: 2,
            mb: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <TextField
              label="キーワード"
              value={cond.keyword}
              onChange={(e) => setCond({ ...cond, keyword: e.target.value })}
              sx={{ width: { xs: "100%", sm: 260 } }}
            />
            <Select
              displayEmpty
              value={cond.company}
              onChange={(e) => setCond({ ...cond, company: e.target.value })}
              sx={{ width: { xs: "100%", sm: 220 } }}
            >
              <MenuItem value="">実施会社</MenuItem>
              {COMPANIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
            <Select
              displayEmpty
              value={cond.primaryCompany}
              onChange={(e) => setCond({ ...cond, primaryCompany: e.target.value })}
              sx={{ width: { xs: "100%", sm: 220 } }}
            >
              <MenuItem value="">一次会社</MenuItem>
              {PRIMARY_COMPANIES.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ display: "flex", gap: 1.25, mt: 2 }}>
            <Button variant="contained" size="small" onClick={() => search(cond)}>
              検索
            </Button>
            <Button variant="outlined" size="small" onClick={() => search(EMPTY_COND)}>
              クリア
            </Button>
          </Box>
        </Box>

        {/* 巡回月の切替と凡例 */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 1.5 }}>
          <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
            <Typography sx={{ fontSize: 12.5, fontWeight: 600 }}>巡回月</Typography>
            <IconButton size="small" onClick={() => setMonth(shiftMonth(month, -1))} aria-label="前月">
              <ChevronLeftIcon fontSize="small" />
            </IconButton>
            <Box component="label" sx={{ display: "inline-flex", alignItems: "center", gap: 0.75, cursor: "pointer" }}>
              <Typography sx={{ fontSize: 13, fontWeight: 600, minWidth: 78, textAlign: "center" }}>
                {fmtMonth(month)}
              </Typography>
              {/* 幅を絞ってカレンダーアイコンだけを見せる（値の表示は左のラベルが担う） */}
              <Box
                component="input"
                type="month"
                value={month}
                onChange={(e) => e.target.value && setMonth(e.target.value)}
                sx={{
                  border: 0,
                  background: "none",
                  font: "inherit",
                  fontSize: 12,
                  color: "text.secondary",
                  width: 16,
                  p: 0,
                  cursor: "pointer",
                  "&::-webkit-calendar-picker-indicator": { cursor: "pointer", opacity: 0.6 },
                }}
              />
            </Box>
            <IconButton size="small" onClick={() => setMonth(shiftMonth(month, 1))} aria-label="翌月">
              <ChevronRightIcon fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: { sm: "auto" } }}>
            {/* ステータスの凡例（クリックできる絞り込みではない） */}
            <Typography color="text.secondary" sx={{ fontSize: 11.5 }}>凡例</Typography>
            <PatrolStatusChip record={{ confirmedDate: "x" }} />
            <PatrolStatusChip record={{ confirmedDate: "" }} />
            <Button size="small" variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={exportCsv}>
              CSVファイル出力
            </Button>
          </Box>
        </Box>

        {/* 一覧。狭い画面ではテーブルの代わりにカードで出す */}
        {narrow ? (
          <CardList empty="条件に一致する巡回記録はありません。">
            {rows.map((r) => (
              <RecordCard
                key={r.id}
                title={`巡回記録No. ${r.no}`}
                headRight={
                  <>
                    <PatrolStatusChip record={r} />
                    <IconButton size="small" onClick={() => navigate(`/patrol/records/${r.id}`)} aria-label="詳細">
                      <InfoOutlinedIcon fontSize="small" />
                    </IconButton>
                  </>
                }
                rows={[
                  ["予定日", fmtDate(r.plannedDate)],
                  ["実施日", fmtDate(r.date)],
                  ["実施会社", r.company],
                  ["一次会社", r.primaryCompany],
                  ["実施者", r.inspector],
                  ["次回予定日", fmtDate(r.nextDate)],
                  [
                    "写真添付",
                    r.photos.length > 0 ? (
                      <Box key="ph" component="span" sx={{ color: "error.main", fontWeight: 600 }}>
                        あり
                      </Box>
                    ) : (
                      "－"
                    ),
                  ],
                ]}
              />
            ))}
          </CardList>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: 110 }}>ステータス</TableCell>
                  <TableCell sx={{ width: 100 }}>予定日</TableCell>
                  <TableCell sx={{ width: 100 }}>実施日</TableCell>
                  <TableCell>実施会社</TableCell>
                  <TableCell>一次会社</TableCell>
                  <TableCell sx={{ width: 140 }}>実施者</TableCell>
                  <TableCell sx={{ width: 100 }}>次回予定日</TableCell>
                  <TableCell sx={{ width: 80 }} align="center">写真添付</TableCell>
                  <TableCell sx={{ width: 60 }} align="center">詳細</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ color: "text.secondary", py: 4 }}>
                      条件に一致する巡回記録はありません。
                    </TableCell>
                  </TableRow>
                )}
                {rows.map((r) => (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <PatrolStatusChip record={r} />
                    </TableCell>
                    <TableCell>{fmtDate(r.plannedDate)}</TableCell>
                    <TableCell>{fmtDate(r.date)}</TableCell>
                    <TableCell>{r.company}</TableCell>
                    <TableCell>{r.primaryCompany}</TableCell>
                    <TableCell>{r.inspector}</TableCell>
                    <TableCell>{fmtDate(r.nextDate)}</TableCell>
                    <TableCell align="center">
                      {r.photos.length > 0 ? (
                        <Box component="span" sx={{ color: "error.main", fontWeight: 600 }}>あり</Box>
                      ) : (
                        <Box component="span" sx={{ color: "text.secondary" }}>－</Box>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => navigate(`/patrol/records/${r.id}`)} aria-label="詳細">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          onPageChange={(_, p) => setPage(p)}
          rowsPerPage={perPage}
          rowsPerPageOptions={[25, 50, 100]}
          onRowsPerPageChange={(e) => {
            setPerPage(Number(e.target.value));
            setPage(0);
          }}
          labelRowsPerPage="ページあたりの行数:"
          labelDisplayedRows={({ from, to, count }) => `${from}〜${to} / ${count}`}
        />
      </CardContent>
    </Card>
  );
}
