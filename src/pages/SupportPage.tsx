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
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {['open', 'in_progress', 'resolved', 'closed', ''].map((s) => (
            <option key={s} value={s}>{s || 'All'}</option>
          ))}
        </select>
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
        <div className="card" style={{ marginTop: 20, padding: 20 }}>
          <h3>{selected.subject}</h3>
          <p>{selected.message}</p>
          <textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Admin reply" style={{ width: '100%' }} />
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={save}>Reply & resolve</button>
        </div>
      )}
    </div>
  );
}
