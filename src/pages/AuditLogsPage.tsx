import { useMemo, useState } from 'react';
import { adminApi, AuditLogRow } from '../api/client';
import { Pagination } from '../components/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';
import { downloadCsv } from '../utils/exportCsv';

export function AuditLogsPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');

  const filterKey = `${search}|${actionFilter}|${entityFilter}`;
  const filters = useMemo(() => {
    const p: Record<string, string> = {};
    if (search) p.search = search;
    return p;
  }, [filterKey]);

  const { items, total, page, setPage, loading, error, reload, limit } = usePaginatedList<AuditLogRow>(
    adminApi.auditLogs,
    filters,
  );

  const filtered = items.filter((log) => {
    if (actionFilter && log.action !== actionFilter) return false;
    if (entityFilter && log.entity !== entityFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        (log.entityId ?? '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const actions = [...new Set(items.map((l) => l.action))];
  const entities = [...new Set(items.map((l) => l.entity))];

  const exportPage = () => {
    downloadCsv(
      `audit-logs-page-${page}.csv`,
      ['Date', 'Action', 'Entity', 'Entity ID', 'Admin ID'],
      filtered.map((l) => [
        new Date(l.createdAt).toISOString(),
        l.action,
        l.entity,
        l.entityId ?? '',
        l.adminId,
      ]),
    );
  };

  return (
    <div className="page">
      <h1 className="page-title">Audit logs</h1>
      <p className="page-sub">Track admin actions across the platform</p>
      {error && <div className="error-banner">{error}</div>}

      <div className="toolbar">
        <div className="toolbar-field">
          <input placeholder="Search action, entity, ID…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="toolbar-field toolbar-field--narrow">
          <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}>
            <option value="">All actions</option>
            {actions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-field toolbar-field--narrow">
          <select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)}>
            <option value="">All entities</option>
            {entities.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-actions">
          <button type="button" className="btn btn-primary" onClick={() => { setPage(1); reload(); }}>Apply</button>
          <button type="button" className="btn btn-outline" onClick={exportPage}>Export page CSV</button>
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <div className="loading-state">Loading audit logs…</div>
        ) : filtered.length === 0 ? (
          <div className="empty-state-inline">No audit logs found</div>
        ) : (
          <table>
            <thead>
              <tr><th>When</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>Details</th></tr>
            </thead>
            <tbody>
              {filtered.map((l) => (
                <tr key={l.id}>
                  <td data-label="When">{new Date(l.createdAt).toLocaleString()}</td>
                  <td data-label="Action"><span className="badge badge-gray">{l.action}</span></td>
                  <td data-label="Entity">{l.entity}</td>
                  <td data-label="ID">{l.entityId ? `${l.entityId.slice(0, 8)}…` : '—'}</td>
                  <td data-label="Details">
                    {l.metadata ? (
                      <code className="meta-code">{JSON.stringify(l.metadata).slice(0, 80)}</code>
                    ) : (
                      '—'
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
