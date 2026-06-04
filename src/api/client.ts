import { pickPlatformSettingsPayload } from './payloads';
import { API_BASE, apiReachabilityHint } from './config';

export { API_BASE };

export type ApiResponse<T> = { success: boolean; data: T };

function getToken() {
  return localStorage.getItem('admin_token');
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem('admin_token', token);
  else localStorage.removeItem('admin_token');
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Active-Role': 'admin',
    ...(options.headers as Record<string, string> | undefined),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const url = `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, { ...options, headers });
  } catch {
    throw new Error(apiReachabilityHint());
  }

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg =
      json?.error?.message ??
      json?.message ??
      (typeof json?.error === 'string' ? json.error : null) ??
      `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return parseApiPayload<T>(json);
}

function parseApiPayload<T>(json: unknown): T {
  if (json === null || typeof json !== 'object') return json as T;

  const root = json as Record<string, unknown>;
  let payload: unknown = root.data !== undefined ? root.data : json;

  if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
    const record = payload as Record<string, unknown>;
    if (record.stats && typeof record.stats === 'object') {
      payload = record.stats;
    }
    // Paginated lists: { items, total } or nested { data: { items, total } }
    if (Array.isArray(record.items)) {
      return payload as T;
    }
    if (record.data && typeof record.data === 'object' && !Array.isArray(record.data)) {
      const inner = record.data as Record<string, unknown>;
      if (Array.isArray(inner.items)) {
        return inner as T;
      }
    }
  }

  return payload as T;
}

