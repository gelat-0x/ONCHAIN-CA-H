export type TokenType = 'stablecoin' | 'volatile' | 'governance';

export interface TokenDef {
  id: string;
  symbol: string;
  name: string;
  coingeckoId: string;
  type: TokenType;
  color: string;
  description: string;
  /** Logo filename key when different from symbol (e.g. FRAX not FXS). */
  logoSymbol?: string;
  /** Explicit asset filename in src/assets/tokens/ (without extension). */
  logoAsset?: string;
  /** Human CoinGecko URL slug (may differ from API id). */
  coingeckoPageSlug?: string;
  pegTarget?: number;
}

/**
 * Chart + ticker watchlist.
 * - frxUSD = Frax stablecoin (CoinGecko API: frax-usd)
 * - FRAX = Frax ecosystem token (CoinGecko page: /coins/frax — API id: frax-share, formerly FXS)
 */
export const WATCHLIST_TOKENS: TokenDef[] = [
  {
    id: 'frxusd',
    symbol: 'frxUSD',
    name: 'Frax USD',
    coingeckoId: 'frax-usd',
    type: 'stablecoin',
    color: '#ffffff',
    description: 'Frax stablecoin pegged to $1 — PegKeeper base asset.',
    pegTarget: 1,
  },
  {
    id: 'frax',
    symbol: 'FRAX',
    name: 'Frax',
    coingeckoId: 'frax-share',
    coingeckoPageSlug: 'frax',
    type: 'governance',
    color: '#ffffff',
    logoSymbol: 'FRAX',
    description: 'Frax ecosystem / governance token (CoinGecko: frax, API id frax-share).',
  },
  {
    id: 'btc',
    symbol: 'BTC',
    name: 'Bitcoin',
    coingeckoId: 'bitcoin',
    type: 'volatile',
    color: '#f7931a',
    description: 'Macro benchmark for crypto markets.',
  },
  {
    id: 'eth',
    symbol: 'ETH',
    name: 'Ethereum',
    coingeckoId: 'ethereum',
    type: 'volatile',
    color: '#627eea',
    description: 'Base layer where PegKeeper pools live.',
  },
  {
    id: 'sol',
    symbol: 'SOL',
    name: 'Solana',
    coingeckoId: 'solana',
    type: 'volatile',
    color: '#9945ff',
    logoAsset: 'SOL',
    description: 'High-throughput L1 benchmark.',
  },
  {
    id: 'crv',
    symbol: 'CRV',
    name: 'Curve DAO',
    coingeckoId: 'curve-dao-token',
    type: 'volatile',
    color: '#ff6b35',
    logoAsset: 'CRV',
    description: 'Curve governance — home of every PegKeeper pool.',
  },
  {
    id: 'cvx',
    symbol: 'CVX',
    name: 'Convex Finance',
    coingeckoId: 'convex-finance',
    type: 'volatile',
    color: '#3d5afe',
    logoAsset: 'CVX',
    description: 'Boosted Curve LP yields across the PegKeeper mesh.',
  },
  {
    id: 'aave',
    symbol: 'AAVE',
    name: 'Aave',
    coingeckoId: 'aave',
    type: 'volatile',
    color: '#b6509e',
    description: 'DeFi lending giant in the PegKeeper orbit.',
  },
  {
    id: 'fxn',
    symbol: 'FXN',
    name: 'f(x) Protocol',
    coingeckoId: 'f-x-protocol',
    type: 'volatile',
    color: '#4ecdc4',
    description: 'f(x) Protocol governance token.',
  },
];

/** Volatile/governance tokens for the price ticker (no stablecoins). */
export const TICKER_TOKENS = WATCHLIST_TOKENS.filter((t) => t.type !== 'stablecoin');

export const COINGECKO_IDS = [...new Set(WATCHLIST_TOKENS.map((t) => t.coingeckoId))];

export function tokenById(id: string): TokenDef | undefined {
  return WATCHLIST_TOKENS.find(
    (t) => t.id === id || t.coingeckoId === id || t.symbol.toLowerCase() === id.toLowerCase(),
  );
}

export function tokenByCoingeckoId(cgId: string): TokenDef | undefined {
  return WATCHLIST_TOKENS.find((t) => t.coingeckoId === cgId);
}

export function tokenBySymbol(symbol: string): TokenDef | undefined {
  return WATCHLIST_TOKENS.find((t) => t.symbol.toLowerCase() === symbol.toLowerCase());
}
