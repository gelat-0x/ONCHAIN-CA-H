import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  type TooltipItem,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, annotationPlugin);

interface PoolPegChartProps {
  data: number[];
  height?: number;
}

/** Clean peg chart for pool explore modal — axes, tooltips, 1.0 reference line. */
export function PoolPegChart({ data, height = 220 }: PoolPegChartProps) {
  const values = data.length ? data : [1.0];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(0.0003, (max - min) * 0.35);

  const chartData = {
    labels: values.map((_, i) => `D${i + 1}`),
    datasets: [
      {
        label: 'Peg',
        data: values,
        borderColor: '#FFFFFF',
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: '#FFFFFF',
        fill: false,
        tension: 0.35,
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
        titleFont: { family: 'DM Sans', weight: 'bold' as const, size: 11 },
        bodyFont: { family: 'DM Sans', size: 11 },
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => {
            const y = ctx.parsed.y;
            return y != null ? `$${y.toFixed(4)}` : '';
          },
        },
      },
      annotation: {
        annotations: {
          pegLine: {
            type: 'line' as const,
            yMin: 1.0,
            yMax: 1.0,
            borderColor: 'rgba(255,255,255,0.35)',
            borderWidth: 1,
            borderDash: [4, 4],
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: { color: 'rgba(255,255,255,0.04)' },
        ticks: { color: 'var(--muted)', font: { size: 9 }, maxTicksLimit: 7 },
        border: { display: false },
      },
      y: {
        display: true,
        min: Math.min(0.998, min - pad),
        max: Math.max(1.002, max + pad),
        grid: { color: 'rgba(255,255,255,0.06)' },
        ticks: {
          color: 'var(--muted)',
          font: { size: 9 },
          callback: (v: string | number) => `$${Number(v).toFixed(4)}`,
          maxTicksLimit: 5,
        },
        border: { display: false },
      },
    },
  };

  return (
    <div className="pool-peg-chart" style={{ height }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
