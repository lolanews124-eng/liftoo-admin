import { FormEvent, useEffect, useState } from 'react';
import { adminApi, AdminBroadcastRow } from '../api/client';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { usePaginatedList } from '../hooks/usePaginatedList';

type Audience = 'customer' | 'assistant';

export function NotificationsPage() {
  const [audience, setAudience] = useState<Audience>('customer');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const { items, total, page, setPage, loading, reload, limit, error: listError } = usePaginatedList<AdminBroadcastRow>(
    adminApi.notificationBroadcasts,
    {},
  );

  useEffect(() => {
    reload();
  }, [reload]);

  const send = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and message are required');
      return;
    }
    setSending(true);
    setError('');
    setMessage('');
    try {
      const res = await adminApi.broadcastNotification({
        audience,
        title: title.trim(),
        body: body.trim(),
      });
      setMessage(
        `Sent to ${res.sent} ${audience === 'customer' ? 'customers' : 'assistants'} (${res.targeted} targeted${res.failed ? `, ${res.failed} failed` : ''})`,
      );
      setTitle('');
      setBody('');
      reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="page">
      <PageHeader
        title="Push notifications"
        subtitle="Send to customer or assistant app: in-app list + live socket + phone push (when user has FCM token)."
      />
      {error && <div className="error-banner">{error}</div>}
      {listError && (
        <div className="error-banner">
          {listError}
          {listError.toLowerCase().includes('cannot reach') && (
            <p style={{ margin: '8px 0 0', fontSize: 13 }}>
              Local: run <code>npm run dev</code> in <code>backend</code> (port 5000), then <code>npm run dev</code> in <code>admin</code>.
            </p>
          )}
        </div>
      )}
      {message && <div className="success-banner">{message}</div>}

      <div className="card settings-section broadcast-form-card">
        <h2 className="card-heading">New broadcast</h2>
        <form onSubmit={send}>
          <div className="field">
            <span>Audience</span>
            <div className="segmented" role="group" aria-label="Audience">
              <button
                type="button"
                className={audience === 'customer' ? 'active' : ''}
                onClick={() => setAudience('customer')}
              >
                Customers
              </button>
              <button
                type="button"
                className={audience === 'assistant' ? 'active' : ''}
                onClick={() => setAudience('assistant')}
              >
                Assistants
              </button>
            </div>
            <small>In-app list, live socket, and push (when FCM token is set).</small>
          </div>
          <label className="field">
            <span>Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Festival offer this weekend"
              maxLength={120}
            />
          </label>
          <label className="field">
            <span>Message</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Short message users will read in the app…"
              rows={4}
              maxLength={1000}
            />
          </label>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={sending}>
              {sending ? 'Sending…' : audience === 'customer' ? 'Send to all customers' : 'Send to all assistants'}
            </button>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 className="card-heading">Broadcast history</h2>
        {loading ? (
          <div className="loading-state">Loading…</div>
        ) : items.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>No broadcasts yet.</p>
        ) : (
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Audience</th>
                  <th>Title</th>
                  <th>Sent</th>
                  <th>Failed</th>
                </tr>
              </thead>
              <tbody>
                {items.map((b) => (
                  <tr key={b.id}>
                    <td data-label="When">{new Date(b.createdAt).toLocaleString()}</td>
                    <td data-label="Audience">
                      <span className={`badge ${b.audience === 'customer' ? 'badge-green' : 'badge-orange'}`}>
                        {b.audience === 'customer' ? 'Customers' : 'Assistants'}
                      </span>
                    </td>
                    <td data-label="Title">
                      <strong>{b.title}</strong>
                      <br />
                      <small style={{ color: 'var(--muted)' }}>{b.body}</small>
                    </td>
                    <td data-label="Sent">{b.sentCount}</td>
                    <td data-label="Failed">{b.failCount > 0 ? b.failCount : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={total} limit={limit} onChange={setPage} />
      </div>
    </div>
  );
}
