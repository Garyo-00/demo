import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
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
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchTwoToneIcon from "@mui/icons-material/SearchTwoTone";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import { useKynext } from "./KynextContext.jsx";
import { DisabledTooltip, StatusChip, useConfirmDialog, useIsMobile } from "./KynextCommon.jsx";
import { addDays, fmtDate, fmtDateJa, fmtMonthJa, todayYmd } from "../../kynextData.js";

// ===== KYシート一覧・KY出力で共有する部品（本番 features/kySheet 配下の SearchCard / DataGrid / Card 相当） =====

// 仮作成シートは中身が未入力なので出力対象にならない（本番 ExportableStatuses）
export const EXPORTABLE_STATUSES = ["NotStarted", "InProgress", "Completed"];

// キーワードは一次会社・作業内容の部分一致（本番 listKYNEXTSheets の keyword 検索）
export const matchKeyword = (sheet, keyword) => {
  const k = (keyword || "").trim();
  if (!k) return true;
  return (sheet.firstCompanyName || "").includes(k) || (sheet.workContent || "").includes(k);
};

// 一覧の見出しラベル（本番 useBasicDetailItemNames）。使用中テンプレートの基本情報カタログから取る。
export const useBasicDetailItemNames = () => {
  const { catalog } = useKynext();
  const c = catalog?.basicDetailCatalog;
  return {
    firstCompanyName: c?.firstCompanyLabel || "一次会社",
    workContentName: c?.workContentLabel || "作業内容",
    workDateName: c?.workDateLabel || "作業日",
  };
};

// 元請確認ブロックの列を出すかどうか（本番 useWorkflowCatalogFlags）
export const useWorkflowCatalogFlags = () => {
  const { catalog } = useKynext();
  const w = catalog?.workflowCatalog;
  return {
    hasCreateConfirm: w?.hasGeneralContractorConfirmCreateKynextSheet ?? false,
    hasCompleteConfirm: w?.hasGeneralContractorConfirmPostWork ?? false,
  };
};

// ---------- 検索カード（本番 SearchCard） ----------
// mode: 'list' | 'export'。スマホの一覧では Accordion に畳む。
export function SearchCard({ mode = "list", keyword, onKeywordChange, onSearch, onClear, firstCompanyName, workContentName }) {
  const mobile = useIsMobile();
  const title = mode === "list" ? "KYシートを検索する" : "KYシート出力";

  const formContent = (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch();
      }}
    >
      <Stack spacing={2}>
        <TextField
          fullWidth
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder={`キーワード(${firstCompanyName}、${workContentName}で検索)`}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchTwoToneIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        <Stack direction="row" spacing={2} sx={{ justifyContent: "center" }}>
          <Button type="submit" variant="contained">
            検索
          </Button>
          <Button variant="outlined" onClick={onClear}>
            クリア
          </Button>
        </Stack>
      </Stack>
    </Box>
  );

  if (mobile && mode === "list") {
    return (
      <Accordion sx={{ borderRadius: 1, "&:last-of-type": { borderRadius: 1 } }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" component="h1" sx={{ fontWeight: "bold", fontSize: 18 }}>
            KYシートを検索する
          </Typography>
        </AccordionSummary>
        <AccordionDetails>{formContent}</AccordionDetails>
      </Accordion>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack spacing={3}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: "bold", fontSize: 18 }}>
              {title}
            </Typography>
          </Stack>
          {formContent}
        </Stack>
      </CardContent>
    </Card>
  );
}

// 日付／月の入力枠。値の表示は日本語（yyyy年M月d日）で、右端のカレンダーアイコンから native 入力を開く。
// （本番は @mui/x-date-pickers の DatePicker。依存が無いので type="date" / "month" で代替）
function NativePickerField({ type, value, label, onChange, width }) {
  return (
    <Box
      component="label"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 0.5,
        width,
        height: 36,
        px: 1.25,
        border: "1px solid #d7dbe4",
        borderRadius: 2,
        bgcolor: "#fff",
        cursor: "pointer",
        "&:hover": { borderColor: "text.primary" },
      }}
    >
      <Typography sx={{ fontSize: 13, whiteSpace: "nowrap" }}>{label}</Typography>
      <Box
        component="input"
        type={type}
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        aria-label={type === "month" ? "月を選択" : "日付を選択"}
        sx={{
          border: 0,
          background: "none",
          font: "inherit",
          color: "text.secondary",
          width: 18,
          p: 0,
          cursor: "pointer",
          "&::-webkit-calendar-picker-indicator": { cursor: "pointer", opacity: 0.7 },
        }}
      />
    </Box>
  );
}

