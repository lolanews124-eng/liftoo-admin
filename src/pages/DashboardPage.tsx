import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, DashboardStats, DailyAnalytics } from '../api/client';
import { AnalyticsCharts } from '../components/Charts';

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

  return (
    <div className="page">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Platform overview — users, bookings, revenue & activity</p>

      <div className="grid-4">
        <div className="card stat-card stat-card-primary">
          <h3>Total users</h3>
          <p>{stats.users.total}</p>
          <span className="stat-sub">{stats.users.customers} customers · {stats.users.assistants} assistants</span>
        </div>
        <div className="card stat-card">
          <h3>Active bookings</h3>
          <p>{stats.bookings.active}</p>
          <span className="stat-sub">{stats.bookings.completed} completed total</span>
        </div>
        <div className="card stat-card">
          <h3>Pending KYC</h3>
          <p>{stats.pendingVerifications}</p>
          <Link to="/verifications" className="stat-link">Review →</Link>
        </div>
        <div className="card stat-card">
          <h3>Total revenue</h3>
          <p>₹{Math.round(stats.revenue.total)}</p>
          <span className="stat-sub">Platform ₹{Math.round(stats.revenue.platform)} · Payouts pending ₹{Math.round(stats.revenue.pendingPayouts)}</span>
        </div>
      </div>

      {analytics.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <AnalyticsCharts daily={analytics} />
        </div>
      )}

      <div className="grid-2" style={{ marginTop: 20 }}>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>Quick links</h2>
          <div className="quick-links">
            <Link to="/bookings" className="quick-link">📅 Bookings</Link>
            <Link to="/assistants" className="quick-link">👤 Assistant stats</Link>
            <Link to="/audit-logs" className="quick-link">📋 Audit logs</Link>
            <Link to="/payouts" className="quick-link">💸 Payouts</Link>
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0 }}>7-day summary</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Bookings</th><th>Done</th><th>Revenue</th></tr>
              </thead>
              <tbody>
                {analytics.map((d) => (
                  <tr key={d.date}>
                    <td>{d.date}</td>
                    <td>{d.bookings}</td>
                    <td>{d.completed}</td>
                    <td>₹{Math.round(d.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h2 style={{ marginTop: 0 }}>Recent bookings</h2>
        <div className="table-wrap">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Service</th>
                <th>Venue</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentBookings.map((b) => (
                <tr key={b.id}>
                  <td data-label="Customer">{b.customer?.name ?? '—'}</td>
                  <td data-label="Service">{b.category?.name ?? '—'}</td>
                  <td data-label="Venue">{b.venueName}</td>
                  <td data-label="Status"><span className="badge badge-orange">{b.status}</span></td>
                  <td data-label="Amount">₹{b.totalAmount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
