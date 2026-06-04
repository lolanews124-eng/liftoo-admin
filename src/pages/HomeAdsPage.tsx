import { useEffect, useRef, useState } from 'react';
import { adminApi, adminUploadImage, HomeFeedAd } from '../api/client';
import { PageHeader } from '../components/PageHeader';

const emptyForm = () => ({
  title: '',
  imageUrl: '',
  buttonLabel: '',
  buttonLink: '',
  buttonAction: 'url' as 'url' | 'route',
  sortOrder: 0,
  isActive: false,
});

export function HomeAdsPage() {
  const [items, setItems] = useState<HomeFeedAd[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    adminApi
      .homeFeedAds()
      .then(setItems)
      .catch((e) => setMessage(e instanceof Error ? e.message : 'Failed to load'));

  useEffect(() => {
    load();
  }, []);

  const onPickImage = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setMessage('');
    try {
      const { url } = await adminUploadImage(file);
      setForm((f) => ({ ...f, imageUrl: url }));
      setMessage('Image uploaded');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setForm(emptyForm());
    setEditingId(null);
  };

  const save = async () => {
    if (!form.imageUrl.trim()) {
      setMessage('Upload an image first');
      return;
    }
    try {
      if (editingId) {
        await adminApi.updateHomeFeedAd(editingId, form);
        setMessage('Ad updated');
      } else {
        await adminApi.createHomeFeedAd(form);
        setMessage('Ad created');
      }
      resetForm();
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const startEdit = (ad: HomeFeedAd) => {
    setEditingId(ad.id);
    setForm({
      title: ad.title ?? '',
      imageUrl: ad.imageUrl,
      buttonLabel: ad.buttonLabel ?? '',
      buttonLink: ad.buttonLink ?? '',
      buttonAction: ad.buttonAction === 'route' ? 'route' : 'url',
      sortOrder: ad.sortOrder,
      isActive: ad.isActive,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page">
      <PageHeader
        title="Home feed ads"
        subtitle="Banner below Refer & Earn on the customer app home screen. Only one ad can be live at a time."
      />
      {message && (
        <div
          className={
            message.includes('created') || message.includes('updated') || message.includes('uploaded')
              ? 'success-banner'
              : 'error-banner'
          }
        >
          {message}
        </div>
      )}

      <div className="card broadcast-form-card">
        <h2 className="card-heading">{editingId ? 'Edit ad' : 'New ad'}</h2>
        <div className="form-grid-2">
          <label className="field">
            <span>Title (optional)</span>
            <input
              placeholder="Summer sale"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Sort order</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
            />
          </label>
          <label className="field field--full">
            <span>Banner image</span>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPickImage(e.target.files?.[0])} />
            <div className="form-actions form-actions--start">
              <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                {uploading ? 'Uploading…' : 'Upload image'}
              </button>
              {form.imageUrl && (
                <a href={form.imageUrl} target="_blank" rel="noreferrer" className="muted-link">
                  Preview URL
                </a>
              )}
            </div>
            {form.imageUrl && (
              <img src={form.imageUrl} alt="Ad preview" className="home-ad-preview" />
            )}
          </label>
          <label className="field">
            <span>Button label</span>
            <input
              placeholder="Shop now"
              value={form.buttonLabel}
              onChange={(e) => setForm({ ...form, buttonLabel: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Button action</span>
            <select
              value={form.buttonAction}
              onChange={(e) => setForm({ ...form, buttonAction: e.target.value as 'url' | 'route' })}
            >
              <option value="url">Open URL (browser)</option>
              <option value="route">App route (e.g. /referral)</option>
            </select>
          </label>
          <label className="field field--full">
            <span>Button link</span>
            <input
              placeholder={form.buttonAction === 'route' ? '/referral' : 'https://liftoo.in'}
              value={form.buttonLink}
              onChange={(e) => setForm({ ...form, buttonLink: e.target.value })}
            />
          </label>
          <label className="field field--checkbox">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            <span>Live on home feed (deactivates other ads)</span>
          </label>
        </div>
        <div className="form-actions form-actions--start">
          <button type="button" className="btn btn-primary" onClick={save}>
            {editingId ? 'Save changes' : 'Create ad'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={resetForm}>
              Cancel edit
            </button>
          )}
        </div>
      </div>

      <div className="table-wrap card">
        <table className="responsive-table">
          <thead>
            <tr>
              <th>Preview</th>
              <th>Title</th>
              <th>Button</th>
              <th>Live</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="muted-cell">
                  No ads yet
                </td>
              </tr>
            ) : (
              items.map((ad) => (
                <tr key={ad.id}>
                  <td>
                    <img src={ad.imageUrl} alt="" className="home-ad-thumb" />
                  </td>
                  <td>{ad.title || '—'}</td>
                  <td>
                    {ad.buttonLabel ? (
                      <>
                        <strong>{ad.buttonLabel}</strong>
                        <br />
                        <span className="muted-small">{ad.buttonLink}</span>
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{ad.isActive ? 'Yes' : 'No'}</td>
                  <td data-label="Actions" className="actions-cell">
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(ad)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => adminApi.toggleHomeFeedAd(ad.id, !ad.isActive).then(load)}
                    >
                      {ad.isActive ? 'Deactivate' : 'Go live'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm btn-danger"
                      onClick={() => {
                        if (confirm('Delete this ad?')) adminApi.deleteHomeFeedAd(ad.id).then(load);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
