import { useMemo } from 'react';
import type { PoolData } from '../types';
import { formatUsd } from '../lib/formatUsd';
import { poolChartColor, formatPoolApr } from '../lib/poolChartColor';
import {
  computeFamilyAprAverages,
  volumeSegments,
} from '../lib/pegKeeperFamilyStats';
import { TokenLogo } from './TokenLogo';

interface PoolVolumeBoardProps {
  pools: PoolData[];
  totalVolume24h: number;
}

export function PoolVolumeBoard({ pools, totalVolume24h }: PoolVolumeBoardProps) {
  const sorted = useMemo(
    () => [...pools].sort((a, b) => b.volume24h - a.volume24h),
    [pools],
  );

  const summed = sorted.reduce((s, p) => s + p.volume24h, 0);
  const total = totalVolume24h > 0 ? totalVolume24h : summed;
  const maxVol = Math.max(sorted[0]?.volume24h ?? 0, 1);

  const segments = useMemo(
    () => volumeSegments(sorted, total, poolChartColor),
    [sorted, total],
  );

  const aprAvgs = useMemo(() => computeFamilyAprAverages(pools), [pools]);

  return (
    <section className="section pool-volume-board" id="volume-by-pool">
      <div className="pool-volume-board__card cult-shadow">
        <div className="section-head pool-volume-board__head">
          <div>
            <p className="section-eyebrow">24h trading volume</p>
            <h2 className="section-title">Volume by pool</h2>
            <p className="text-caption pool-volume-board__sub">
              Share of family volume across {sorted.length} PegKeeper pools
            </p>
          </div>
          <div className="pool-volume-board__totals">
            <div className="pool-volume-board__total tabular-nums">
              <span className="metric-label">Total 24h</span>
              <span className="metric-value val-green">{formatUsd(total)}</span>
            </div>
            <div className="pool-volume-board__apr-row">
              <div className="pool-volume-board__apr-kpi tabular-nums">
                <span className="metric-label">Avg Base APR</span>
                <span className="metric-value">
                  {aprAvgs.avgBaseApr > 0 ? formatPoolApr(aprAvgs.avgBaseApr) : '—'}
                </span>
              </div>
              <div className="pool-volume-board__apr-kpi tabular-nums">
                <span className="metric-label">Avg Curve APR</span>
                <span className="metric-value">
                  {aprAvgs.avgCurveApr > 0 ? formatPoolApr(aprAvgs.avgCurveApr) : '—'}
                </span>
              </div>
              <div className="pool-volume-board__apr-kpi tabular-nums">
                <span className="metric-label">Avg Boost APR</span>
                <span className="metric-value val-green">
                  {aprAvgs.avgBoostApr > 0 ? formatPoolApr(aprAvgs.avgBoostApr) : '—'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {segments.length > 0 && (
          <div className="pool-volume-board__stack-wrap">
            <div
              className="pool-volume-board__stack"
              role="img"
              aria-label="24h volume share by pool"
            >
              {segments.map(({ pool, pct, color }) => (
                <div
                  key={pool.id}
                  className="pool-volume-board__stack-seg"
                  style={{ width: `${pct}%`, backgroundColor: color }}
                  title={`${pool.name}: ${pct.toFixed(1)}%`}
                />
              ))}
            </div>
            <ul className="pool-volume-board__stack-legend">
              {segments.slice(0, 8).map(({ pool, pct, color }) => (
                <li key={pool.id} className="pool-volume-board__stack-key">
                  <span
                    className="pool-volume-board__stack-dot"
                    style={{ backgroundColor: color }}
                    aria-hidden
                  />
                  <span className="pool-volume-board__stack-label">{pool.name}</span>
                  <span className="pool-volume-board__stack-pct tabular-nums">
                    {pct.toFixed(1)}%
                  </span>
                </li>
              ))}
              {segments.length > 8 && (
                <li className="pool-volume-board__stack-key pool-volume-board__stack-key--more">
                  +{segments.length - 8} more
                </li>
              )}
            </ul>
          </div>
        )}

        <div className="pool-volume-board__list">
          {sorted.map((pool) => {
            const pct = total > 0 && pool.volume24h > 0 ? (pool.volume24h / total) * 100 : 0;
            const widthPct =
              pool.volume24h > 0 ? Math.max(2, (pool.volume24h / maxVol) * 100) : 0;
            const color = poolChartColor(pool);
            const sym = pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id;

            return (
              <div key={pool.id} className="pool-volume-row">
                <div className="pool-volume-row__meta">
                  <TokenLogo
                    symbol={sym}
                    poolId={pool.id}
                    fallbackInitials={pool.partnerInitials}
                    fallbackColor={color}
                    size="xs"
                  />
                  <div className="pool-volume-row__text">
                    <span className="pool-volume-row__name">{pool.name}</span>
                    <span className="pool-volume-row__partner">{pool.partner}</span>
                  </div>
                </div>
                <div className="pool-volume-row__bar-wrap">
                  <div
                    className="pool-volume-row__bar"
                    style={{
                      width: pool.volume24h > 0 ? `${widthPct}%` : '0%',
                      backgroundColor: color,
                    }}
                  />
                </div>
                <div className="pool-volume-row__nums tabular-nums">
                  <span className="pool-volume-row__vol">
                    {pool.volume24h > 0 ? formatUsd(pool.volume24h) : '—'}
                  </span>
                  <span className="pool-volume-row__pct">
                    {pool.volume24h > 0 ? `${pct.toFixed(1)}%` : '0%'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
