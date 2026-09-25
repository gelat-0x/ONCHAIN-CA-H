import type { NewsCategory, NewsItem, XPost } from '../types';
import type { NewsFilter } from '../../shared/data/newsAccounts.ts';
import { CATEGORY_LABELS, primaryCategory } from '../../shared/lib/tagCategories.ts';

export { CATEGORY_LABELS };

export function normalizeSearch(q: string): string {
  return q.trim().toLowerCase();
}

export function articlePrimary(item: NewsItem): NewsCategory {
  return item.primaryCategory ?? primaryCategory(item.categories);
}

export function postPrimary(
  post: XPost,
  accountCategories: NewsCategory[],
): NewsCategory {
  if (post.primaryCategory) return post.primaryCategory;
  const cats = post.categories?.length ? post.categories : accountCategories;
  return primaryCategory(cats);
}

export function postCategories(
  post: XPost,
  accountCategories: NewsCategory[],
): NewsCategory[] {
  if (post.categories?.length) return post.categories;
  return accountCategories.length ? accountCategories : ['general'];
}

/** Any token match (OR) — better for user search. */
export function matchesSearchAny(haystack: string, query: string): boolean {
  const q = normalizeSearch(query);
  if (!q) return true;
  const text = haystack.toLowerCase();
  const tokens = q.split(/\s+/).filter(Boolean);
  if (!tokens.length) return true;
  return tokens.some((tok) => text.includes(tok));
}

export function matchesTopicFilter(
  categories: NewsCategory[],
  filter: NewsFilter,
): boolean {
  if (filter === 'all') return true;
  return categories.includes(filter);
}

function articleSearchBlob(item: NewsItem): string {
  const primary = articlePrimary(item);
  return [
    item.title,
    item.summary ?? '',
    item.source,
    CATEGORY_LABELS[primary],
    ...item.categories.map((c) => CATEGORY_LABELS[c]),
  ].join(' ');
}

export function filterArticles(
  items: NewsItem[],
  filter: NewsFilter,
  search: string,
): NewsItem[] {
  return items
    .filter((item) => {
      if (!matchesTopicFilter(item.categories, filter)) return false;
      if (!search.trim()) return true;
      return matchesSearchAny(articleSearchBlob(item), search);
    })
    .sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export function filterPosts(
  posts: XPost[],
  filter: NewsFilter,
  search: string,
  accountCategories: NewsCategory[],
  handle: string,
  displayName: string,
): XPost[] {
  return posts
    .filter((post) => {
      const categories = postCategories(post, accountCategories);
      if (!matchesTopicFilter(categories, filter)) return false;
      if (!search.trim()) return true;
      const primary = postPrimary(post, accountCategories);
      const blob = [
        post.text,
        handle,
        displayName,
        `@${handle}`,
        CATEGORY_LABELS[primary],
        ...categories.map((c) => CATEGORY_LABELS[c]),
      ].join(' ');
      return matchesSearchAny(blob, search);
    })
    .sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
}

export interface SearchResultItem {
  kind: 'article' | 'post';
  id: string;
  title: string;
  summary: string;
  excerpt: string;
  url: string;
  source: string;
  publishedAt: string;
  primary: NewsCategory;
  handle?: string;
}

export function buildSearchResults(
  articles: NewsItem[],
  posts: Array<{ post: XPost; handle: string; displayName: string; accountCategories: NewsCategory[] }>,
  filter: NewsFilter,
  search: string,
): SearchResultItem[] {
  if (!search.trim()) return [];

  const articleResults: SearchResultItem[] = filterArticles(articles, filter, search).map(
    (item) => ({
      kind: 'article' as const,
      id: item.id,
      title: item.title,
      summary: item.summary ?? '',
      excerpt: item.summary ?? '',
      url: item.url,
      source: item.source,
      publishedAt: item.publishedAt,
      primary: articlePrimary(item),
    }),
  );

  const postResults: SearchResultItem[] = [];
  for (const { post, handle, displayName, accountCategories } of posts) {
    const filtered = filterPosts([post], filter, search, accountCategories, handle, displayName);
    if (!filtered.length) continue;
    const p = filtered[0];
    const excerpt =
      p.text.length > 220 ? `${p.text.slice(0, 217).trim()}…` : p.text;
    postResults.push({
      kind: 'post',
      id: `x-${handle}-${p.id}`,
      title: excerpt,
      summary: `@${handle}`,
      excerpt: p.text,
      url: p.url,
      source: displayName,
      publishedAt: p.publishedAt,
      primary: postPrimary(p, accountCategories),
      handle,
    });
  }

  return [...articleResults, ...postResults].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}
