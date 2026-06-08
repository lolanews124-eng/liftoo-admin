import { useEffect, useState } from 'react';
import { adminApi, WebsiteContactInquiry } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { formatAppDate } from '../utils/formatDate';

const STATUSES = ['new', 'read', 'replied', 'closed'] as const;

export function WebsiteContactPage() {
  const [items, setItems] = useState<WebsiteContactInquiry[]>([]);
  const [selected, setSelected] = useState<WebsiteContactInquiry | null>(null);
  const [statusFilter, setStatusFilter] = useState('new');
  const [status, setStatus] = useState<WebsiteContactInquiry['status']>('read');
  const [adminNote, setAdminNote] = useState('');

  const load = () =>
    adminApi.websiteContactInquiries(statusFilter || undefined).then(setItems);

  useEffect(() => {
    load();
  }, [statusFilter]);

  const open = (item: WebsiteContactInquiry) => {
    setSelected(item);
    setStatus(item.status);
    setAdminNote(item.adminNote ?? '');
  };

  const save = async () => {
    if (!selected) return;
    await adminApi.updateWebsiteContactInquiry(selected.id, { status, adminNote });
    setSelected(null);
    load();
  };

  return (
    <div className="page">
      <PageHeader
        title="Website contact"
        subtitle="Messages from the liftoo.in contact form"
      />
      <div className="toolbar">
        <div className="toolbar-field toolbar-field--narrow">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            {['new', 'read', 'replied', 'closed', ''].map((s) => (
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
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.email}</td>
                <td>{item.phone}</td>
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
            <a href={`mailto:${selected.email}`}>{selected.email}</a> ·{' '}
            <a href={`tel:${selected.phone}`}>{selected.phone}</a>
          </p>
          <p style={{ margin: '0 0 16px', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {selected.message}
          </p>
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
