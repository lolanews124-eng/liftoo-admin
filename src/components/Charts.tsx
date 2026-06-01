import type { DailyAnalytics } from '../api/client';

export function BarChart({
  data,
  valueKey,
  labelKey = 'date',
  color = 'var(--primary)',
  formatValue = (v: number) => String(v),
}: {
  data: Record<string, unknown>[];
  valueKey: string;
  labelKey?: string;
  color?: string;
  formatValue?: (v: number) => string;
}) {
  const max = Math.max(1, ...data.map((d) => Number(d[valueKey]) || 0));

  return (
    <div className="chart-bars">
      {data.map((d, i) => {
        const val = Number(d[valueKey]) || 0;
        const pct = (val / max) * 100;
        const label = String(d[labelKey] ?? '');
        return (
          <div key={i} className="chart-bar-col">
            <div className="chart-bar-value">{formatValue(val)}</div>
            <div className="chart-bar-track">
              <div className="chart-bar-fill" style={{ height: `${pct}%`, background: color }} />
            </div>
            <div className="chart-bar-label">{label.slice(5)}</div>
          </div>
        );
      })}
    </div>
  );
}

export function AnalyticsCharts({ daily }: { daily: DailyAnalytics[] }) {
  if (daily.length === 0) return null;

  return (
    <div className="grid-2 chart-grid">
      <div className="card">
        <h3 className="chart-title">Bookings (7 days)</h3>
        <BarChart data={daily as unknown as Record<string, unknown>[]} valueKey="bookings" />
      </div>
      <div className="card">
        <h3 className="chart-title">Revenue (7 days)</h3>
        <BarChart
          data={daily as unknown as Record<string, unknown>[]}
          valueKey="revenue"
          color="var(--success)"
          formatValue={(v) => `₹${Math.round(v)}`}
        />
      </div>
      <div className="card">
        <h3 className="chart-title">Completed (7 days)</h3>
        <BarChart data={daily as unknown as Record<string, unknown>[]} valueKey="completed" color="#6366f1" />
      </div>
      <div className="card">
        <h3 className="chart-title">Completion rate</h3>
        <div className="chart-bars">
          {daily.map((d) => {
            const rate = d.bookings > 0 ? Math.round((d.completed / d.bookings) * 100) : 0;
            return (
              <div key={d.date} className="chart-bar-col">
                <div className="chart-bar-value">{rate}%</div>
                <div className="chart-bar-track">
                  <div className="chart-bar-fill" style={{ height: `${rate}%`, background: '#8b5cf6' }} />
                </div>
                <div className="chart-bar-label">{d.date.slice(5)}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
