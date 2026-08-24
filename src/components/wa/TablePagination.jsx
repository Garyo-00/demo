import MuiTablePagination from "@mui/material/TablePagination";

// テーブル用ページネーション（ページあたりの行数セレクタ＋範囲表示＋前後移動）
export default function TablePagination({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
  options = [25, 50, 100],
}) {
  return (
    <MuiTablePagination
      component="div"
      count={total}
      page={page}
      rowsPerPage={pageSize}
      rowsPerPageOptions={options.map((o) => ({ value: o, label: `${o}件` }))}
      onPageChange={(_, p) => onPage(p)}
      onRowsPerPageChange={(e) => onPageSize(Number(e.target.value))}
      labelRowsPerPage="ページあたりの行数："
      labelDisplayedRows={({ from, to, count }) => `${from}〜${to} / ${count}`}
      slotProps={{
        actions: {
          previousButton: { "aria-label": "前のページ" },
          nextButton: { "aria-label": "次のページ" },
        },
      }}
      sx={{
        borderBottom: 0,
        "& .MuiTablePagination-toolbar": { minHeight: 44, px: 0.5 },
        "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
          fontSize: 12.5,
          color: "text.secondary",
        },
      }}
    />
  );
}
