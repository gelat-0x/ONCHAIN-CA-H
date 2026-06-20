import type { DashboardData, ChartsData, ChartRange } from '../../shared/types/index.ts';
import { CACHE_TTL_MS } from '../../shared/constants/cache.ts';

interface CacheEntry<T> {
  data: T | null;
  ts: number;
  key?: string;
}

const dashboardCache: CacheEntry<DashboardData> = { data: null, ts: 0 };
const chartsCache: CacheEntry<ChartsData> = { data: null, ts: 0, key: '' };

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

export function getChartsCache(range: ChartRange): ChartsData | null {
  if (
    chartsCache.data &&
    chartsCache.key === range &&
    Date.now() - chartsCache.ts < CACHE_TTL_MS
  ) {
    return chartsCache.data;
  }
  return null;
}

export function setChartsCache(data: ChartsData, range: ChartRange): void {
  chartsCache.data = data;
  chartsCache.ts = Date.now();
  chartsCache.key = range;
}

export function staleDashboard(): DashboardData | null {
  return dashboardCache.data;
}

export function staleCharts(): ChartsData | null {
  return chartsCache.data;
}
