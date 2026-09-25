import type { StudioDashboardState } from '../../hooks/useStudioDashboard';

interface StudioDataBarProps {
  dashboard: Pick<StudioDashboardState, 'cached' | 'loading' | 'error'>;
  onRefresh: () => void;
}

export function StudioDataBar({ dashboard, onRefresh }: StudioDataBarProps) {
  const { cached, loading, error } = dashboard;

  return (
    <div className="studio-data-bar" role="status">
      {error ? <p className="studio-data-bar__error">{error}</p> : null}
      <div className="studio-data-bar__meta">
        <span
          className={`studio-data-bar__pill ${cached ? 'studio-data-bar__pill--cached' : 'studio-data-bar__pill--live'}`}
        >
          {loading ? 'Loading…' : cached ? 'Cached' : 'Live'}
        </span>
        {!error ? (
          <button
            type="button"
            className="btn-ghost btn-ghost-sm studio-data-bar__refresh"
            disabled={loading}
            onClick={onRefresh}
          >
            Refresh data
          </button>
        ) : null}
      </div>
    </div>
  );
}
