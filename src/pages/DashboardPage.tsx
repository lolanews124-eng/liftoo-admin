import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, DashboardStats, DailyAnalytics } from '../api/client';
import { AnalyticsCharts } from '../components/Charts';
import { PageHeader } from '../components/PageHeader';
import { BookingStatusBadge } from '../components/StatusBadge';
import { isPaymentPending } from '../utils/status';

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<DailyAnalytics[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([adminApi.dashboard(), adminApi.dashboardAnalytics()])
      .then(([s, a]) => {
        setStats({
          users: {
            total: s.users?.total ?? 0,
            customers: s.users?.customers ?? 0,
            assistants: s.users?.assistants ?? 0,
          },
          bookings: {
            total: s.bookings?.total ?? 0,
            active: s.bookings?.active ?? 0,
            completed: s.bookings?.completed ?? 0,
          },
          pendingVerifications: s.pendingVerifications ?? 0,
          pendingPayments: s.pendingPayments ?? 0,
          openSupportTickets: s.openSupportTickets ?? 0,
          revenue: {
            total: s.revenue?.total ?? 0,
            platform: s.revenue?.platform ?? 0,
            pendingPayouts: s.revenue?.pendingPayouts ?? 0,
          },
          recentBookings: s.recentBookings ?? [],
        });
        const daily = Array.isArray(a) ? a : a?.daily;
        setAnalytics(daily ?? []);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page"><div className="loading-state">Loading dashboard…</div></div>;
  if (error) return <div className="page"><div className="error-banner">{error}</div></div>;
  if (!stats) {
    return (
      <div className="page">
        <div className="error-banner">Dashboard data is unavailable. Check the API response format.</div>
      </div>
    );
  }

  const alerts = [
    stats.pendingVerifications > 0 && {
      label: `${stats.pendingVerifications} KYC pending`,
      to: '/verifications',
      tone: 'warn',
    },
    (stats.pendingPayments ?? 0) > 0 && {
      label: `${stats.pendingPayments} payments awaiting customer`,
      to: '/bookings?paymentPending=1',
      tone: 'primary',
    },
    (stats.openSupportTickets ?? 0) > 0 && {
      label: `${stats.openSupportTickets} open support tickets`,
      to: '/support',
      tone: 'info',
    },
  ].filter(Boolean) as { label: string; to: string; tone: string }[];

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        subtitle="Platform overview — matches the Liftoo customer & assistant apps"
      />

      {alerts.length > 0 && (
        <div className="alert-strip">
          {alerts.map((a) => (
            <Link key={a.to} to={a.to} className={`alert-pill alert-${a.tone}`}>
              {a.label} →
            </Link>
          ))}
        </div>
      )}

      <div className="grid-4">
        <div className="card stat-card stat-card-primary">
          <div className="stat-icon">👥</div>
          <h3>Total users</h3>
          <p>{stats.users.total}</p>
          <span className="stat-sub">{stats.users.customers} customers · {stats.users.assistants} assistants</span>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">📅</div>
          <h3>Active bookings</h3>
          <p>{stats.bookings.active}</p>
          <span className="stat-sub">{stats.bookings.completed} completed · {stats.bookings.total} total</span>
          <Link to="/bookings" className="stat-link">View all →</Link>
        </div>
        <div className="card stat-card">
          <div className="stat-icon">💳</div>
          <h3>Pending payments</h3>
          <p>{stats.pendingPayments ?? 0}</p>
          <span className="stat-sub">Completed jobs — customer pay after service</span>
          {(stats.pendingPayments ?? 0) > 0 && (
            <Link to="/bookings?paymentPending=1" className="stat-link">Review →</Link>
          )}
        </div>
        <div className="card stat-card">
          <div className="stat-icon">₹</div>
          <h3>Revenue collected</h3>
          <p>₹{Math.round(stats.revenue.total)}</p>
          <span className="stat-sub">
            Platform fees ₹{Math.round(stats.revenue.platform)} · Assistant payouts pending ₹
            {Math.round(stats.revenue.pendingPayouts)}
          </span>
        </div>
      </div>

      {analytics.length > 0 && <AnalyticsCharts daily={analytics} />}

      <div className="grid-2">
        <div className="card">
          <h2 className="card-heading">Quick actions</h2>
          <div className="quick-links">
            <Link to="/verifications" className="quick-link">✅ KYC queue</Link>
            <Link to="/bookings?paymentPending=1" className="quick-link">💳 Pending payments</Link>
            <Link to="/payouts" className="quick-link">💸 Payout requests</Link>
            <Link to="/settings" className="quick-link">⚙️ Platform settings</Link>
          </div>
        </div>
        <div className="card">
          <h2 className="card-heading">Payment model (app)</h2>
          <ul className="info-list">
            <li>Customer pays <strong>after</strong> assistant marks job complete</li>
            <li>Methods: Wallet, UPI, or Cash (OTP from assistant)</li>
            <li>Cash: company share debited from assistant settlement wallet</li>
            <li>Assistant earning credited only when payment is completed</li>
          </ul>
        </div>
      </div>

      <div className="card card--table">
        <h2 className="card-heading card-table-title">Recent bookings</h2>
        <div className="table-wrap">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Venue</th>
                <th>Status</th>
                <th>Payment</th>
                <th>Amount</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.map((b) => (
                <tr key={b.id}>
                  <td data-label="Customer">{b.customer?.name ?? '—'}</td>
                  <td data-label="Service">{b.category?.name ?? '—'}</td>
                  <td data-label="Venue">{b.venueName}</td>
                  <td data-label="Status"><BookingStatusBadge status={b.status} /></td>
                  <td data-label="Payment">
                    {isPaymentPending(b.status, b.payment) ? (
                      <span className="badge badge-orange">Payment due</span>
                    ) : b.payment ? (
                      <span className="badge badge-green">{b.payment.status}</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td data-label="Amount">₹{b.totalAmount}</td>
                  <td>
                    <Link to={`/bookings`} className="table-link" onClick={(e) => {
                      e.preventDefault();
                      window.location.href = `/bookings`;
                    }}>
                      Open
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
