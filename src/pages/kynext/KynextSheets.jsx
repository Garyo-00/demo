import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Card, CardContent, Container, Stack, Tab, Tabs, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import GridViewIcon from "@mui/icons-material/GridView";
import TableRowsIcon from "@mui/icons-material/TableRows";
import { useKynext } from "../../components/kynext/KynextContext.jsx";
import { useIsMobile } from "../../components/kynext/KynextCommon.jsx";
import {
  CardGrid,
  CompanyMultiSelect,
  DateNavigator,
  EmptyList,
  MonthNavigator,
  SearchCard,
  SheetCard,
  SheetTable,
  filterByCompanies,
  matchKeyword,
  useBasicDetailItemNames,
  useCopySheet,
  useDeleteDeniedReason,
  useDeleteSheetDialog,
  usePagination,
} from "../../components/kynext/KynextListParts.jsx";

// 新規作成ボタン（本番 CreateButton）。
// テンプレート未設定は設定すれば解消するので disabled、作成権限が無い場合は操作で解消できないのでボタンごと出さない
function CreateButton() {
  const navigate = useNavigate();
  const { me, currentTemplate } = useKynext();
  if (!me.sheetCreatable) return null;
  return (
    <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate("/kynext/ky-sheets/create/reference")} disabled={!currentTemplate} sx={{ whiteSpace: "nowrap" }}>
      新規作成
    </Button>
  );
}

