export type TokenType = 'stablecoin' | 'volatile' | 'governance';

export interface TokenDef {
  id: string;
  symbol: string;
  name: string;
  coingeckoId: string;
  type: TokenType;
  color: string;
  description: string;
  /** For stablecoins — show peg band on charts */
  pegTarget?: number;
}

/** Canonical watchlist — live prices via CoinGecko */
export const WATCHLIST_TOKENS: TokenDef[] = [
  {
    id: 'frxusd',
    symbol: 'frxUSD',
    name: 'Frax USD',
    coingeckoId: 'frax-usd',
    type: 'stablecoin',
    color: '#FFFFFF',
    pegTarget: 1,
    description: 'Fully-collateralized Frax stablecoin. The peg asset for all PegKeeper pools.',
  },
  {
    id: 'frax',
    symbol: 'FRAX',
    name: 'Frax Ecosystem',
    coingeckoId: 'frax',
    type: 'volatile',
    color: '#ffffff',
    description: 'Frax ecosystem token — volatile governance asset, not the stablecoin.',
  },
  {
    id: 'fxs',
    symbol: 'FXS',
    name: 'Frax Shares',
    coingeckoId: 'frax-share',
    type: 'governance',
    color: '#A3A3A3',
    description: 'Frax governance & revenue share token.',
  },
  {
    id: 'aave',
    symbol: 'AAVE',
    name: 'Aave',
    coingeckoId: 'aave',
    type: 'volatile',
    color: '#b6509e',
    description: 'Leading DeFi lending protocol — PegKeeper partner ecosystem.',
  },
  {
    id: 'gho',
    symbol: 'GHO',
    name: 'GHO',
    coingeckoId: 'gho',
    type: 'stablecoin',
    color: '#6c5ce7',
    pegTarget: 1,
    description: 'Aave-native decentralized stablecoin.',
  },
  {
    id: 'crv',
    symbol: 'CRV',
    name: 'Curve DAO',
    coingeckoId: 'curve-dao-token',
    type: 'volatile',
    color: '#ff6b35',
    description: 'Curve governance token — all PegKeeper pools live on Curve.',
  },
  {
    id: 'cvx',
    symbol: 'CVX',
    name: 'Convex Finance',
    coingeckoId: 'convex-finance',
    type: 'volatile',
    color: '#3d5afe',
    description: 'Convex boosts Curve LP yields across PegKeeper pools.',
  },
  {
    id: 'fxn',
    symbol: 'FXN',
    name: 'f(x) Protocol',
    coingeckoId: 'f-x-protocol',
    type: 'volatile',
    color: '#4ecdc4',
    description: 'f(x) Protocol governance — veFXN revenue & emissions.',
  },
  {
    id: 'crvusd',
    symbol: 'crvUSD',
    name: 'Curve USD',
    coingeckoId: 'crvusd',
    type: 'stablecoin',
    color: '#D4D4D4',
    pegTarget: 1,
    description: 'Curve-native stablecoin — largest PegKeeper partner pool.',
  },
];

export const COINGECKO_IDS = WATCHLIST_TOKENS.map((t) => t.coingeckoId);

export function tokenById(id: string): TokenDef | undefined {
  return WATCHLIST_TOKENS.find((t) => t.id === id || t.coingeckoId === id || t.symbol.toLowerCase() === id.toLowerCase());
}

export function tokenByCoingeckoId(cgId: string): TokenDef | undefined {
  return WATCHLIST_TOKENS.find((t) => t.coingeckoId === cgId);
}
