import type { TooltipItem } from 'chart.js';

export const CHART_COLORS = {
  accent: '#FFFFFF',
  grid: 'rgba(255,255,255,0.06)',
  tick: '#737373',
  tooltipBg: '#171717',
  tooltipBorder: '#000000',
};

export function baseChartOptions(opts?: {
  yFormat?: (v: number) => string;
  yMin?: number;
  yMax?: number;
  showLegend?: boolean;
}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: opts?.showLegend ?? false },
      tooltip: {
        backgroundColor: CHART_COLORS.tooltipBg,
        borderColor: CHART_COLORS.tooltipBorder,
        borderWidth: 2,
        titleFont: { family: 'DM Sans', weight: 'bold' as const },
        bodyFont: { family: 'DM Sans', weight: 'normal' as const },
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
            const y = ctx.parsed.y;
            if (y == null) return '';
            return opts?.yFormat ? opts.yFormat(y) : `$${y.toFixed(4)}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: CHART_COLORS.grid },
        ticks: {
          color: CHART_COLORS.tick,
          font: { family: 'DM Sans', size: 10, weight: 500 },
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: { color: CHART_COLORS.grid },
        ticks: {
          color: CHART_COLORS.tick,
          font: { family: 'DM Sans', size: 10, weight: 500 },
          callback: (v: number | string) =>
            opts?.yFormat ? opts.yFormat(Number(v)) : `$${Number(v).toFixed(4)}`,
        },
        ...(opts?.yMin != null ? { min: opts.yMin } : {}),
        ...(opts?.yMax != null ? { max: opts.yMax } : {}),
      },
    },
  };
}

export function formatPrice(price: number, type?: string): string {
  if (type === 'stablecoin') return `$${price.toFixed(4)}`;
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  if (price >= 0.01) return `$${price.toFixed(4)}`;
  return `$${price.toFixed(6)}`;
}

export function formatChange(pct: number): string {
  const sign = pct >= 0 ? '+' : '';
  return `${sign}${pct.toFixed(2)}%`;
}
