import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminApi, BookingDetail, BookingRow } from '../api/client';
import { ListPanel } from '../components/ListPanel';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { BookingStatusBadge, PaymentStatusBadge } from '../components/StatusBadge';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { isPaymentPending } from '../utils/status';

export function BookingsPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [paymentPendingOnly, setPaymentPendingOnly] = useState(
    searchParams.get('paymentPending') === '1',
  );
  const [applied, setApplied] = useState({
    status: '',
    search: '',
    paymentPending: searchParams.get('paymentPending') === '1',
  });
  const [selected, setSelected] = useState<BookingDetail | null>(null);
  const [exporting, setExporting] = useState(false);

  const filters = useMemo(
    () => ({
      status: applied.status,
      search: applied.search,
      ...(applied.paymentPending ? { paymentPending: 'true' } : {}),
    }),
    [applied],
  );

  const { items, total, page, setPage, loading, error, reload, limit, resetPage } = usePaginatedList<BookingRow>(
    adminApi.bookings,
    filters,
  );

  const apply = () => {
    resetPage();
    setApplied({ status, search, paymentPending: paymentPendingOnly });
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
      <PageHeader
        title="Bookings"
        subtitle="Post-completion payments, cash OTP flow, and live job tracking"
        action={
          <button type="button" className="btn btn-outline" onClick={exportAll} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export CSV'}
          </button>
        }
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="toolbar">
        <div className="toolbar-field">
          <input
            placeholder="Search venue, customer, phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
        </div>
        <div className="toolbar-field toolbar-field--narrow">
          <select value={status} onChange={(e) => setStatus(e.target.value)} disabled={paymentPendingOnly}>
            <option value="">All statuses</option>
            {['pending', 'searching', 'assigned', 'arriving', 'started', 'completed', 'cancelled'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <label className="filter-check">
          <input
            type="checkbox"
            checked={paymentPendingOnly}
            onChange={(e) => {
              setPaymentPendingOnly(e.target.checked);
              if (e.target.checked) setStatus('');
            }}
          />
          Payment pending only
        </label>
        <div className="toolbar-actions">
          <button type="button" className="btn btn-primary" onClick={apply}>Apply filters</button>
        </div>
      </div>

      <ListPanel footer={<Pagination page={page} total={total} limit={limit} onChange={setPage} />}>
        {loading ? (
          <div className="loading-state">Loading bookings…</div>
        ) : items.length === 0 ? (
          <div className="empty-state-inline">No bookings found</div>
        ) : (
          <div className="table-wrap">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Assistant</th>
                <th>Venue</th>
                <th>Scheduled</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((b) => (
                <tr key={b.id}>
                  <td data-label="ID"><code className="meta-code">{b.id.slice(0, 8)}</code></td>
                  <td data-label="Customer">{b.customer?.name ?? '—'}</td>
                  <td data-label="Assistant">{b.assistant?.name ?? '—'}</td>
                  <td data-label="Venue">{b.venueName}</td>
                  <td data-label="Scheduled">{new Date(b.scheduledAt).toLocaleString()}</td>
                  <td data-label="Status"><BookingStatusBadge status={b.status} /></td>
                  <td data-label="Payment">
                    {isPaymentPending(b.status, b.payment) ? (
                      <span className="badge badge-orange">Due</span>
                    ) : b.payment ? (
                      <PaymentStatusBadge status={b.payment.status} />
                    ) : (
                      '—'
                    )}
                  </td>
                  <td data-label="Amount">₹{b.totalAmount}</td>
                  <td>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => open(b.id)}>
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </ListPanel>

      {selected && (
        <div className="modal-backdrop" onClick={() => setSelected(null)}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-top">
              <div>
                <h2 style={{ margin: '0 0 4px' }}>{selected.category?.name ?? 'Booking'}</h2>
                <code className="meta-code">{selected.id}</code>
              </div>
              <BookingStatusBadge status={selected.status} />
            </div>

            <div className="detail-grid">
              <div className="detail-block">
                <h4>People</h4>
                <p><strong>Customer:</strong> {selected.customer?.name} · {selected.customer?.phone}</p>
                <p><strong>Assistant:</strong> {selected.assistant?.name ?? 'Not assigned'} {selected.assistant?.phone ? `· ${selected.assistant.phone}` : ''}</p>
              </div>
              <div className="detail-block">
                <h4>Schedule & place</h4>
                <p>{new Date(selected.scheduledAt).toLocaleString()} · {selected.durationMin} min</p>
                <p>{selected.venueName}</p>
                <p className="cell-sub">{selected.addressFormatted}</p>
              </div>
              <div className="detail-block">
                <h4>Fees</h4>
                <p>Service ₹{selected.serviceFee} · Platform ₹{selected.platformFee}</p>
                <p><strong>Total ₹{selected.totalAmount}</strong></p>
                {selected.assistantEarningAmount != null && (
                  <p className="cell-sub">Assistant earning (on pay): ₹{selected.assistantEarningAmount}</p>
                )}
                {selected.companyShareAmount != null && (
                  <p className="cell-sub">Company share (cash): ₹{selected.companyShareAmount}</p>
                )}
              </div>
              <div className="detail-block">
                <h4>Payment</h4>
                {selected.payment ? (
                  <>
                    <p>
                      {selected.payment.method?.toUpperCase() ?? '—'} —{' '}
                      <PaymentStatusBadge status={selected.payment.status} /> ₹{selected.payment.amount}
                    </p>
                    {selected.payment.cashCollectedAt && (
                      <p className="cell-sub">Cash collected: {new Date(selected.payment.cashCollectedAt).toLocaleString()}</p>
                    )}
                  </>
                ) : isPaymentPending(selected.status, null) ? (
                  <p className="badge badge-orange">Awaiting customer payment</p>
                ) : (
                  <p>—</p>
                )}
              </div>
            </div>

            {selected.rating && (
              <p><strong>Service rating:</strong> ★ {selected.rating.stars} {selected.rating.comment ? `— ${selected.rating.comment}` : ''}</p>
            )}

            <h3>Status timeline</h3>
            <ul className="timeline-list">
              {selected.statusHistory?.map((h) => (
                <li key={h.createdAt}>
                  <BookingStatusBadge status={h.status} />
                  <span>{new Date(h.createdAt).toLocaleString()}</span>
                  {h.note && <span className="cell-sub"> — {h.note}</span>}
                </li>
              ))}
            </ul>

            {selected.rejections && selected.rejections.length > 0 && (
              <>
                <h3>Assistant rejections</h3>
                <ul>
                  {selected.rejections.map((r) => (
                    <li key={r.id}>{r.assistant?.name}: {r.reason ?? '—'}</li>
                  ))}
                </ul>
              </>
            )}

            <div className="modal-footer modal-footer--between">
              <div className="btn-group">
                {selected.status !== 'cancelled' && selected.status !== 'completed' && (
                  <button type="button" className="btn btn-danger btn-sm" onClick={() => updateStatus(selected.id, 'cancelled')}>
                    Cancel booking
                  </button>
                )}
                {selected.status !== 'completed' && selected.status !== 'cancelled' && (
                  <button type="button" className="btn btn-success btn-sm" onClick={() => updateStatus(selected.id, 'completed')}>
                    Mark completed
                  </button>
                )}
              </div>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
