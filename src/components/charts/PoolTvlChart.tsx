import { formatUsd } from '../../lib/formatUsd';
import { TimeSeriesChart } from './TimeSeriesChart';
import type { ChartPoint } from './timeSeriesSetup';

interface PoolTvlChartProps {
  data: number[];
  series?: Array<{ ts: number; value: number }>;
  height?: number;
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
export function PoolTvlChart({ data, series, height = 240 }: PoolTvlChartProps) {
  const points = toSeries(data.length ? data : [0], series);

  return (
    <TimeSeriesChart
      className="pool-tvl-chart"
      height={height}
      theme="modal"
      timeUnit="day"
      formatValue={(v) => formatUsd(v)}
      series={[
        {
          id: 'tvl',
          label: 'TVL',
          color: '#FFFFFF',
          data: points,
          fill: true,
        },
      ]}
    />
  );
}
