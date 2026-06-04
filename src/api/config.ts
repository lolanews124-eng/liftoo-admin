/**
 * Dev: use `/api/v1` so Vite proxies to the local Nest server.
 * Production (Vercel): same path is rewritten to https://api.liftoo.in in vercel.json.
 * Override with VITE_API_URL when building for a custom API host.
 */
export function resolveApiBase(): string {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  if (fromEnv?.trim()) {
    return fromEnv.trim().replace(/\/$/, '');
  }
  return '/api/v1';
}

export const API_BASE = resolveApiBase();

export function apiReachabilityHint(): string {
  if (import.meta.env.DEV) {
    return 'Start the API: cd backend && npm run dev (port 5000). Admin uses Vite proxy /api → localhost:5000.';
  }
  return `Cannot reach API at ${API_BASE}. Check VITE_API_URL or Vercel /api rewrite to your API host.`;
}
