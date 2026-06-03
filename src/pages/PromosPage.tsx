import { useEffect, useState } from 'react';
import { adminApi, PromoCode } from '../api/client';

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
      <h1 className="page-title">Promo Codes</h1>
      <p className="page-sub">Create discount codes for customers</p>
      {message && (
        <div className={message.includes('created') || message.includes('success') ? 'success-banner' : 'error-banner'}>
          {message}
        </div>
      )}

      <div className="card" style={{ padding: 20, marginBottom: 20, maxWidth: 480 }}>
        <h3 style={{ marginTop: 0 }}>New promo</h3>
        <div className="toolbar">
          <input placeholder="CODE" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <select value={discountType} onChange={(e) => setDiscountType(e.target.value as 'fixed' | 'percent')}>
            <option value="fixed">Fixed ₹</option>
            <option value="percent">Percent %</option>
          </select>
          <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} />
          <button className="btn btn-primary" onClick={create}>Create</button>
        </div>
      </div>

      <div className="table-wrap card">
        <table>
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
                <td>
                  <button className="btn btn-outline" onClick={() => adminApi.togglePromo(p.id, !p.isActive).then(load)}>
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
