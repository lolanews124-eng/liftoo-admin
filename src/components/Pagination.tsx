export function Pagination({
  page,
  total,
  limit,
  onChange,
}: {
  page: number;
  total: number;
  limit: number;
  onChange: (p: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <div className="pagination">
      <span className="pagination-info">
        {total === 0 ? 'No results' : `${start}–${end} of ${total}`}
      </span>
      <div className="pagination-controls">
        <button type="button" className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          ← Prev
        </button>
        <span className="pagination-page">
          Page {page} / {pages}
        </span>
        <button type="button" className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
          Next →
        </button>
      </div>
    </div>
  );
}
