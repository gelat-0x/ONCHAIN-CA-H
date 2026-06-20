import { useMemo } from 'react';
import type { PoolData } from '../types';

function fmtUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1000) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

interface FrxUsdHubProps {
  pools: PoolData[];
  selectedId?: string;
  onSelect?: (pool: PoolData) => void;
  frxUsdPrice?: number;
}

export function FrxUsdHub({ pools, selectedId, onSelect, frxUsdPrice }: FrxUsdHubProps) {
  const totalTvl = useMemo(() => pools.reduce((s, p) => s + p.tvl, 0), [pools]);
  const totalDebt = useMemo(() => pools.reduce((s, p) => s + p.pegKeeperDebt, 0), [pools]);

  const nodes = useMemo(() => {
    const maxTvl = Math.max(...pools.map((p) => p.tvl), 1);
    return pools.map((pool, i) => {
      const angle = (i / pools.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 34;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      const share = totalTvl > 0 ? (pool.tvl / totalTvl) * 100 : 0;
      const r = 2.2 + (pool.tvl / maxTvl) * 4.5;
      return { pool, x, y, r, share, angle };
    });
  }, [pools, totalTvl]);

  const selected = pools.find((p) => p.id === selectedId) ?? pools[0] ?? null;

  return (
    <div className="frx-hub">
      <div className="frx-hub__head">
        <div>
          <div className="frx-hub__eyebrow">PegKeeper reserve hub</div>
          <h3 className="frx-hub__title">frxUSD</h3>
        </div>
        <div className="frx-hub__peg tabular-nums">
          {frxUsdPrice != null ? `$${frxUsdPrice.toFixed(4)}` : '—'}
          <span className="frx-hub__peg-label">peg</span>
        </div>
      </div>

      <div className="frx-hub__viz" aria-label="frxUSD PegKeeper partner pools">
        <svg viewBox="0 0 100 100" className="frx-hub__svg" role="img">
          <circle cx="50" cy="50" r="34" fill="none" stroke="var(--border)" strokeWidth="0.4" strokeDasharray="1.5 2" />
          <circle cx="50" cy="50" r="22" fill="none" stroke="var(--border)" strokeWidth="0.25" opacity="0.5" />

          {nodes.map(({ pool, x, y, r, share }) => {
            const active = pool.id === selected?.id;
            return (
              <g key={pool.id}>
                <line
                  x1="50"
                  y1="50"
                  x2={x}
                  y2={y}
                  stroke={active ? 'var(--foreground)' : 'var(--primary-600)'}
                  strokeWidth={active ? 0.35 : 0.2}
                  opacity={active ? 0.9 : 0.45}
                />
                <circle
                  cx={x}
                  cy={y}
                  r={r}
                  fill={active ? 'var(--foreground)' : 'var(--primary-700)'}
                  stroke={active ? 'var(--foreground)' : pool.partnerColor}
                  strokeWidth={active ? 0.5 : 0.35}
                  className="frx-hub__node"
                  onClick={() => onSelect?.(pool)}
                  style={{ cursor: 'pointer' }}
                />
                {share >= 4 && (
                  <text
                    x={x}
                    y={y - r - 1.8}
                    textAnchor="middle"
                    className="frx-hub__node-label"
                    fill={active ? 'var(--foreground)' : 'var(--primary-300)'}
                    fontSize="2.8"
                  >
                    {pool.stablecoin ?? pool.name.split('/')[1]?.trim()}
                  </text>
                )}
              </g>
            );
          })}

          <circle cx="50" cy="50" r="7" fill="var(--surface-2)" stroke="var(--foreground)" strokeWidth="0.5" />
          <text x="50" y="51.5" textAnchor="middle" fill="var(--foreground)" fontSize="3.2" fontWeight="700">
            frxUSD
          </text>
        </svg>

        <div className="frx-hub__legend">
          <span><strong>{pools.length}</strong> partner pools</span>
          <span><strong>{fmtUsd(totalTvl)}</strong> combined TVL</span>
          <span><strong>{fmtUsd(totalDebt)}</strong> frxUSD debt</span>
        </div>
      </div>

      {selected && (
        <div className="frx-hub__detail">
          <div className="frx-hub__detail-top">
            <div>
              <div className="frx-hub__detail-pair">{selected.name}</div>
              <div className="frx-hub__detail-partner">{selected.partner}</div>
            </div>
            <span className={`pill pill--${selected.status.toLowerCase()}`}>{selected.status}</span>
          </div>
          <div className="frx-hub__detail-grid">
            <div>
              <span className="metric-label">Pool TVL</span>
              <span className="metric-value tabular-nums">{fmtUsd(selected.tvl)}</span>
              <span className="frx-hub__share tabular-nums">
                {totalTvl > 0 ? `${((selected.tvl / totalTvl) * 100).toFixed(1)}% of hub` : '—'}
              </span>
            </div>
            <div>
              <span className="metric-label">frxUSD PegKeeper debt</span>
              <span className="metric-value tabular-nums">{fmtUsd(selected.pegKeeperDebt)}</span>
            </div>
            <div>
              <span className="metric-label">24h volume</span>
              <span className="metric-value tabular-nums">{fmtUsd(selected.volume24h)}</span>
            </div>
            <div>
              <span className="metric-label">Live since</span>
              <span className="metric-value">{selected.since ?? '—'}</span>
            </div>
          </div>
          {selected.description && (
            <p className="frx-hub__detail-desc">{selected.description}</p>
          )}
          <a
            href={selected.curveUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost btn-ghost-sm frx-hub__curve-link"
          >
            View on Curve ↗
          </a>
        </div>
      )}

      <div className="frx-hub__pool-list">
        {pools.slice(0, 8).map((pool) => {
          const active = pool.id === selected?.id;
          const share = totalTvl > 0 ? (pool.tvl / totalTvl) * 100 : 0;
          return (
            <button
              key={pool.id}
              type="button"
              className={`frx-hub__pool-chip ${active ? 'frx-hub__pool-chip--active' : ''}`}
              onClick={() => onSelect?.(pool)}
            >
              <span className="frx-hub__chip-name">{pool.stablecoin ?? pool.name.split('/')[1]?.trim()}</span>
              <span className="frx-hub__chip-tvl tabular-nums">{fmtUsd(pool.tvl)}</span>
              <span className="frx-hub__chip-share tabular-nums">{share.toFixed(0)}%</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
