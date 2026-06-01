import { useMemo, useState } from 'react';
import { adminApi, PaymentRow, EarningRow, RatingRow, AppReviewRow, ReferralRow } from '../api/client';
import { Pagination } from '../components/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';
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
      <input placeholder="Search…" value={search} onChange={(e) => onSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onApply()} />
      {extra}
      <button type="button" className="btn btn-primary" onClick={onApply}>Search</button>
      <button type="button" className="btn btn-outline" onClick={onExport}>Export CSV</button>
    </div>
  );
}

export function PaymentsPage() {
  const [search, setSearch] = useState('');
  const [applied, setApplied] = useState('');
  const filters = useMemo(() => ({ search: applied }), [applied]);
  const { items, total, page, setPage, loading, error, limit, resetPage } = usePaginatedList<PaymentRow>(adminApi.payments, filters);

  return (
    <div className="page">
      <h1 className="page-title">Payments</h1>
      <p className="page-sub">All booking payments</p>
      {error && <div className="error-banner">{error}</div>}
      <FinanceToolbar
        search={search}
        onSearch={setSearch}
        onApply={() => { resetPage(); setApplied(search); }}
        onExport={() => downloadCsv('payments.csv', ['Method', 'Amount', 'Status', 'Venue', 'Date'], items.map((p) => [p.method, p.amount, p.status, p.booking?.venueName ?? '', p.createdAt]))}
      />
      <div className="card table-wrap">
        {loading ? <div className="loading-state">Loading…</div> : (
          <table className="responsive-table">
            <thead><tr><th>Method</th><th>Amount</th><th>Status</th><th>Customer</th><th>Booking</th><th>Date</th></tr></thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id}>
                  <td data-label="Method">{p.method.toUpperCase()}</td>
                  <td data-label="Amount">₹{p.amount}</td>
                  <td data-label="Status"><span className="badge badge-green">{p.status}</span></td>
                  <td data-label="Customer">{p.booking?.customer?.name ?? '—'}</td>
                  <td data-label="Booking">{p.booking?.venueName ?? '—'}</td>
                  <td data-label="Date">{new Date(p.createdAt).toLocaleString()}</td>
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
      <h1 className="page-title">Assistant earnings</h1>
      <p className="page-sub">Track payouts to assistants</p>
      {error && <div className="error-banner">{error}</div>}
      <FinanceToolbar
        search={search}
        onSearch={setSearch}
        onApply={() => { resetPage(); reload(); }}
        onExport={() => downloadCsv('earnings.csv', ['Assistant', 'Amount', 'Description', 'Paid'], filtered.map((e) => [e.assistant?.name ?? '', e.amount, e.description, e.isPaidOut ? 'yes' : 'no']))}
        extra={
          <select value={paidFilter} onChange={(e) => setPaidFilter(e.target.value)}>
            <option value="">All</option>
            <option value="pending">Pending payout</option>
            <option value="paid">Paid out</option>
          </select>
        }
      />
      <div className="card table-wrap">
        {loading ? <div className="loading-state">Loading…</div> : (
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
        )}
      </div>
      <Pagination page={page} total={total} limit={limit} onChange={setPage} />
    </div>
  );
}

export function ReviewsPage() {
  const { items: ratings, total: t1, page: p1, setPage: setP1, loading: l1, limit } = usePaginatedList<RatingRow>(adminApi.ratings, {});
  const { items: appReviews, total: t2, page: p2, setPage: setP2, loading: l2 } = usePaginatedList<AppReviewRow>(adminApi.appReviews, {});

  return (
    <div className="page">
      <h1 className="page-title">Reviews</h1>
      <p className="page-sub">Service ratings and app feedback</p>
      <div className="card" style={{ marginBottom: 20 }}>
        <h2>Service ratings</h2>
        {l1 ? <div className="loading-state">Loading…</div> : (
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
        )}
        <Pagination page={p1} total={t1} limit={limit} onChange={setP1} />
      </div>
      <div className="card">
        <h2>App reviews</h2>
        {l2 ? <div className="loading-state">Loading…</div> : (
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
        )}
        <Pagination page={p2} total={t2} limit={limit} onChange={setP2} />
      </div>
    </div>
  );
}

export function ReferralsPage() {
  const { items, total, page, setPage, loading, limit } = usePaginatedList<ReferralRow>(adminApi.referrals, {});

  return (
    <div className="page">
      <h1 className="page-title">Referrals</h1>
      <p className="page-sub">Referral activity and rewards</p>
      <div className="card table-wrap">
        {loading ? <div className="loading-state">Loading…</div> : (
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
        )}
      </div>
      <Pagination page={page} total={total} limit={limit} onChange={setPage} />
    </div>
  );
}
