/** Supported live chart ranges (CoinGecko market_chart mapping on server). */
export type ChartRangeId = '5m' | '1' | '7' | '30' | 'max';

export const CHART_RANGES: { id: ChartRangeId; label: string; pollMs: number }[] = [
  { id: '5m', label: '5M', pollMs: 30_000 },
  { id: '1', label: '1D', pollMs: 60_000 },
  { id: '7', label: '7D', pollMs: 60_000 },
  { id: '30', label: '30D', pollMs: 120_000 },
  { id: 'max', label: 'ALL', pollMs: 300_000 },
];

export function isChartRange(v: string): v is ChartRangeId {
  return CHART_RANGES.some((r) => r.id === v);
}

export function chartRangePollMs(id: ChartRangeId): number {
  return CHART_RANGES.find((r) => r.id === id)?.pollMs ?? 60_000;
}
