import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, UserRow } from '../api/client';
import { Pagination } from '../components/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { PageHeader } from '../components/PageHeader';
import { downloadCsv } from '../utils/exportCsv';

export function AssistantStatsPage() {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'jobs' | 'rating' | 'newest'>('jobs');
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const filters = useMemo(() => ({ role: 'assistant', search }), [search]);

  const { items, total, page, setPage, loading, error, reload, limit } = usePaginatedList<UserRow>(
    adminApi.users,
    filters,
  );

  const sorted = [...items]
    .filter((u) => (!onlineOnly || u.isOnline) && (!verifiedOnly || u.adminVerified))
    .sort((a, b) => {
      if (sort === 'rating') return (b.rating ?? 0) - (a.rating ?? 0);
      if (sort === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.totalJobs ?? 0) - (a.totalJobs ?? 0);
    });

  const avgRating =
    sorted.length > 0 ? sorted.reduce((s, u) => s + (u.rating ?? 0), 0) / sorted.length : 0;
  const totalJobs = sorted.reduce((s, u) => s + (u.totalJobs ?? 0), 0);
  const onlineCount = sorted.filter((u) => u.isOnline).length;

  const exportCsv = () => {
    downloadCsv(
      'assistant-stats.csv',
      ['Name', 'Phone', 'Code', 'Rating', 'Jobs', 'Verified', 'Online', 'Wallet'],
      sorted.map((u) => [
        u.name ?? '',
        u.phone,
        u.assistantCode ?? '',
        u.rating ?? 0,
        u.totalJobs ?? 0,
        u.adminVerified ? 'yes' : 'no',
        u.isOnline ? 'yes' : 'no',
        u.walletBalance,
      ]),
    );
  };

  return (
    <div className="page">
      <PageHeader title="Assistant performance" subtitle="Ratings, jobs completed, and online status" />
      {error && <div className="error-banner">{error}</div>}

      <div className="grid-4">
        <div className="card stat-card"><h3>On this page</h3><p>{sorted.length}</p></div>
        <div className="card stat-card"><h3>Avg rating</h3><p>★ {avgRating.toFixed(1)}</p></div>
        <div className="card stat-card"><h3>Total jobs</h3><p>{totalJobs}</p></div>
        <div className="card stat-card"><h3>Online now</h3><p>{onlineCount}</p></div>
      </div>

      <div className="toolbar">
        <div className="toolbar-field">
          <input placeholder="Search name or phone" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="toolbar-field toolbar-field--narrow">
          <select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="jobs">Sort: most jobs</option>
            <option value="rating">Sort: highest rating</option>
            <option value="newest">Sort: newest</option>
          </select>
        </div>
        <label className="filter-check">
          <input type="checkbox" checked={onlineOnly} onChange={(e) => setOnlineOnly(e.target.checked)} /> Online only
        </label>
        <label className="filter-check">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /> Verified only
        </label>
        <div className="toolbar-actions">
          <button type="button" className="btn btn-primary" onClick={() => { setPage(1); reload(); }}>Search</button>
          <button type="button" className="btn btn-outline" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <div className="loading-state">Loading assistants…</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Assistant</th>
                <th>Code</th>
                <th>Rating</th>
                <th>Jobs</th>
                <th>Status</th>
                <th>Wallet</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((u) => (
                <tr key={u.id}>
                  <td data-label="Assistant">
                    <strong>{u.name ?? '—'}</strong>
                    <div className="cell-sub">{u.phone}</div>
                  </td>
                  <td data-label="Code">{u.assistantCode ?? '—'}</td>
                  <td data-label="Rating">★ {(u.rating ?? 0).toFixed(1)}</td>
                  <td data-label="Jobs">{u.totalJobs ?? 0}</td>
                  <td data-label="Status">
                    {u.isOnline && <span className="badge badge-green">Online</span>}
                    {u.adminVerified ? <span className="badge badge-green">Verified</span> : <span className="badge badge-orange">Pending</span>}
                    {u.isSuspended && <span className="badge badge-red">Suspended</span>}
                  </td>
                  <td data-label="Wallet">₹{u.walletBalance}</td>
                  <td>
                    <Link to={`/users/${u.id}`} className="btn btn-outline btn-sm">View</Link>
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
