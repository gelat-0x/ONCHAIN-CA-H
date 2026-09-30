import { formatUsd } from '../../lib/formatUsd';
import { TimeSeriesChart } from './TimeSeriesChart';
import type { ChartPoint } from './timeSeriesSetup';

interface PoolTvlChartProps {
  data: number[];
  series?: Array<{ ts: number; value: number }>;
  height?: number;
  label?: string;
}

function toSeries(data: number[], series?: Array<{ ts: number; value: number }>): ChartPoint[] {
  if (series?.length) {
    return series.map((p) => ({ ts: p.ts, value: p.value }));
  }
  const now = Date.now();
  return data.map((value, i) => ({
    ts: now - (data.length - 1 - i) * 86400000,
    value,
  }));
}

/** 7-day TVL trend for pool explore modal. */
export function PoolTvlChart({ data, series, height = 240, label = 'TVL' }: PoolTvlChartProps) {
  const points = toSeries(data.length ? data : [0], series);
  const span = points.length >= 2 ? points[points.length - 1]!.ts - points[0]!.ts : 0;
  const timeUnit = span > 0 && span < 36 * 60 * 60 * 1000 ? 'hour' : 'day';

  return (
    <TimeSeriesChart
      className="pool-tvl-chart"
      height={height}
      theme="modal"
      timeUnit={timeUnit}
      formatValue={(v) => formatUsd(v)}
      series={[
        {
          id: 'tvl',
          label,
          color: '#FFFFFF',
          data: points,
          fill: true,
        },
      ]}
    />
  );
}
