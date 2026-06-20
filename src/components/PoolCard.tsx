import type { PoolData } from '../types';
import { MiniSparkline } from './charts/MiniSparkline';
import { useIntersection } from '../hooks/useIntersection';

function aprClass(apr: number): string {
  if (apr > 10) return 'val-green';
  if (apr >= 5) return 'val-warn';
  if (apr > 0) return 'val-red';
  return 'val-muted';
}

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

interface PoolCardProps {
  pool: PoolData;
  index: number;
  featured?: boolean;
}

export function PoolCard({ pool, index, featured }: PoolCardProps) {
  const { ref, visible } = useIntersection();
  const delay = (index % 9) * 60;

  return (
    <article
      ref={ref}
      className={`pool-card fade-in ${visible ? 'visible' : ''} ${featured ? 'pool-card--featured' : ''}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="pool-card-top">
        <div>
          <div className="pool-card-pair">{pool.name}</div>
          <div className="pool-card-partner">{pool.partner}</div>
        </div>
        <div
          className="pool-card-orb"
          style={{ background: `${pool.partnerColor}18`, color: pool.partnerColor, borderColor: `${pool.partnerColor}44` }}
        >
          {pool.partnerInitials}
        </div>
      </div>

      {pool.description && (
        <p className="pool-card-desc">{pool.description}</p>
      )}

      <div className="pool-card-metrics">
        <div className="pool-metric">
          <span className="metric-label">TVL</span>
          <span className="metric-value val-green tabular-nums">{fmtUsd(pool.tvl)}</span>
        </div>
        <div className="pool-metric">
          <span className="metric-label">APR</span>
          <span className={`metric-value tabular-nums ${aprClass(pool.apr)}`}>
            {pool.apr > 0 ? `${pool.apr}%` : '—'}
          </span>
        </div>
        <div className="pool-metric">
          <span className="metric-label">Vol 24h</span>
          <span className="metric-value tabular-nums">{fmtUsd(pool.volume24h)}</span>
        </div>
        <div className="pool-metric">
          <span className="metric-label">Debt</span>
          <span className="metric-value tabular-nums">{fmtUsd(pool.pegKeeperDebt)}</span>
        </div>
      </div>

      <div className="pool-card-spark">
        <MiniSparkline data={pool.pegDeviation} height={36} />
      </div>

      <div className="pool-card-foot">
        <span className={`pill pill--${pool.status.toLowerCase()}`}>{pool.status}</span>
        <a href={pool.curveUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost-sm">
          Curve ↗
        </a>
      </div>
    </article>
  );
}

export function PoolDetailPanel({ pool }: { pool: PoolData | null }) {
  if (!pool) {
    return (
      <div className="pool-detail-panel pool-detail-panel--empty">
        <span className="hash">#</span> Select a pool from the constellation
      </div>
    );
  }

  return (
    <div className="pool-detail-panel">
      <div className="pool-detail-header">
        <h3>{pool.name}</h3>
        <span className={`pill pill--${pool.status.toLowerCase()}`}>{pool.status}</span>
      </div>
      <p className="pool-detail-partner">{pool.partner} · {pool.chain}</p>
      {pool.description && <p className="pool-detail-desc">{pool.description}</p>}
      <div className="pool-detail-grid">
        <div><span className="metric-label">TVL</span><span className="metric-value val-green">{fmtUsd(pool.tvl)}</span></div>
        <div><span className="metric-label">frxUSD Debt</span><span className="metric-value">{fmtUsd(pool.pegKeeperDebt)}</span></div>
        <div><span className="metric-label">APR</span><span className={`metric-value ${aprClass(pool.apr)}`}>{pool.apr > 0 ? `${pool.apr}%` : '—'}</span></div>
        <div><span className="metric-label">Since</span><span className="metric-value">{pool.since ?? '—'}</span></div>
      </div>
      <div style={{ height: 64, marginTop: 16 }}>
        <MiniSparkline data={pool.pegDeviation} height={64} />
      </div>
    </div>
  );
}
