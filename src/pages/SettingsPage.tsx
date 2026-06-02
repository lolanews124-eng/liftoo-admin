import { useEffect, useState } from 'react';
import { adminApi, PlatformSettings } from '../api/client';
import { PageHeader } from '../components/PageHeader';

export function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => adminApi.getSettings().then(setSettings).catch((e) => setMessage(e.message));

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    setMessage('');
    try {
      const updated = await adminApi.updateSettings(settings);
      setSettings(updated);
      setMessage('Settings saved successfully');
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (!settings) return <div className="page"><div className="loading-state">Loading settings…</div></div>;

  const numField = (label: string, key: keyof PlatformSettings, hint?: string) => (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={settings[key] as number}
        onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value) })}
      />
      {hint && <small>{hint}</small>}
    </label>
  );

  return (
    <div className="page">
      <PageHeader
        title="Platform settings"
        subtitle="Same rules used by customer app, assistant app, and API"
      />
      {message && (
        <div className={message.includes('success') ? 'success-banner' : 'error-banner'}>{message}</div>
      )}

      <div className="settings-grid">
        <div className="card settings-section">
          <h2 className="card-heading">Matching & search</h2>
          {numField('Matching radius (km)', 'matchRadiusKm', 'How far assistants receive requests')}
          {numField('Requests per batch', 'matchBatchSize', 'Assistants notified at once')}
          {numField('Search timeout (minutes)', 'bookingSearchTimeoutMin', 'Auto-cancel if no assistant')}
        </div>

        <div className="card settings-section">
          <h2 className="card-heading">Pricing & payouts</h2>
          {numField('Platform fee (%)', 'platformFeePercent', 'On top of service fee for customers')}
          {numField('Assistant earning (%)', 'assistantEarningPercent', 'Share of service fee after payment')}
          {numField(
            'Min settlement wallet (₹)',
            'minAssistantSettlementBalance',
            'Minimum balance before assistant can accept cash jobs (company share debit)',
          )}
        </div>

        <div className="card settings-section">
          <h2 className="card-heading">Wallet & referrals</h2>
          {numField('Signup wallet bonus (₹)', 'signupWalletBonus')}
          {numField('Referral reward (₹)', 'referralRewardAmount', 'After referee first paid booking')}
        </div>

        <div className="card settings-section">
          <h2 className="card-heading">Cancellation</h2>
          {numField('Free cancel window (minutes)', 'cancellationFreeBeforeMin')}
          {numField('Late cancel fee (%)', 'cancellationFeePercent')}
          {numField('Minimum cancel fee (₹)', 'minCancellationFee')}
        </div>
      </div>

      <button className="btn btn-primary" style={{ marginTop: 20 }} onClick={save} disabled={saving}>
        {saving ? 'Saving…' : 'Save all settings'}
      </button>
    </div>
  );
}
