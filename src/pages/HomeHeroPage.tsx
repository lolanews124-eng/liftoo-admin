import { useEffect, useRef, useState } from 'react';
import { adminApi, adminUploadImage, HomeHeroSlide, normalizePublicUploadUrl } from '../api/client';
import { PageHeader } from '../components/PageHeader';

const emptyForm = () => ({
  tag: '',
  title: '',
  subtitle: '',
  ctaLabel: 'Book Assistant',
  imageUrl: '',
  accentColor: '#E91E8C',
  sortOrder: 0,
  isActive: false,
});

export function HomeHeroPage() {
  const [items, setItems] = useState<HomeHeroSlide[]>([]);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    adminApi
      .homeHeroSlides()
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
      setMessage('Background image uploaded');
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
      setMessage('Upload a background image first');
      return;
    }
    if (!form.tag.trim() || !form.title.trim() || !form.subtitle.trim() || !form.ctaLabel.trim()) {
      setMessage('Fill tag, title, subtitle and button label');
      return;
    }
    try {
      const payload = {
        ...form,
        title: form.title.replace(/\\n/g, '\n'),
      };
      if (editingId) {
        await adminApi.updateHomeHeroSlide(editingId, payload);
        setMessage('Hero slide updated');
      } else {
        await adminApi.createHomeHeroSlide(payload);
        setMessage('Hero slide created');
      }
      resetForm();
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed');
    }
  };

  const startEdit = (slide: HomeHeroSlide) => {
    setEditingId(slide.id);
    setForm({
      tag: slide.tag,
      title: slide.title,
      subtitle: slide.subtitle,
      ctaLabel: slide.ctaLabel,
      imageUrl: normalizePublicUploadUrl(slide.imageUrl),
      accentColor: slide.accentColor ?? '#E91E8C',
      sortOrder: slide.sortOrder,
      isActive: slide.isActive,
    });
    document.querySelector('.home-hero-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="page">
      <PageHeader
        title="Home hero carousel"
        subtitle="Top carousel on the customer app home screen. Text overlays on a background image — same layout as the app, fully managed here."
      />

      <div className="card home-ad-guidelines">
        <h2 className="card-heading">Image & copy guidelines</h2>
        <ul className="guidelines-list guidelines-list--inline">
          <li>
            <strong>Recommended image:</strong> 1200 × 600 px (2∶1)
          </li>
          <li>
            <strong>Format:</strong> JPG/PNG under 2 MB
          </li>
          <li>
            <strong>Safe zone:</strong> Keep the left half clear — text appears there
          </li>
          <li>
            <strong>Title line breaks:</strong> Use Enter in the title field (max 2 lines on phone)
          </li>
          <li>
            Up to <strong>6 live slides</strong> — lower sort order appears first
          </li>
        </ul>
      </div>

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

      <div className="home-ads-layout">
        <div className="card home-hero-form broadcast-form-card">
          <h2 className="card-heading">{editingId ? 'Edit slide' : 'New slide'}</h2>
          <div className="form-grid-2 home-ad-form-grid">
            <label className="field">
              <span>Tag badge</span>
              <input
                placeholder="Family help"
                value={form.tag}
                onChange={(e) => setForm({ ...form, tag: e.target.value })}
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
              <span>Title</span>
              <textarea
                rows={2}
                placeholder={'Help for family\n& seniors'}
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </label>
            <label className="field field--full">
              <span>Subtitle</span>
              <textarea
                rows={2}
                placeholder="Trusted support at hospitals, malls and crowded places."
                value={form.subtitle}
                onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Button label</span>
              <input
                placeholder="Get help"
                value={form.ctaLabel}
                onChange={(e) => setForm({ ...form, ctaLabel: e.target.value })}
              />
            </label>
            <label className="field">
              <span>Accent color</span>
              <div className="color-field-row">
                <input
                  type="color"
                  value={form.accentColor.startsWith('#') ? form.accentColor : `#${form.accentColor}`}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                />
                <input
                  placeholder="#10B981"
                  value={form.accentColor}
                  onChange={(e) => setForm({ ...form, accentColor: e.target.value })}
                />
              </div>
            </label>
            <label className="field field--full">
              <span>Background image</span>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onPickImage(e.target.files?.[0])} />
              <div className="form-actions form-actions--start">
                <button type="button" className="btn btn-outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? 'Uploading…' : 'Upload background'}
                </button>
              </div>
              {form.imageUrl && (
                <div
                  className="home-hero-preview"
                  style={{
                    backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.1) 100%), url(${normalizePublicUploadUrl(form.imageUrl)})`,
                  }}
                >
                  <div className="home-hero-preview__content">
                    <span className="home-hero-preview__tag" style={{ backgroundColor: `${form.accentColor}33`, color: form.accentColor }}>
                      {form.tag || 'Tag'}
                    </span>
                    <strong className="home-hero-preview__title">{form.title || 'Title'}</strong>
                    <p className="home-hero-preview__subtitle">{form.subtitle || 'Subtitle'}</p>
                    <span className="home-hero-preview__cta" style={{ backgroundColor: form.accentColor }}>
                      {form.ctaLabel || 'CTA'}
                    </span>
                  </div>
                </div>
              )}
            </label>
            <label className="field field--checkbox field--full">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              <span>Live on home hero carousel</span>
            </label>
          </div>
          <div className="form-actions form-actions--start">
            <button type="button" className="btn btn-primary" onClick={save}>
              {editingId ? 'Save changes' : 'Create slide'}
            </button>
            {editingId && (
              <button type="button" className="btn btn-outline" onClick={resetForm}>
                Cancel edit
              </button>
            )}
          </div>
        </div>

        <div className="list-panel home-ads-list">
          <h2 className="card-heading card-table-title">All slides ({items.length})</h2>
          <div className="table-wrap">
            <table className="responsive-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Tag / Title</th>
                  <th>CTA</th>
                  <th>Live</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="muted-cell">
                      No hero slides yet — create one using the form
                    </td>
                  </tr>
                ) : (
                  items.map((slide) => (
                    <tr key={slide.id}>
                      <td data-label="Preview">
                        <img src={normalizePublicUploadUrl(slide.imageUrl)} alt="" className="home-ad-thumb home-hero-thumb" />
                      </td>
                      <td data-label="Copy">
                        <span className="badge badge-outline">{slide.tag}</span>
                        <br />
                        <strong>{slide.title.replace(/\n/g, ' ')}</strong>
                      </td>
                      <td data-label="CTA">{slide.ctaLabel}</td>
                      <td data-label="Live">
                        {slide.isActive ? <span className="badge badge-green">Live</span> : <span className="badge badge-gray">Off</span>}
                      </td>
                      <td data-label="Actions" className="actions-cell">
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(slide)}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          onClick={() => adminApi.toggleHomeHeroSlide(slide.id, !slide.isActive).then(load)}
                        >
                          {slide.isActive ? 'Deactivate' : 'Go live'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm btn-danger"
                          onClick={() => {
                            if (confirm('Delete this slide?')) adminApi.deleteHomeHeroSlide(slide.id).then(load);
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
      </div>
    </div>
  );
}