// 「作業日で確認」タブ（本番 KYNEXTSheetDataGrid / KYNEXTSheetCardList）
function ByDate({ sheets, viewMode, date, onDateChange, labels }) {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const { me } = useKynext();
  const { copy, renderDialog: renderCopyDialog } = useCopySheet();
  const { deleteSheet, renderDeleteDialog } = useDeleteSheetDialog();
  const deleteDeniedReasonOf = useDeleteDeniedReason();
  const rows = useMemo(() => sheets.filter((s) => s.workDate === date), [sheets, date]);
  // コピー作成・仮作成の本作成は作成権限（ロール）で判断する
  const copyable = me.sheetCreatable;
  const createDeniedReason = me.sheetCreatable ? null : "作成する権限がありません";

  return (
    <Stack direction="column" sx={{ width: "100%" }}>
      <Stack direction={mobile ? "column" : "row"} spacing={1} sx={{ justifyContent: "space-between", mb: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Typography>{`提出: ${rows.length}件`}</Typography>
        </Stack>
        <DateNavigator date={date} onChange={onDateChange} />
      </Stack>
      {viewMode === "table" ? (
        <SheetTable
          rows={rows}
          mode="list"
          labels={labels}
          onCopy={copyable ? copy : undefined}
          onDelete={(row) => deleteSheet(row.id, row.workContent)}
          createDeniedReason={createDeniedReason}
          deleteDeniedReasonOf={deleteDeniedReasonOf}
        />
      ) : rows.length > 0 ? (
        <CardGrid>
          {rows.map((s) => (
            <SheetCard key={s.id} sheet={s} onClick={(sheet) => navigate(sheet.status === "Provisional" ? `/kynext/ky-sheets/${sheet.id}/edit` : `/kynext/ky-sheets/${sheet.id}`)} onCopy={copyable ? copy : undefined} />
          ))}
        </CardGrid>
      ) : (
        <EmptyList />
      )}
      {renderCopyDialog()}
      {renderDeleteDialog()}
    </Stack>
  );
}

// 「一次会社で確認」タブ（本番 dataGridByCompany/*）。月単位で取り、会社で絞り込む。
function ByCompany({ sheets, viewMode, month, onMonthChange, labels }) {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const { me } = useKynext();
  const { copy, renderDialog: renderCopyDialog } = useCopySheet();
  const [selectedCompanies, setSelectedCompanies] = useState([null]);
  const copyable = me.sheetCreatable;

  // 作業日の降順（本番 sortModel workDate desc）
  const monthly = useMemo(
    () => sheets.filter((s) => (s.workDate || "").startsWith(month)).sort((a, b) => (a.workDate < b.workDate ? 1 : a.workDate > b.workDate ? -1 : b.id - a.id)),
    [sheets, month]
  );
  const displayed = useMemo(() => filterByCompanies(monthly, selectedCompanies), [monthly, selectedCompanies]);
  const { pageRows, renderPagination } = usePagination(displayed, 10);

  // カード表示は会社ごとにグループ化する
  const groups = useMemo(() => {
    const map = new Map();
    for (const s of displayed) {
      const c = s.firstCompanyName || "(会社名未設定)";
      map.set(c, [...(map.get(c) ?? []), s]);
    }
    return [...map.entries()].map(([company, list]) => ({ company, sheets: list }));
  }, [displayed]);

  return (
    <Stack direction="column" sx={{ width: "100%" }}>
      <Stack direction={mobile ? "column" : "row"} spacing={2} sx={{ justifyContent: "space-between", alignItems: mobile ? "stretch" : "center", mb: 2 }}>
        <CompanyMultiSelect sheets={monthly} selected={selectedCompanies} onChange={setSelectedCompanies} label={`${labels.firstCompanyName}で複数選択`} />
        <MonthNavigator month={month} onChange={onMonthChange} />
      </Stack>
      {viewMode === "table" ? (
        <Box>
          <SheetTable rows={pageRows} mode="list" showWorkDate showConfirmColumns={false} labels={labels} onCopy={copyable ? copy : undefined} />
          {renderPagination()}
        </Box>
      ) : groups.length > 0 ? (
        <Stack spacing={3}>
          {groups.map(({ company, sheets: list }) => (
            <Box key={company}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
                {company}（{list.length}件）
              </Typography>
              <CardGrid>
                {list.map((s) => (
                  <SheetCard key={s.id} sheet={s} showWorkDate onClick={(sheet) => navigate(sheet.status === "Provisional" ? `/kynext/ky-sheets/${sheet.id}/edit` : `/kynext/ky-sheets/${sheet.id}`)} onCopy={copyable ? copy : undefined} />
                ))}
              </CardGrid>
            </Box>
          ))}
        </Stack>
      ) : (
        <EmptyList />
      )}
      {renderCopyDialog()}
    </Stack>
  );
}

/**
 * KYシート一覧（本番 pages/kySheets/index.tsx + features/kySheet/KYNEXTSheets.tsx）。
 * 検索カード → 新規作成 → タブ（作業日で確認／一次会社で確認）＋テーブル・カード切替。
 * 表示状態（タブ・表示形式・検索語・日付・月）は listState に持ち、詳細から戻っても残す。
 */
export default function KynextSheets() {
  const mobile = useIsMobile();
  const { sheets, listState, setListState } = useKynext();
  const labels = useBasicDetailItemNames();
  const { tab, viewMode, keyword, date, month } = listState;
  const patch = (p) => setListState((s) => ({ ...s, ...p }));
  // 入力中のキーワード。「検索」を押すまで絞り込みには反映しない。
  const [draft, setDraft] = useState(keyword);
  const effectiveViewMode = viewMode ?? (mobile ? "card" : "table");

  const filtered = useMemo(() => sheets.filter((s) => matchKeyword(s, keyword)), [sheets, keyword]);

  return (
    <Container maxWidth="lg">
      <Stack direction="column" spacing={2}>
        <SearchCard
          mode="list"
          keyword={draft}
          onKeywordChange={setDraft}
          onSearch={() => patch({ keyword: draft })}
          onClear={() => {
            setDraft("");
            patch({ keyword: "" });
          }}
          firstCompanyName={labels.firstCompanyName}
          workContentName={labels.workContentName}
        />
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
          <CreateButton />
        </Stack>
        <Card>
          <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={tab} onChange={(_, v) => patch({ tab: v })} variant="scrollable" allowScrollButtonsMobile>
              <Tab label={`${labels.workDateName}で確認`} value="date" />
              <Tab label={`${labels.firstCompanyName}で確認`} value="company" />
            </Tabs>
            <ToggleButtonGroup value={effectiveViewMode} exclusive onChange={(_, v) => v && patch({ viewMode: v })} size="small" sx={{ mr: { xs: 1, md: 2 } }}>
              <ToggleButton value="table" aria-label="テーブル表示">
                <TableRowsIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="card" aria-label="カード表示">
                <GridViewIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </Stack>
          <CardContent>
            {tab === "date" ? (
              <ByDate sheets={filtered} viewMode={effectiveViewMode} date={date} onDateChange={(d) => patch({ date: d })} labels={labels} />
            ) : (
              <ByCompany sheets={filtered} viewMode={effectiveViewMode} month={month} onMonthChange={(m) => patch({ month: m })} labels={labels} />
            )}
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
}
