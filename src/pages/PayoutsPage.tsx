import { useEffect, useState } from 'react';
import { adminApi, PayoutRequest } from '../api/client';

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
      <h1 className="page-title">Payout Requests</h1>
      <p className="page-sub">Approve and mark assistant bank payouts</p>
      {message && <div className="error-banner">{message}</div>}
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All</option>
          {['pending', 'approved', 'rejected', 'paid'].map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
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
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td>
                  {p.status === 'pending' && (
                    <>
                      <button className="btn btn-outline" onClick={() => process(p.id, 'approved')}>Approve</button>{' '}
                      <button className="btn btn-outline" onClick={() => process(p.id, 'rejected')}>Reject</button>
                    </>
                  )}
                  {p.status === 'approved' && (
                    <button className="btn btn-primary" onClick={() => process(p.id, 'paid')}>Mark paid</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
