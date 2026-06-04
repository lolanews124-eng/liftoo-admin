import { useEffect, useState } from 'react';
import { adminApi, PlatformSettings } from '../api/client';
import { pickPlatformSettingsPayload } from '../api/payloads';
import { PageHeader } from '../components/PageHeader';

type SettingsFieldKey = keyof Omit<PlatformSettings, 'id' | 'configured'>;

const FIELD_KEYS: SettingsFieldKey[] = [
  'matchRadiusKm',
  'matchBatchSize',
  'bookingSearchTimeoutMin',
  'platformFeePercent',
  'assistantEarningPercent',
  'minAssistantSettlementBalance',
  'signupWalletBonus',
  'referralRewardAmount',
  'cancellationFreeBeforeMin',
  'cancellationFeePercent',
  'minCancellationFee',
];

type SettingsForm = Record<SettingsFieldKey, string> & { id: string; configured: boolean };

function emptyForm(id = 'default'): SettingsForm {
  return {
    id,
    configured: false,
    matchRadiusKm: '',
    matchBatchSize: '',
    bookingSearchTimeoutMin: '',
    platformFeePercent: '',
    assistantEarningPercent: '',
    minAssistantSettlementBalance: '',
    signupWalletBonus: '',
    referralRewardAmount: '',
    cancellationFreeBeforeMin: '',
    cancellationFeePercent: '',
    minCancellationFee: '',
  };
}

function fromApi(data: PlatformSettings): SettingsForm {
  if (!data.configured) return emptyForm(data.id);
  const form = emptyForm(data.id);
  form.configured = true;
  for (const key of FIELD_KEYS) {
    const v = data[key];
    form[key] = v == null ? '' : String(v);
  }
  return form;
}

function toPayload(form: SettingsForm) {
  const out: Record<string, number> = {};
  for (const key of FIELD_KEYS) {
    out[key] = Number(form[key]);
  }
  return pickPlatformSettingsPayload(out as Partial<PlatformSettings>);
}

function validateForm(form: SettingsForm): string | null {
  for (const key of FIELD_KEYS) {
    const raw = form[key].trim();
    if (raw === '') return 'Please fill in all fields before saving.';
    const n = Number(raw);
    if (Number.isNaN(n)) return 'All values must be valid numbers.';
    if (key === 'matchRadiusKm' || key === 'matchBatchSize' || key === 'bookingSearchTimeoutMin') {
      if (n < 1) return 'Matching radius, batch size, and timeout must be at least 1.';
    } else if (n < 0) {
      return 'Values cannot be negative.';
    }
  }
  return null;
}

export function SettingsPage() {
  const [form, setForm] = useState<SettingsForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = () =>
    adminApi
      .getSettings()
      .then((data) => setForm(fromApi(data)))
      .catch((e) => setMessage(e.message));

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!form) return;
    const err = validateForm(form);
    if (err) {
      setMessage(err);
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      const updated = await adminApi.updateSettings(toPayload(form));
      setForm(fromApi(updated));
      setMessage('Settings saved successfully');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: SettingsFieldKey, value: string) => {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  if (!form) return <div className="page"><div className="loading-state">Loading settings…</div></div>;

  const numField = (label: string, key: SettingsFieldKey, hint?: string, placeholder?: string) => (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={form[key]}
        placeholder={placeholder ?? 'Enter value'}
        onChange={(e) => setField(key, e.target.value)}
      />
      {hint && <small>{hint}</small>}
    </label>
  );

  return (
    <div className="page">
      <PageHeader
        title="Platform settings"
        subtitle={
          form.configured
            ? 'Rules used by customer app, assistant app, and API'
            : 'Set up platform rules for the first time — all fields are required'
        }
      />
      {!form.configured && (
        <div className="success-banner" style={{ marginBottom: 16 }}>
          Welcome — enter your matching, pricing, wallet, and cancellation rules below, then save.
        </div>
      )}
      {message && (
        <div className={message.includes('success') ? 'success-banner' : 'error-banner'}>{message}</div>
      )}

      <div className="settings-grid">
        <div className="card settings-section">
          <h2 className="card-heading">Matching & search</h2>
          {numField('Matching radius (km)', 'matchRadiusKm', 'How far assistants receive requests', 'e.g. 15')}
          {numField('Requests per batch', 'matchBatchSize', 'Assistants notified at once', 'e.g. 3')}
          {numField('Search timeout (minutes)', 'bookingSearchTimeoutMin', 'Auto-cancel if no assistant', 'e.g. 15')}
        </div>

        <div className="card settings-section">
          <h2 className="card-heading">Pricing & payouts</h2>
          {numField('Platform fee (%)', 'platformFeePercent', 'On top of service fee for customers', 'e.g. 10')}
          {numField('Assistant earning (%)', 'assistantEarningPercent', 'Share of service fee after payment', 'e.g. 80')}
          {numField(
            'Min settlement wallet (₹)',
            'minAssistantSettlementBalance',
            'Minimum balance before assistant can accept cash jobs',
            'e.g. 150',
          )}
        </div>

        <div className="card settings-section">
          <h2 className="card-heading">Wallet & referrals</h2>
          {numField('Signup wallet bonus (₹)', 'signupWalletBonus', undefined, 'e.g. 500')}
          {numField('Referral reward (₹)', 'referralRewardAmount', 'After referee first paid booking', 'e.g. 100')}
        </div>

        <div className="card settings-section">
          <h2 className="card-heading">Cancellation</h2>
          {numField('Free cancel window (minutes)', 'cancellationFreeBeforeMin', undefined, 'e.g. 60')}
          {numField('Late cancel fee (%)', 'cancellationFeePercent', undefined, 'e.g. 10')}
          {numField('Minimum cancel fee (₹)', 'minCancellationFee', undefined, 'e.g. 50')}
        </div>
      </div>

      <div className="sticky-actions">
        <p className="hint">
          {form.configured
            ? 'Changes apply to customer app, assistant app, and API immediately after save.'
            : 'Save once when all fields are filled — apps use these values after that.'}
        </p>
        <button type="button" className="btn btn-primary btn-lg" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : form.configured ? 'Save all settings' : 'Save platform settings'}
        </button>
      </div>
    </div>
  );
}
