import { useEffect, useState } from 'react';
import { adminApi, PayoutRequest } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { formatAppDate } from '../utils/formatDate';

export function PayoutsPage() {
  const [items, setItems] = useState<PayoutRequest[]>([]);
  const [status, setStatus] = useState('pending');
  const [message, setMessage] = useState('');

  const load = () =>
    adminApi.payoutRequests(status || undefined).then(setItems).catch((e) => setMessage(e.message));

  useEffect(() => { load(); }, [status]);

  const process = async (id: string, newStatus: string) => {
    await adminApi.processPayout(id, newStatus);
    load();
  };

  return (
    <div className="page">
      <PageHeader title="Payout requests" subtitle="Approve and mark assistant bank payouts" />
      {message && <div className="error-banner">{message}</div>}
      <div className="toolbar">
        <div className="toolbar-field toolbar-field--narrow">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
            <option value="">All statuses</option>
            {['pending', 'approved', 'rejected', 'paid'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="table-wrap card">
        <table>
          <thead>
            <tr><th>Assistant</th><th>Amount</th><th>Bank</th><th>Status</th><th>Date</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td>{p.assistant?.name ?? '—'}<br /><small>{p.assistant?.phone}</small></td>
                <td>₹{p.amount}</td>
                <td>{p.bankAccount ?? '—'} / {p.ifscCode ?? '—'}</td>
                <td><span className="badge badge-orange">{p.status}</span></td>
                <td>{formatAppDate(p.createdAt)}</td>
                <td data-label="Actions">
                  <div className="action-row">
                    {p.status === 'pending' && (
                      <>
                        <button type="button" className="btn btn-success btn-sm" onClick={() => process(p.id, 'approved')}>Approve</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => process(p.id, 'rejected')}>Reject</button>
                      </>
                    )}
                    {p.status === 'approved' && (
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => process(p.id, 'paid')}>Mark paid</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