// ---------- 日付ナビゲーター（本番 KYNEXTSheetDataGrid の 今日／前日／翌日／日付入力） ----------
export function DateNavigator({ date, onChange }) {
  const mobile = useIsMobile();
  return (
    <Stack direction="row" sx={{ alignItems: "center" }}>
      <Button variant="text" size="small" onClick={() => onChange(todayYmd())}>
        今日
      </Button>
      <Stack direction="row" sx={{ alignItems: "center" }}>
        <IconButton size="small" onClick={() => onChange(addDays(date, -1))} aria-label="前日">
          <ChevronLeftIcon />
        </IconButton>
        <NativePickerField type="date" value={date} label={fmtDateJa(date)} onChange={onChange} width={mobile ? 150 : 200} />
        <IconButton size="small" onClick={() => onChange(addDays(date, 1))} aria-label="翌日">
          <ChevronRightIcon />
        </IconButton>
      </Stack>
    </Stack>
  );
}

// 月の加減算（YYYY-MM）
export const addMonths = (ym, n) => {
  const [y, m] = ym.split("-").map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

// ---------- 月ナビゲーター（本番 MonthNavigator） ----------
export function MonthNavigator({ month, onChange }) {
  const mobile = useIsMobile();
  return (
    <Stack direction="row" sx={{ alignItems: "center" }}>
      <Button variant="text" size="small" onClick={() => onChange(todayYmd().slice(0, 7))}>
        今月
      </Button>
      <IconButton size="small" onClick={() => onChange(addMonths(month, -1))} aria-label="前月">
        <ChevronLeftIcon />
      </IconButton>
      <NativePickerField type="month" value={month} label={fmtMonthJa(month)} onChange={onChange} width={mobile ? 130 : 160} />
      <IconButton size="small" onClick={() => onChange(addMonths(month, 1))} aria-label="翌月">
        <ChevronRightIcon />
      </IconButton>
    </Stack>
  );
}

// ---------- 一次会社の複数選択（本番 dataGridByCompany の Autocomplete） ----------
// selected は会社名の配列。null は「すべての会社」。
export function CompanyMultiSelect({ sheets, selected, onChange, label }) {
  const grouped = useMemo(() => {
    const map = new Map();
    for (const s of sheets) {
      const c = s.firstCompanyName || "(会社名未設定)";
      map.set(c, (map.get(c) ?? 0) + 1);
    }
    return [...map.entries()].map(([company, count]) => ({ company, count }));
  }, [sheets]);
  const options = useMemo(() => [{ company: null, count: sheets.length }, ...grouped], [grouped, sheets.length]);
  // 選択済みの会社を選択肢から除外
  const available = options.filter((o) => !selected.includes(o.company));
  const value = selected.map((c) => options.find((o) => o.company === c)).filter(Boolean);
  return (
    <Autocomplete
      size="small"
      sx={{ minWidth: 240 }}
      multiple
      options={available}
      getOptionLabel={(o) => (o.company === null ? `すべての会社（${o.count}件）` : `${o.company}（${o.count}件）`)}
      isOptionEqualToValue={(o, v) => o.company === v.company}
      value={value}
      onChange={(_, opts) => {
        const companies = opts.map((o) => o.company);
        // 「すべての会社」が選択されたら、他の選択をクリア
        onChange(companies.includes(null) ? [null] : companies);
      }}
      disabled={available.length === 0}
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
}

// 会社の選択で絞り込む
export const filterByCompanies = (sheets, selected) => {
  if (selected.includes(null)) return sheets;
  if (selected.length === 0) return [];
  return sheets.filter((s) => selected.includes(s.firstCompanyName || "(会社名未設定)"));
};

// ---------- コピー作成（本番 useCopyKYNEXTSheet） ----------
// コピー元のカタログが使用中テンプレートのカタログと違うときは、引き継げない項目がある旨を確認してから作成画面へ。
export function useCopySheet() {
  const navigate = useNavigate();
  const { getSheet, catalog } = useKynext();
  const dialog = useConfirmDialog({
    title: "確認",
    children: (
      <Typography>
        テンプレートに変更がありました。
        <br />
        コピーが不完全な場合があるので提出前に確認してください
      </Typography>
    ),
  });
  const copy = async (id) => {
    const sheet = getSheet(id);
    if (!sheet) return;
    if (sheet.catalog?.id !== catalog?.id) {
      const { accepted } = await dialog.confirm();
      if (!accepted) return;
    }
    navigate("/kynext/ky-sheets/create", { state: { copy: true, kynextSheet: id } });
  };
  return { copy, renderDialog: dialog.renderDialog };
}

// ---------- 削除ダイアログ（本番 useDeleteKYNEXTSheet） ----------
export function useDeleteSheetDialog() {
  const { deleteSheet: remove, notify } = useKynext();
  const [target, setTarget] = useState(null); // { id, workContent }
  const [acknowledged, setAcknowledged] = useState(false);
  useEffect(() => {
    if (target) setAcknowledged(false);
  }, [target]);

  const deleteSheet = (id, workContent) => setTarget({ id, workContent });
  const close = () => setTarget(null);
  const accept = () => {
    remove(target.id);
    notify("KYシートを削除しました");
    close();
  };

  const renderDeleteDialog = () => (
    <Dialog open={!!target} onClose={close} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", fontSize: "22px", color: "error.main" }}>KYシートを削除しますか？</DialogTitle>
      <DialogContent>
        {target?.workContent && (
          <Typography variant="h4" sx={{ mb: 2, fontSize: 18, fontWeight: 600 }}>{`作業内容「${target.workContent}」`}</Typography>
        )}
        <Alert severity="warning" sx={{ mb: 2 }}>
          この操作は取り消せません。
        </Alert>
        <FormControlLabel
          control={<Checkbox checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />}
          label={<Typography variant="body2">確認しました</Typography>}
        />
      </DialogContent>
      <DialogActions sx={{ padding: "16px 24px 24px" }}>
        <Button onClick={close}>キャンセル</Button>
        <Button variant="contained" color="error" onClick={accept} disabled={!acknowledged}>
          削除する
        </Button>
      </DialogActions>
    </Dialog>
  );
  return { deleteSheet, renderDeleteDialog };
}

// 仮作成シートの削除可否（本番 permissions.deletable の簡略版）。
// 協力会社は自社（自身が作成した）シートのみ削除できる。
export function useDeleteDeniedReason() {
  const { me } = useKynext();
  return (sheet) => {
    if (me.key === "partner" && sheet.firstCompanyName !== me.company) return "自身が作成したKYシートのみ削除できます";
    return null;
  };
}

const ActionButtonSx = { minWidth: "auto", px: 0.75 };

// ---------- 一覧テーブル（本番 KYNEXTSheetDataGrid + columns.tsx。@mui/x-data-grid が無いので MUI Table） ----------
// mode: 'list' | 'export'。export では先頭に checkbox 列。
// showWorkDate: 作業日列（「一次会社で確認」タブ）。showConfirmColumns: 提出後確認／終了後確認列。
export function SheetTable({
  rows,
  mode = "list",
  showWorkDate = false,
  showConfirmColumns = true,
  onCopy,
  onDelete,
  createDeniedReason = null,
  deleteDeniedReasonOf,
  selectedIds = [],
  onSelectedIdsChange,
  labels,
}) {
  const navigate = useNavigate();
  const { hasCreateConfirm, hasCompleteConfirm } = useWorkflowCatalogFlags();
  const isExport = mode === "export";
  const allSelected = rows.length > 0 && rows.every((r) => selectedIds.includes(r.id));
  const someSelected = rows.some((r) => selectedIds.includes(r.id));
  const toggle = (id) => onSelectedIdsChange?.(selectedIds.includes(id) ? selectedIds.filter((x) => x !== id) : [...selectedIds, id]);
  const toggleAll = () => onSelectedIdsChange?.(allSelected ? selectedIds.filter((id) => !rows.some((r) => r.id === id)) : [...new Set([...selectedIds, ...rows.map((r) => r.id)])]);

  // Cmd/Ctrl クリックは別タブで開く（本番 openPath）
  const openPath = (path, event) => {
    if (event?.metaKey || event?.ctrlKey) window.open(path, "_blank");
    else navigate(path);
  };
  const openDetail = (row, e) => openPath(`/kynext/ky-sheets/${row.id}`, e);
  // 仮作成シートは中身が未入力なので詳細ではなく作成フローへ送る
  const openCreateFlow = (row, e) => openPath(`/kynext/ky-sheets/${row.id}/edit`, e);

  const confirmerName = (c) => (c?.confirmedAt ? c.confirmer?.name || "ー" : "ー");
  const colCount = 4 + (isExport ? 1 : 0) + (onCopy ? 1 : 0) + (showWorkDate ? 1 : 0) + (showConfirmColumns && hasCreateConfirm ? 1 : 0) + (showConfirmColumns && hasCompleteConfirm ? 1 : 0) + 1;

  return (
    <TableContainer sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2 }}>
      <Table size="small" sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow>
            {isExport && (
              <TableCell padding="checkbox">
                <Checkbox size="small" indeterminate={someSelected && !allSelected} checked={allSelected} onChange={toggleAll} slotProps={{ input: { "aria-label": "すべて選択" } }} />
              </TableCell>
            )}
            {onCopy && <TableCell sx={{ width: 90 }}>コピー作成</TableCell>}
            {showWorkDate && <TableCell sx={{ width: 110 }}>{labels.workDateName}</TableCell>}
            <TableCell>{labels.firstCompanyName}</TableCell>
            <TableCell>{labels.workContentName}</TableCell>
            <TableCell sx={{ width: 90 }} align="right">
              作業人数
            </TableCell>
            {showConfirmColumns && hasCreateConfirm && <TableCell sx={{ width: 120 }}>提出後確認</TableCell>}
            {showConfirmColumns && hasCompleteConfirm && <TableCell sx={{ width: 120 }}>終了後確認</TableCell>}
            <TableCell sx={{ width: 100 }}>ステータス</TableCell>
            <TableCell sx={{ width: onDelete ? 130 : 80 }}>詳細</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={colCount} align="center" sx={{ py: 6, color: "text.secondary" }}>
                該当するKYシートがありません
              </TableCell>
            </TableRow>
          )}
          {rows.map((row) => {
            const isProvisional = row.status === "Provisional";
            const deleteReason = isProvisional && onDelete ? deleteDeniedReasonOf?.(row) ?? null : null;
            const selected = selectedIds.includes(row.id);
            return (
              <TableRow
                key={row.id}
                hover
                selected={selected}
                onClick={(e) => (isExport ? toggle(row.id) : isProvisional ? undefined : openDetail(row, e))}
                sx={{ cursor: isExport || !isProvisional ? "pointer" : "default" }}
              >
                {isExport && (
                  <TableCell padding="checkbox">
                    <Checkbox size="small" checked={selected} onChange={() => toggle(row.id)} onClick={(e) => e.stopPropagation()} slotProps={{ input: { "aria-label": "選択" } }} />
                  </TableCell>
                )}
                {onCopy && (
                  <TableCell>
                    <IconButton
                      size="small"
                      aria-label="コピー作成"
                      disabled={isProvisional}
                      onClick={(e) => {
                        e.stopPropagation();
                        onCopy(row.id);
                      }}
                    >
                      <ContentCopyIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                )}
                {showWorkDate && <TableCell sx={{ whiteSpace: "nowrap" }}>{fmtDate(row.workDate)}</TableCell>}
                <TableCell>{row.firstCompanyName || ""}</TableCell>
                <TableCell>{row.workContent || ""}</TableCell>
                <TableCell align="right">{row.workerChecklists?.length ?? 0}</TableCell>
                {showConfirmColumns && hasCreateConfirm && <TableCell>{confirmerName(row.createConfirm)}</TableCell>}
                {showConfirmColumns && hasCompleteConfirm && <TableCell>{confirmerName(row.completeConfirm)}</TableCell>}
                <TableCell>
                  <StatusChip status={row.status} />
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                  {/* 作成権限が無くても仮作成行は「詳細」に置き換えず、「本作成」を disabled にする */}
                  <DisabledTooltip disabled={isProvisional && !!createDeniedReason} title={createDeniedReason ?? ""}>
                    <Button
                      variant="text"
                      size="small"
                      sx={ActionButtonSx}
                      disabled={isProvisional && !!createDeniedReason}
                      onClick={(e) => (isProvisional ? openCreateFlow(row, e) : openDetail(row, e))}
                    >
                      {isProvisional ? "本作成" : "詳細"}
                    </Button>
                  </DisabledTooltip>
                  {isProvisional && onDelete && (
                    <DisabledTooltip disabled={!!deleteReason} title={deleteReason ?? ""}>
                      <Button variant="text" size="small" color="error" sx={ActionButtonSx} disabled={!!deleteReason} onClick={() => onDelete(row)}>
                        削除
                      </Button>
                    </DisabledTooltip>
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

// ---------- ページ送り（本番 DataGrid の pagination。pageSizeOptions 10/25/50） ----------
export function usePagination(rows, initialSize = 10) {
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(initialSize);
  const safePage = Math.min(page, Math.max(0, Math.ceil(rows.length / perPage) - 1));
  const pageRows = rows.slice(safePage * perPage, safePage * perPage + perPage);
  const render = () => (
    <TablePagination
      component="div"
      count={rows.length}
      page={safePage}
      onPageChange={(_, p) => setPage(p)}
      rowsPerPage={perPage}
      onRowsPerPageChange={(e) => {
        setPerPage(Number(e.target.value));
        setPage(0);
      }}
      rowsPerPageOptions={[10, 25, 50]}
      labelRowsPerPage="表示件数"
      labelDisplayedRows={({ from, to, count }) => `${from}–${to} / ${count}`}
    />
  );
  return { pageRows, renderPagination: render };
}

// ---------- カード（本番 KYNEXTSheetCard） ----------
export function SheetCard({ sheet, onClick, showWorkDate = false, onCopy }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardActionArea component="div" onClick={(e) => onClick(sheet, e)} sx={{ height: "100%" }}>
        <CardContent>
          <Stack direction="row" sx={{ alignItems: "center" }}>
            <Stack sx={{ flex: 1, minWidth: 0 }}>
              {showWorkDate && sheet.workDate && (
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    作業日
                  </Typography>
                  <Typography variant="body2">{fmtDate(sheet.workDate)}</Typography>
                </Stack>
              )}
              <Typography variant="subtitle2" noWrap sx={{ fontWeight: 700 }}>
                {sheet.firstCompanyName}
              </Typography>
              {sheet.workContent && (
                <Typography variant="body2" color="text.secondary" noWrap>
                  {sheet.workContent}
                </Typography>
              )}
            </Stack>
            <Stack spacing={0.5} sx={{ alignItems: "flex-end", ml: 1 }}>
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                {onCopy && (
                  <IconButton
                    size="small"
                    aria-label="コピー作成"
                    disabled={sheet.status === "Provisional"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onCopy(sheet.id);
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <ContentCopyIcon fontSize="small" />
                  </IconButton>
                )}
                <StatusChip status={sheet.status} />
              </Stack>
              <Stack direction="row" sx={{ alignItems: "center" }}>
                <Typography variant="body2" color="primary">
                  {sheet.status === "Provisional" ? "本作成" : "詳細を確認"}
                </Typography>
                <ChevronRightIcon fontSize="small" color="primary" />
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

// カードの並び（本番 Grid xs12 / sm6 / md4）
export function CardGrid({ children }) {
  return <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" } }}>{children}</Box>;
}

export function EmptyList() {
  return (
    <Stack sx={{ alignItems: "center", justifyContent: "center", py: 8 }}>
      <Typography color="text.secondary">該当するKYシートがありません</Typography>
    </Stack>
  );
}
