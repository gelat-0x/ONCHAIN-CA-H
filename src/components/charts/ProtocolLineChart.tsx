import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { ChartPoint } from '../../types';
import { formatUsd, formatUsdMetric } from '../../lib/formatUsd';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

interface ProtocolLineChartProps {
  points: ChartPoint[];
  label: string;
  color?: string;
  height?: number;
  valueFormatter?: (v: number) => string;
}

function defaultRange(points: ChartPoint[]): { labels: string[]; values: number[] } {
  const sorted = [...points].sort((a, b) => a.ts - b.ts);
  return {
    labels: sorted.map((p) => new Date(p.ts).toISOString().slice(0, 10)),
    values: sorted.map((p) => p.value),
  };
}

export function ProtocolLineChart({
  points,
  label,
  color = '#ffffff',
  height = 280,
  valueFormatter = (v) => formatUsdMetric(v),
}: ProtocolLineChartProps) {
  const { labels, values } = useMemo(() => defaultRange(points), [points]);

  const data = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: color,
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: true,
        backgroundColor: (ctx: { chart: ChartJS }) => {
          const { ctx: c, chartArea } = ctx.chart;
          if (!chartArea) return 'rgba(255,255,255,0.05)';
          const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, 'rgba(255,255,255,0.18)');
          g.addColorStop(1, 'rgba(255,255,255,0.0)');
          return g;
        },
        tension: 0.25,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161616',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        titleFont: { family: 'DM Sans', weight: 'bold' as const },
        bodyFont: { family: 'DM Sans', weight: 'normal' as const },
        callbacks: {
          label: (ctx: { parsed: { y: number | null } }) =>
            ctx.parsed.y != null ? valueFormatter(ctx.parsed.y) : '',
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: {
          color: '#444444',
          font: { family: 'DM Sans', size: 10, weight: 500 },
          maxTicksLimit: 6,
        },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: {
          color: '#444444',
          font: { family: 'DM Sans', size: 10, weight: 500 },
          callback: (v: number | string) => formatUsd(Number(v)),
        },
      },
    },
  };

  if (values.length < 2 || values.every((v) => !v)) {
    return <div className="protocol-chart__empty">No live history yet, retrying on refresh.</div>;
  }

  return (
    <div style={{ height, position: 'relative' }}>
      <Line data={data} options={options} />
    </div>
  );
}
