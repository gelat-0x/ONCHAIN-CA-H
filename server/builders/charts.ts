import type { ChartsData, TokenMarketData, ChartHistoryResponse } from '../../shared/types/index.ts';
import { DUNE_BASELINE } from '../../shared/data/poolRegistry.ts';
import { WATCHLIST_TOKENS, tokenById } from '../../shared/data/tokenCatalog.ts';
import type { ChartRangeId } from '../../shared/constants/chartRanges.ts';
import {
  fetchCoinGeckoPrices,
  fetchTokenHistory,
  getCachedTokenHistory,
  resolvePrice,
} from '../services/coingecko.ts';
import { sliceHistoryForRange } from '../lib/chartRangeParams.ts';
import { buildTickerOnly } from './ticker.ts';

export type { ChartHistoryResponse };

/** Fast watchlist — live prices + ticker, no histories (loaded per token). */
export async function buildChartsWatchlist(): Promise<ChartsData> {
  const cg = await fetchCoinGeckoPrices();
  const tokens: Record<string, TokenMarketData> = {};

  for (const t of WATCHLIST_TOKENS) {
    const row = cg[t.coingeckoId];
    const { price, change24h } = resolvePrice(t.coingeckoId, row);
    tokens[t.id] = {
      id: t.id,
      symbol: t.symbol,
      name: t.name,
      type: t.type,
      color: t.color,
      price,
      change24h: +change24h.toFixed(2),
      marketCap: row?.usd_market_cap,
      volume24h: row?.usd_24h_vol,
      lastUpdated: row?.last_updated_at,
      history: [],
    };
  }

  const frxPrice = tokens.frxusd?.price ?? cg['frax-usd']?.usd ?? 1.0001;
  const live = Object.values(cg).some((r) => r?.usd);

  return {
    tokens,
    ticker: buildTickerOnly(cg, DUNE_BASELINE.totalPoolTvl, frxPrice),
    lastUpdated: new Date().toISOString(),
    cached: false,
    dataSource: live ? 'live' : 'cached',
  };
}

/** Single-token OHLC-style history from CoinGecko (live, cached server-side). */
export async function buildTokenChartHistory(
  tokenId: string,
  range: ChartRangeId,
): Promise<ChartHistoryResponse | null> {
  const def = tokenById(tokenId);
  if (!def) return null;

  const cg = await fetchCoinGeckoPrices();
  const row = cg[def.coingeckoId];
  const { price, change24h } = resolvePrice(def.coingeckoId, row);

  let history = await fetchTokenHistory(def.coingeckoId, range);
  const live = history.length >= 2;
  if (!live) {
    history = getCachedTokenHistory(def.coingeckoId, range) ?? [];
  }

  const sliced = sliceHistoryForRange(
    history.map((h) => ({ date: h.date, price: h.price, ts: h.ts })),
    range,
  );

  const token: TokenMarketData = {
    id: def.id,
    symbol: def.symbol,
    name: def.name,
    type: def.type,
    color: def.color,
    price,
    change24h: +change24h.toFixed(2),
    marketCap: row?.usd_market_cap,
    volume24h: row?.usd_24h_vol,
    lastUpdated: row?.last_updated_at,
    history: sliced,
  };

  return {
    token,
    range,
    lastUpdated: new Date().toISOString(),
    live: sliced.length >= 2,
  };
}

/** @deprecated Use watchlist + /history/:id — kept for backwards compat. */
export async function buildChartsData(range: ChartRangeId = '30'): Promise<ChartsData> {
  const base = await buildChartsWatchlist();
  for (const t of WATCHLIST_TOKENS) {
    const hist = await buildTokenChartHistory(t.id, range);
    if (hist?.token.history?.length) {
      base.tokens[t.id] = hist.token;
    }
  }
  return base;
}
