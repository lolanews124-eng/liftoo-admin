import { useEffect, useState } from 'react';
import { adminApi, VerificationDetail } from '../api/client';

export function VerificationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VerificationDetail | null>(null);
  const [queue, setQueue] = useState<{ userId: string; user: { name: string; phone: string }; pendingCount: number }[]>([]);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const loadQueue = () => {
    adminApi.verifications({ status: 'pending' }).then((r) => setQueue(r.items)).catch((e) => setError(e.message));
  };

  useEffect(() => { loadQueue(); }, []);

  const openUser = async (id: string) => {
    setUserId(id);
    setDetail(await adminApi.verification(id));
  };

  const review = async (type: string, status: 'verified' | 'rejected') => {
    if (!userId) return;
    await adminApi.reviewVerification({ userId, type, status, adminNote: note || undefined });
    setNote('');
    await openUser(userId);
    loadQueue();
  };

  return (
    <div className="page">
      <h1 className="page-title">KYC Verification</h1>
      <p className="page-sub">Review assistant documents and approve or reject</p>
      {error && <div className="error-banner">{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Pending queue</h3>
          {queue.length === 0 && <p style={{ color: 'var(--muted)' }}>No pending verifications</p>}
          {queue.map((q) => (
            <button
              key={q.userId}
              className="btn btn-outline"
              style={{ width: '100%', marginBottom: 8, textAlign: 'left' }}
              onClick={() => openUser(q.userId)}
            >
              <strong>{q.user.name ?? q.user.phone}</strong>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{q.pendingCount} pending</div>
            </button>
          ))}
        </div>

        <div className="card">
          {!detail ? (
            <p style={{ color: 'var(--muted)' }}>Select an assistant to review documents</p>
          ) : (
            <>
              <h2 style={{ marginTop: 0 }}>{detail.user.name ?? detail.user.phone}</h2>
              <p style={{ color: 'var(--muted)' }}>
                Completion: {detail.summary.completionPercent}% · Pending: {detail.summary.pendingCount}
              </p>
              <div className="field">
                <label>Admin note (optional)</label>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for rejection, etc." />
              </div>
              <div className="doc-grid">
                {detail.documents.map((d) => (
                  <div key={d.type} className="doc-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <strong>{d.label ?? d.type}</strong>
                      <span className={`badge ${d.status === 'verified' ? 'badge-green' : d.status === 'pending' ? 'badge-orange' : 'badge-gray'}`}>
                        {d.status}
                      </span>
                    </div>
                    {d.fileUrl && (
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', fontSize: 13 }}>
                        View file
                      </a>
                    )}
                    {d.textValue && <p style={{ fontSize: 13 }}>{d.textValue}</p>}
                    {d.metadata && (
                      <pre style={{ fontSize: 12, background: '#f9fafb', padding: 8, borderRadius: 8, overflow: 'auto' }}>
                        {JSON.stringify(d.metadata, null, 2)}
                      </pre>
                    )}
                    {d.status === 'pending' && (
                      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                        <button className="btn btn-success btn-sm" onClick={() => review(d.type, 'verified')}>Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => review(d.type, 'rejected')}>Reject</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
