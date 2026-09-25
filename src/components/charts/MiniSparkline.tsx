import { TimeSeriesChart } from './TimeSeriesChart';
import type { ChartPoint } from './timeSeriesSetup';

interface MiniSparklineProps {
  data: number[];
  series?: Array<{ ts: number; value: number }>;
  height?: number;
  color?: string;
  theme?: 'card' | 'terminal' | 'embedded';
}

function autoYRange(points: ChartPoint[]): { yMin?: number; yMax?: number } {
  const values = points.map((p) => p.value).filter((v) => Number.isFinite(v));
  if (values.length < 2) return {};

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const pad = Math.max(range * 0.14, max * 0.025, 1);

  return { yMin: min - pad, yMax: max + pad };
}

/** Compact TVL sparkline for pool cards — always visible, dark-integrated. */
export function MiniSparkline({
  data,
  series,
  height = 48,
  color,
  theme = 'embedded',
}: MiniSparklineProps) {
  const values = data.length ? data : [0];
  const now = Date.now();
  const points: ChartPoint[] = series?.length
    ? series.map((p) => ({ ts: p.ts, value: p.value }))
    : values.map((value, i) => ({
        ts: now - (values.length - 1 - i) * 86400000,
        value,
      }));

  const { yMin, yMax } = autoYRange(points);
  const lineColor = color ?? 'rgba(255,255,255,0.86)';

  return (
    <TimeSeriesChart
      series={[
        {
          id: 'spark',
          label: 'TVL',
          color: lineColor,
          data: points,
          fill: true,
        },
      ]}
      height={height}
      theme={theme}
      yMin={yMin}
      yMax={yMax}
      showXAxis={false}
      showYAxis={false}
      showTooltip={false}
      animate={false}
      timeUnit="day"
      formatValue={() => ''}
      className="mini-sparkline"
    />
  );
}
