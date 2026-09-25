/**
 * Frontend API client — thin fetch layer only.
 * All live data aggregation happens in server/builders/.
 */
import { PLACEHOLDER_DASHBOARD } from '../data/placeholders.ts';
import { POOL_REGISTRY } from '../data/poolRegistry.ts';
import { sanitizeDashboardData } from '../../shared/lib/sanitizeMetrics.ts';
import type { ChartsData, ChartHistoryResponse, ChartRange, DashboardData, NewsResponse, ProtocolChartsData, ShowData, XTimelineResponse } from '../types/index.ts';
import type { ChartRangeId } from '../../shared/constants/chartRanges.ts';
import {
  ONCHAIN_CASH_HOSTS,
  ONCHAIN_CASH_SEGMENTS,
  ONCHAIN_CASH_SHOW,
} from '../../shared/data/showConfig.ts';

const TIMEOUT = 10_000;
const HISTORY_TIMEOUT = 45_000;
const PROTOCOL_TIMEOUT = 60_000;

async function safeFetch<T>(url: string, timeout = TIMEOUT): Promise<T | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const DASHBOARD_TIMEOUT = 30_000;
const CLIENT_CACHE_MS = 45_000;

let dashboardInflight: Promise<DashboardData> | null = null;
let dashboardCache: { data: DashboardData; at: number } | null = null;

/** Shared client cache — keeps navigations fast and avoids duplicate dashboard hits. */
export async function fetchDashboardData(refresh = false): Promise<DashboardData> {
  if (
    !refresh &&
    dashboardCache &&
    Date.now() - dashboardCache.at < CLIENT_CACHE_MS
  ) {
    return dashboardCache.data;
  }
  if (!refresh && dashboardInflight) return dashboardInflight;

  const request = (async () => {
    const q = refresh ? '?refresh=1' : '';
    const data = await safeFetch<DashboardData>(`/api/dashboard${q}`, DASHBOARD_TIMEOUT);
    const base = data ?? { ...PLACEHOLDER_DASHBOARD, cached: true };
    const sanitized = sanitizeDashboardData(base, POOL_REGISTRY);
    dashboardCache = { data: sanitized, at: Date.now() };
    return sanitized;
  })().finally(() => {
    dashboardInflight = null;
  });

  dashboardInflight = request;
  return request;
}

/** Warm the dashboard cache as soon as the app boots. */
export function prefetchDashboardData(): void {
  void fetchDashboardData(false);
}

const NEWS_TIMEOUT = 20_000;

export async function fetchNews(refresh = false): Promise<NewsResponse> {
  const q = refresh ? '?refresh=1' : '';
  const data = await safeFetch<NewsResponse>(`/api/news${q}`, NEWS_TIMEOUT);
  if (!data) {
    return {
      items: [],
      sources: [],
      lastUpdated: new Date().toISOString(),
      cached: false,
      error: 'fetch_failed',
    };
  }
  if (!data.items.length) {
    return { ...data, error: data.error ?? 'empty' };
  }
  return data;
}

const X_TIMELINE_TIMEOUT = 20_000;

export async function fetchXTimeline(account: string, refresh = false): Promise<XTimelineResponse> {
  const q = refresh ? '?refresh=1' : '';
  const data = await safeFetch<XTimelineResponse>(
    `/api/x/timeline/${encodeURIComponent(account)}${q}`,
    X_TIMELINE_TIMEOUT,
  );
  if (!data) {
    return {
      posts: [],
      account,
      lastUpdated: new Date().toISOString(),
      cached: false,
      error: 'fetch_failed',
    };
  }
  if (!data.posts.length) {
    return { ...data, error: data.error ?? 'empty' };
  }
  return data;
}

export async function fetchChartsWatchlist(refresh = false): Promise<ChartsData | null> {
  const q = refresh ? '?refresh=1' : '';
  return safeFetch<ChartsData>(`/api/charts/watchlist${q}`, TIMEOUT);
}

export async function fetchTokenChartHistory(
  tokenId: string,
  range: ChartRangeId,
  refresh = false,
): Promise<ChartHistoryResponse | null> {
  const q = refresh ? '&refresh=1' : '';
  return safeFetch<ChartHistoryResponse>(
    `/api/charts/history/${encodeURIComponent(tokenId)}?range=${range}${q}`,
    HISTORY_TIMEOUT,
  );
}

/** @deprecated Prefer watchlist + fetchTokenChartHistory */
export async function fetchChartsData(
  range: ChartRange = '30',
  refresh = false,
): Promise<ChartsData | null> {
  const q = refresh ? '&refresh=1' : '';
  return safeFetch<ChartsData>(`/api/charts?range=${range}${q}`, HISTORY_TIMEOUT);
}

export async function fetchProtocolCharts(refresh = false): Promise<ProtocolChartsData | null> {
  const q = refresh ? '?refresh=1' : '';
  return safeFetch<ProtocolChartsData>(`/api/charts/protocol${q}`, PROTOCOL_TIMEOUT);
}

let showInflight: Promise<ShowData> | null = null;
let showCache: { data: ShowData; at: number } | null = null;

function fallbackShowData(): ShowData {
  return {
    channelId: ONCHAIN_CASH_SHOW.youtubeChannelId,
    channelUrl: ONCHAIN_CASH_SHOW.youtubeChannelUrl,
    liveEmbedUrl: `https://www.youtube-nocookie.com/embed/live_stream?channel=${ONCHAIN_CASH_SHOW.youtubeChannelId}`,
    schedule: { ...ONCHAIN_CASH_SHOW.schedule },
    hosts: ONCHAIN_CASH_HOSTS,
    segments: ONCHAIN_CASH_SEGMENTS,
    episodes: [],
    source: 'youtube-rss',
    lastUpdated: new Date().toISOString(),
    cached: false,
    error: 'fetch_failed',
  };
}

export async function fetchShowData(refresh = false): Promise<ShowData> {
  if (!refresh && showCache && Date.now() - showCache.at < CLIENT_CACHE_MS) {
    return showCache.data;
  }
  if (!refresh && showInflight) return showInflight;

  const request = (async () => {
    const q = refresh ? '?refresh=1' : '';
    const data = await safeFetch<ShowData>(`/api/show${q}`, 20_000);
    const next = data ?? fallbackShowData();
    showCache = { data: next, at: Date.now() };
    return next;
  })().finally(() => {
    showInflight = null;
  });

  showInflight = request;
  return request;
}

export function prefetchShowData(): void {
  void fetchShowData(false);
}

export async function submitShowTopic(input: {
  topic: string;
  reason?: string;
}): Promise<'ok' | 'config' | 'error'> {
  try {
    const response = await fetch('/api/show/topic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(12_000),
    });
    if (response.status === 503) return 'config';
    if (!response.ok) return 'error';
    return 'ok';
  } catch {
    return 'error';
  }
}
