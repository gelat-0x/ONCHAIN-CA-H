import type { NewsCategory } from '../types/index.ts';

export type NewsFilter = 'all' | NewsCategory;

export const LATEST_X_TAB = '__latest__';

export const CATEGORY_LABELS: Record<NewsCategory, string> = {
  frax: 'Frax',
  stablecoin: 'Stablecoin',
  regulatory: 'Regulatory',
  defi: 'DeFi',
  rwa: 'RWA',
  general: 'General',
};

export interface XNewsAccount {
  handle: string;
  displayName: string;
  categories: NewsCategory[];
  accentColor?: string;
  initials?: string;
  /** Bundled token logo symbol (FRAX, CRV, AAVE, …). */
  logoSymbol?: string;
}

/** Logo-first accounts shown in the X sidebar (Frax, Curve, Aave). */
export const X_FEATURED_HANDLES = ['fraxfinance', 'CurveFinance', 'AaveAave'] as const;

export const X_NEWS_ACCOUNTS: XNewsAccount[] = [
  {
    handle: 'fraxfinance',
    displayName: 'Frax',
    categories: ['frax'],
    accentColor: '#ffffff',
    initials: 'FX',
    logoSymbol: 'FRAX',
  },
  {
    handle: 'CurveFinance',
    displayName: 'Curve',
    categories: ['defi'],
    accentColor: '#00ff88',
    initials: 'CV',
    logoSymbol: 'CRV',
  },
  {
    handle: 'AaveAave',
    displayName: 'Aave',
    categories: ['defi'],
    accentColor: '#b6509e',
    initials: 'AA',
    logoSymbol: 'AAVE',
  },
  {
    handle: 'stakedao',
    displayName: 'Stake DAO',
    categories: ['defi', 'frax'],
    accentColor: '#ffffff',
    initials: 'SD',
  },
  {
    handle: 'circle',
    displayName: 'Circle',
    categories: ['stablecoin'],
    accentColor: '#2775ca',
    initials: 'CR',
  },
  {
    handle: 'Tether_to',
    displayName: 'Tether',
    categories: ['stablecoin'],
    accentColor: '#26a17b',
    initials: 'US',
  },
  {
    handle: 'ondofinance',
    displayName: 'Ondo',
    categories: ['rwa'],
    accentColor: '#ffffff',
    initials: 'ON',
  },
  {
    handle: 'HyperliquidX',
    displayName: 'Hyperliquid',
    categories: ['defi'],
    accentColor: '#97fce4',
    initials: 'HL',
  },
];

export function accountByHandle(handle: string): XNewsAccount | undefined {
  const h = handle.replace(/^@/, '').toLowerCase();
  return X_NEWS_ACCOUNTS.find((a) => a.handle.toLowerCase() === h);
}

/** Resolve or adopt an X handle from user search (e.g. "uniswap" → @uniswap). */
export function adoptHandleFromQuery(raw: string): XNewsAccount | null {
  const handle = raw.trim().replace(/^@/, '');
  if (!handle || !/^[A-Za-z0-9_]{1,15}$/.test(handle)) return null;
  return (
    accountByHandle(handle) ?? {
      handle,
      displayName: handle,
      categories: ['general'],
      initials: handle.slice(0, 2).toUpperCase(),
    }
  );
}

export function featuredAccounts(): XNewsAccount[] {
  return X_FEATURED_HANDLES.map((h) => accountByHandle(h)).filter(Boolean) as XNewsAccount[];
}

/** Accounts whose primary topics match the active filter chip. */
export function accountsForFilter(filter: NewsFilter): XNewsAccount[] {
  if (filter === 'all') return [...X_NEWS_ACCOUNTS];
  return X_NEWS_ACCOUNTS.filter((a) => a.categories.includes(filter));
}

/** Handles to prefetch for Latest stream (broader than tab list). */
export function prefetchHandlesForFilter(filter: NewsFilter): string[] {
  if (filter === 'all') return X_NEWS_ACCOUNTS.map((a) => a.handle);
  const matched = accountsForFilter(filter);
  if (matched.length) return matched.map((a) => a.handle);
  return X_NEWS_ACCOUNTS.map((a) => a.handle);
}
