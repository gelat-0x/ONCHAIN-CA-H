/**
 * Directory of where frxUSD can earn.
 * Live APYs overlay these rows from /api/learn/frxusd-opportunities.
 * frxUSD only — sfrxUSD is excluded.
 */

import type {
  FrxUsdLpLane,
  FrxUsdOppCategory,
  FrxUsdOppFeatured,
  FrxUsdOppLive,
  FrxUsdOppRow,
} from '../types/index.ts';

export interface FrxUsdPlace {
  id: string;
  name: string;
  active: boolean;
}

export interface FrxUsdMarket {
  id: string;
  label: string;
  chain: string;
}

export type FrxUsdVaultKind = 'deposit' | 'compound';

export interface FrxUsdVenue {
  id: string;
  name: string;
  logo: string;
  category: FrxUsdOppCategory;
  lane?: FrxUsdLpLane;
  vaultKind?: FrxUsdVaultKind;
  pair: string;
  chains: string[];
  href: string;
  internal?: boolean;
  /** One simple line on the closed card. */
  hook: string;
  /** What you actually put in. */
  youDo: string;
  /** Why you earn, in plain words. */
  yieldFrom: string;
  /** Optional next step. */
  next?: string;
  /** Vault card glow. */
  accent?: string;
  /** Show in the main 4-card grid (vs Explore more). */
  primaryVault?: boolean;
  /** How expanded sheet lists markets. */
  marketsMode?: 'pairs' | 'chains' | 'hidden';
  fallbackApy: number;
  markets: FrxUsdMarket[];
  match: {
    projects: string[];
    chains?: string[];
    symbolIncludes?: string[];
    symbolExcludes?: string[];
    preferTvl?: number;
  };
}

/** Official live networks from docs.frax.com/frxusd/frxusd-contracts. */
export const FRXUSD_PLACES: FrxUsdPlace[] = [
  { id: 'ethereum', name: 'Ethereum', active: true },
  { id: 'fraxtal', name: 'Fraxtal', active: true },
  { id: 'polygon', name: 'Polygon', active: true },
  { id: 'base', name: 'Base', active: true },
  { id: 'solana', name: 'Solana', active: false },
  { id: 'arbitrum', name: 'Arbitrum', active: false },
  { id: 'optimism', name: 'Optimism', active: false },
  { id: 'avalanche', name: 'Avalanche', active: false },
  { id: 'bsc', name: 'BSC', active: false },
  { id: 'linea', name: 'Linea', active: false },
  { id: 'scroll', name: 'Scroll', active: false },
  { id: 'zksync', name: 'zkSync', active: false },
  { id: 'unichain', name: 'Unichain', active: false },
  { id: 'sonic', name: 'Sonic', active: false },
  { id: 'berachain', name: 'Berachain', active: false },
  { id: 'sei', name: 'Sei', active: false },
  { id: 'mode', name: 'Mode', active: false },
  { id: 'ink', name: 'Ink', active: false },
  { id: 'katana', name: 'Katana', active: false },
  { id: 'monad', name: 'Monad', active: false },
  { id: 'plume', name: 'Plume', active: false },
  { id: 'abstract', name: 'Abstract', active: false },
  { id: 'aurora', name: 'Aurora', active: false },
  { id: 'polygon-zkevm', name: 'Polygon zkEVM', active: false },
  { id: 'xlayer', name: 'X Layer', active: false },
  { id: 'stable', name: 'Stable', active: false },
  { id: 'worldchain', name: 'Worldchain', active: false },
  { id: 'blast', name: 'Blast', active: false },
  { id: 'hyperevm', name: 'HyperEVM', active: false },
  { id: 'aptos', name: 'Aptos', active: false },
  { id: 'movement', name: 'Movement', active: false },
];

export const FRXUSD_ACTIVE_PLACES = FRXUSD_PLACES.filter((p) => p.active);
export const FRXUSD_OTHER_PLACES = FRXUSD_PLACES.filter((p) => !p.active);

