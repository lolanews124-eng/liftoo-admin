import { FormEvent, useEffect, useState } from 'react';
import { adminApi, Category, PlatformSettings } from '../api/client';

export function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [form, setForm] = useState({ slug: '', name: '', baseRate: 150, icon: '', description: '' });
  const [editing, setEditing] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ name: '', baseRate: 0, description: '', icon: '' });
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [cats, s] = await Promise.all([adminApi.categories(), adminApi.getSettings()]);
      setItems(cats);
      setSettings(s);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  };

  useEffect(() => { load(); }, []);

  const assistantShare = (rate: number) => {
    const pct = settings?.assistantEarningPercent ?? 80;
    return Math.round(rate * (pct / 100));
  };

  const create = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await adminApi.createCategory({
        slug: form.slug.trim(),
        name: form.name.trim(),
        baseRate: form.baseRate,
        icon: form.icon || undefined,
        description: form.description || undefined,
        isActive: true,
      });
      setForm({ slug: '', name: '', baseRate: 150, icon: '', description: '' });
      setMessage('Category created');
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (c: Category) => {
    setEditing(c);
    setEditForm({
      name: c.name,
      baseRate: c.baseRate,
      description: c.description ?? '',
      icon: c.icon ?? '',
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (editForm.baseRate < 0) {
      setError('Price cannot be negative');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await adminApi.updateCategory(editing.id, {
        name: editForm.name.trim(),
        baseRate: editForm.baseRate,
        description: editForm.description.trim() || undefined,
        icon: editForm.icon.trim() || undefined,
      });
      setEditing(null);
      setMessage(`Price updated for ${editForm.name}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: Category) => {
    await adminApi.updateCategory(c.id, { isActive: !c.isActive });
    await load();
  };

  return (
    <div className="page">
      <h1 className="page-title">Category pricing</h1>
      <p className="page-sub">
        Set service price per hour for each category. Customer fee = rate × hours + platform fee.
        Assistant earns {settings?.assistantEarningPercent ?? 80}% of service fee (from Settings).
      </p>
      {error && <div className="error-banner">{error}</div>}
      {message && <div className="success-banner">{message}</div>}

      <form className="card" onSubmit={create} style={{ marginBottom: 16, padding: 24 }}>
        <h3 style={{ marginTop: 0 }}>Add new category</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <div className="field">
            <label>Slug (unique id)</label>
            <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="bag_carry" required />
          </div>
          <div className="field">
            <label>Display name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Bag Carry" required />
          </div>
          <div className="field">
            <label>Price per hour (₹)</label>
            <input
              type="number"
              min={0}
              step={1}
              value={form.baseRate}
              onChange={(e) => setForm({ ...form, baseRate: Number(e.target.value) })}
              required
            />
          </div>
          <div className="field">
            <label>Icon key</label>
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="shopping_bag" />
          </div>
        </div>
        <div className="field" style={{ marginTop: 12 }}>
          <label>Description (optional)</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <p style={{ fontSize: 13, color: 'var(--muted)', margin: '12px 0' }}>
          1 hour booking → customer pays ~₹{form.baseRate} service + {settings?.platformFeePercent ?? 10}% platform fee.
          Assistant ~₹{assistantShare(form.baseRate)}.
        </p>
        <button className="btn btn-primary" disabled={saving}>Create category</button>
      </form>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Price / hour</th>
              <th>1 hr example</th>
              <th>Assistant ~</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((c) => {
              const platformPct = settings?.platformFeePercent ?? 10;
              const service1hr = c.baseRate;
              const total1hr = Math.round(service1hr + service1hr * (platformPct / 100));
              return (
                <tr key={c.id}>
                  <td>
                    <strong>{c.name}</strong>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{c.slug}</div>
                  </td>
                  <td>
                    <strong style={{ fontSize: 16 }}>₹{c.baseRate}</strong>
                    <span style={{ color: 'var(--muted)' }}>/hr</span>
                  </td>
                  <td>
                    <div>Service ₹{service1hr}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>Customer total ~₹{total1hr}</div>
                  </td>
                  <td>₹{assistantShare(c.baseRate)}/hr</td>
                  <td>
                    {c.isActive ? (
                      <span className="badge badge-green">Active</span>
                    ) : (
                      <span className="badge badge-gray">Inactive</span>
                    )}
                  </td>
                  <td style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => openEdit(c)}>Edit price</button>
                    <button className="btn btn-outline btn-sm" onClick={() => toggle(c)}>
                      {c.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="modal-backdrop" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <h2 style={{ marginTop: 0 }}>Edit — {editing.name}</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14 }}>Slug: {editing.slug} (cannot change)</p>

            <div className="field">
              <label>Display name</label>
              <input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Price per hour (₹)</label>
              <input
                type="number"
                min={0}
                step={1}
                value={editForm.baseRate}
                onChange={(e) => setEditForm({ ...editForm, baseRate: Number(e.target.value) })}
              />
            </div>
            <div className="field">
              <label>Description</label>
              <input
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Icon key</label>
              <input
                value={editForm.icon}
                onChange={(e) => setEditForm({ ...editForm, icon: e.target.value })}
              />
            </div>

            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
              <div>1 hour → service fee ₹{editForm.baseRate}</div>
              <div>Customer pays ~₹{Math.round(editForm.baseRate * (1 + (settings?.platformFeePercent ?? 10) / 100))} incl. platform fee</div>
              <div>Assistant earns ~₹{assistantShare(editForm.baseRate)} ({settings?.assistantEarningPercent ?? 80}%)</div>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary" onClick={saveEdit} disabled={saving}>
                {saving ? 'Saving…' : 'Save price'}
              </button>
              <button className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
