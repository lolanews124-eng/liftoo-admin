import { adminApi, RejectionRow } from '../api/client';
import { DataPanel } from '../components/DataPanel';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { EMPTY_FILTERS, usePaginatedList } from '../hooks/usePaginatedList';
import { downloadCsv } from '../utils/exportCsv';
import { formatAppDateTime } from '../utils/formatDate';

export function RejectionsPage() {
  const { items, total, page, setPage, loading, error, limit, reload } =
    usePaginatedList<RejectionRow>(adminApi.rejections, EMPTY_FILTERS);

  return (
    <div className="page">
      <PageHeader
        title="Booking rejections"
        subtitle="Reasons assistants gave when declining requests"
        action={
          <button
            type="button"
            className="btn btn-outline"
            disabled={loading || items.length === 0}
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
        }
      />

      <div className="list-panel">
        <DataPanel
          loading={loading}
          error={error}
          empty={!loading && !error && items.length === 0}
          emptyTitle="No rejections recorded"
          emptyHint="When assistants decline a booking request, it will show here."
          onRetry={reload}
        >
          <div className="table-wrap">
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
                    <td data-label="When">{formatAppDateTime(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataPanel>
        {!loading && !error && items.length > 0 && (
          <div className="list-panel-footer">
            <Pagination page={page} total={total} limit={limit} onChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
