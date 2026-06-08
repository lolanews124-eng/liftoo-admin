import { useEffect, useState } from 'react';
import { adminApi, AssistantApplication } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { formatAppDate } from '../utils/formatDate';

const STATUSES = ['new', 'contacted', 'approved', 'rejected'] as const;

export function AssistantApplicationsPage() {
  const [items, setItems] = useState<AssistantApplication[]>([]);
  const [selected, setSelected] = useState<AssistantApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState('new');
  const [status, setStatus] = useState<AssistantApplication['status']>('contacted');
  const [adminNote, setAdminNote] = useState('');

  const load = () =>
    adminApi.assistantApplications(statusFilter || undefined).then(setItems);

  useEffect(() => {
    load();
  }, [statusFilter]);

  const open = (item: AssistantApplication) => {
    setSelected(item);
    setStatus(item.status);
    setAdminNote(item.adminNote ?? '');
  };

  const save = async () => {
    if (!selected) return;
    await adminApi.updateAssistantApplication(selected.id, { status, adminNote });
    setSelected(null);
    load();
  };

  return (
    <div className="page">
      <PageHeader
        title="Assistant applications"
        subtitle="Apply requests from the Become an Assistant page"
      />
      <div className="toolbar">
        <div className="toolbar-field toolbar-field--narrow">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            {['new', 'contacted', 'approved', 'rejected', ''].map((s) => (
              <option key={s} value={s}>
                {s ? s : 'All statuses'}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>City</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.phone}</td>
                <td>{item.email ?? '—'}</td>
                <td>{item.city}</td>
                <td>{item.status}</td>
                <td>{formatAppDate(item.createdAt)}</td>
                <td>
                  <button className="btn btn-outline" type="button" onClick={() => open(item)}>
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="card-heading">{selected.name}</h2>
          <p style={{ margin: '0 0 8px' }}>
            <a href={`tel:${selected.phone}`}>{selected.phone}</a>
            {selected.email ? (
              <>
                {' '}
                · <a href={`mailto:${selected.email}`}>{selected.email}</a>
              </>
            ) : null}
          </p>
          <p style={{ margin: '0 0 8px', color: 'var(--muted)' }}>City: {selected.city}</p>
          {selected.message ? (
            <p style={{ margin: '0 0 16px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {selected.message}
            </p>
          ) : null}
          <label className="field">
            <span>Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Admin note</span>
            <textarea
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Internal notes…"
            />
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => setSelected(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={save}>
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