/** @deprecated use FRXUSD_PLACES */
export const FRXUSD_ECOSYSTEMS = FRXUSD_PLACES;

export const FRXUSD_LP_LANES: Array<{ id: FrxUsdLpLane; label: string; line: string }> = [
  { id: 'pegkeeper', label: 'Dollar pairs', line: 'frxUSD plus another dollar stablecoin' },
  { id: 'fx', label: 'Currency pairs', line: 'frxUSD plus won, real, pound, and more' },
  { id: 'amm', label: 'Other pairs', line: 'frxUSD plus bonds, IQ, or other tokens' },
  { id: 'compound', label: 'Auto-compound', line: 'Deposit your pair. The vault compounds rewards for you.' },
  { id: 'boost', label: 'Boost rewards', line: 'You already hold the pair. Stake it for extra rewards.' },
];

/** Main vault grid — four cards above Explore more. */
export const FRXUSD_PRIMARY_VAULT_IDS = ['aave', 'fraxlend', 'morpho', 'resupply'] as const;

export const FRXUSD_VENUES: FrxUsdVenue[] = [
  {
    id: 'aave',
    name: 'Aave V4',
    logo: 'aave',
    category: 'vault',
    primaryVault: true,
    vaultKind: 'deposit',
    pair: 'frxUSD',
    chains: ['Ethereum'],
    href: 'https://pro.aave.com/explore/token/FRXUSD?chain=1',
    hook: 'Deposit frxUSD. Borrowers pay you.',
    youDo: 'Deposit frxUSD into Aave.',
    yieldFrom: 'People who borrow frxUSD pay you interest.',
    marketsMode: 'hidden',
    accent: '#8b5cf6',
    fallbackApy: 5.5,
    markets: [
      { id: 'core', label: 'frxUSD · Core (Main, Gold, Forex)', chain: 'Ethereum' },
    ],
    match: { projects: ['aave-v4', 'aave'], chains: ['Ethereum'] },
  },
  {
    id: 'fraxlend',
    name: 'Fraxlend',
    logo: 'fraxlend',
    category: 'vault',
    primaryVault: true,
    vaultKind: 'deposit',
    pair: 'frxUSD',
    chains: ['Fraxtal', 'Ethereum'],
    href: 'https://frax.com/lend',
    hook: 'Lend frxUSD. Borrowers pay you.',
    youDo: 'Deposit frxUSD into Fraxlend.',
    yieldFrom: 'Borrowers pay you to use your frxUSD.',
    marketsMode: 'chains',
    accent: '#f4f4f5',
    fallbackApy: 5.3,
    markets: [
      { id: 'eth', label: 'frxUSD lending', chain: 'Ethereum' },
      { id: 'ft', label: 'frxUSD lending', chain: 'Fraxtal' },
    ],
    match: { projects: ['fraxlend'], preferTvl: 50_000 },
  },
  {
    id: 'morpho',
    name: 'Morpho',
    logo: 'morpho',
    category: 'vault',
    primaryVault: true,
    vaultKind: 'deposit',
    pair: 'frxUSD',
    chains: ['Ethereum'],
    href: 'https://app.morpho.org/ethereum/vault/0xCE13e39534082FCF8f13F6D84e6D95414D14271e/stake-dao-frxusd-v2',
    hook: 'One tap. The vault lends for you.',
    youDo: 'Deposit frxUSD into this Morpho vault.',
    yieldFrom: 'The vault lends your frxUSD and sends interest back to you.',
    marketsMode: 'hidden',
    accent: '#2470ff',
    fallbackApy: 3.58,
    markets: [{ id: 'sdv2', label: 'Stake DAO frxUSD v2', chain: 'Ethereum' }],
    match: { projects: ['morpho-blue', 'morpho'] },
  },
  {
    id: 'resupply',
    name: 'Resupply',
    logo: 'resupply',
    category: 'vault',
    primaryVault: true,
    vaultKind: 'deposit',
    pair: 'frxUSD',
    chains: ['Ethereum'],
    href: 'https://resupply.fi',
    hook: 'Lend frxUSD in one market.',
    youDo: 'Deposit frxUSD into Resupply.',
    yieldFrom: 'Borrowers pay you to use your frxUSD.',
    marketsMode: 'hidden',
    accent: '#38bdf8',
    fallbackApy: 3.63,
    markets: [{ id: 'rs', label: 'frxUSD lending', chain: 'Ethereum' }],
    match: { projects: ['resupply'] },
  },
  {
    id: 'concrete',
    name: 'Concrete',
    logo: 'concrete',
    category: 'vault',
    vaultKind: 'deposit',
    pair: 'frxUSD',
    chains: ['Ethereum'],
    href: 'https://app.concrete.xyz/vault/frax/frxusd',
    hook: 'One tap. The vault handles the rest.',
    youDo: 'Deposit frxUSD into the frxUSD+ vault.',
    yieldFrom: 'The vault deploys your frxUSD across curated strategies.',
    marketsMode: 'hidden',
    accent: '#ea580c',
    fallbackApy: 7.3,
    markets: [{ id: 'ct', label: 'frxUSD+ vault', chain: 'Ethereum' }],
    match: { projects: ['concrete'] },
  },
  {
    id: 'etherfi',
    name: 'ether.fi',
    logo: 'etherfi',
    category: 'vault',
    vaultKind: 'deposit',
    pair: 'frxUSD',
    chains: ['Optimism'],
    href: 'https://www.ether.fi/app/cash/earn',
    hook: 'Stake frxUSD in your ether.fi vault.',
    youDo: 'Deposit frxUSD through ether.fi Cash.',
    yieldFrom: 'Earn yield plus ether.fi membership rewards.',
    marketsMode: 'hidden',
    accent: '#6366f1',
    fallbackApy: 4.0,
    markets: [{ id: 'ef', label: 'frxUSD stake', chain: 'Optimism' }],
    match: { projects: ['etherfi', 'ether.fi'] },
  },
  {
    id: 'beefy',
    name: 'Beefy',
    logo: 'beefy',
    category: 'lp',
    lane: 'compound',
    pair: 'Curve LP vaults',
    chains: ['Ethereum', 'Fraxtal'],
    href: 'https://app.beefy.com',
    hook: 'Curve pair on Beefy',
    youDo: 'Deposit a Curve pair that includes frxUSD.',
    yieldFrom: 'Beefy compounds swap fees and rewards back into your pair.',
    accent: '#fbbf24',
    fallbackApy: 19.58,
    markets: [
      { id: 'bf-ms', label: 'msUSD / frxUSD', chain: 'Ethereum' },
      { id: 'bf-pm', label: 'pmUSD / frxUSD', chain: 'Ethereum' },
      { id: 'bf-fxb', label: 'frxUSD / FXB 2055', chain: 'Fraxtal' },
    ],
    match: { projects: ['beefy'] },
  },
  {
    id: 'yearn',
    name: 'Yearn',
    logo: 'yearn',
    category: 'lp',
    lane: 'compound',
    pair: 'Curve LP vaults',
    chains: ['Ethereum'],
    href: 'https://yearn.fi',
    hook: 'Curve pair on Yearn',
    youDo: 'Deposit a Curve pair that includes frxUSD.',
    yieldFrom: 'Yearn compounds swap fees and rewards back into your pair.',
    accent: '#006ae3',
    fallbackApy: 32.83,
    markets: [
      { id: 'yn-dusd', label: 'frxUSD / DUSD', chain: 'Ethereum' },
      { id: 'yn-pm', label: 'pmUSD / frxUSD', chain: 'Ethereum' },
      { id: 'yn-crv', label: 'crvUSD / frxUSD', chain: 'Ethereum' },
    ],
    match: { projects: ['yearn-finance'] },
  },
  {
    id: 'pegkeeper',
    name: 'Curve PegKeeper',
    logo: 'curve',
    category: 'lp',
    lane: 'pegkeeper',
    pair: 'frxUSD plus another dollar',
    chains: ['Ethereum'],
    href: '/pegkeeper',
    internal: true,
    hook: 'frxUSD plus a partner dollar',
    youDo: 'Add frxUSD and a partner dollar stablecoin — like DUSD or crvUSD.',
    yieldFrom: 'Swap fees plus Curve rewards on your frxUSD pair.',
    next: 'Next step: stake the pair on Stake DAO for a boost.',
    accent: '#2ef497',
    fallbackApy: 24.8,
    markets: [{ id: 'pk', label: '30 pairs vs frxUSD', chain: 'Ethereum' }],
    match: { projects: ['stake-dao-yield', 'curve-dex'], chains: ['Ethereum'], preferTvl: 200_000 },
  },
  {
    id: 'fx',
    name: 'Curve FXSwap',
    logo: 'curve',
    category: 'lp',
    lane: 'fx',
    pair: 'FX / frxUSD',
    chains: ['Polygon', 'Ethereum'],
    href: 'https://www.curve.finance',
    hook: 'frxUSD plus a foreign currency',
    youDo: 'Add frxUSD and a currency like Korean won or Brazilian real.',
    yieldFrom: 'Swap fees and rewards on your frxUSD pair.',
    accent: '#2ef497',
    fallbackApy: 48.89,
    markets: [
      { id: 'krwq', label: 'KRWQ / frxUSD', chain: 'Polygon' },
      { id: 'zarp', label: 'ZARP / frxUSD', chain: 'Polygon' },
      { id: 'brz', label: 'BRZ / frxUSD', chain: 'Polygon' },
      { id: 'audf', label: 'AUDF / frxUSD', chain: 'Polygon' },
      { id: 'tgbp', label: 'tGBP / frxUSD', chain: 'Polygon' },
      { id: 'idrx', label: 'IDRX / frxUSD', chain: 'Polygon' },
    ],
    match: { projects: ['curve-dex'], chains: ['Polygon'] },
  },
  {
    id: 'curve-fxb',
    name: 'Curve FXB',
    logo: 'curve',
    category: 'lp',
    lane: 'amm',
    pair: 'frxUSD / FXB',
    chains: ['Fraxtal'],
    href: 'https://www.curve.finance',
    hook: 'frxUSD plus a Frax bond',
    youDo: 'Add frxUSD and a Frax Bond on Fraxtal Curve.',
    yieldFrom: 'Swap fees and rewards on your frxUSD pair.',
    accent: '#2ef497',
    fallbackApy: 22.9,
    markets: [
      { id: 'fxb26', label: 'frxUSD / FXB 2026', chain: 'Fraxtal' },
      { id: 'fxb27', label: 'frxUSD / FXB 2027', chain: 'Fraxtal' },
      { id: 'fxb29', label: 'frxUSD / FXB 2029', chain: 'Fraxtal' },
      { id: 'fxb55', label: 'frxUSD / FXB 2055', chain: 'Fraxtal' },
    ],
    match: { projects: ['curve-dex', 'stake-dao-yield'], chains: ['Fraxtal'], symbolIncludes: ['fxb'] },
  },
  {
    id: 'curve-ft',
    name: 'Curve IQ',
    logo: 'curve',
    category: 'lp',
    lane: 'amm',
    pair: 'IQ / frxUSD',
    chains: ['Fraxtal'],
    href: 'https://www.curve.finance',
    hook: 'IQ plus frxUSD',
    youDo: 'Add IQ and frxUSD on Fraxtal Curve.',
    yieldFrom: 'Swap fees and rewards on your frxUSD pair.',
    accent: '#2ef497',
    fallbackApy: 0,
    markets: [{ id: 'iq', label: 'IQ / frxUSD', chain: 'Fraxtal' }],
    match: {
      projects: ['curve-dex', 'stake-dao-yield'],
      chains: ['Fraxtal'],
      symbolExcludes: ['fxb'],
    },
  },
  {
    id: 'uniswap',
    name: 'Uniswap v4',
    logo: 'uniswap',
    category: 'lp',
    lane: 'amm',
    pair: 'USDC / frxUSD',
    chains: ['Ethereum'],
    href: 'https://app.uniswap.org',
    hook: 'USDC plus frxUSD',
    youDo: 'Add USDC and frxUSD on Uniswap.',
    yieldFrom: 'Swap fees from people trading against your frxUSD.',
    accent: '#ff007a',
    fallbackApy: 5.56,
    markets: [{ id: 'uni', label: 'USDC / frxUSD', chain: 'Ethereum' }],
    match: { projects: ['uniswap-v4', 'uniswap'] },
  },
  {
    id: 'aerodrome',
    name: 'Aerodrome',
    logo: 'aerodrome',
    category: 'lp',
    lane: 'amm',
    pair: 'frxUSD on Base',
    chains: ['Base'],
    href: 'https://aerodrome.finance',
    hook: 'frxUSD plus another token on Base',
    youDo: 'Add frxUSD and another token on Aerodrome.',
    yieldFrom: 'Swap fees plus AERO rewards on your frxUSD pair.',
    accent: '#0052ff',
    fallbackApy: 5.59,
    markets: [
      { id: 'a-usdc', label: 'USDC / frxUSD', chain: 'Base' },
      { id: 'a-idrx', label: 'IDRX / frxUSD', chain: 'Base' },
      { id: 'a-tgbp', label: 'tGBP / frxUSD', chain: 'Base' },
      { id: 'a-eusd', label: 'eUSD / frxUSD', chain: 'Base' },
    ],
    match: { projects: ['aerodrome-slipstream', 'aerodrome-v1', 'aerodrome'], chains: ['Base'], preferTvl: 50_000 },
  },
  {
    id: 'fraxswap',
    name: 'Fraxswap',
    logo: 'fraxswap',
    category: 'lp',
    lane: 'amm',
    pair: 'WFRAX / frxUSD',
    chains: ['Ethereum'],
    href: 'https://app.frax.finance',
    hook: 'WFRAX plus frxUSD',
    youDo: 'Add WFRAX and frxUSD on Fraxswap.',
    yieldFrom: 'Swap fees on your frxUSD pair.',
    fallbackApy: 0,
    markets: [{ id: 'fs', label: 'WFRAX / frxUSD', chain: 'Ethereum' }],
    match: { projects: ['fraxswap'] },
  },
  {
    id: 'stakedao',
    name: 'Stake DAO',
    logo: 'stakedao',
    category: 'lp',
    lane: 'boost',
    pair: 'frxUSD Curve LPs',
    chains: ['Ethereum', 'Fraxtal'],
    href: 'https://www.stakedao.org/yield?tokenFilter=usd&search=frxUSD',
    hook: 'Stake your frxUSD Curve pair',
    youDo: 'Stake a Curve pair that includes frxUSD.',
    yieldFrom: 'Extra CRV rewards on top of your pool rate.',
    accent: '#e2e8f0',
    fallbackApy: 24.8,
    markets: [
      { id: 'sd-eth', label: 'Ethereum strategies', chain: 'Ethereum' },
      { id: 'sd-ft', label: 'Fraxtal strategies', chain: 'Fraxtal' },
    ],
    match: { projects: ['stake-dao-yield'] },
  },
  {
    id: 'convex',
    name: 'Convex',
    logo: 'convex',
    category: 'lp',
    lane: 'boost',
    pair: 'frxUSD Curve LPs',
    chains: ['Ethereum'],
    href: 'https://www.convexfinance.com',
    hook: 'Stake your frxUSD Curve pair',
    youDo: 'Stake a Curve pair that includes frxUSD on Convex.',
    yieldFrom: 'Extra CRV and CVX on top of your pool rate.',
    accent: '#3b82f6',
    fallbackApy: 27.44,
    markets: [{ id: 'cvx', label: 'frxUSD Curve LPs', chain: 'Ethereum' }],
    match: { projects: ['convex-finance'] },
  },
];

