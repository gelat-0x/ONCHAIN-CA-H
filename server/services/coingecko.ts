import type { ChartRangeId } from '../../shared/constants/chartRanges.ts';
import { coingeckoChartParams } from '../lib/chartRangeParams.ts';
import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import { COINGECKO_RETRY_DELAY_MS } from '../../shared/constants/cache.ts';
import type { CoinGeckoPriceRow } from '../../shared/types/index.ts';
import { WATCHLIST_TOKENS, COINGECKO_IDS } from '../../shared/data/tokenCatalog.ts';
import { fetchJson } from '../lib/http.ts';

/** Last successful live prices — used when CoinGecko rate-limits or is offline. */
let lastLivePrices: Record<string, CoinGeckoPriceRow> = {};

/** Offline defaults when CoinGecko is unavailable (updated periodically). */
export const PRICE_FALLBACKS: Record<string, { price: number; change24h: number }> = {
  'frax-usd': { price: 0.9993, change24h: -0.03 },
  bitcoin: { price: 59_100, change24h: -1.1 },
  ethereum: { price: 1_557, change24h: -1.9 },
  solana: { price: 65.8, change24h: -1.0 },
  'frax-share': { price: 0.237, change24h: -1.4 },
  aave: { price: 80.7, change24h: 7.8 },
  'curve-dao-token': { price: 0.19, change24h: -0.8 },
  'convex-finance': { price: 1.09, change24h: -3.4 },
  'f-x-protocol': { price: 12.3, change24h: -3.2 },
};

/** Per-token history cache when CoinGecko rate-limits (key: `${cgId}:${days}`). */
const historyCache = new Map<string, { ts: number; points: { date: string; price: number; ts: number }[] }>();
const HISTORY_CACHE_MS = 55_000;

function historyCacheKey(cgId: string, days: string): string {
  return `${cgId}:${days}`;
}

export function getCachedTokenHistory(
  cgId: string,
  days: string,
): { date: string; price: number; ts: number }[] | undefined {
  const hit = historyCache.get(historyCacheKey(cgId, days));
  if (hit && Date.now() - hit.ts < HISTORY_CACHE_MS * 120) {
    return hit.points;
  }
  return undefined;
}

export function resolvePrice(cgId: string, row?: CoinGeckoPriceRow): { price: number; change24h: number } {
  if (row?.usd) return { price: row.usd, change24h: row.usd_24h_change ?? 0 };

  const cached = lastLivePrices[cgId];
  if (cached?.usd) {
    return { price: cached.usd, change24h: cached.usd_24h_change ?? 0 };
  }

  return PRICE_FALLBACKS[cgId] ?? { price: 0, change24h: 0 };
}

export async function fetchCoinGeckoPrices(): Promise<Record<string, CoinGeckoPriceRow>> {
  const url = API_ENDPOINTS.coingecko.simplePrice(COINGECKO_IDS);
  const data = await fetchJson<Record<string, CoinGeckoPriceRow>>(url);

  if (data && Object.keys(data).length > 0) {
    lastLivePrices = { ...lastLivePrices, ...data };
    return data;
  }

  const out: Record<string, CoinGeckoPriceRow> = { ...lastLivePrices };
  for (const t of WATCHLIST_TOKENS) {
    if (out[t.coingeckoId]?.usd) continue;
    const row = await fetchJson<Record<string, CoinGeckoPriceRow>>(
      API_ENDPOINTS.coingecko.singlePrice(t.coingeckoId),
    );
    if (row?.[t.coingeckoId]) {
      out[t.coingeckoId] = row[t.coingeckoId];
      lastLivePrices[t.coingeckoId] = row[t.coingeckoId];
    }
    await new Promise((r) => setTimeout(r, COINGECKO_RETRY_DELAY_MS));
  }

  if (Object.keys(out).length > 0) return out;
  return lastLivePrices;
}

/** CoinGecko market_chart — UI ranges or legacy day counts (e.g. peg history `90`). */
export async function fetchTokenHistory(
  cgId: string,
  range: ChartRangeId | '90',
): Promise<{ date: string; price: number; ts: number }[]> {
  const { days, interval } =
    range === '90'
      ? { days: '90', interval: '&interval=daily' }
      : coingeckoChartParams(range);
  const cacheKey = `${cgId}:${range}:${days}`;

  const dayCandidates = days === 'max' ? ['max', '365'] : [days];
  let history: { prices?: [number, number][] } | null = null;

  for (const dayVal of dayCandidates) {
    for (let attempt = 0; attempt < 3; attempt++) {
      history = await fetchJson<{ prices?: [number, number][] }>(
        API_ENDPOINTS.coingecko.marketChart(cgId, dayVal, interval),
      );
      if (history?.prices?.length) break;
      await new Promise((r) => setTimeout(r, COINGECKO_RETRY_DELAY_MS * (attempt + 2)));
    }
    if (history?.prices?.length) break;
  }

  if (!history?.prices?.length) {
    return getCachedTokenHistory(cgId, cacheKey) ?? [];
  }
  const isStable = cgId === 'frax-usd' || cgId === 'crvusd' || cgId === 'gho';
  const decimals = isStable ? 4 : 6;

  const points = history.prices
    .map(([ts, price]) => ({
      ts,
      date: new Date(ts).toISOString(),
      price: +Number(price).toFixed(decimals),
    }))
    .sort((a, b) => a.ts - b.ts);

  const byTs = new Map<number, (typeof points)[0]>();
  for (const p of points) byTs.set(p.ts, p);
  const deduped = [...byTs.values()].sort((a, b) => a.ts - b.ts);

  historyCache.set(historyCacheKey(cgId, cacheKey), { ts: Date.now(), points: deduped });
  return deduped;
}
