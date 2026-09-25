import { useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import type { Chart, ChartOptions, TooltipItem } from 'chart.js';
import {
  ensureTimeSeriesChartRegistered,
  type ChartSeries,
} from './timeSeriesSetup';

ensureTimeSeriesChartRegistered();

export type TimeSeriesTheme = 'terminal' | 'card' | 'modal' | 'embedded';

const THEME: Record<
  TimeSeriesTheme,
  {
    line: string;
    fill: string;
    grid: string;
    tick: string;
    bg: string;
    tooltipBg: string;
    tooltipBorder: string;
  }
> = {
  terminal: {
    line: '#FFFFFF',
    fill: 'rgba(255,255,255,0.08)',
    grid: 'rgba(255,255,255,0.06)',
    tick: '#737373',
    bg: 'transparent',
    tooltipBg: '#171717',
    tooltipBorder: 'rgba(255,255,255,0.12)',
  },
  card: {
    line: '#111111',
    fill: 'rgba(17,17,17,0.06)',
    grid: 'rgba(17,17,17,0.06)',
    tick: '#666666',
    bg: '#ffffff',
    tooltipBg: '#111111',
    tooltipBorder: 'rgba(255,255,255,0.1)',
  },
  modal: {
    line: '#FFFFFF',
    fill: 'rgba(255,255,255,0.1)',
    grid: 'rgba(255,255,255,0.08)',
    tick: '#999999',
    bg: 'rgba(255,255,255,0.04)',
    tooltipBg: '#0a0a0a',
    tooltipBorder: 'rgba(255,255,255,0.12)',
  },
  embedded: {
    line: 'rgba(255,255,255,0.88)',
    fill: 'rgba(255,255,255,0.08)',
    grid: 'transparent',
    tick: 'transparent',
    bg: 'transparent',
    tooltipBg: '#171717',
    tooltipBorder: 'rgba(255,255,255,0.12)',
  },
};

interface TimeSeriesChartProps {
  series: ChartSeries[];
  height?: number;
  theme?: TimeSeriesTheme;
  formatValue?: (v: number) => string;
  yMin?: number;
  yMax?: number;
  showLegend?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  timeUnit?: 'minute' | 'hour' | 'day';
  className?: string;
  showTooltip?: boolean;
  animate?: boolean;
}

export function TimeSeriesChart({
  series,
  height = 280,
  theme = 'terminal',
  formatValue = (v) => `$${v.toFixed(4)}`,
  yMin,
  yMax,
  showLegend = false,
  showXAxis = true,
  showYAxis = true,
  timeUnit,
  className = '',
  showTooltip = true,
  animate = true,
}: TimeSeriesChartProps) {
  const pal = THEME[theme];
  const chartRef = useRef<Chart<'line'>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const compact = theme === 'embedded' || theme === 'card';

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const resize = () => chartRef.current?.resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    requestAnimationFrame(resize);

    return () => ro.disconnect();
  }, [series, height, theme]);

  const datasets = series.map((s) => ({
    label: s.label,
    data: s.data.map((p) => ({ x: p.ts, y: p.value })),
    borderColor: s.color || pal.line,
    backgroundColor: s.fill
      ? theme === 'embedded'
        ? (s.color ? `${s.color}18` : pal.fill)
        : s.color
          ? `${s.color}22`
          : pal.fill
      : 'transparent',
    borderWidth: compact ? 1.35 : 2,
    pointRadius: 0,
    pointHoverRadius: showTooltip ? 4 : 0,
    pointHitRadius: showTooltip ? 12 : 0,
    fill: s.fill ?? false,
    tension: theme === 'embedded' ? 0.48 : 0.42,
    spanGaps: true,
  }));

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animation: animate ? { duration: theme === 'embedded' ? 0 : 280 } : false,
    interaction: showTooltip ? { mode: 'index', intersect: false } : { mode: 'nearest', intersect: false },
    plugins: {
      legend: {
        display: showLegend,
        labels: { color: pal.tick, font: { family: 'DM Sans', size: 10 }, boxWidth: 10 },
      },
      tooltip: {
        enabled: showTooltip,
        backgroundColor: pal.tooltipBg,
        borderColor: pal.tooltipBorder,
        borderWidth: 1,
        titleFont: { family: 'DM Sans', size: 11, weight: 'bold' },
        bodyFont: { family: 'DM Sans', size: 11 },
        padding: 10,
        displayColors: true,
        callbacks: {
          title: (items) => {
            const ts = items[0]?.parsed.x;
            if (ts == null) return '';
            const d = new Date(ts);
            if (timeUnit === 'minute' || timeUnit === 'hour') {
              return d.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
            }
            return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
          },
          label: (ctx: TooltipItem<'line'>) => {
            const y = ctx.parsed.y;
            if (y == null) return '';
            return `${ctx.dataset.label}: ${formatValue(y)}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time',
        display: showXAxis,
        grid: { color: pal.grid, drawTicks: false },
        border: { display: false },
        ticks: {
          color: pal.tick,
          font: { family: 'DM Sans', size: 9, weight: 500 },
          maxTicksLimit: theme === 'card' ? 4 : 6,
          maxRotation: 0,
        },
        time: {
          unit: timeUnit,
          displayFormats: {
            minute: 'HH:mm',
            hour: 'HH:mm',
            day: 'MMM d',
          },
        },
      },
      y: {
        display: showYAxis,
        min: yMin,
        max: yMax,
        grid: { color: pal.grid, drawTicks: false },
        border: { display: false },
        ticks: {
          color: pal.tick,
          font: { family: 'DM Sans', size: 9, weight: 500 },
          maxTicksLimit: theme === 'card' ? 3 : 5,
          callback: (v) => formatValue(Number(v)),
        },
      },
    },
    elements: {
      line: { borderCapStyle: 'round', borderJoinStyle: 'round' },
    },
  };

  return (
    <div
      ref={containerRef}
      className={`time-series-chart time-series-chart--${theme} ${className}`.trim()}
      style={{ height, background: pal.bg }}
    >
      <Line ref={chartRef} data={{ datasets }} options={options} />
    </div>
  );
}
