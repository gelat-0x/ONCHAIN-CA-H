import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import { COINGECKO_RETRY_DELAY_MS } from '../../shared/constants/cache.ts';
import type { CoinGeckoPriceRow } from '../../shared/types/index.ts';
import { WATCHLIST_TOKENS, COINGECKO_IDS } from '../../shared/data/tokenCatalog.ts';
import { fetchJson } from '../lib/http.ts';

/** Fallback prices when CoinGecko is unavailable — update in docs/API_INTEGRATION.md */
export const PRICE_FALLBACKS: Record<string, { price: number; change24h: number }> = {
  'frax-usd': { price: 1.0001, change24h: 0.01 },
  frax: { price: 2.45, change24h: -1.2 },
  'frax-share': { price: 2.84, change24h: -0.8 },
  aave: { price: 185, change24h: 1.5 },
  gho: { price: 1.0002, change24h: 0.02 },
  'curve-dao-token': { price: 0.42, change24h: 2.1 },
  'convex-finance': { price: 3.2, change24h: -0.5 },
  'f-x-protocol': { price: 12.3, change24h: -3.2 },
  crvusd: { price: 1.0003, change24h: 0.01 },
};

export function resolvePrice(cgId: string, row?: CoinGeckoPriceRow): { price: number; change24h: number } {
  if (row?.usd) return { price: row.usd, change24h: row.usd_24h_change ?? 0 };
  return PRICE_FALLBACKS[cgId] ?? { price: 0, change24h: 0 };
}

export async function fetchCoinGeckoPrices(): Promise<Record<string, CoinGeckoPriceRow>> {
  const url = API_ENDPOINTS.coingecko.simplePrice(COINGECKO_IDS);
  const data = await fetchJson<Record<string, CoinGeckoPriceRow>>(url);
  if (data && Object.keys(data).length > 0) return data;

  const out: Record<string, CoinGeckoPriceRow> = {};
  for (const t of WATCHLIST_TOKENS) {
    const row = await fetchJson<Record<string, CoinGeckoPriceRow>>(
      API_ENDPOINTS.coingecko.singlePrice(t.coingeckoId),
    );
    if (row?.[t.coingeckoId]) out[t.coingeckoId] = row[t.coingeckoId];
    await new Promise((r) => setTimeout(r, COINGECKO_RETRY_DELAY_MS));
  }
  return out;
}

export async function fetchTokenHistory(
  cgId: string,
  days: string,
): Promise<{ date: string; price: number; ts: number }[]> {
  const interval = days === '1' || days === '7' ? '' : '&interval=daily';
  const history = await fetchJson<{ prices?: [number, number][] }>(
    API_ENDPOINTS.coingecko.marketChart(cgId, days, interval),
  );
  if (!history?.prices?.length) return [];
  const isStable = cgId === 'frax-usd' || cgId === 'crvusd' || cgId === 'gho';
  return history.prices.map(([ts, price]) => ({
    ts,
    date: new Date(ts).toISOString().split('T')[0],
    price: +price.toFixed(isStable ? 4 : 6),
  }));
}
