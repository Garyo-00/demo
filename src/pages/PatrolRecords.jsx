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
  TableSortLabel,
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
  EMPTY_SEARCH,
  PATROL_PROJECT,
  fmtDate,
  fmtMonth,
  isConfirmed,
  shiftMonth,
} from "../patrolData.js";

// CSVの固定列。この後ろに「項目N」「項目Nコメント」が最大項目数まで続く。
const CSV_HEADER = [
  "予定日",
  "実施日",
  "実施会社",
  "一次会社",
  "実施者",
  "次回予定日",
  "写真添付",
  "元請確認",
  "ヒアリング・所見",
  "詳細",
];

// 並び順のキー。未実施の記録は実施日を持たないため予定日で並べる。
const sortKey = (r) => r.date || r.plannedDate || "";

// 並び替えできる列。値の取り出し方だけを持つ。
const SORTABLE = {
  status: { label: "ステータス", of: (r) => (!r.date ? 0 : r.confirmedDate ? 2 : 1) },
  plannedDate: { label: "予定日", of: (r) => r.plannedDate },
  date: { label: "実施日", of: sortKey },
  company: { label: "実施会社", of: (r) => r.company },
  primaryCompany: { label: "一次会社", of: (r) => r.primaryCompany },
  inspector: { label: "実施者", of: (r) => r.inspector },
  nextDate: { label: "次回予定日", of: (r) => r.nextDate },
  photo: { label: "写真添付", of: (r) => (r.photos.length > 0 ? 1 : 0) },
  note: { label: "追記", of: (r) => ((r.notes?.length || 0) > 0 ? 1 : 0) },
};

const hasPhoto = (r) => r.photos.length > 0;
const hasNote = (r) => (r.notes?.length || 0) > 0;

// 「あり」「－」の表示。写真添付は現場対応が必要なため強調色にする。
function Mark({ on, emphasize }) {
  return on ? (
    <Box component="span" sx={{ color: emphasize ? "error.main" : "text.primary", fontWeight: 600 }}>
      あり
    </Box>
  ) : (
    <Box component="span" sx={{ color: "text.secondary" }}>－</Box>
  );
}

