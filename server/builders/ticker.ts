import type { CoinGeckoPriceRow, TickerItem } from '../../shared/types/index.ts';
import { WATCHLIST_TOKENS } from '../../shared/data/tokenCatalog.ts';
import { changeDirection, stablePegDirection } from '../lib/helpers.ts';
import { resolvePrice } from '../services/coingecko.ts';

export function buildTickerOnly(
  cg: Record<string, CoinGeckoPriceRow>,
  totalTvl: number,
  frxPrice: number,
): TickerItem[] {
  const items: TickerItem[] = WATCHLIST_TOKENS.map((t) => {
    const row = cg[t.coingeckoId];
    const { price, change24h } = resolvePrice(t.coingeckoId, row);
    const p = row?.usd ?? (t.symbol === 'frxUSD' ? frxPrice : price);
    return {
      symbol: t.symbol,
      price: +p.toFixed(t.type === 'stablecoin' ? 4 : p < 1 ? 4 : 2),
      change: t.type === 'stablecoin' ? stablePegDirection(p, t.pegTarget ?? 1) : changeDirection(change24h),
      change24h: +change24h.toFixed(2),
      type: t.type,
    };
  });
  items.push({ symbol: 'TVL', price: Math.round(totalTvl), change: 'up', type: 'metric' });
  return items;
}
