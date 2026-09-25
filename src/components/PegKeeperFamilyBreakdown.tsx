import { useMemo, useState } from 'react';
import type { PoolData } from '../types';
import { formatUsd } from '../lib/formatUsd';
import { formatPoolApr } from '../lib/poolChartColor';
import {
  computeFamilyAprAverages,
  groupPoolBars,
  totalFrxUsdLiquidity,
  type FamilyBarItem,
  type FamilyBarMode,
} from '../lib/pegKeeperFamilyStats';

interface PegKeeperFamilyBreakdownProps {
  pools: PoolData[];
  totalVolume24h: number;
  totalTvl: number;
}

const MODES: { key: FamilyBarMode; label: string }[] = [
  { key: 'tvl', label: 'TVL' },
  { key: 'volume', label: '24h Volume' },
];

/** Strip the shared "frxUSD /" prefix — it is stated once in the legend instead. */
function partnerSymbol(item: FamilyBarItem): string {
  if (!item.pool) return item.label;
  const { pool } = item;
  return pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id;
}

export function PegKeeperFamilyBreakdown({
  pools,
  totalVolume24h,
  totalTvl,
}: PegKeeperFamilyBreakdownProps) {
  const [mode, setMode] = useState<FamilyBarMode>('tvl');

  const rows = useMemo(() => groupPoolBars(pools, mode), [pools, mode]);
  const aprAvgs = useMemo(() => computeFamilyAprAverages(pools), [pools]);
  const frxUsdTotal = useMemo(() => totalFrxUsdLiquidity(pools), [pools]);

  const total =
    mode === 'volume'
      ? totalVolume24h > 0
        ? totalVolume24h
        : pools.reduce((s, p) => s + p.volume24h, 0)
      : totalTvl > 0
        ? totalTvl
        : pools.reduce((s, p) => s + p.tvl, 0);

  const maxValue = rows.reduce((max, row) => Math.max(max, row.value), 0);
  const frxUsdTotalPct = totalTvl > 0 ? (frxUsdTotal / totalTvl) * 100 : 0;
  const isTvl = mode === 'tvl';

  return (
    <section className="section pk-breakdown" id="pegkeeper-family-chart">
      <div className="pk-breakdown__card">
        <header className="pk-breakdown__head">
          <div className="pk-breakdown__intro">
            <p className="section-eyebrow">Analytics</p>
            <h2 className="section-title">Family breakdown</h2>
            <p className="pk-breakdown__sub">
              Every pair is frxUSD on one side. This is how deep each partner sits.
            </p>
          </div>

          <div className="pk-breakdown__kpis">
            <div className="pk-breakdown__kpi">
              <span className="pk-breakdown__kpi-label">Total</span>
              <span className="pk-breakdown__kpi-value tabular-nums">{formatUsd(total)}</span>
            </div>
            <div className="pk-breakdown__kpi">
              <span className="pk-breakdown__kpi-label">frxUSD anchored</span>
              <span className="pk-breakdown__kpi-value tabular-nums">
                {formatUsd(frxUsdTotal)}
                <span className="pk-breakdown__kpi-sub">
                  {frxUsdTotalPct > 0 ? `${frxUsdTotalPct.toFixed(0)}%` : '—'}
                </span>
              </span>
            </div>
            <div className="pk-breakdown__kpi">
              <span className="pk-breakdown__kpi-label">Avg boost APR</span>
              <span className="pk-breakdown__kpi-value tabular-nums">
                {aprAvgs.avgBoostApr > 0 ? formatPoolApr(aprAvgs.avgBoostApr) : '—'}
              </span>
            </div>
          </div>
        </header>

        <div className="pk-breakdown__controls">
          <div className="pool-sort__seg" role="group" aria-label="Breakdown metric">
            {MODES.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`pool-sort__btn pk-breakdown__toggle-btn ${
                  mode === key ? 'pool-sort__btn--active' : ''
                }`}
                onClick={() => setMode(key)}
                aria-pressed={mode === key}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="pk-breakdown__legend">
            {isTvl ? (
              <>
                <span className="pk-breakdown__legend-item">
                  <span className="pk-breakdown__swatch pk-breakdown__swatch--frx" />
                  frxUSD side
                </span>
                <span className="pk-breakdown__legend-item">
                  <span className="pk-breakdown__swatch pk-breakdown__swatch--partner" />
                  Partner side
                </span>
              </>
            ) : (
              <span className="pk-breakdown__legend-item">Swap volume routed in the last 24h</span>
            )}
          </p>
        </div>

        {maxValue > 0 ? (
          <>
            <div className="pk-breakdown__colhead">
              <span className="pk-breakdown__colhead-spacer" />
              <span className="pk-breakdown__col-label pk-breakdown__col-label--value">
                <span className="pk-breakdown__tip">
                  <button
                    type="button"
                    className="pk-breakdown__info"
                    aria-label={
                      isTvl
                        ? 'TVL, total TVL of the PegKeeper Family.'
                        : '24h Volume, swap volume routed in the last 24 hours.'
                    }
                  >
                    i
                  </button>
                  <span className="pk-breakdown__tooltip" role="tooltip">
                    {isTvl
                      ? 'TVL, total TVL of the PegKeeper Family.'
                      : '24h Volume, swap volume routed in the last 24 hours.'}
                  </span>
                </span>
              </span>
              <span className="pk-breakdown__col-label pk-breakdown__col-label--pct">
                <span className="pk-breakdown__tip">
                  <button
                    type="button"
                    className="pk-breakdown__info"
                    aria-label="How much of the PegKeeper Family this pool’s TVL represents."
                  >
                    i
                  </button>
                  <span className="pk-breakdown__tooltip" role="tooltip">
                    How much of the PegKeeper Family this pool’s TVL represents.
                  </span>
                </span>
              </span>
            </div>
            <ol className="pk-breakdown__rows">
              {rows.map((row, i) => {
                const widthPct = maxValue > 0 ? (row.value / maxValue) * 100 : 0;
                const sharePct = total > 0 ? (row.value / total) * 100 : 0;
                const frxPct = isTvl ? row.frxUsdPct * 100 : 0;

                return (
                  <li key={row.id} className="pk-breakdown__row">
                    <span className="pk-breakdown__rank tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="pk-breakdown__label" title={row.pool?.name ?? row.label}>
                      {partnerSymbol(row)}
                    </span>
                    <span className="pk-breakdown__track">
                      <span
                        className="pk-breakdown__fill"
                        style={{ width: `${widthPct}%`, background: row.color }}
                      >
                        {isTvl && frxPct > 0 && (
                          <span className="pk-breakdown__fill-frx" style={{ width: `${frxPct}%` }} />
                        )}
                      </span>
                    </span>
                    <span className="pk-breakdown__value tabular-nums">{formatUsd(row.value)}</span>
                    <span className="pk-breakdown__pct tabular-nums">
                      {sharePct >= 0.1 ? `${sharePct.toFixed(1)}%` : '—'}
                    </span>
                  </li>
                );
              })}
            </ol>
          </>
        ) : (
          <p className="pk-breakdown__empty">No data for this metric yet.</p>
        )}
      </div>
    </section>
  );
}
