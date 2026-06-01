import { useMemo, useState } from 'react';
import { adminApi, BookingDetail, BookingRow } from '../api/client';
import { Pagination } from '../components/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';

export function BookingsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState({ status: '', search: '' });
  const [selected, setSelected] = useState<BookingDetail | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters = useMemo(() => ({ status: applied.status, search: applied.search }), [applied]);

  const { items, total, page, setPage, loading, error, reload, limit, resetPage } = usePaginatedList<BookingRow>(
    adminApi.bookings,
    filters,
  );

  const apply = () => {
    resetPage();
    setApplied({ status, search });
  };

  const open = async (id: string) => setSelected(await adminApi.booking(id));

  const updateStatus = async (id: string, newStatus: string) => {
    await adminApi.updateBookingStatus(id, newStatus, 'Updated from admin panel');
    setSelected(await adminApi.booking(id));
    reload();
  };

  const exportAll = async () => {
    setExporting(true);
    try {
      const csv = await adminApi.exportBookingsCsv();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="page">
      <h1 className="page-title">Bookings</h1>
      <p className="page-sub">Track and manage all platform bookings</p>
      {error && <div className="error-banner">{error}</div>}
      <div className="toolbar">
        <input
          placeholder="Search venue, customer, phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && apply()}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {['pending', 'searching', 'assigned', 'arriving', 'started', 'completed', 'cancelled'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button type="button" className="btn btn-primary" onClick={apply}>Filter</button>
        <button type="button" className="btn btn-outline" onClick={exportAll} disabled={exporting}>
          {exporting ? 'Exporting…' : 'Export all CSV'}
        </button>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <div className="loading-state">Loading bookings…</div>
        ) : items.length === 0 ? (
          <div className="empty-state-inline">No bookings found</div>
        ) : (
          <table className="responsive-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Assistant</th>
                <th>Venue</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td data-label="ID">{b.id.slice(0, 8)}…</td>
                  <td data-label="Customer">{b.customer?.name ?? '—'}</td>
                  <td data-label="Assistant">{b.assistant?.name ?? '—'}</td>
                  <td data-label="Venue">{b.venueName}</td>
                  <td data-label="Scheduled">{new Date(b.scheduledAt).toLocaleDateString()}</td>
                  <td data-label="Status"><span className="badge badge-orange">{b.status}</span></td>
                  <td data-label="Amount">₹{b.totalAmount}</td>
                  <td><button type="button" className="btn btn-outline btn-sm" onClick={() => open(b.id)}>View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <Pagination page={page} total={total} limit={limit} onChange={setPage} />

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>Booking {selected.id.slice(0, 8)}…</h2>
            <p><strong>Status:</strong> {selected.status} · <strong>Total:</strong> ₹{selected.totalAmount}</p>
            <p><strong>Duration:</strong> {selected.durationMin} min · <strong>Service:</strong> ₹{selected.serviceFee} · <strong>Platform:</strong> ₹{selected.platformFee}</p>
            <p><strong>Customer:</strong> {selected.customer?.name} ({selected.customer?.phone})</p>
            <p><strong>Assistant:</strong> {selected.assistant?.name ?? '—'}</p>
            <p><strong>Address:</strong> {selected.addressFormatted}</p>
            {selected.payment && (
              <p><strong>Payment:</strong> {selected.payment.method} — {selected.payment.status} (₹{selected.payment.amount})</p>
            )}
            {selected.rating && <p><strong>Rating:</strong> ★ {selected.rating.stars} {selected.rating.comment ? `— ${selected.rating.comment}` : ''}</p>}
            <h3>Status history</h3>
            <ul>
              {selected.statusHistory?.map((h) => (
                <li key={h.createdAt}>{h.status} — {new Date(h.createdAt).toLocaleString()} {h.note ? `(${h.note})` : ''}</li>
              ))}
            </ul>
            {selected.rejections && selected.rejections.length > 0 && (
              <>
                <h3>Rejections</h3>
                <ul>
                  {selected.rejections.map((r) => (
                    <li key={r.id}>{r.assistant?.name}: {r.reason ?? '—'}</li>
                  ))}
                </ul>
              </>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
              {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                <button type="button" className="btn btn-danger btn-sm" onClick={() => updateStatus(selected.id, 'cancelled')}>Cancel</button>
              )}
              {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                <button type="button" className="btn btn-success btn-sm" onClick={() => updateStatus(selected.id, 'completed')}>Mark completed</button>
              )}
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
