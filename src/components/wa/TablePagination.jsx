// テーブル用ページネーション（ページあたりの行数セレクタ＋範囲表示＋前後移動）
export default function TablePagination({
  total,
  page,
  pageSize,
  onPage,
  onPageSize,
  options = [50, 100, 200],
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : page * pageSize + 1;
  const to = Math.min(total, (page + 1) * pageSize);
  return (
    <div className="pager">
      <span className="pager-label">ページあたりの行数：</span>
      <select
        className="pager-size"
        value={pageSize}
        onChange={(e) => onPageSize(Number(e.target.value))}
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}件
          </option>
        ))}
      </select>
      <span className="pager-range">
        {from}〜{to} / {total}
      </span>
      <button
        className="pager-arrow"
        onClick={() => onPage(page - 1)}
        disabled={page <= 0}
        aria-label="前のページ"
      >
        ‹
      </button>
      <button
        className="pager-arrow"
        onClick={() => onPage(page + 1)}
        disabled={page >= pageCount - 1}
        aria-label="次のページ"
      >
        ›
      </button>
    </div>
  );
}
