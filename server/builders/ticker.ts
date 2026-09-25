import type { CoinGeckoPriceRow, TickerItem } from '../../shared/types/index.ts';
import { TICKER_TOKENS } from '../../shared/data/tokenCatalog.ts';
import { changeDirection } from '../lib/helpers.ts';
import { resolvePrice } from '../services/coingecko.ts';

/** Build price ticker — volatile/governance tokens only (no frxUSD stablecoin). */
export function buildTickerOnly(
  cg: Record<string, CoinGeckoPriceRow>,
  _totalTvl: number,
  _frxPrice: number,
): TickerItem[] {
  return TICKER_TOKENS.map((t) => {
    const row = cg[t.coingeckoId];
    const { price, change24h } = resolvePrice(t.coingeckoId, row);
    const p = price;
    const decimals = t.type === 'stablecoin' ? 4 : p >= 100 ? 0 : p >= 1 ? 2 : 4;
    return {
      symbol: t.symbol,
      logoSymbol: t.logoSymbol ?? t.symbol,
      price: +p.toFixed(decimals),
      change: changeDirection(change24h),
      change24h: +change24h.toFixed(2),
      type: t.type,
    };
  });
}
