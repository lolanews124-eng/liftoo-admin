import { useEffect, useState } from 'react';
import { adminApi, VerificationDetail } from '../api/client';
import { PageHeader } from '../components/PageHeader';

export function VerificationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VerificationDetail | null>(null);
  const [queue, setQueue] = useState<{ userId: string; user: { name: string; phone: string }; pendingCount: number }[]>([]);
  const [error, setError] = useState('');
  const [queueLoading, setQueueLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [note, setNote] = useState('');

  const loadQueue = () => {
    setQueueLoading(true);
    adminApi
      .verifications({ status: 'pending' })
      .then((r) => setQueue(r.items ?? []))
      .catch((e) => setError(e.message))
      .finally(() => setQueueLoading(false));
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const openUser = async (id: string) => {
    setUserId(id);
    setDetailLoading(true);
    setError('');
    try {
      setDetail(await adminApi.verification(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load documents');
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
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
      <PageHeader title="KYC verification" subtitle="Review assistant documents and approve or reject" />
      {error && <div className="error-banner">{error}</div>}

      <div className="kyc-layout">
        <div className="card">
          <h2 className="card-heading">Pending queue</h2>
          {queueLoading ? (
            <p style={{ color: 'var(--muted)', margin: 0 }}>Loading queue…</p>
          ) : queue.length === 0 ? (
            <div className="empty-state" style={{ padding: '24px 0' }}>
              <div className="empty-state-icon" aria-hidden>✓</div>
              <strong>All caught up</strong>
              <p>No pending verifications right now.</p>
            </div>
          ) : (
            <div className="kyc-queue-list">
              {queue.map((q) => (
                <button
                  key={q.userId}
                  type="button"
                  className={`kyc-queue-item${userId === q.userId ? ' active' : ''}`}
                  onClick={() => openUser(q.userId)}
                >
                  <strong>{q.user.name ?? q.user.phone}</strong>
                  <span>{q.pendingCount} document{q.pendingCount !== 1 ? 's' : ''} pending</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          {detailLoading ? (
            <p style={{ color: 'var(--muted)', margin: 0 }}>Loading documents…</p>
          ) : !detail ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-state-icon" aria-hidden>📄</div>
              <strong>Select an assistant</strong>
              <p>Choose someone from the queue to review their KYC documents.</p>
            </div>
          ) : (
            <>
              <h2 className="card-heading" style={{ marginTop: 0 }}>{detail.user.name ?? detail.user.phone}</h2>
              <p className="page-sub" style={{ margin: '0 0 16px' }}>
                Completion: {detail.summary.completionPercent}% · Pending: {detail.summary.pendingCount}
              </p>
              <label className="field">
                <span>Admin note (optional)</span>
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for rejection, etc." />
              </label>
              <div className="doc-grid">
                {detail.documents.map((d) => (
                  <div key={d.type} className="doc-item">
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                      <strong>{d.label ?? d.type}</strong>
                      <span className={`badge ${d.status === 'verified' ? 'badge-green' : d.status === 'pending' ? 'badge-orange' : 'badge-gray'}`}>
                        {d.status}
                      </span>
                    </div>
                    {d.fileUrl && (
                      <a href={d.fileUrl} target="_blank" rel="noreferrer" className="table-link" style={{ fontSize: 13 }}>
                        View file
                      </a>
                    )}
                    {d.textValue && <p style={{ fontSize: 13, margin: '8px 0 0' }}>{d.textValue}</p>}
                    {d.status === 'pending' && (
                      <div className="btn-group" style={{ marginTop: 12 }}>
                        <button type="button" className="btn btn-success btn-sm" onClick={() => review(d.type, 'verified')}>
                          Approve
                        </button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => review(d.type, 'rejected')}>
                          Reject
                        </button>
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
