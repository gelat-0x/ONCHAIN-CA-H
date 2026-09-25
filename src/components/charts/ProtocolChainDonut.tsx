import { useMemo } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, type TooltipItem } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { ProtocolChainTvl } from '../../types';
import { formatUsdMetric } from '../../lib/formatUsd';
import { chainBrandColor } from '../../lib/chainColors';

ChartJS.register(ArcElement, Tooltip);

/** Chains below this share of total TVL are grouped as "Other" in presentation only. */
const OTHER_THRESHOLD_PCT = 2.5;

export interface ChainSlice {
  chain: string;
  tvl: number;
  pct: number;
  color: string;
  grouped?: boolean;
}

interface ProtocolChainDonutProps {
  chains: ProtocolChainTvl[];
  /** Chart.js height of the ring area */
  height?: number;
  /** Optional accent when a chain has no brand mapping (fallback only). */
  accent?: string;
  emptyLabel?: string;
}

function buildSlices(chains: ProtocolChainTvl[]): {
  slices: ChainSlice[];
  total: number;
} {
  const positive = chains
    .filter((c) => Number.isFinite(c.tvl) && c.tvl > 0)
    .sort((a, b) => b.tvl - a.tvl);
  const total = positive.reduce((sum, c) => sum + c.tvl, 0);
  if (total <= 0) return { slices: [], total: 0 };

  const major: ChainSlice[] = [];
  let otherTvl = 0;

  for (const { chain, tvl } of positive) {
    const pct = (tvl / total) * 100;
    if (pct < OTHER_THRESHOLD_PCT && positive.length > 4) {
      otherTvl += tvl;
    } else {
      major.push({
        chain,
        tvl,
        pct,
        color: '',
      });
    }
  }

  if (otherTvl > 0) {
    major.push({
      chain: 'Other',
      tvl: otherTvl,
      pct: (otherTvl / total) * 100,
      color: '',
      grouped: true,
    });
  }

  // Brand colors per chain (DefiLlama-style: Ethereum blue, etc.)
  const slices = major.map((s, i) => ({
    ...s,
    pct: (s.tvl / total) * 100,
    color: chainBrandColor(s.chain, i),
  }));

  return { slices, total };
}

export function ProtocolChainDonut({
  chains,
  height = 220,
  emptyLabel = 'Chain TVL breakdown unavailable from source.',
}: ProtocolChainDonutProps) {
  const { slices, total } = useMemo(() => buildSlices(chains), [chains]);

  const chartData = useMemo(
    () => ({
      labels: slices.map((s) => s.chain),
      datasets: [
        {
          data: slices.map((s) => s.tvl),
          backgroundColor: slices.map((s) => s.color),
          borderColor: 'rgba(0,0,0,0.65)',
          borderWidth: 2,
          hoverOffset: 4,
        },
      ],
    }),
    [slices],
  );

  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      cutout: '68%',
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#161616',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          titleFont: { family: 'DM Sans', weight: 'bold' as const },
          bodyFont: { family: 'DM Sans', weight: 'normal' as const },
          callbacks: {
            label: (ctx: TooltipItem<'doughnut'>) => {
              const slice = slices[ctx.dataIndex];
              if (!slice) return '';
              return `${slice.chain}: ${formatUsdMetric(slice.tvl)} (${slice.pct.toFixed(1)}%)`;
            },
          },
        },
      },
    }),
    [slices],
  );

  if (!slices.length) {
    return <p className="protocol-chart__empty">{emptyLabel}</p>;
  }

  const pctSum = slices.reduce((s, x) => s + x.pct, 0);
  const summaryText = slices
    .map((s) => `${s.chain} ${s.pct.toFixed(1)}% (${formatUsdMetric(s.tvl)})`)
    .join('; ');

  return (
    <div className="protocol-donut">
      <div className="protocol-donut__visual" style={{ height }}>
        <Doughnut data={chartData} options={options} />
        <div className="protocol-donut__center" aria-hidden="true">
          <span className="protocol-donut__center-label">Total</span>
          <span className="protocol-donut__center-value tabular-nums">
            {formatUsdMetric(total)}
          </span>
        </div>
      </div>

      <ul className="protocol-donut__legend">
        {slices.map((s) => (
          <li key={s.chain} className="protocol-donut__legend-item">
            <span
              className="protocol-donut__swatch"
              style={{ background: s.color }}
              aria-hidden="true"
            />
            <span className="protocol-donut__legend-name">
              {s.chain}
              {s.grouped ? ' (grouped)' : ''}
            </span>
            <span className="protocol-donut__legend-pct tabular-nums">
              {s.pct.toFixed(1)}%
            </span>
            <span className="protocol-donut__legend-usd tabular-nums">
              {formatUsdMetric(s.tvl)}
            </span>
          </li>
        ))}
      </ul>

      <p className="protocol-donut__sr-only">
        TVL by chain. Total {formatUsdMetric(total)}. Shares sum to {pctSum.toFixed(1)}%.
        {summaryText}
      </p>
    </div>
  );
}
