/** Liftoo platform timezone — India Standard Time (Kolkata). */
export const APP_TIMEZONE = 'Asia/Kolkata';

const DATE_TIME_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
};

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  timeZone: APP_TIMEZONE,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
};

function parse(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  const d = typeof value === 'string' ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatAppDateTime(value: string | Date | null | undefined): string {
  const d = parse(value);
  if (!d) return '—';
  return d.toLocaleString('en-IN', DATE_TIME_OPTS);
}

export function formatAppDate(value: string | Date | null | undefined): string {
  const d = parse(value);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', DATE_OPTS);
}
