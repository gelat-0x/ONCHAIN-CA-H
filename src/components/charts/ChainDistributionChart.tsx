import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  type TooltipItem,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import type { ChainDistribution } from '../../types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

interface ChainDistributionChartProps {
  data: ChainDistribution[];
}

export function ChainDistributionChart({ data }: ChainDistributionChartProps) {
  const chartData = {
    labels: data.map((d) => d.chain),
    datasets: [
      {
        data: data.map((d) => d.percentage),
        backgroundColor: data.map((_, i) => {
          const shades = ['#FFFFFF', '#D4D4D4', '#A3A3A3', '#737373', '#525252', '#404040'];
          return shades[Math.min(i, shades.length - 1)];
        }),
        borderRadius: 2,
        barThickness: 16,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#161616',
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => {
            const x = ctx.parsed.x;
            return x != null ? `${x.toFixed(2)}%` : '';
          },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: {
          color: '#444444',
          font: { family: 'DM Sans', size: 10, weight: 500 },
          callback: (v: number | string) => `${v}%`,
        },
        max: 100,
      },
      y: {
        grid: { display: false },
        ticks: {
          color: '#888888',
          font: { family: 'DM Sans', size: 11, weight: 500 },
        },
      },
    },
  };

  return (
    <div>
      <div className="chart-title">Chain Distribution</div>
      <div style={{ height: 240 }}>
        <Bar data={chartData} options={options} />
      </div>
      <div className="chart-source">Source: Sharpe Terminal</div>
    </div>
  );
}
