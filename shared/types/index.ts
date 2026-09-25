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
   * Amount of frxUSD in the Curve pool.
   *
   * @deprecated Legacy compatibility field. Do not display as PegKeeper debt.
   * Prefer `frxUsdBalanceUsd` for UI.
   */
  pegKeeperDebt: number;
  /** Current USD value of the frxUSD side reported by Curve (or explicit onchain RPC). */
  frxUsdBalanceUsd?: number;
  /** Current frxUSD-side value divided by the complete Curve pool TVL. */
  frxUsdSharePct?: number;
  /** Identifies the live source used for pool composition. */
  frxUsdBalanceSource?: 'curve' | 'onchain-rpc';
  pegDeviation: number[];
  /** 7-day TVL trend ending at current `tvl`. */
  tvlHistory7d: number[];
  /** Timestamped TVL series for charts (7d). */
  tvlHistorySeries?: Array<{ ts: number; value: number }>;
  /**
   * Stake DAO boosted APR — the max-boost yield available to LP stakers who
   * stake their Curve LP at Stake DAO. Higher than the base pool `apr`.
   * Present only when a matching Stake DAO strategy was found.
   */
  boostedApr?: number;
  /** Realized/projected staked APR (boost applied at current stake). */
  stakedApr?: number;
  /**
   * Curve total APR — APR-equivalent of curve.finance Total APY at max boost
   * (Base APY + daily-compounded CRV max + extras, then APY→APR).
   * Sits beside base `apr` (fees only) and `stakeDaoApr` / `boostedApr` (Stake DAO).
   */
  rewardsApr?: number;
  /**
   * Curve total APY — matches curve.finance Total APY (base + WFRAX/CHIP/etc.).
   * Prefer for card/modal display when Stake DAO is not the headline source.
   */
  rewardsApy?: number;
  /** Stake DAO Only Boost is active — deposits may be split to Convex for optimal boost. */
  onlyBoost?: boolean;
  /** Direct link to the matching Stake DAO Curve strategy page. */
  stakeDaoUrl?: string;
  /** Headline Stake DAO APR for cards — realized Strategy APR (`apr.current.total`). */
  stakeDaoApr?: number;
  /** Stake DAO max-boost APR (upper bound shown in explore modal). */
  stakeDaoMaxApr?: number;
  /** True when APR/link come from a matched Stake DAO v2 strategy (not estimated). */
  stakeDaoVerified?: boolean;
  /** Convex pool id from Stake DAO `sidecarPool.id` (Only Boost Convex leg). */
  convexPoolId?: number;
  /** Convex stake URL — venue link only, no Convex APR on the card. */
  convexUrl?: string;
  /** 7-day TVL change % from live history series (undefined when history is flat fallback). */
  tvlChange7dPct?: number;
  /** True when `tvlHistory7d` came from DefiLlama chart data (not a flat current-TVL fill). */
  tvlHistoryLive?: boolean;
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
  logoSymbol?: string;
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
  history?: Array<{ date: string; price: number; ts?: number }>;
}

export interface ChainDistribution {
  chain: string;
  percentage: number;
}

export type ChartRange = '5m' | '1' | '7' | '30' | 'max';

export interface ChartHistoryResponse {
  token: TokenMarketData;
  range: ChartRange;
  lastUpdated: string;
  live: boolean;
  cached?: boolean;
}

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

export interface ShowHost {
  name: string;
  handle: string;
  url: string;
}

export interface ShowSegment {
  name: string;
  description: string;
  /** Optional profile / deep link (e.g. CharmanderX81 on X). */
  url?: string;
  /** Visible link label when `url` is set (e.g. "X / CharmanderX81"). */
  linkLabel?: string;
}

export interface ShowEpisode {
  videoId: string;
  title: string;
  publishedAt: string;
  description: string;
  thumbnailUrl: string;
  watchUrl: string;
  embedUrl: string;
}

