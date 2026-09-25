import type { NewsCategory, NewsItem, NewsResponse } from '../../shared/types/index.ts';
import {
  classifyNewsBlob,
  mapCryptoCompareCategories,
  primaryCategory,
} from '../../shared/lib/tagCategories.ts';
import { CACHE_TTL_MS } from '../../shared/constants/cache.ts';

interface FeedConfig {
  name: string;
  url: string;
  /** When set, may boost frax tagging when content is Frax-relevant. */
  sourceHint?: NewsCategory[];
}

const FEEDS: FeedConfig[] = [
  { name: 'Frax Finance', url: 'https://news.frax.com/feed', sourceHint: ['frax'] },
  { name: 'CoinDesk', url: 'https://www.coindesk.com/arc/outboundfeeds/rss/' },
  { name: 'Cointelegraph', url: 'https://cointelegraph.com/rss' },
  { name: 'Blockworks', url: 'https://blockworks.co/feed' },
  { name: 'Decrypt', url: 'https://decrypt.co/feed' },
  { name: 'The Defiant', url: 'https://thedefiant.io/feed' },
];

const CRYPTOCOMPARE_NEWS =
  'https://min-api.cryptocompare.com/data/v2/news/?lang=EN&sortOrder=latest';

const FETCH_TIMEOUT_MS = 8_000;
const MAX_ITEMS = 150;

let cache: { ts: number; data: NewsResponse } | null = null;

async function fetchText(url: string): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
        'User-Agent': 'ONCHAIN-CASH-News/1.0',
      },
    });
    clearTimeout(t);
    if (!res.ok) {
      console.warn(`[news] ${url} returned ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`[news] Failed to fetch ${url}:`, err);
    return null;
  }
}

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
}

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const m = block.match(re);
  return m ? stripCdata(m[1]).trim() : '';
}

function parseRssDate(raw: string): string {
  if (!raw) return new Date().toISOString();
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString();
}

function extractAtomLink(block: string): string {
  const tags = block.match(/<link\b[^>]*\/?>/gi) ?? [];
  for (const tag of tags) {
    if (/rel=["'][^"']*self[^"']*["']/i.test(tag)) continue;
    const href = tag.match(/href=["']([^"']+)["']/i)?.[1];
    if (href?.startsWith('http')) return href;
  }
  return '';
}

function itemFromBlob(
  base: Omit<NewsItem, 'categories' | 'primaryCategory'>,
  blob: string,
  sourceName: string,
  sourceHint?: NewsCategory[],
): NewsItem {
  const { categories, primaryCategory: primary } = classifyNewsBlob(blob, sourceName, {
    sourceHint,
  });
  return { ...base, categories, primaryCategory: primary };
}

function parseAtomFeed(xml: string, sourceName: string, sourceHint?: NewsCategory[]): NewsItem[] {
  const items: NewsItem[] = [];
  const entryRe = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
  let m: RegExpExecArray | null;
  while ((m = entryRe.exec(xml)) !== null) {
    const block = m[1];
    const title = stripHtml(extractTag(block, 'title'));
    const link = extractAtomLink(block);
    if (!title || !link) continue;

    const pubDate =
      extractTag(block, 'published') ||
      extractTag(block, 'updated') ||
      extractTag(block, 'pubDate');
    const description = stripHtml(
      extractTag(block, 'summary') ||
        extractTag(block, 'content') ||
        extractTag(block, 'description') ||
        '',
    ).slice(0, 400);

    let imageUrl: string | undefined;
    const media = block.match(/url=["']([^"']+)["']/i);
    if (media?.[1]?.startsWith('http')) imageUrl = media[1];

    const blob = `${title} ${description}`;
    items.push(
      itemFromBlob(
        {
          id: `atom-${sourceName}-${encodeURIComponent(link).slice(0, 48)}`,
          title,
          url: link,
          source: sourceName,
          publishedAt: parseRssDate(pubDate),
          summary: description || undefined,
          imageUrl,
        },
        blob,
        sourceName,
        sourceHint,
      ),
    );
  }
  return items;
}

function parseFeedXml(xml: string, sourceName: string, sourceHint?: NewsCategory[]): NewsItem[] {
  const rss = parseRssFeed(xml, sourceName, sourceHint);
  if (rss.length) return rss;
  return parseAtomFeed(xml, sourceName, sourceHint);
}

function parseRssFeed(xml: string, sourceName: string, sourceHint?: NewsCategory[]): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = stripHtml(extractTag(block, 'title'));
    let link = extractTag(block, 'link');
    if (!link) {
      const guid = extractTag(block, 'guid');
      if (guid.startsWith('http')) link = guid;
    }
    link = link.trim();
    if (!title || !link) continue;

    const pubDate = extractTag(block, 'pubDate') || extractTag(block, 'published');
    const description = stripHtml(
      extractTag(block, 'description') || extractTag(block, 'content:encoded') || '',
    ).slice(0, 400);

    let imageUrl: string | undefined;
    const media = block.match(/url=["']([^"']+)["']/i);
    if (media?.[1]?.startsWith('http')) imageUrl = media[1];

    const blob = `${title} ${description}`;
    items.push(
      itemFromBlob(
        {
          id: `rss-${sourceName}-${encodeURIComponent(link).slice(0, 48)}`,
          title,
          url: link,
          source: sourceName,
          publishedAt: parseRssDate(pubDate),
          summary: description || undefined,
          imageUrl,
        },
        blob,
        sourceName,
        sourceHint,
      ),
    );
  }
  return items;
}

async function fetchRssFeed(feed: FeedConfig): Promise<NewsItem[]> {
  const xml = await fetchText(feed.url);
  if (!xml) return [];
  return parseFeedXml(xml, feed.name, feed.sourceHint);
}

interface CryptoCompareArticle {
  id?: string;
  guid?: string;
  title?: string;
  url?: string;
  body?: string;
  imageurl?: string;
  published_on?: number;
  source_info?: { name?: string };
  categories?: string;
}

async function fetchCryptoCompareNews(): Promise<NewsItem[]> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(CRYPTOCOMPARE_NEWS, { signal: ctrl.signal });
    clearTimeout(t);
    if (!res.ok) return [];
    const json = (await res.json()) as { Data?: CryptoCompareArticle[] };
    const rows = json.Data ?? [];
    return rows.map((a) => {
      const title = (a.title ?? '').trim();
      const url = (a.url ?? '').trim();
      const summary = stripHtml(a.body ?? '').slice(0, 400);
      const blob = `${title} ${summary} ${a.categories ?? ''}`;
      const publishedAt =
        a.published_on != null
          ? new Date(a.published_on * 1000).toISOString()
          : new Date().toISOString();
      const source = a.source_info?.name ?? 'CryptoCompare';
      const categories = mapCryptoCompareCategories(a.categories ?? '', blob);
      return {
        id: `cc-${a.id ?? a.guid ?? url}`,
        title,
        url,
        source,
        publishedAt,
        summary: summary || undefined,
        imageUrl: a.imageurl?.startsWith('http') ? a.imageurl : undefined,
        categories,
        primaryCategory: primaryCategory(categories),
      };
    }).filter((i) => i.title && i.url);
  } catch (err) {
    console.warn('[news] CryptoCompare fetch failed:', err);
    return [];
  }
}

function normalizeDedupUrl(url: string): string {
  try {
    const u = new URL(url.trim());
    u.hostname = u.hostname.toLowerCase().replace(/^www\./, '');
    u.hash = '';
    const stripParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'source'];
    for (const key of [...u.searchParams.keys()]) {
      if (stripParams.includes(key.toLowerCase()) || key.toLowerCase().startsWith('utm_')) {
        u.searchParams.delete(key);
      }
    }
    let path = u.pathname.replace(/\/$/, '');
    if (!path) path = '/';
    const qs = u.searchParams.toString();
    return `${u.protocol}//${u.hostname}${path}${qs ? `?${qs}` : ''}`;
  } catch {
    return url.toLowerCase().replace(/\/$/, '');
  }
}

