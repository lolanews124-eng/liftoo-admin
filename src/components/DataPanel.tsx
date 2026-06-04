import { ReactNode } from 'react';

type DataPanelProps = {
  loading?: boolean;
  error?: string;
  empty?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  onRetry?: () => void;
  children: ReactNode;
};

export function DataPanel({
  loading,
  error,
  empty,
  emptyTitle = 'No data yet',
  emptyHint,
  onRetry,
  children,
}: DataPanelProps) {
  if (loading) {
    return (
      <div className="data-panel-loading" aria-busy="true">
        <div className="spinner" />
        <span>Loading data…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="data-panel-error">
        <p>{error}</p>
        {onRetry && (
          <button type="button" className="btn btn-outline btn-sm" onClick={onRetry}>
            Try again
          </button>
        )}
      </div>
    );
  }

  if (empty) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon" aria-hidden>📭</div>
        <strong>{emptyTitle}</strong>
        {emptyHint && <p>{emptyHint}</p>}
      </div>
    );
  }

  return <>{children}</>;
}
