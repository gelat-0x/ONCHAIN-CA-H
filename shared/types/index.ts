/**
 * Shared TypeScript types — used by both client (src/) and server (server/).
 * Do not import React or browser-only APIs here.
 */

export interface PoolData {
  id: string;
  name: string;
  stablecoin?: string;
  partner: string;
  partnerInitials: string;
  partnerColor: string;
  description?: string;
  chain?: string;
  since?: string;
  tvl: number;
  apr: number;
  volume24h: number;
  /**
   * Amount of frxUSD in the Curve pool (sourced primarily from Dune).
   *
   * This value is currently written to both `frxUsdBalanceUsd` (preferred)
   * and `pegKeeperDebt` (for frontend compatibility).
   *
   * IMPORTANT: This represents the frxUSD balance in the pool,
   * not necessarily the "debt" figure from the PegKeeper contract.
   * The name `pegKeeperDebt` will be revisited once we have clearer data.
   */
  pegKeeperDebt: number;
  frxUsdBalanceUsd?: number;   // Preferred internal name
  pegDeviation: number[];
  status: 'ACTIVE' | 'ALERT';
  curveUrl: string;
}

export interface PartnerProtocol {
  protocol: string;
  pool: string;
  tvl: string;
  apr: string;
  chain: string;
  status: 'ACTIVE' | 'ALERT';
  since: string;
  description?: string;
}

export interface TickerItem {
  symbol: string;
  price: number;
  change: 'up' | 'down' | 'flat';
  change24h?: number;
  type?: 'stablecoin' | 'volatile' | 'governance' | 'metric';
}

export interface TokenMarketData {
  id: string;
  symbol: string;
  name: string;
  type: 'stablecoin' | 'volatile' | 'governance';
  color: string;
  price: number;
  change24h?: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated?: number;
  history?: Array<{ date: string; price: number }>;
}

export interface ChainDistribution {
  chain: string;
  percentage: number;
}

export type ChartRange = string;

export interface ChartsData {
  tokens: Record<string, TokenMarketData>;
  ticker: TickerItem[];
  lastUpdated: string;
  cached: boolean;
  dataSource: string;
}

export interface DashboardData {
  pools: PoolData[];
  partners: PartnerProtocol[];
  frxUsdPrice: number;
  pegHistory30d: number[];
  pegHistory90d: { date: string; price: number }[];
  chainDistribution: ChainDistribution[];
  totalTvl: number;
  totalFrxUsdInPools: number;
  totalVolume24h: number;
  activePools: number;
  partnerCount: number;
  marketCap: number;
  ticker: TickerItem[];
  cached?: boolean;
  dataSource: string;
  lastUpdated?: string;
}

/** DefiLlama yield pool shape (subset we care about) */
export interface DefiLlamaYieldPool {
  pool: string;
  symbol: string;
  project?: string;
  tvlUsd?: number;
  apy?: number;
  apyBase?: number;
  apyReward?: number;
  volumeUsd1d?: number;
}

/** DefiLlama stablecoin asset shape (subset) */
export interface DefiLlamaStablecoin {
  symbol: string;
  price: number;
  circulating: { peggedUSD: number };
  chainCirculating?: Record<string, { current?: { peggedUSD?: number } }>;
}

/** CoinGecko simple/price row */
export interface CoinGeckoPriceRow {
  usd?: number;
  usd_24h_change?: number;
  usd_market_cap?: number;
  usd_24h_vol?: number;
  last_updated_at?: number;
}

/**
 * Row shape returned by the dedicated ONCHAIN CA$H PegKeeper Dune query.
 */
export interface DunePegKeeperRow {
  pool_address: string;
  pool_name: string;
  stablecoin: string;
  total_tvl: number;
  frxusd_balance: number;
  volume_24h: number;
  last_updated: string; // ISO timestamp (recommended: to_iso8601(NOW()) from Dune)
}

/**
 * Result of fetching from Dune (can be partial/stale).
 */
export interface DunePegKeeperResult {
  rows: DunePegKeeperRow[];
  lastUpdated: Date | null;
  isStale: boolean;
  source: 'dune';
}
