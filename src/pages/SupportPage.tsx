import { useEffect, useState } from 'react';
import { adminApi, SupportTicket } from '../api/client';
import { PageHeader } from '../components/PageHeader';

export function SupportPage() {
  const [items, setItems] = useState<SupportTicket[]>([]);
  const [selected, setSelected] = useState<SupportTicket | null>(null);
  const [reply, setReply] = useState('');
  const [status, setStatus] = useState('open');

  const load = () => adminApi.supportTickets(status || undefined).then(setItems);

  useEffect(() => { load(); }, [status]);

  const save = async () => {
    if (!selected) return;
    await adminApi.updateSupportTicket(selected.id, { adminReply: reply, status: 'resolved' });
    setSelected(null);
    setReply('');
    load();
  };

  return (
    <div className="page">
      <PageHeader title="Support tickets" subtitle="Customer help requests from the app" />
      <div className="toolbar">
        <div className="toolbar-field toolbar-field--narrow">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            {['open', 'in_progress', 'resolved', 'closed', ''].map((s) => (
              <option key={s} value={s}>{s ? s.replace('_', ' ') : 'All statuses'}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr><th>User</th><th>Subject</th><th>Status</th><th>Date</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((t) => (
              <tr key={t.id}>
                <td>{t.user?.name ?? t.user?.phone}</td>
                <td>{t.subject}</td>
                <td>{t.status}</td>
                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td><button className="btn btn-outline" onClick={() => { setSelected(t); setReply(t.adminReply ?? ''); }}>View</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="card" style={{ marginTop: 20 }}>
          <h2 className="card-heading">{selected.subject}</h2>
          <p style={{ margin: '0 0 16px', lineHeight: 1.5 }}>{selected.message}</p>
          <label className="field">
            <span>Admin reply</span>
            <textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write your reply to the customer…" />
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn-outline" onClick={() => { setSelected(null); setReply(''); }}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary" onClick={save} disabled={!reply.trim()}>
              Reply & resolve
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
