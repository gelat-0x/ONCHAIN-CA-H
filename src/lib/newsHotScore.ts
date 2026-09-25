import type { NewsCategory, NewsItem } from '../types';
import type { NewsFilter } from '../../shared/data/newsAccounts.ts';
import { CATEGORY_LABELS } from '../../shared/lib/tagCategories.ts';

const HOT_KEYWORDS = [
  'breaking',
  'surge',
  'record',
  'depeg',
  'crash',
  'soars',
  'plunge',
  'all-time',
  'all time',
  'etf',
  'hack',
  'exploit',
  'bankruptcy',
  'approval',
  'largest',
  'mica',
  'genius act',
  'clarity act',
  'hyperliquid',
  'ban',
  'enforcement',
  'regulation',
];

const SOURCE_BOOST = new Set(['CoinDesk', 'Cointelegraph', 'The Defiant', 'Decrypt']);

function recencyWeight(iso: string): number {
  const hrs = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (hrs < 1) return 3;
  if (hrs < 6) return 2;
  if (hrs < 24) return 1;
  return 0;
}

function titleHotBoost(title: string): number {
  const t = title.toLowerCase();
  return HOT_KEYWORDS.some((kw) => t.includes(kw)) ? 1 : 0;
}

export function hotScore(item: NewsItem, filter: NewsFilter): number {
  let score = recencyWeight(item.publishedAt);
  if (SOURCE_BOOST.has(item.source)) score += 1;
  if (filter !== 'all' && item.categories.includes(filter)) score += 1;
  if (filter === 'regulatory' && item.categories.includes('regulatory')) score += 1;
  score += titleHotBoost(item.title);
  return score;
}

export function pickHottest(
  items: NewsItem[],
  filter: NewsFilter,
  search: string,
  limit = 5,
): NewsItem[] {
  if (search.trim()) return [];

  const ranked = [...items]
    .map((item) => ({ item, score: hotScore(item, filter) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.item.publishedAt).getTime() - new Date(a.item.publishedAt).getTime();
    });

  if (ranked.length) {
    return ranked.slice(0, limit).map(({ item }) => item);
  }

  return [...items]
    .sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    )
    .slice(0, limit);
}

export function categoryLabel(cat: NewsCategory): string {
  return CATEGORY_LABELS[cat];
}