export const FRXUSD_FEATURED_IDS = ['aave', 'pegkeeper', 'fraxlend', 'morpho', 'fx'] as const;

export const FRXUSD_CATEGORY_LABEL: Record<FrxUsdOppCategory, string> = {
  vault: 'Vaults',
  lp: 'LP',
};

export function venueById(id: string): FrxUsdVenue | undefined {
  return FRXUSD_VENUES.find((v) => v.id === id);
}

export function hasFrxUsdSymbol(symbol: string): boolean {
  return symbol.toLowerCase().replace(/sfrxusd/g, '').includes('frxusd');
}

export function prettyFrxUsdPair(symbol: string): string {
  let s = symbol.replace(/fxb[-_/\s]*(\d{4})\d*/gi, 'FXB $1');
  s = s.replace(/[-_]/g, ' / ');
  s = s.replace(/sfrxusd/gi, 'sfrxUSD').replace(/frxusd/gi, 'frxUSD');
  if (!s.includes('/') && /frxUSD/i.test(s) && s.replace(/frxUSD/gi, '').length > 1) {
    s = s.replace(/frxUSD/i, 'frxUSD / ');
  }
  return s.replace(/\s+/g, ' ').replace(/\/\s*\//g, '/').trim();
}

const DOOR_BY_VENUE: Record<string, FrxUsdOppRow['door']> = {
  aave: 'lend',
  fraxlend: 'lend',
  resupply: 'lend',
  morpho: 'vault',
  concrete: 'vault',
  etherfi: 'vault',
  pegkeeper: 'peg',
  uniswap: 'peg',
  fx: 'fx',
  aerodrome: 'fx',
  'curve-fxb': 'fx',
  'curve-ft': 'fx',
  beefy: 'boost',
  yearn: 'boost',
  stakedao: 'boost',
  convex: 'boost',
};

function venueToRow(v: FrxUsdVenue): FrxUsdOppRow {
  return {
    id: v.id,
    venue: v.logo,
    category: v.category,
    lane: v.lane,
    door: DOOR_BY_VENUE[v.id],
    group: v.name,
    name: v.name,
    pair: v.pair,
    chain: v.chains[0] ?? 'Ethereum',
    chains: v.chains,
    apy: v.fallbackApy,
    happens: v.yieldFrom,
    youDo: v.youDo,
    href: v.href,
    internal: v.internal,
  };
}

function venueToFeatured(v: FrxUsdVenue): FrxUsdOppFeatured {
  return {
    id: v.id,
    venue: v.logo,
    name: v.name,
    pair: v.pair,
    chain: v.chains[0] ?? 'Ethereum',
    chains: v.chains,
    apy: v.fallbackApy,
    note: v.hook,
    href: v.href,
    internal: v.internal,
  };
}

export function fallbackOpportunityLive(): FrxUsdOppLive {
  const rows = FRXUSD_VENUES.map(venueToRow).filter((r) => r.apy > 0);
  const featured = FRXUSD_FEATURED_IDS.map((id) => {
    const v = FRXUSD_VENUES.find((x) => x.id === id)!;
    return venueToFeatured(v);
  });
  const stake = FRXUSD_VENUES.find((v) => v.id === 'stakedao');
  return {
    liveCount: 118,
    averageApy: 7.8,
    ecosystems: FRXUSD_PLACES.length,
    featured,
    rows,
    stakeDao: {
      count: 58,
      pools: stake ? [{ ...venueToRow(stake), pair: 'frxUSD Curve LPs', apy: 24.8 }] : [],
    },
    updatedAt: new Date().toISOString(),
  };
}
