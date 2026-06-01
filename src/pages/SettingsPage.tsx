import { useEffect, useState } from 'react';
import { adminApi, PlatformSettings } from '../api/client';

export function SettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const load = () => adminApi.getSettings().then(setSettings).catch((e) => setMessage(e.message));

  useEffect(() => { load(); }, []);

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

  if (!settings) return <div className="page"><p>Loading settings…</p></div>;

  const field = (
    label: string,
    key: keyof PlatformSettings,
    hint?: string,
  ) => (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        value={settings[key] as number}
        onChange={(e) => setSettings({ ...settings, [key]: Number(e.target.value) })}
      />
      {hint && <small style={{ color: 'var(--muted)' }}>{hint}</small>}
    </label>
  );

  return (
    <div className="page">
      <h1 className="page-title">Platform Settings</h1>
      <p className="page-sub">Configure matching, wallet, referrals, and assistant payouts</p>
      {message && <div className={message.includes('success') ? 'success-banner' : 'error-banner'}>{message}</div>}

      <div className="card" style={{ display: 'grid', gap: 16, maxWidth: 520, padding: 24 }}>
        {field('Matching radius (km)', 'matchRadiusKm', 'How far assistants can receive requests')}
        {field('New user wallet bonus (₹)', 'signupWalletBonus', 'Credited on first signup')}
        {field('Referral reward (₹)', 'referralRewardAmount', 'Paid to referrer after first booking')}
        {field('Assistant earning (%)', 'assistantEarningPercent', 'Percent of service fee paid to assistant')}
        {field('Requests per batch', 'matchBatchSize', 'Nearby assistants notified at once (e.g. 3)')}
        {field('Platform fee (%)', 'platformFeePercent', 'Added on top of service fee for customers')}
        {field('Search timeout (minutes)', 'bookingSearchTimeoutMin', 'Auto-cancel if no assistant found')}
        {field('Free cancel window (minutes)', 'cancellationFreeBeforeMin', 'Cancel without fee if this many minutes before start')}
        {field('Late cancel fee (%)', 'cancellationFeePercent', 'Percent of booking total when cancelled late')}
        {field('Minimum cancel fee (₹)', 'minCancellationFee', 'Minimum charge for late cancellation')}

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </div>
    </div>
  );
}
