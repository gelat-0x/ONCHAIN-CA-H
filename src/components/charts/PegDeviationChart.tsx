import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  annotationPlugin,
);

interface PegDeviationChartProps {
  data: { date: string; price: number }[];
}

export function PegDeviationChart({ data }: PegDeviationChartProps) {
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'frxUSD Price',
        data: data.map((d) => d.price),
        borderColor: '#FFFFFF',
        borderWidth: 1.5,
        pointRadius: 0,
        pointHoverRadius: 4,
        fill: false,
        tension: 0.3,
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
        borderColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        titleFont: { family: 'DM Sans', weight: 'bold' as const },
        bodyFont: { family: 'DM Sans', weight: 'normal' as const },
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
            borderColor: 'rgba(255,255,255,0.4)',
            borderWidth: 1,
            borderDash: [6, 4],
          },
          greenBand: {
            type: 'box' as const,
            yMin: 0.998,
            yMax: 1.002,
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            borderWidth: 0,
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
          maxTicksLimit: 8,
        },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: {
          color: '#444444',
          font: { family: 'DM Sans', size: 10, weight: 500 },
          callback: (v: number | string) => `$${Number(v).toFixed(3)}`,
        },
        min: 0.995,
        max: 1.005,
      },
    },
    onClick: () => setShowEasterEgg(true),
  };

  return (
    <div className="chart-container" style={{ position: 'relative' }}>
      <div className="chart-title">90-Day Peg History — frxUSD</div>
      <div style={{ height: 320 }}>
        <Line data={chartData} options={options} />
      </div>
      <div className="chart-source">
        Powered by Chaos Proof of Reserves + Curve Finance
      </div>
      {showEasterEgg && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#161616',
            border: '2px solid #FFFFFF',
            borderRadius: 8,
            padding: '16px 24px',
            fontSize: 13,
            color: '#FFFFFF',
            zIndex: 10,
            cursor: 'pointer',
          }}
          onClick={() => setShowEasterEgg(false)}
        >
          frxUSD has never broken peg. This line is the proof.
        </div>
      )}
    </div>
  );
}
