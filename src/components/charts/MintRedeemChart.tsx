import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { FrxUsdMintRedeemDay } from '../../types';
import { formatUsd } from '../../lib/formatUsd';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

interface MintRedeemChartProps {
  daily: FrxUsdMintRedeemDay[];
  height?: number;
}

export function MintRedeemChart({ daily, height = 280 }: MintRedeemChartProps) {
  const { labels, mint, redeem } = useMemo(() => {
    const slice = daily.slice(-90);
    return {
      labels: slice.map((d) => new Date(d.ts).toISOString().slice(0, 10)),
      mint: slice.map((d) => d.mint),
      redeem: slice.map((d) => d.redeem),
    };
  }, [daily]);

  const data = {
    labels,
    datasets: [
      {
        label: 'Mint',
        data: mint,
        backgroundColor: 'rgba(52, 211, 153, 0.65)',
        borderColor: '#34d399',
        borderWidth: 1,
        borderRadius: 2,
      },
      {
        label: 'Redeem',
        data: redeem,
        backgroundColor: 'rgba(248, 113, 113, 0.55)',
        borderColor: '#f87171',
        borderWidth: 1,
        borderRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        display: true,
        position: 'top' as const,
        labels: {
          color: '#888',
          font: { family: 'DM Sans', size: 11 },
          boxWidth: 10,
        },
      },
      tooltip: {
        backgroundColor: '#161616',
        borderColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        callbacks: {
          label: (ctx: { dataset: { label?: string }; parsed: { y: number | null } }) =>
            `${ctx.dataset.label}: ${ctx.parsed.y != null ? formatUsd(ctx.parsed.y) : '—'}`,
        },
      },
    },
    scales: {
      x: {
        stacked: false,
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: {
          color: '#444',
          font: { family: 'DM Sans', size: 10 },
          maxTicksLimit: 8,
        },
      },
      y: {
        stacked: false,
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: {
          color: '#444',
          font: { family: 'DM Sans', size: 10 },
          callback: (v: number | string) => formatUsd(Number(v)),
        },
      },
    },
  };

  if (!labels.length || (mint.every((v) => !v) && redeem.every((v) => !v))) {
    return <div className="protocol-chart__empty">No mint/redeem history yet.</div>;
  }

  return (
    <div style={{ height, position: 'relative' }}>
      <Bar data={data} options={options} />
    </div>
  );
}
