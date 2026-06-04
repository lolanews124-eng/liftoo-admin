import { useEffect, useState } from 'react';
import { adminApi, PromoCode } from '../api/client';
import { PageHeader } from '../components/PageHeader';

export function PromosPage() {
  const [items, setItems] = useState<PromoCode[]>([]);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'fixed' | 'percent'>('fixed');
  const [discountValue, setDiscountValue] = useState(50);
  const [message, setMessage] = useState('');

  const load = () => adminApi.promos().then(setItems).catch((e) => setMessage(e.message));

  useEffect(() => { load(); }, []);

  const create = async () => {
    try {
      await adminApi.createPromo({ code, discountType, discountValue });
      setCode('');
      setMessage('Promo created');
      load();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Failed');
    }
  };

  return (
    <div className="page">
      <PageHeader title="Promo codes" subtitle="Create discount codes for customers at checkout" />
      {message && (
        <div className={message.includes('created') || message.includes('success') ? 'success-banner' : 'error-banner'}>
          {message}
        </div>
      )}

      <div className="card broadcast-form-card">
        <h2 className="card-heading">New promo</h2>
        <div className="form-grid-2">
          <label className="field">
            <span>Code</span>
            <input placeholder="SUMMER50" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </label>
          <label className="field">
            <span>Discount type</span>
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percent')}>
              <option value="fixed">Fixed amount (₹)</option>
              <option value="percent">Percentage (%)</option>
            </select>
          </label>
          <label className="field">
            <span>Value</span>
            <input type="number" min={1} value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} />
          </label>
        </div>
        <div className="form-actions form-actions--start">
          <button type="button" className="btn btn-primary" onClick={create} disabled={!code.trim()}>
            Create promo
          </button>
        </div>
      </div>

      <div className="table-wrap card">
        <table className="responsive-table">
          <thead>
            <tr><th>Code</th><th>Type</th><th>Value</th><th>Used</th><th>Active</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id}>
                <td><strong>{p.code}</strong></td>
                <td>{p.discountType}</td>
                <td>{p.discountType === 'fixed' ? `₹${p.discountValue}` : `${p.discountValue}%`}</td>
                <td>{p.usedCount}{p.maxUses ? ` / ${p.maxUses}` : ''}</td>
                <td>{p.isActive ? 'Yes' : 'No'}</td>
                <td data-label="Actions">
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => adminApi.togglePromo(p.id, !p.isActive).then(load)}>
                    {p.isActive ? 'Disable' : 'Enable'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