function dedupeItems(items: NewsItem[]): NewsItem[] {
  const seen = new Set<string>();
  const out: NewsItem[] = [];
  for (const item of items) {
    const key = item.url
      ? normalizeDedupUrl(item.url)
      : item.title.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function isOfficialFraxItem(item: NewsItem): boolean {
  return item.source === 'Frax Finance';
}

function sortByDateDesc(items: NewsItem[]): NewsItem[] {
  return [...items].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/** Always include official Frax sources; cap generic crypto headlines at MAX_ITEMS. */
function finalizeNewsItems(all: NewsItem[]): NewsItem[] {
  const deduped = dedupeItems(all);
  const official = sortByDateDesc(deduped.filter(isOfficialFraxItem));
  const other = sortByDateDesc(deduped.filter((i) => !isOfficialFraxItem(i))).slice(0, MAX_ITEMS);
  return sortByDateDesc(dedupeItems([...official, ...other]));
}

async function buildNewsResponse(): Promise<NewsResponse> {
  const adapters = [
    ...FEEDS.map((f) => () => fetchRssFeed(f)),
    () => fetchCryptoCompareNews(),
  ];

  const settled = await Promise.allSettled(adapters.map((fn) => fn()));
  const all: NewsItem[] = [];
  const sources = new Set<string>();

  for (const r of settled) {
    if (r.status === 'fulfilled') {
      for (const item of r.value) {
        all.push(item);
        sources.add(item.source);
      }
    }
  }

  const items = finalizeNewsItems(all);

  return {
    items,
    sources: [...sources].sort(),
    lastUpdated: new Date().toISOString(),
    cached: false,
  };
}

/** Aggregated live news (60s cache, stale-while-error). */
export async function fetchNews(refresh = false): Promise<NewsResponse> {
  if (!refresh && cache && Date.now() - cache.ts < CACHE_TTL_MS) {
    return { ...cache.data, cached: true };
  }

  try {
    const data = await buildNewsResponse();
    if (data.items.length) {
      cache = { ts: Date.now(), data };
      console.log(`[news] ${data.items.length} items from ${data.sources.length} sources`);
      return data;
    }
  } catch (err) {
    console.warn('[news] build failed:', err);
  }

  if (cache?.data.items.length) {
    return { ...cache.data, cached: true };
  }

  return {
    items: [],
    sources: [],
    lastUpdated: new Date().toISOString(),
    cached: false,
  };
}
