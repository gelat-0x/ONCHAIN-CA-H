/** Downsample time series for readable bar charts (max N bars). */
export function downsampleChartPoints<T extends { value: number }>(
  points: T[],
  maxBars: number,
): T[] {
  if (points.length <= maxBars) return points;
  const out: T[] = [];
  const step = (points.length - 1) / (maxBars - 1);
  for (let i = 0; i < maxBars; i++) {
    out.push(points[Math.round(i * step)]!);
  }
  return out;
}

/** Max bars by range — tuned for CoinGecko granularity per window. */
export function chartBarTarget(range: string, pointCount: number): number {
  if (range === '5m') return Math.min(pointCount, 60);
  if (range === '1') return Math.min(pointCount, 48);
  if (range === '7') return Math.min(pointCount, 42);
  if (range === '30') return Math.min(pointCount, 30);
  if (range === 'max') return Math.min(pointCount, 52);
  if (range === '90') return Math.min(pointCount, 45);
  return Math.min(pointCount, 52);
}

const RANGE_LABELS: Record<string, string> = {
  '5m': '1m · live',
  '1': '24h · ~5m',
  '7': '7 days',
  '30': '30 days',
  'max': 'All time',
};

export function chartRangeLabel(range: string): string {
  return RANGE_LABELS[range] ?? `${range}d`;
}
