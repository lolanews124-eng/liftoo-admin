import type { PlatformSettings } from './client';

/** Fields allowed by backend `UpdatePlatformSettingsDto` (no `id`). */
const PLATFORM_SETTINGS_KEYS: (keyof PlatformSettings)[] = [
  'matchRadiusKm',
  'signupWalletBonus',
  'referralRewardAmount',
  'assistantEarningPercent',
  'matchBatchSize',
  'platformFeePercent',
  'bookingSearchTimeoutMin',
  'cancellationFreeBeforeMin',
  'cancellationFeePercent',
  'minCancellationFee',
  'minAssistantSettlementBalance',
];

export function pickPlatformSettingsPayload(
  settings: Partial<PlatformSettings>,
): Partial<PlatformSettings> {
  const out: Partial<PlatformSettings> = {};
  for (const key of PLATFORM_SETTINGS_KEYS) {
    const value = settings[key];
    if (value !== undefined && value !== null) {
      (out as Record<string, unknown>)[key] = value;
    }
  }
  return out;
}
