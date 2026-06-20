/**
 * External API endpoint URLs.
 * Replace or extend these when plugging in your own data providers.
 *
 * @see docs/API_INTEGRATION.md
 */

export const API_ENDPOINTS = {
  /** DefiLlama — Curve pool TVL, APY, volume */
  defiLlama: {
    yields: 'https://yields.llama.fi/pools',
    stablecoins: 'https://stablecoins.llama.fi/stablecoins',
  },

  /** CoinGecko — token prices & chart history (free tier: 30 req/min) */
  coingecko: {
    base: 'https://api.coingecko.com/api/v3',
    simplePrice: (ids: string[]) =>
      `${API_ENDPOINTS.coingecko.base}/simple/price?ids=${ids.join(',')}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true&include_last_updated_at=true`,
    marketChart: (id: string, days: string, interval = '') =>
      `${API_ENDPOINTS.coingecko.base}/coins/${id}/market_chart?vs_currency=usd&days=${days}${interval}`,
    singlePrice: (id: string) =>
      `${API_ENDPOINTS.coingecko.base}/simple/price?ids=${id}&vs_currencies=usd&include_24hr_change=true`,
  },

  /**
   * Dune Analytics — PegKeeper pool data (requires API key)
   * Query ID from: https://dune.com/stablescarab/frax-frxusd-pegkeeper-pools
   * Set DUNE_API_KEY in .env and implement server/services/dune.ts
   */
  dune: {
    base: 'https://api.dune.com/api/v1',
    pegkeeperQueryId: '', // ← ADD YOUR DUNE QUERY ID HERE
  },
} as const;