export const adminApi = {
  login: (email: string, password: string) =>
    api<{ accessToken: string; refreshToken: string; user: AdminUser }>('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => api<AdminUser>('/admin/auth/me'),
  dashboard: () => api<DashboardStats>('/admin/dashboard/stats'),
  dashboardAnalytics: () => api<{ daily: DailyAnalytics[] }>('/admin/dashboard/analytics'),
  users: (params?: Record<string, string>) =>
    api<Paginated<UserRow>>(`/admin/users?${new URLSearchParams(params ?? {})}`),
  user: (id: string) => api<UserDetail>(`/admin/users/${id}`),
  updateUser: (id: string, body: Partial<UserRow> & { roles?: string[] }) =>
    api(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  verifications: (params?: Record<string, string>) =>
    api<Paginated<VerificationRow>>(`/admin/verifications?${new URLSearchParams(params ?? {})}`),
  verification: (userId: string) => api<VerificationDetail>(`/admin/verifications/${userId}`),
  reviewVerification: (body: ReviewBody) =>
    api('/admin/verifications/review', { method: 'PATCH', body: JSON.stringify(body) }),
  bookings: (params?: Record<string, string>) =>
    api<Paginated<BookingRow>>(`/admin/bookings?${new URLSearchParams(params ?? {})}`),
  booking: (id: string) => api<BookingDetail>(`/admin/bookings/${id}`),
  updateBookingStatus: (id: string, status: string, note?: string) =>
    api(`/admin/bookings/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    }),
  categories: () => api<Category[]>(`/admin/categories`),
  createCategory: (body: Partial<Category>) =>
    api('/admin/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id: string, body: Partial<Category>) =>
    api(`/admin/categories/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteCategory: (id: string) => api(`/admin/categories/${id}`, { method: 'DELETE' }),
  cities: () => api<City[]>(`/admin/cities`),
  createCity: (body: Partial<City>) =>
    api('/admin/cities', { method: 'POST', body: JSON.stringify(body) }),
  updateCity: (id: string, body: Partial<City>) =>
    api(`/admin/cities/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  payments: (params?: Record<string, string>) =>
    api<Paginated<PaymentRow>>(`/admin/payments?${new URLSearchParams(params ?? {})}`),
  earnings: (params?: Record<string, string>) =>
    api<Paginated<EarningRow>>(`/admin/earnings?${new URLSearchParams(params ?? {})}`),
  markPayout: (id: string) => api(`/admin/earnings/${id}/payout`, { method: 'PATCH' }),
  ratings: (params?: Record<string, string>) =>
    api<Paginated<RatingRow>>(`/admin/ratings?${new URLSearchParams(params ?? {})}`),
  appReviews: (params?: Record<string, string>) =>
    api<Paginated<AppReviewRow>>(`/admin/app-reviews?${new URLSearchParams(params ?? {})}`),
  referrals: (params?: Record<string, string>) =>
    api<Paginated<ReferralRow>>(`/admin/referrals?${new URLSearchParams(params ?? {})}`),
  getSettings: () => api<PlatformSettings>('/admin/settings'),
  updateSettings: (body: Partial<PlatformSettings>) =>
    api<PlatformSettings>('/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify(pickPlatformSettingsPayload(body)),
    }),
  verifyAssistant: (userId: string, verified: boolean) =>
    api(`/admin/assistants/${userId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ verified }),
    }),
  rejections: (params?: Record<string, string>) =>
    api<Paginated<RejectionRow>>(`/admin/rejections?${new URLSearchParams(params ?? {})}`),
  exportBookingsCsv: async () => {
    const token = getToken();
    const res = await fetch(`${API_BASE}/admin/bookings/export/csv`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
        'X-Active-Role': 'admin',
      },
    });
    if (!res.ok) throw new Error('Export failed');
    return res.text();
  },
  promos: () => api<PromoCode[]>('/admin/promos'),
  createPromo: (body: Partial<PromoCode>) =>
    api('/admin/promos', { method: 'POST', body: JSON.stringify(body) }),
  togglePromo: (id: string, isActive: boolean) =>
    api(`/admin/promos/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  payoutRequests: (status?: string) =>
    api<PayoutRequest[]>(`/admin/payouts${status ? `?status=${status}` : ''}`),
  processPayout: (id: string, status: string, adminNote?: string) =>
    api(`/admin/payouts/${id}`, { method: 'PATCH', body: JSON.stringify({ status, adminNote }) }),
  supportTickets: (status?: string) =>
    api<SupportTicket[]>(`/admin/support${status ? `?status=${status}` : ''}`),
  updateSupportTicket: (id: string, body: Partial<SupportTicket>) =>
    api(`/admin/support/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  auditLogs: (params?: Record<string, string>) =>
    api<Paginated<AuditLogRow>>(`/admin/audit-logs?${new URLSearchParams(params ?? {})}`),
  broadcastNotification: (body: { audience: 'customer' | 'assistant'; title: string; body: string }) =>
    api<BroadcastResult>('/admin/notifications/broadcast', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  notificationBroadcasts: (params?: Record<string, string>) =>
    api<Paginated<AdminBroadcastRow>>(
      `/admin/notifications/broadcasts?${new URLSearchParams(params ?? {})}`,
    ),
  homeFeedAds: () => api<HomeFeedAd[]>('/admin/home-feed-ads'),
  createHomeFeedAd: (body: Partial<HomeFeedAd>) =>
    api<HomeFeedAd>('/admin/home-feed-ads', { method: 'POST', body: JSON.stringify(body) }),
  updateHomeFeedAd: (id: string, body: Partial<HomeFeedAd>) =>
    api<HomeFeedAd>(`/admin/home-feed-ads/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  toggleHomeFeedAd: (id: string, isActive: boolean) =>
    api<HomeFeedAd>(`/admin/home-feed-ads/${id}/toggle`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    }),
  deleteHomeFeedAd: (id: string) =>
    api<{ deleted: boolean }>(`/admin/home-feed-ads/${id}`, { method: 'DELETE' }),
};

export async function adminUploadImage(file: File): Promise<{ url: string }> {
  const form = new FormData();
  form.append('file', file);
  const token = getToken();
  const res = await fetch(`${API_BASE}/upload/file`, {
    method: 'POST',
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
      'X-Active-Role': 'admin',
    },
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      (json as { error?: { message?: string }; message?: string })?.error?.message ??
      (json as { message?: string })?.message ??
      `Upload failed (${res.status})`;
    throw new Error(msg);
  }
  const data = parseApiPayload<{ url: string }>(json);
  return data;
}

export interface HomeFeedAd {
  id: string;
  title?: string | null;
  imageUrl: string;
  buttonLabel?: string | null;
  buttonLink?: string | null;
  buttonAction: 'url' | 'route';
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BroadcastResult {
  broadcast: AdminBroadcastRow;
  audience: 'customer' | 'assistant';
  targeted: number;
  sent: number;
  failed: number;
}

export interface AdminBroadcastRow {
  id: string;
  adminId: string;
  audience: 'customer' | 'assistant';
  title: string;
  body: string;
  sentCount: number;
  failCount: number;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  phone: string;
  name: string;
  roles: string[];
  activeRole: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  users: { total: number; customers: number; assistants: number };
  bookings: { total: number; active: number; completed: number };
  pendingVerifications: number;
  pendingPayments?: number;
  openSupportTickets?: number;
  revenue: { total: number; platform: number; pendingPayouts: number };
  recentBookings: BookingRow[];
}

export interface UserRow {
  id: string;
  name: string | null;
  phone: string;
  email: string | null;
  roles: string[];
  activeRole: string | null;
  isSuspended: boolean;
  walletBalance: number;
  rating?: number;
  totalJobs?: number;
  assistantCode?: string | null;
  adminVerified?: boolean;
  isOnline?: boolean;
  createdAt: string;
}

export interface UserDetail extends UserRow {
  wallet?: { balance: number; transactions: unknown[] };
  assistantProfile?: unknown;
  bookingsAsCustomer?: unknown[];
  bookingsAsAssistant?: unknown[];
  addresses?: unknown[];
}

export interface VerificationRow {
  userId: string;
  user: { id: string; name: string; phone: string };
  pendingCount: number;
  documents: VerificationDoc[];
}

export interface VerificationDetail {
  user: { id: string; name: string; phone: string };
  documents: VerificationDoc[];
  summary: { completionPercent: number; fullyVerified: boolean; pendingCount: number };
}

export interface VerificationDoc {
  type: string;
  label?: string;
  status: string;
  fileUrl?: string | null;
  textValue?: string | null;
  metadata?: Record<string, unknown> | null;
  adminNote?: string | null;
  uploadedAt?: string | null;
}

export interface ReviewBody {
  userId: string;
  type: string;
  status: 'verified' | 'rejected';
  adminNote?: string;
}

export interface BookingRow {
  id: string;
  status: string;
  venueName: string;
  totalAmount: number;
  scheduledAt: string;
  createdAt: string;
  category?: { name: string };
  customer?: { name: string; phone: string };
  assistant?: { name: string; phone: string } | null;
  payment?: {
    method?: string;
    status: string;
    amount: number;
    cashCollectedAt?: string | null;
  } | null;
}

export interface BookingDetail extends BookingRow {
  durationMin: number;
  serviceFee: number;
  platformFee: number;
  assistantEarningAmount?: number;
  companyShareAmount?: number;
  addressFormatted: string;
  lat?: number;
  lng?: number;
  statusHistory: { status: string; note?: string; createdAt: string }[];
  rejections?: {
    id: string;
    reason?: string | null;
    createdAt: string;
    assistant?: { id: string; name: string | null; phone: string };
  }[];
  rating?: { stars: number; comment?: string };
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  baseRate: number;
  assistantPayoutPercent?: number | null;
  isActive: boolean;
}

export interface City {
  id: string;
  name: string;
  state?: string;
  isActive: boolean;
}

export interface PaymentRow {
  id: string;
  method: string;
  amount: number;
  status: string;
  createdAt: string;
  booking?: BookingRow;
}

export interface EarningRow {
  id: string;
  amount: number;
  description: string;
  isPaidOut: boolean;
  createdAt: string;
  assistant?: { name: string; phone: string };
}

export interface RatingRow {
  id: string;
  stars: number;
  comment?: string;
  createdAt: string;
  customer?: { name: string; phone: string };
  assistant?: { name: string; phone: string };
  booking?: { venueName: string; category?: { name: string } };
}

export interface AppReviewRow {
  id: string;
  stars: number;
  comment?: string;
  platform?: string;
  createdAt: string;
  user?: { name: string; phone: string };
}

export interface ReferralRow {
  id: string;
  code: string;
  rewardAmount: number;
  status: string;
  createdAt: string;
  referrer?: { name: string; phone: string; referralCode: string };
  referee?: { name: string; phone: string } | null;
}

export interface PlatformSettings {
  id: string;
  /** False until admin saves settings for the first time — fields are null in API. */
  configured?: boolean;
  matchRadiusKm: number | null;
  signupWalletBonus: number | null;
  referralRewardAmount: number | null;
  assistantEarningPercent: number | null;
  matchBatchSize: number | null;
  platformFeePercent: number | null;
  bookingSearchTimeoutMin: number | null;
  cancellationFreeBeforeMin: number | null;
  cancellationFeePercent: number | null;
  minCancellationFee: number | null;
  minAssistantSettlementBalance: number | null;
}

export interface DailyAnalytics {
  date: string;
  bookings: number;
  revenue: number;
  completed: number;
}

export interface PromoCode {
  id: string;
  code: string;
  discountType: 'fixed' | 'percent';
  discountValue: number;
  maxUses?: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt?: string | null;
  createdAt: string;
}

export interface PayoutRequest {
  id: string;
  amount: number;
  status: string;
  bankAccount?: string | null;
  ifscCode?: string | null;
  adminNote?: string | null;
  createdAt: string;
  processedAt?: string | null;
  assistant?: { id: string; name: string | null; phone: string; assistantProfile?: { assistantCode?: string } };
}

export interface SupportTicket {
  id: string;
  subject: string;
  message: string;
  status: string;
  adminReply?: string | null;
  bookingId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string | null; phone: string };
}

export interface AuditLogRow {
  id: string;
  adminId: string;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface RejectionRow {
  id: string;
  bookingId: string;
  reason: string;
  createdAt: string;
  booking?: {
    id: string;
    venueName: string;
    status: string;
    category?: { name: string };
  };
  assistant?: {
    id: string;
    name: string | null;
    phone: string;
    assistantProfile?: { assistantCode: string | null };
  };
}
