import { useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

interface MiniSparklineProps {
  data: number[];
  height?: number;
  animate?: boolean;
  color?: string;
}

export function MiniSparkline({ data, height = 40, animate = true, color = '#FFFFFF' }: MiniSparklineProps) {
  const chartRef = useRef<ChartJS<'line'>>(null);

  useEffect(() => {
    if (!animate || !chartRef.current) return;
    const chart = chartRef.current;
    chart.update('active');
  }, [animate, data]);

  const chartData = {
    labels: data.map((_, i) => i),
    datasets: [
      {
        data,
        borderColor: color,
        borderWidth: 1.5,
        pointRadius: 0,
        fill: {
          target: 'origin',
          above: `${color}14`,
        },
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 1500 },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: {
      x: { display: false },
      y: { display: false, min: Math.min(...data) - 0.001, max: Math.max(...data) + 0.001 },
    },
  };

  return (
    <div style={{ height }}>
      <Line ref={chartRef} data={chartData} options={options} />
    </div>
  );
}
