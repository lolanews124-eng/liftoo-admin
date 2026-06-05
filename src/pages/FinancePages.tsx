import { useMemo, useState } from 'react';
import { adminApi, PaymentRow, EarningRow, RatingRow, AppReviewRow, ReferralRow } from '../api/client';
import { ListPanel } from '../components/ListPanel';
import { PageHeader } from '../components/PageHeader';
import { PaymentStatusBadge } from '../components/StatusBadge';
import { Pagination } from '../components/Pagination';
import { DataPanel } from '../components/DataPanel';
import { EMPTY_FILTERS, usePaginatedList } from '../hooks/usePaginatedList';
import { downloadCsv } from '../utils/exportCsv';

function FinanceToolbar({
  search,
  onSearch,
  onApply,
  onExport,
  extra,
}: {
  search: string;
  onSearch: (v: string) => void;
  onApply: () => void;
  onExport: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-field">
        <input placeholder="Search…" value={search} onChange={(e) => onSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onApply()} />
      </div>
      {extra}
      <div className="toolbar-actions">
        <button type="button" className="btn btn-primary" onClick={onApply}>Search</button>
        <button type="button" className="btn btn-outline" onClick={onExport}>Export CSV</button>
      </div>
    </div>
  );
}

export function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [applied, setApplied] = useState({ search: '', status: '' });
  const filters = useMemo(() => applied, [applied]);
  const { items, total, page, setPage, loading, error, limit, resetPage } = usePaginatedList<PaymentRow>(adminApi.payments, filters);

  const displayed = items.filter((p) => !applied.status || p.status === applied.status);

  return (
    <div className="page">
      <PageHeader title="Payments" subtitle="Wallet, UPI, and cash — credited after job completion" />
      {error && <div className="error-banner">{error}</div>}
      <FinanceToolbar
        search={search}
        onSearch={setSearch}
        onApply={() => { resetPage(); setApplied({ search, status: statusFilter }); }}
        onExport={() => downloadCsv('payments.csv', ['Method', 'Amount', 'Status', 'Venue', 'Date'], displayed.map((p) => [p.method, p.amount, p.status, p.booking?.venueName ?? '', p.createdAt]))}
        extra={
          <div className="toolbar-field toolbar-field--narrow">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        }
      />
      <ListPanel footer={<Pagination page={page} total={total} limit={limit} onChange={setPage} />}>
        {loading ? <div className="loading-state">Loading…</div> : (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead><tr><th>Method</th><th>Amount</th><th>Status</th><th>Customer</th><th>Booking</th><th>Date</th></tr></thead>
              <tbody>
                {displayed.map((p) => (
                  <tr key={p.id}>
                    <td data-label="Method">{p.method?.toUpperCase() ?? '—'}</td>
                    <td data-label="Amount">₹{p.amount}</td>
                    <td data-label="Status"><PaymentStatusBadge status={p.status} /></td>
                    <td data-label="Customer">{p.booking?.customer?.name ?? '—'}</td>
                    <td data-label="Booking">{p.booking?.venueName ?? '—'}</td>
                    <td data-label="Date">{new Date(p.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ListPanel>
    </div>
  );
}

export function EarningsPage() {
  const [search, setSearch] = useState('');
  const [paidFilter, setPaidFilter] = useState('');
  const filters = useMemo(() => ({ search }), [search]);
  const { items, total, page, setPage, loading, error, reload, limit, resetPage } = usePaginatedList<EarningRow>(adminApi.earnings, filters);

  const filtered = items.filter((e) => {
    if (paidFilter === 'paid') return e.isPaidOut;
    if (paidFilter === 'pending') return !e.isPaidOut;
    return true;
  });

  return (
    <div className="page">
      <PageHeader title="Assistant earnings" subtitle="Track payouts to assistants" />
      {error && <div className="error-banner">{error}</div>}
      <FinanceToolbar
        search={search}
        onSearch={setSearch}
        onApply={() => { resetPage(); reload(); }}
        onExport={() => downloadCsv('earnings.csv', ['Assistant', 'Amount', 'Description', 'Paid'], filtered.map((e) => [e.assistant?.name ?? '', e.amount, e.description, e.isPaidOut ? 'yes' : 'no']))}
        extra={
          <div className="toolbar-field toolbar-field--narrow">
            <select value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)}>
              <option value="">All</option>
              <option value="pending">Pending payout</option>
              <option value="paid">Paid out</option>
            </select>
          </div>
        }
      />
      <ListPanel footer={<Pagination page={page} total={total} limit={limit} onChange={setPage} />}>
        {loading ? <div className="loading-state">Loading…</div> : (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead><tr><th>Assistant</th><th>Amount</th><th>Description</th><th>Paid out</th><th>Action</th></tr></thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id}>
                    <td data-label="Assistant">{e.assistant?.name ?? '—'}</td>
                    <td data-label="Amount">₹{e.amount}</td>
                    <td data-label="Description">{e.description}</td>
                    <td data-label="Paid">{e.isPaidOut ? <span className="badge badge-green">Yes</span> : <span className="badge badge-orange">Pending</span>}</td>
                    <td data-label="Action">
                      {!e.isPaidOut && (
                        <button type="button" className="btn btn-success btn-sm" onClick={async () => { await adminApi.markPayout(e.id); reload(); }}>Mark paid</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ListPanel>
    </div>
  );
}

export function ReviewsPage() {
  const {
    items: ratings,
    total: t1,
    page: p1,
    setPage: setP1,
    loading: l1,
    error: err1,
    limit,
    reload: reload1,
  } = usePaginatedList<RatingRow>(adminApi.ratings, EMPTY_FILTERS);
  const {
    items: appReviews,
    total: t2,
    page: p2,
    setPage: setP2,
    loading: l2,
    error: err2,
    reload: reload2,
  } = usePaginatedList<AppReviewRow>(adminApi.appReviews, EMPTY_FILTERS);

  return (
    <div className="page">
      <PageHeader title="Reviews" subtitle="Service ratings and app feedback" />
      <div className="reviews-stack">
        <div className="card">
          <h2 className="card-heading">Service ratings</h2>
          <DataPanel
            loading={l1}
            error={err1}
            empty={!l1 && !err1 && ratings.length === 0}
            emptyTitle="No service ratings yet"
            emptyHint="Ratings appear after customers complete bookings."
            onRetry={reload1}
          >
            <div className="table-wrap">
              <table className="responsive-table">
                <thead><tr><th>Stars</th><th>Customer</th><th>Assistant</th><th>Booking</th><th>Comment</th></tr></thead>
                <tbody>
                  {ratings.map((r) => (
                    <tr key={r.id}>
                      <td data-label="Stars">{'★'.repeat(r.stars)}</td>
                      <td data-label="Customer">{r.customer?.name ?? '—'}</td>
                      <td data-label="Assistant">{r.assistant?.name ?? '—'}</td>
                      <td data-label="Booking">{r.booking?.venueName ?? '—'}</td>
                      <td data-label="Comment">{r.comment ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataPanel>
          {!l1 && !err1 && ratings.length > 0 && (
            <Pagination page={p1} total={t1} limit={limit} onChange={setP1} />
          )}
        </div>
        <div className="card">
          <h2 className="card-heading">App reviews</h2>
          <DataPanel
            loading={l2}
            error={err2}
            empty={!l2 && !err2 && appReviews.length === 0}
            emptyTitle="No app reviews yet"
            emptyHint="Reviews submitted from the app will show here."
            onRetry={reload2}
          >
            <div className="table-wrap">
              <table className="responsive-table">
                <thead><tr><th>Stars</th><th>User</th><th>Platform</th><th>Comment</th></tr></thead>
                <tbody>
                  {appReviews.map((r) => (
                    <tr key={r.id}>
                      <td data-label="Stars">{'★'.repeat(r.stars)}</td>
                      <td data-label="User">{r.user?.name ?? '—'}</td>
                      <td data-label="Platform">{r.platform ?? '—'}</td>
                      <td data-label="Comment">{r.comment ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </DataPanel>
          {!l2 && !err2 && appReviews.length > 0 && (
            <Pagination page={p2} total={t2} limit={limit} onChange={setP2} />
          )}
        </div>
      </div>
    </div>
  );
}

export function ReferralsPage() {
  const { items, total, page, setPage, loading, error, limit, reload } =
    usePaginatedList<ReferralRow>(adminApi.referrals, EMPTY_FILTERS);

  return (
    <div className="page">
      <PageHeader title="Referrals" subtitle="Referral activity and rewards" />
      <div className="card">
        <DataPanel
          loading={loading}
          error={error}
          empty={!loading && !error && items.length === 0}
          emptyTitle="No referrals yet"
          emptyHint="When users refer friends, activity will appear here."
          onRetry={reload}
        >
          <div className="table-wrap">
            <table className="responsive-table">
              <thead><tr><th>Code</th><th>Referrer</th><th>Referee</th><th>Reward</th><th>Status</th></tr></thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Code">{r.code}</td>
                    <td data-label="Referrer">{r.referrer?.name ?? '—'}</td>
                    <td data-label="Referee">{r.referee?.name ?? '—'}</td>
                    <td data-label="Reward">₹{r.rewardAmount}</td>
                    <td data-label="Status"><span className="badge badge-green">{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DataPanel>
        {!loading && !error && items.length > 0 && (
          <Pagination page={page} total={total} limit={limit} onChange={setPage} />
        )}
      </div>
    </div>
  );
}
