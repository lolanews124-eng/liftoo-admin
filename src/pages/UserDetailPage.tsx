import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { adminApi } from '../api/client';
import { RoleEditor } from '../components/RoleEditor';

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    if (!id) return;
    adminApi
      .user(id)
      .then((u) => {
        const data = u as unknown as Record<string, unknown>;
        setUser(data);
        setRoles((data.roles as string[]) ?? []);
      })
      .catch((e) => setError(e.message));
  };

  useEffect(() => {
    load();
  }, [id]);

  const saveRoles = async () => {
    if (!id) return;
    setSaving(true);
    setMsg('');
    try {
      await adminApi.updateUser(id, { roles: roles as ('customer' | 'assistant')[] });
      setMsg('Roles updated');
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const toggleSuspend = async () => {
    if (!id || !user) return;
    await adminApi.updateUser(id, { isSuspended: !user.isSuspended });
    load();
  };

  const toggleVerify = async () => {
    if (!id) return;
    const ap = user?.assistantProfile as { adminVerified?: boolean } | undefined;
    await adminApi.verifyAssistant(id, !ap?.adminVerified);
    load();
  };

  if (error && !user) {
    return (
      <div className="page">
        <div className="error-banner">{error}</div>
        <Link to="/users" className="btn btn-outline">← Back to users</Link>
      </div>
    );
  }
  if (!user) return <div className="page"><div className="loading-state">Loading user…</div></div>;

  const wallet = user.wallet as { balance?: number; transactions?: { type: string; amount: number; description: string; createdAt: string }[] } | undefined;
  const ap = user.assistantProfile as { rating?: number; totalJobs?: number; assistantCode?: string; adminVerified?: boolean } | undefined;
  const bookingsCustomer = (user.bookingsAsCustomer ?? []) as Record<string, unknown>[];
  const bookingsAssistant = (user.bookingsAsAssistant ?? []) as Record<string, unknown>[];
  const addresses = (user.addresses ?? []) as { label: string; formattedAddress: string }[];

  return (
    <div className="page">
      <Link to="/users" className="page-back">
        ← Back to users
      </Link>
      {error && <div className="error-banner">{error}</div>}
      {msg && <div className="success-banner">{msg}</div>}

      <div className="detail-header card">
        <div className="detail-avatar">{(String(user.name ?? user.phone ?? 'U'))[0].toUpperCase()}</div>
        <div>
          <h1 className="page-title" style={{ margin: 0 }}>{String(user.name ?? 'User')}</h1>
          <p className="page-sub" style={{ margin: '4px 0 0' }}>+91 {String(user.phone)} · {String(user.email ?? '—')}</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            {user.isSuspended ? <span className="badge badge-red">Suspended</span> : <span className="badge badge-green">Active</span>}
            {ap && (ap.adminVerified ? <span className="badge badge-green">Verified assistant</span> : <span className="badge badge-orange">KYC pending</span>)}
            {(user.availability as { isOnline?: boolean } | undefined)?.isOnline && <span className="badge badge-green">Online</span>}
          </div>
        </div>
        <div className="detail-actions">
          <button type="button" className="btn btn-outline btn-sm" onClick={toggleSuspend}>
            {user.isSuspended ? 'Unsuspend' : 'Suspend'}
          </button>
          {roles.includes('assistant') && (
            <button type="button" className="btn btn-outline btn-sm" onClick={toggleVerify}>
              {ap?.adminVerified ? 'Revoke verify' : 'Verify assistant'}
            </button>
          )}
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: 16 }}>
        <div className="card stat-card"><h3>Wallet</h3><p>₹{wallet?.balance ?? 0}</p></div>
        {ap && (
          <>
            <div className="card stat-card"><h3>Rating</h3><p>★ {ap.rating?.toFixed(1) ?? '—'}</p></div>
            <div className="card stat-card"><h3>Jobs done</h3><p>{ap.totalJobs ?? 0}</p></div>
          </>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <RoleEditor roles={roles} onChange={setRoles} />
        <div className="form-actions form-actions--start">
          <button type="button" className="btn btn-primary" onClick={saveRoles} disabled={saving}>
            {saving ? 'Saving…' : 'Save roles'}
          </button>
        </div>
      </div>

      {addresses.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Saved addresses</h3>
          {addresses.map((a, i) => (
            <p key={i}><strong>{a.label}</strong> — {a.formattedAddress}</p>
          ))}
        </div>
      )}

      {wallet?.transactions && wallet.transactions.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3>Recent wallet transactions</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Type</th><th>Amount</th><th>Description</th><th>Date</th></tr></thead>
              <tbody>
                {wallet.transactions.map((t, i) => (
                  <tr key={i}>
                    <td>{t.type}</td>
                    <td>₹{t.amount}</td>
                    <td>{t.description}</td>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(bookingsCustomer.length > 0 || bookingsAssistant.length > 0) && (
        <div className="grid-2" style={{ marginTop: 16 }}>
          {bookingsCustomer.length > 0 && (
            <div className="card">
              <h3>Bookings as customer</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Service</th><th>Status</th><th>Amount</th></tr></thead>
                  <tbody>
                    {bookingsCustomer.map((b) => (
                      <tr key={String(b.id)}>
                        <td>{(b.category as { name?: string })?.name ?? '—'}</td>
                        <td><span className="badge badge-orange">{String(b.status)}</span></td>
                        <td>₹{String(b.totalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {bookingsAssistant.length > 0 && (
            <div className="card">
              <h3>Bookings as assistant</h3>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Service</th><th>Customer</th><th>Status</th></tr></thead>
                  <tbody>
                    {bookingsAssistant.map((b) => (
                      <tr key={String(b.id)}>
                        <td>{(b.category as { name?: string })?.name ?? '—'}</td>
                        <td>{(b.customer as { name?: string })?.name ?? '—'}</td>
                        <td><span className="badge badge-orange">{String(b.status)}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
