import type { ChartRangeId } from '../../shared/constants/chartRanges.ts';

/** CoinGecko market_chart query params per UI range. */
export function coingeckoChartParams(range: ChartRangeId): { days: string; interval: string } {
  switch (range) {
    case '5m':
    case '1':
      return { days: '1', interval: '' };
    case '7':
      return { days: '7', interval: '' };
    case '30':
      return { days: '30', interval: '&interval=daily' };
    case 'max':
      return { days: 'max', interval: '' };
    default:
      return { days: '30', interval: '&interval=daily' };
  }
}

/** Slice raw history for 5M view — last ~60 minutes at ~5min resolution. */
export function sliceHistoryForRange<T extends { ts: number }>(
  points: T[],
  range: ChartRangeId,
): T[] {
  if (points.length < 2) return points;
  if (range !== '5m') return points;
  const cutoff = Date.now() - 60 * 60 * 1000;
  const recent = points.filter((p) => p.ts >= cutoff);
  return recent.length >= 2 ? recent : points.slice(-12);
}
