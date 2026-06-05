import { useEffect, useState } from 'react';
import { adminApi, resolveVerificationFileUrl, VerificationDetail, VerificationDoc } from '../api/client';
import { ImageLightbox } from '../components/ImageLightbox';
import { PageHeader } from '../components/PageHeader';

function DocPreview({ doc, onViewImage }: { doc: VerificationDoc; onViewImage: (url: string, label: string) => void }) {
  const resolved = resolveVerificationFileUrl(doc.fileUrl);

  if (!doc.fileUrl) return null;

  if (resolved.isInvalid) {
    return (
      <div className="doc-file-warning">
        <span aria-hidden>⚠</span>
        <div>
          <strong>File not uploaded correctly</strong>
          <p>Ask the assistant to re-submit this document from the app.</p>
        </div>
      </div>
    );
  }

  if (!resolved.url) return null;

  if (resolved.isImage) {
    return (
      <div className="doc-preview">
        <button
          type="button"
          className="doc-preview-thumb"
          onClick={() => onViewImage(resolved.url!, doc.label ?? doc.type)}
          aria-label={`View ${doc.label ?? doc.type}`}
        >
          <img src={resolved.url} alt={doc.label ?? doc.type} loading="lazy" />
        </button>
        <div className="doc-preview-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onViewImage(resolved.url!, doc.label ?? doc.type)}>
            View full size
          </button>
          <a href={resolved.url} target="_blank" rel="noreferrer" className="table-link">
            Open in tab
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-preview-actions">
      <a href={resolved.url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm">
        {resolved.isPdf ? 'View PDF' : 'View file'}
      </a>
    </div>
  );
}

export function VerificationsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [detail, setDetail] = useState<VerificationDetail | null>(null);
  const [queue, setQueue] = useState<{ userId: string; user: { name: string; phone: string }; pendingCount: number }[]>([]);
  const [error, setError] = useState('');
  const [queueLoading, setQueueLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [reviewing, setReviewing] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);

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
    setReviewing(type);
    setError('');
    try {
      await adminApi.reviewVerification({ userId, type, status, adminNote: note || undefined });
      setNote('');
      await openUser(userId);
      loadQueue();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Review failed');
    } finally {
      setReviewing(null);
    }
  };

  const pendingDocs = detail?.documents.filter((d) => d.status === 'pending') ?? [];
  const submittedDocs = detail?.documents.filter((d) => d.status !== 'not_submitted') ?? [];

  return (
    <div className="page">
      <PageHeader title="KYC verification" subtitle="Review assistant documents — preview images inline and approve or reject" />
      {error && <div className="error-banner">{error}</div>}

      <div className="kyc-layout">
        <div className="card kyc-queue-card">
          <div className="kyc-queue-header">
            <h2 className="card-heading">Pending queue</h2>
            {!queueLoading && queue.length > 0 && <span className="badge badge-orange">{queue.length}</span>}
          </div>
          {queueLoading ? (
            <div className="data-panel-loading" aria-busy="true">
              <div className="spinner" />
              <span>Loading queue…</span>
            </div>
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
                  <div className="kyc-queue-item-main">
                    <strong>{q.user.name ?? q.user.phone}</strong>
                    {q.user.name && <span className="cell-sub">{q.user.phone}</span>}
                  </div>
                  <span className="badge badge-orange">{q.pendingCount} pending</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card kyc-review-card">
          {detailLoading ? (
            <div className="data-panel-loading" aria-busy="true">
              <div className="spinner" />
              <span>Loading documents…</span>
            </div>
          ) : !detail ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <div className="empty-state-icon" aria-hidden>📄</div>
              <strong>Select an assistant</strong>
              <p>Choose someone from the queue to review their KYC documents.</p>
            </div>
          ) : (
            <>
              <div className="kyc-review-header">
                <div>
                  <h2 className="card-heading" style={{ marginTop: 0 }}>{detail.user.name ?? detail.user.phone}</h2>
                  <p className="page-sub" style={{ margin: 0 }}>{detail.user.phone}</p>
                </div>
                <div className="kyc-progress">
                  <div className="kyc-progress-label">
                    <span>Completion</span>
                    <strong>{detail.summary.completionPercent}%</strong>
                  </div>
                  <div className="kyc-progress-bar" role="progressbar" aria-valuenow={detail.summary.completionPercent} aria-valuemin={0} aria-valuemax={100}>
                    <div className="kyc-progress-fill" style={{ width: `${detail.summary.completionPercent}%` }} />
                  </div>
                  <span className="kyc-progress-pending">{detail.summary.pendingCount} pending review</span>
                </div>
              </div>

              {pendingDocs.length > 0 && (
                <label className="field kyc-note-field">
                  <span>Admin note (optional — applies to next reject)</span>
                  <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Reason for rejection, etc." />
                </label>
              )}

              <div className="doc-grid">
                {detail.documents.map((d) => (
                  <div
                    key={d.type}
                    className={`doc-item doc-item--${d.status}${d.status === 'pending' ? ' doc-item--attention' : ''}`}
                  >
                    <div className="doc-item-header">
                      <div>
                        <strong>{d.label ?? d.type}</strong>
                        {d.uploadedAt && (
                          <span className="cell-sub">Uploaded {new Date(d.uploadedAt).toLocaleString()}</span>
                        )}
                      </div>
                      <span
                        className={`badge ${
                          d.status === 'verified'
                            ? 'badge-green'
                            : d.status === 'pending'
                              ? 'badge-orange'
                              : d.status === 'rejected'
                                ? 'badge-red'
                                : 'badge-gray'
                        }`}
                      >
                        {d.status.replace('_', ' ')}
                      </span>
                    </div>

                    {d.textValue && !d.fileUrl && (
                      <p className="doc-text-value">{d.textValue}</p>
                    )}

                    <DocPreview doc={d} onViewImage={(src, alt) => setLightbox({ src, alt })} />

                    {d.adminNote && <p className="doc-admin-note">Admin: {d.adminNote}</p>}

                    {d.status === 'pending' && (
                      <div className="btn-group doc-actions">
                        <button
                          type="button"
                          className="btn btn-success btn-sm"
                          disabled={reviewing === d.type}
                          onClick={() => review(d.type, 'verified')}
                        >
                          {reviewing === d.type ? 'Saving…' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={reviewing === d.type}
                          onClick={() => review(d.type, 'rejected')}
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {submittedDocs.length === 0 && (
                <p className="kyc-empty-docs">No documents submitted yet.</p>
              )}
            </>
          )}
        </div>
      </div>

      {lightbox && (
        <ImageLightbox src={lightbox.src} alt={lightbox.alt} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
