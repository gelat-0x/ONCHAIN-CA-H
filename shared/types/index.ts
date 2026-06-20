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
  pegKeeperDebt: number;
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
  change24h: number;
  marketCap?: number;
  volume24h?: number;
  lastUpdated?: number;
  history: { date: string; price: number; ts: number }[];
}

export interface ChartsData {
  tokens: Record<string, TokenMarketData>;
  ticker: TickerItem[];
  lastUpdated: string;
  cached: boolean;
  dataSource: string;
}

export type ChartRange = '1' | '7' | '30' | '90' | '365';

export interface ChainDistribution {
  chain: string;
  percentage: number;
}

export interface DashboardData {
  pools: PoolData[];
  partners: PartnerProtocol[];
  frxUsdPrice: number;
  pegHistory30d: number[];
  pegHistory90d: { date: string; price: number }[];
  chainDistribution: ChainDistribution[];
  totalTvl: number;
  totalFrxUsdInPools?: number;
  totalVolume24h: number;
  activePools: number;
  partnerCount: number;
  marketCap: number;
  ticker: TickerItem[];
  cached: boolean;
  dataSource?: string;
  lastUpdated?: string;
}

/** DefiLlama yields pool shape (subset) */
export interface DefiLlamaYieldPool {
  pool: string;
  project: string;
  chain: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
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
