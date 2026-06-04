import { adminApi, RejectionRow } from '../api/client';
import { Pagination } from '../components/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { downloadCsv } from '../utils/exportCsv';

export function RejectionsPage() {
  const { items, total, page, setPage, loading, error, limit } = usePaginatedList<RejectionRow>(adminApi.rejections, {});

  return (
    <div className="page">
      <h1 className="page-title">Booking rejections</h1>
      <p className="page-sub">Reasons assistants gave when declining requests</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() =>
            downloadCsv(
              'rejections.csv',
              ['Assistant', 'Code', 'Venue', 'Service', 'Reason', 'When'],
              items.map((r) => [
                r.assistant?.name ?? '',
                r.assistant?.assistantProfile?.assistantCode ?? '',
                r.booking?.venueName ?? '',
                r.booking?.category?.name ?? '',
                r.reason,
                r.createdAt,
              ]),
            )
          }
        >
          Export CSV
        </button>
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <div className="loading-state">Loading…</div>
        ) : (
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Assistant</th>
                <th>ID</th>
                <th>Booking</th>
                <th>Service</th>
                <th>Reason</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r.id}>
                  <td data-label="Assistant">{r.assistant?.name ?? '—'}</td>
                  <td data-label="ID">{r.assistant?.assistantProfile?.assistantCode ?? '—'}</td>
                  <td data-label="Booking">{r.booking?.venueName ?? r.bookingId.slice(0, 8)}</td>
                  <td data-label="Service">{r.booking?.category?.name ?? '—'}</td>
                  <td data-label="Reason">{r.reason}</td>
                  <td data-label="When">{new Date(r.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} total={total} limit={limit} onChange={setPage} />
    </div>
  );
}