export interface ShowData {
  channelId: string;
  channelUrl: string;
  liveEmbedUrl: string;
  schedule: {
    weekdayUtc: number;
    hourUtc: number;
    minuteUtc: number;
    liveWindowMinutes: number;
  };
  hosts: ShowHost[];
  segments: ShowSegment[];
  episodes: ShowEpisode[];
  source: 'youtube-rss';
  lastUpdated: string;
  cached: boolean;
  error?: 'fetch_failed' | 'empty_feed';
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

/** A normalized chart point ready for frontend rendering. */
export interface ChartPoint {
  ts: number;
  value: number;
}

/** Live headline metric for protocol analysis cards. */
export interface ProtocolHeadlineMetric {
  key: string;
  label: string;
  value: number | null;
  /** Percent change when provided by DefiLlama (e.g. TVL change_1d). */
  changePct?: number | null;
}

/** Per-chain TVL snapshot from DefiLlama. */
export interface ProtocolChainTvl {
  chain: string;
  tvl: number;
}

/** Full protocol analysis from DefiLlama (TVL, fees, revenue, optional volume). */
export interface DefiLlamaProtocolAnalysis {
  slug: string;
  name: string;
  category: string;
  description?: string;
  url: string;
  chains: string[];
  headlines: ProtocolHeadlineMetric[];
  chainTvl: ProtocolChainTvl[];
  series: {
    tvl: ChartPoint[];
    fees: ChartPoint[];
    revenue: ChartPoint[];
    holdersRevenue?: ChartPoint[];
    volume?: ChartPoint[];
  };
  source: string;
}

/** @deprecated Use DefiLlamaProtocolAnalysis */
export type FraxProtocolAnalysis = DefiLlamaProtocolAnalysis;

/** Mint/redeem volume for a single collateral route (USDC, BUIDL, …). */
export interface FrxUsdRouteVolume {
  id: string;
  asset: string;
  issuer: string;
  custodianAddress: string;
  mint24h: number;
  redeem24h: number;
  mint7d: number;
  redeem7d: number;
  mint30d: number;
  redeem30d: number;
}

/** frxUSD supply on a specific chain (cross-chain mint destination). */
export interface FrxUsdChainSupply {
  chain: string;
  circulating: number;
  sharePct: number;
}

/** Recent on-chain mint or redeem event. */
export interface FrxUsdMintRedeemEvent {
  id: string;
  ts: number;
  type: 'mint' | 'redeem';
  routeId: string;
  asset: string;
  amountUsd: number;
  txHash: string;
}

/** Daily mint vs redeem derived from circulating-supply changes. */
export interface FrxUsdMintRedeemDay {
  ts: number;
  mint: number;
  redeem: number;
  net: number;
  supply: number;
}

/** Full frxUSD mint/redeem overview for the Dashboard protocol tab. */
export interface FrxUsdMintRedeemData {
  circulating: number;
  mint24h: number;
  redeem24h: number;
  net24h: number;
  mint7d: number;
  redeem7d: number;
  net7d: number;
  routes: FrxUsdRouteVolume[];
  chainSupply: FrxUsdChainSupply[];
  daily: FrxUsdMintRedeemDay[];
  recentEvents: FrxUsdMintRedeemEvent[];
  source: string;
  docsUrl: string;
}

/** Protocol-level chart payload returned by GET /api/charts/protocol. */
export interface ProtocolChartsData {
  familyTvl: { label: string; source: string; points: ChartPoint[] };
  frxUsdSupply: { label: string; source: string; points: ChartPoint[] };
  /** Frax, Aave, Curve — full DefiLlama protocol blocks. */
  protocolAnalyses: DefiLlamaProtocolAnalysis[];
  frxUsdMintRedeem: FrxUsdMintRedeemData | null;
  lastUpdated: string;
  cached: boolean;
  dataSource: string;
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

/** News feed categories for the News page filter chips. */
export type NewsCategory = 'defi' | 'stablecoin' | 'rwa' | 'frax' | 'regulatory' | 'general';

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: string;
  /** ISO 8601 timestamp */
  publishedAt: string;
  summary?: string;
  imageUrl?: string;
  categories: NewsCategory[];
  /** Best single category for filter chips. */
  primaryCategory: NewsCategory;
}

export interface NewsResponse {
  items: NewsItem[];
  sources: string[];
  lastUpdated: string;
  cached: boolean;
  /** Set when the aggregator could not reach any live source. */
  error?: 'fetch_failed' | 'empty';
}

export interface XPost {
  id: string;
  text: string;
  url: string;
  publishedAt: string;
  authorHandle: string;
  imageUrl?: string;
  categories?: NewsCategory[];
  primaryCategory?: NewsCategory;
}

export interface XTimelineResponse {
  posts: XPost[];
  account: string;
  lastUpdated: string;
  cached: boolean;
  error?: 'fetch_failed' | 'empty';
}