export default function PatrolRecords() {
  const navigate = useNavigate();
  const { records, listSearch, setListSearch } = usePatrol();
  const { month, cond } = listSearch;
  const setMonth = (m) => setListSearch((v) => ({ ...v, month: m }));
  const setCond = (c) => setListSearch((v) => ({ ...v, cond: c }));
  // 入力中の値。「検索」を押すまで絞り込みには反映しない。
  const [draft, setDraft] = useState(cond);
  // 既定は実施日の昇順。同じ日付は巡回記録No.順にする。
  const [sort, setSort] = useState({ key: "date", dir: "asc" });
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const narrow = useIsNarrow();

  const filtered = useMemo(
    () =>
      records
        .filter((r) => {
          // 巡回月は実施日で絞り込む（未実施の予定は予定日で拾う）
          if (!sortKey(r).startsWith(month)) return false;
          if (cond.company && r.company !== cond.company) return false;
          if (cond.primaryCompany && r.primaryCompany !== cond.primaryCompany) return false;
          if (cond.keyword) {
            const hay = [r.no, r.company, r.primaryCompany, r.inspector, r.accompany, r.hearing].join(" ");
            if (!hay.includes(cond.keyword)) return false;
          }
          return true;
        })
        .sort((a, b) => {
          const get = SORTABLE[sort.key].of;
          const [x, y] = [get(a), get(b)];
          let d = typeof x === "number" ? x - y : String(x).localeCompare(String(y), "ja");
          // 同値のときは巡回記録No.順（既定の並びでの同日内の順序もこれで決まる）
          if (d === 0) d = Number(a.no) - Number(b.no);
          return sort.dir === "asc" ? d : -d;
        }),
    [records, month, cond, sort]
  );
  const rows = filtered.slice(page * perPage, page * perPage + perPage);

  // 実施会社・一次会社は巡回実施時の自由入力のため、
  // プルダウンの選択肢は固定マスタではなく実際の記録の値から作る。
  const options = useMemo(() => {
    const uniq = (get) => [...new Set(records.map(get).filter(Boolean))].sort((a, b) => a.localeCompare(b, "ja"));
    return { company: uniq((r) => r.company), primaryCompany: uniq((r) => r.primaryCompany) };
  }, [records]);

  function search(next) {
    setDraft(next);
    setCond(next);
    setPage(0);
  }

  // CSVファイル出力。絞り込み結果の全件を出力する。
  function exportCsv() {
    // 巡回項目は「項目N」「項目Nコメント」の組で、出力対象の最大項目数まで列を伸ばす。
    const maxItems = filtered.reduce((n, r) => Math.max(n, r.items.length), 0);
    const header = [...CSV_HEADER];
    for (let i = 1; i <= maxItems; i += 1) header.push(`項目${i}`, `項目${i}コメント`);

    const detailUrl = (r) => `${window.location.origin}/patrol/records/${r.id}`;
    const body = filtered.map((r) => {
      const line = [
        fmtDate(r.plannedDate),
        fmtDate(r.date),
        r.company,
        r.primaryCompany,
        r.inspector,
        fmtDate(r.nextDate),
        hasPhoto(r) ? "あり" : "－",
        isConfirmed(r) ? "済" : "未",
        r.hearing,
        detailUrl(r),
      ];
      for (let i = 0; i < maxItems; i += 1) line.push(r.items[i]?.rating || "", r.items[i]?.comment || "");
      return line;
    });

    const csv = [header, ...body].map((line) => line.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    // Excel で開いたときに文字化けしないよう BOM を付ける
    const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fmtMonth(month)}分巡回記録・予定_${PATROL_PROJECT}.csv`;
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
              value={draft.keyword}
              onChange={(e) => setDraft({ ...draft, keyword: e.target.value })}
              sx={{ width: { xs: "100%", sm: 260 } }}
            />
            <Select
              displayEmpty
              value={draft.company}
              onChange={(e) => setDraft({ ...draft, company: e.target.value })}
              sx={{ width: { xs: "100%", sm: 220 } }}
            >
              <MenuItem value="">実施会社</MenuItem>
              {options.company.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
            <Select
              displayEmpty
              value={draft.primaryCompany}
              onChange={(e) => setDraft({ ...draft, primaryCompany: e.target.value })}
              sx={{ width: { xs: "100%", sm: 220 } }}
            >
              <MenuItem value="">一次会社</MenuItem>
              {options.primaryCompany.map((c) => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </Box>
          <Box sx={{ display: "flex", gap: 1.25, mt: 2 }}>
            <Button variant="contained" size="small" onClick={() => search(draft)}>
              検索
            </Button>
            <Button variant="outlined" size="small" onClick={() => search(EMPTY_SEARCH)}>
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
            <PatrolStatusChip record={{ date: "", confirmedDate: "" }} />
            <PatrolStatusChip record={{ date: "x", confirmedDate: "" }} />
            <PatrolStatusChip record={{ date: "x", confirmedDate: "x" }} />
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
                  ["写真添付", <Mark key="ph" on={hasPhoto(r)} emphasize />],
                  ["追記", <Mark key="nt" on={hasNote(r)} />],
                ]}
              />
            ))}
          </CardList>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  {[
                    ["status", 110, "left"],
                    ["plannedDate", 100, "left"],
                    ["date", 100, "left"],
                    ["company", undefined, "left"],
                    ["primaryCompany", undefined, "left"],
                    ["inspector", 140, "left"],
                    ["nextDate", 100, "left"],
                    ["photo", 80, "center"],
                    ["note", 70, "center"],
                  ].map(([key, width, align]) => (
                    <TableCell
                      key={key}
                      align={align}
                      sx={{ width }}
                      sortDirection={sort.key === key ? sort.dir : false}
                    >
                      <TableSortLabel
                        active={sort.key === key}
                        direction={sort.key === key ? sort.dir : "asc"}
                        onClick={() =>
                          setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))
                        }
                      >
                        {SORTABLE[key].label}
                      </TableSortLabel>
                    </TableCell>
                  ))}
                  <TableCell sx={{ width: 60 }} align="center">詳細</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ color: "text.secondary", py: 4 }}>
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
                      <Mark on={hasPhoto(r)} emphasize />
                    </TableCell>
                    <TableCell align="center">
                      <Mark on={hasNote(r)} />
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
