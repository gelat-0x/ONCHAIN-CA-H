import type { NewsCategory } from '../types/index.ts';

const CATEGORY_PRIORITY: NewsCategory[] = [
  'frax',
  'stablecoin',
  'regulatory',
  'rwa',
  'defi',
  'general',
];

const CATEGORY_KEYWORDS: Record<Exclude<NewsCategory, 'general'>, string[]> = {
  frax: ['frax', 'frxusd', 'fxs', 'fraxtal', 'frax force', 'fraxforce', 'pegkeeper'],
  stablecoin: [
    'stablecoin',
    'stable coin',
    'usdt',
    'usdc',
    'dai',
    'crvusd',
    'depeg',
    'tether',
    'circle',
    'usde',
    'susde',
    'fdusd',
    'pyusd',
    'eurc',
    'mint/burn',
    ' peg ',
  ],
  regulatory: [
    'mica',
    'markets in crypto-assets',
    'genius act',
    'clarity act',
    'sec ',
    ' sec',
    'cftc',
    'regulation',
    'regulatory',
    'compliance',
    'stablecoin bill',
    'eu crypto',
    'licensing',
    'enforcement',
    'congress',
    'legislation',
    'ban crypto',
    'crypto ban',
  ],
  rwa: [
    'rwa',
    'real-world',
    'real world',
    'tokenized',
    'tokenised',
    'tokenized treasury',
    'treasury',
    't-bill',
    'tbill',
    'blackrock',
    'ondo',
    'buidl',
    'superstate',
  ],
  defi: [
    'defi',
    'de-fi',
    'curve',
    'aave',
    'uniswap',
    'lending',
    'dex',
    'amm',
    'liquid staking',
    'stake dao',
    'stakedao',
    'hyperliquid',
    'hyper evm',
    'compound',
    'maker',
    'lido',
    'eigenlayer',
    'pendle',
    'morpho',
  ],
};

export const CATEGORY_LABELS: Record<NewsCategory, string> = {
  frax: 'Frax',
  stablecoin: 'Stablecoin',
  regulatory: 'Regulatory',
  defi: 'DeFi',
  rwa: 'RWA',
  general: 'General',
};

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function keywordMatches(text: string, keyword: string): boolean {
  const kw = keyword.trim().toLowerCase();
  if (!kw) return false;
  if (/\s/.test(kw)) return text.includes(kw);
  const re = new RegExp(`\\b${escapeRegex(kw)}\\b`, 'i');
  return re.test(text);
}

/** Tag headline or post text with topic categories (word-boundary aware). */
export function tagCategories(text: string): NewsCategory[] {
  const t = text.toLowerCase();
  const cats: NewsCategory[] = [];
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    Exclude<NewsCategory, 'general'>,
    string[],
  ][]) {
    if (keywords.some((kw) => keywordMatches(t, kw))) cats.push(cat);
  }
  if (!cats.length) cats.push('general');
  return cats;
}

/** Pick the single best category for filter chips. */
export function primaryCategory(cats: NewsCategory[]): NewsCategory {
  for (const p of CATEGORY_PRIORITY) {
    if (cats.includes(p)) return p;
  }
  return 'general';
}

/** Merge content tags with account defaults (union, deduped). */
export function tagPostCategories(
  text: string,
  accountCategories: NewsCategory[],
): NewsCategory[] {
  const fromText = tagCategories(text).filter((c) => c !== 'general');
  const merged = new Set<NewsCategory>([...accountCategories, ...fromText]);
  if (!merged.size) return ['general'];
  return [...merged];
}

export function primaryFromText(text: string): NewsCategory {
  return primaryCategory(tagCategories(text));
}

/** Map CryptoCompare category string to our tags. */
export function mapCryptoCompareCategories(ccRaw: string, blob: string): NewsCategory[] {
  const cc = ccRaw.toLowerCase();
  const fromBlob = tagCategories(blob);
  const extra: NewsCategory[] = [];
  if (/stable|usdt|usdc|tether|circle|dai/.test(cc)) extra.push('stablecoin');
  if (/defi|dex|lending|yield|nft|blockchain/.test(cc)) extra.push('defi');
  if (/rwa|tokeniz|real.?world|treasury/.test(cc)) extra.push('rwa');
  if (/frax|fxs/.test(cc)) extra.push('frax');
  if (/regulat|sec|cftc|mica|compliance|legislat/.test(cc)) extra.push('regulatory');
  const merged = new Set<NewsCategory>([...fromBlob, ...extra]);
  if (!merged.size) merged.add('general');
  return [...merged];
}

export function classifyNewsBlob(
  blob: string,
  sourceName: string,
  options?: { sourceHint?: NewsCategory[] },
): { categories: NewsCategory[]; primaryCategory: NewsCategory } {
  const text = `${blob} ${sourceName}`.slice(0, 400).toLowerCase();
  let categories = tagCategories(text);

  if (options?.sourceHint?.includes('frax')) {
    const fraxRelevant =
      categories.includes('frax') ||
      keywordMatches(text, 'frax') ||
      keywordMatches(text, 'frxusd') ||
      keywordMatches(text, 'fxs');
    if (fraxRelevant) {
      categories = [...new Set<NewsCategory>([...categories, 'frax'])];
    }
  }

  return {
    categories,
    primaryCategory: primaryCategory(categories),
  };
}
