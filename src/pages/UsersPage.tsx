import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi, UserRow } from '../api/client';
import { Pagination } from '../components/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { ListPanel } from '../components/ListPanel';
import { PageHeader } from '../components/PageHeader';
import { downloadCsv } from '../utils/exportCsv';

export function UsersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [applied, setApplied] = useState({ search: '', role: '' });

  const filters = useMemo(
    () => ({ search: applied.search, role: applied.role }),
    [applied],
  );

  const { items, total, page, setPage, loading, error, reload, limit, resetPage } = usePaginatedList<UserRow>(
    adminApi.users,
    filters,
  );

  const apply = () => {
    resetPage();
    setApplied({ search, role });
  };

  const toggleSuspend = async (u: UserRow) => {
    await adminApi.updateUser(u.id, { isSuspended: !u.isSuspended });
    reload();
  };

  const toggleVerify = async (u: UserRow) => {
    await adminApi.verifyAssistant(u.id, !u.adminVerified);
    reload();
  };

  const exportCsv = async () => {
    const r = await adminApi.users({ ...filters, page: '1', limit: '500' });
    downloadCsv(
      'users.csv',
      ['Name', 'Phone', 'Roles', 'Assistant Code', 'Wallet', 'Verified', 'Suspended', 'Rating', 'Jobs'],
      r.items.map((u) => [
        u.name ?? '',
        u.phone,
        u.roles.join(';'),
        u.assistantCode ?? '',
        u.walletBalance,
        u.adminVerified ? 'yes' : 'no',
        u.isSuspended ? 'yes' : 'no',
        u.rating ?? '',
        u.totalJobs ?? '',
      ]),
    );
  };

  return (
    <div className="page">
      <PageHeader
        title="Users & assistants"
        subtitle="Manage customers and assistants — click a row to view details"
        action={
          <Link to="/assistants" className="btn btn-outline">
            Assistant stats
          </Link>
        }
      />
      {error && <div className="error-banner">{error}</div>}
      <div className="toolbar">
        <div className="toolbar-field">
          <input
            placeholder="Search name, phone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && apply()}
          />
        </div>
        <div className="toolbar-field toolbar-field--narrow">
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="">All roles</option>
            <option value="customer">Customer</option>
            <option value="assistant">Assistant</option>
          </select>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="btn btn-primary" onClick={apply}>Search</button>
          <button type="button" className="btn btn-outline" onClick={exportCsv}>Export CSV</button>
        </div>
      </div>

      <ListPanel footer={<Pagination page={page} total={total} limit={limit} onChange={setPage} />}>
        {loading ? (
          <div className="loading-state">Loading users…</div>
        ) : items.length === 0 ? (
          <div className="empty-state-inline">No users match your filters</div>
        ) : (
          <div className="table-wrap">
          <table className="responsive-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Code</th>
                <th>Roles</th>
                <th>Wallet</th>
                <th>Stats</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((u) => (
                <tr key={u.id}>
                  <td data-label="Name">
                    <Link to={`/users/${u.id}`} className="table-link">{u.name ?? '—'}</Link>
                  </td>
                  <td data-label="Phone">{u.phone}</td>
                  <td data-label="Code">{u.assistantCode ?? '—'}</td>
                  <td data-label="Roles">{u.roles.join(', ')}</td>
                  <td data-label="Wallet">₹{u.walletBalance}</td>
                  <td data-label="Stats">
                    {u.roles.includes('assistant') && (
                      <span className="cell-sub">★ {(u.rating ?? 0).toFixed(1)} · {u.totalJobs ?? 0} jobs</span>
                    )}
                  </td>
                  <td data-label="Status">
                    {u.isSuspended ? <span className="badge badge-red">Suspended</span> : <span className="badge badge-green">Active</span>}
                    {u.isOnline && <span className="badge badge-green">Online</span>}
                    {u.roles.includes('assistant') && (
                      u.adminVerified ? <span className="badge badge-green">Verified</span> : <span className="badge badge-orange">KYC</span>
                    )}
                  </td>
                  <td data-label="Actions">
                    <div className="action-row">
                      <Link to={`/users/${u.id}`} className="btn btn-outline btn-sm">View</Link>
                      {u.roles.includes('assistant') && (
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleVerify(u)}>
                          {u.adminVerified ? 'Revoke' : 'Verify'}
                        </button>
                      )}
                      <button type="button" className="btn btn-outline btn-sm" onClick={() => toggleSuspend(u)}>
                        {u.isSuspended ? 'Unsuspend' : 'Suspend'}
                      </button>
                    </div>
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
