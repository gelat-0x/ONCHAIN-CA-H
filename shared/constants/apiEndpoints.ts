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
    stablecoinChart: (id: string) =>
      `https://stablecoins.llama.fi/stablecoincharts/all?stablecoin=${id}`,
    stablecoinDetail: (id: string) => `https://stablecoins.llama.fi/stablecoin/${id}`,
    protocol: (slug: string) => `https://api.llama.fi/protocol/${slug}`,
    protocolTvl: (slug: string) => `https://api.llama.fi/tvl/${slug}`,
    feesSummary: (slug: string, dataType = 'dailyFees') =>
      `https://api.llama.fi/summary/fees/${slug}?dataType=${dataType}`,
    dexVolumeSummary: (slug: string, dataType = 'dailyVolume') =>
      `https://api.llama.fi/summary/dexs/${slug}?dataType=${dataType}`,
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
   * Dune Analytics — PegKeeper pool data (scheduled query)
   *
   * IMPORTANT (v1 strategy):
   * - The query is scheduled to run every ~3 hours *inside Dune*.
   * - Backend only calls the /results endpoint (no execution from server).
   * - Data older than ~4h is treated as stale.
   *
   * Expected columns from the query:
   *   pool_address | pool_name | stablecoin | total_tvl | frxusd_balance | volume_24h | last_updated
   */
  dune: {
    base: 'https://api.dune.com/api/v1',
    pegkeeperQueryId: '7767958', // ← Paste your scheduled query ID here
  },

  /**
   * Stake DAO — Curve gauge strategies v2 (boosted APY for LP stakers).
   * Payload includes `coins`, `gaugeAddress`, `maxApr`, `apr.current`,
   * `onlyboost` (Convex routing), and `sidecarPool.id` for Convex stake URLs.
   * https://github.com/stake-dao/api
   */
  stakeDao: {
    curveStrategies: (chainId = 1) =>
      `https://api.stakedao.org/api/strategies/v2/curve/${chainId}.json`,
  },
} as const;

// For the first crvusd validation query, use these default parameters in Dune:
// pool_addresses = 0x13e12BB0E6A2f1A3d6901a59a9d585e89A6243e1
// frxusd_token   = 0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29
