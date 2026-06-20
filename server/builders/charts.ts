import type { ChartsData, ChartRange, TokenMarketData } from '../../shared/types/index.ts';
import { DUNE_BASELINE } from '../../shared/data/poolRegistry.ts';
import { WATCHLIST_TOKENS } from '../../shared/data/tokenCatalog.ts';
import { generateSyntheticHistory } from '../lib/helpers.ts';
import { fetchCoinGeckoPrices, fetchTokenHistory, resolvePrice } from '../services/coingecko.ts';
import { buildTickerOnly } from './ticker.ts';

export async function buildChartsData(range: ChartRange = '30'): Promise<ChartsData> {
  const cg = await fetchCoinGeckoPrices();
  const tokens: Record<string, TokenMarketData> = {};

  await Promise.all(
    WATCHLIST_TOKENS.map(async (t) => {
      const row = cg[t.coingeckoId];
      const { price, change24h } = resolvePrice(t.coingeckoId, row);
      const history = await fetchTokenHistory(t.coingeckoId, range);
      const hist = history.length ? history : generateSyntheticHistory(price, range, t.type === 'stablecoin');
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
        history: hist,
      };
    }),
  );

  const frxPrice = tokens.frxusd?.price ?? 1.0001;
  const live = Object.values(cg).some((r) => r?.usd);

  return {
    tokens,
    ticker: buildTickerOnly(cg, DUNE_BASELINE.totalPoolTvl, frxPrice),
    lastUpdated: new Date().toISOString(),
    cached: false,
    dataSource: live ? 'CoinGecko live API' : 'CoinGecko offline — showing cached fallbacks',
  };
}
