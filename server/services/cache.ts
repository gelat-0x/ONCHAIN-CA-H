import type { DashboardData, ChartsData, ChartHistoryResponse } from '../../shared/types/index.ts';
import { CACHE_TTL_MS } from '../../shared/constants/cache.ts';
import { chartRangePollMs, type ChartRangeId } from '../../shared/constants/chartRanges.ts';

interface CacheEntry<T> {
  data: T | null;
  ts: number;
  key?: string;
}

const dashboardCache: CacheEntry<DashboardData> = { data: null, ts: 0 };
const chartsCache: CacheEntry<ChartsData> = { data: null, ts: 0, key: '' };
const historyCache = new Map<string, { data: ChartHistoryResponse; ts: number }>();

function historyKey(tokenId: string, range: string): string {
  return `${tokenId}:${range}`;
}

export function getDashboardCache(): DashboardData | null {
  if (dashboardCache.data && Date.now() - dashboardCache.ts < CACHE_TTL_MS) {
    return dashboardCache.data;
  }
  return null;
}

export function setDashboardCache(data: DashboardData): void {
  dashboardCache.data = data;
  dashboardCache.ts = Date.now();
}

export function getChartsCache(range: string): ChartsData | null {
  if (
    chartsCache.data &&
    chartsCache.key === range &&
    Date.now() - chartsCache.ts < CACHE_TTL_MS
  ) {
    return chartsCache.data;
  }
  return null;
}

export function setChartsCache(data: ChartsData, range: string): void {
  chartsCache.data = data;
  chartsCache.ts = Date.now();
  chartsCache.key = range;
}

export function getHistoryCache(
  tokenId: string,
  range: ChartRangeId,
): ChartHistoryResponse | null {
  const hit = historyCache.get(historyKey(tokenId, range));
  if (hit && Date.now() - hit.ts < chartRangePollMs(range)) {
    return hit.data;
  }
  return null;
}

export function setHistoryCache(
  tokenId: string,
  range: ChartRangeId,
  data: ChartHistoryResponse,
): void {
  historyCache.set(historyKey(tokenId, range), { data, ts: Date.now() });
}

export function staleDashboard(): DashboardData | null {
  return dashboardCache.data;
}

export function clearDashboardCache(): void {
  dashboardCache.data = null;
  dashboardCache.ts = 0;
}

export function staleCharts(): ChartsData | null {
  return chartsCache.data;
}

export function clearChartsCache(): void {
  chartsCache.data = null;
  chartsCache.ts = 0;
  chartsCache.key = '';
}
