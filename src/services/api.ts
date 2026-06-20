/**
 * Frontend API client — thin fetch layer only.
 * All live data aggregation happens in server/builders/.
 */
import { PLACEHOLDER_DASHBOARD } from '../data/placeholders.ts';
import type { ChartsData, ChartRange, DashboardData } from '../types/index.ts';

const TIMEOUT = 10_000;

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const data = await safeFetch<DashboardData>('/api/dashboard');
  return data ?? { ...PLACEHOLDER_DASHBOARD, cached: true };
}

export async function fetchChartsData(range: ChartRange = '30'): Promise<ChartsData | null> {
  return safeFetch<ChartsData>(`/api/charts?range=${range}`);
}
