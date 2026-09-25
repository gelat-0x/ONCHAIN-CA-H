import type { XPost, XTimelineResponse } from '../../shared/types/index.ts';
import { accountByHandle } from '../../shared/data/newsAccounts.ts';
import { tagPostCategories, primaryCategory } from '../../shared/lib/tagCategories.ts';
import { CACHE_TTL_MS } from '../../shared/constants/cache.ts';

const SYNDICATION_BASE = 'https://syndication.twitter.com/srv/timeline-profile/screen-name';
const FXTWITTER_FEED = 'https://fxtwitter.com';
const NITTER_RSS = 'https://nitter.net';
const FETCH_TIMEOUT_MS = 8_000;
const STALE_MAX_MS = 30 * 60_000;

const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const cache = new Map<string, { ts: number; data: XTimelineResponse }>();

function normalizeHandle(account: string): string {
  return account.replace(/^@/, '').trim();
}

function parseNextData(html: string): unknown {
  const marker = '<script id="__NEXT_DATA__" type="application/json">';
  const start = html.indexOf(marker);
  if (start < 0) return null;
  const jsonStart = start + marker.length;
  const end = html.indexOf('</script>', jsonStart);
  if (end < 0) return null;
  try {
    return JSON.parse(html.slice(jsonStart, end));
  } catch {
    return null;
  }
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : null;
}

function tweetImageUrl(tweet: Record<string, unknown>): string | undefined {
  const entities = asRecord(tweet.entities);
  const media = entities?.media;
  if (!Array.isArray(media) || !media.length) return undefined;
  const first = asRecord(media[0]);
  const url = first?.media_url_https ?? first?.media_url;
  return typeof url === 'string' && url.startsWith('http') ? url : undefined;
}

function tweetPublishedAt(tweet: Record<string, unknown>): string {
  const raw = tweet.created_at;
  if (typeof raw === 'string') {
    const d = new Date(raw);
    if (Number.isFinite(d.getTime())) return d.toISOString();
  }
  return new Date().toISOString();
}

function mapTweet(tweet: Record<string, unknown>, handle: string): XPost | null {
  const id = String(tweet.id_str ?? tweet.id ?? tweet.rest_id ?? '').trim();
  const text = String(tweet.full_text ?? tweet.text ?? '').trim();
  if (!id || !text) return null;

  const permalink = typeof tweet.permalink === 'string' ? tweet.permalink : null;

  return {
    id,
    text,
    url: permalink?.startsWith('http')
      ? permalink
      : `https://x.com/${handle}/status/${id}`,
    publishedAt: tweetPublishedAt(tweet),
    authorHandle: handle,
    imageUrl: tweetImageUrl(tweet),
  };
}

function dedupePosts(posts: XPost[]): XPost[] {
  const seen = new Set<string>();
  const out: XPost[] = [];
  for (const p of posts) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    out.push(p);
  }
  return out.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

function tagPostsForAccount(posts: XPost[], handle: string): XPost[] {
  const account = accountByHandle(handle);
  const accountCats = account?.categories ?? ['general'];
  return posts.map((p) => {
    const categories = tagPostCategories(p.text, accountCats);
    return {
      ...p,
      categories,
      primaryCategory: primaryCategory(categories),
    };
  });
}

/** Primary parser: syndication pageProps.timeline.entries[].content.tweet */
function parseTimelineEntries(pageProps: Record<string, unknown>, handle: string): XPost[] {
  const timeline = asRecord(pageProps.timeline);
  const entries = timeline?.entries;
  if (!Array.isArray(entries)) return [];

  const posts: XPost[] = [];
  for (const entry of entries) {
    const e = asRecord(entry);
    const content = asRecord(e?.content);
    const tweet = asRecord(content?.tweet);
    if (!tweet) continue;
    const mapped = mapTweet(tweet, handle);
    if (mapped) posts.push(mapped);
  }
  return posts;
}

/** Fallback: deep-walk JSON for tweet-shaped objects. */
function pickTweetRows(node: unknown, out: Record<string, unknown>[]): void {
  const obj = asRecord(node);
  if (!obj) return;

  const id = obj.id_str ?? obj.id ?? obj.rest_id;
  const text = obj.full_text ?? obj.text;
  if (id != null && typeof text === 'string' && text.trim()) {
    out.push(obj);
  }

  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) {
      for (const item of v) pickTweetRows(item, out);
    } else if (v && typeof v === 'object') {
      pickTweetRows(v, out);
    }
  }
}

function parseTimelineHtml(html: string, account: string): XPost[] {
  const handle = normalizeHandle(account);
  const nextData = parseNextData(html);
  if (!nextData) return [];

  const pageProps = asRecord(asRecord(nextData)?.props)?.pageProps;
  if (pageProps) {
    const fromEntries = parseTimelineEntries(asRecord(pageProps) ?? {}, handle);
    if (fromEntries.length) return dedupePosts(fromEntries).slice(0, 20);
  }

  const rows: Record<string, unknown>[] = [];
  pickTweetRows(nextData, rows);
  const posts = rows
    .map((row) => mapTweet(row, handle))
    .filter((p): p is XPost => p != null);

  return dedupePosts(posts).slice(0, 20);
}

function parseFxTwitterFeedXml(xml: string, handle: string): XPost[] {
  const posts: XPost[] = [];
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1];
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? '';
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1]?.trim() ?? '';
    const pubDate = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1]?.trim() ?? '';
    const desc = block.match(/<description[^>]*>([\s\S]*?)<\/description>/i)?.[1] ?? title;
    const text = desc
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\s+/g, ' ')
      .trim();
    const idMatch = link.match(/status\/(\d+)/);
    const id = idMatch?.[1] ?? link;
    if (!text || !link) continue;
    const d = new Date(pubDate);
    posts.push({
      id,
      text,
      url: link,
      publishedAt: Number.isFinite(d.getTime()) ? d.toISOString() : new Date().toISOString(),
      authorHandle: handle,
    });
  }
  return dedupePosts(posts).slice(0, 20);
}

async function fetchFxTwitterFeed(handle: string): Promise<XPost[] | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const url = `${FXTWITTER_FEED}/${encodeURIComponent(handle)}/feed.xml?count=20`;
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'ONCHAIN-CASH-News/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(t);
    if (!res.ok) {
      console.warn(`[xTimeline] FxTwitter feed @${handle} returned ${res.status}`);
      return null;
    }
    const xml = await res.text();
    const posts = parseFxTwitterFeedXml(xml, handle);
    return posts.length ? posts : null;
  } catch (err) {
    console.warn(`[xTimeline] FxTwitter feed @${handle} failed:`, err);
    return null;
  }
}

async function fetchNitterFeed(handle: string): Promise<XPost[] | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const url = `${NITTER_RSS}/${encodeURIComponent(handle)}/rss`;
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'ONCHAIN-CASH-News/1.0',
        Accept: 'application/rss+xml, application/xml, text/xml, */*',
      },
    });
    clearTimeout(t);
    if (!res.ok) {
      console.warn(`[xTimeline] Nitter RSS @${handle} returned ${res.status}`);
      return null;
    }
    const xml = await res.text();
    const posts = parseFxTwitterFeedXml(xml, handle);
    return posts.length ? posts : null;
  } catch (err) {
    console.warn(`[xTimeline] Nitter RSS @${handle} failed:`, err);
    return null;
  }
}

async function fetchFxTwitterApi(handle: string): Promise<XPost[] | null> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const url = `https://api.fxtwitter.com/2/profile/${encodeURIComponent(handle)}/statuses?count=20`;
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': 'ONCHAIN-CASH-News/1.0' },
    });
    clearTimeout(t);
    if (!res.ok) return null;
    const json = (await res.json()) as { results?: unknown[] };
    const rows = json.results ?? [];
    const posts: XPost[] = [];
    for (const row of rows) {
      const entry = asRecord(row);
      if (!entry) continue;
      const status = entry.type === 'status' ? asRecord(entry.status) ?? entry : entry;
      const mapped = mapTweet(status, handle);
      if (mapped) posts.push(mapped);
    }
    return posts.length ? dedupePosts(posts).slice(0, 20) : null;
  } catch (err) {
    console.warn(`[xTimeline] FxTwitter API @${handle} failed:`, err);
    return null;
  }
}

async function fetchTimelineHtml(account: string): Promise<string | null> {
  const handle = normalizeHandle(account);
  if (!handle) return null;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(`${SYNDICATION_BASE}/${encodeURIComponent(handle)}`, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://platform.twitter.com/',
      },
    });
    clearTimeout(t);
    if (!res.ok) {
      console.warn(`[xTimeline] ${handle} returned ${res.status}`);
      return null;
    }
    return await res.text();
  } catch (err) {
    console.warn(`[xTimeline] Failed to fetch @${handle}:`, err);
    return null;
  }
}

/** Fetch recent posts for an X account via syndication (no API key). */
export async function fetchXTimeline(
  account: string,
  refresh = false,
): Promise<XTimelineResponse> {
  const handle = normalizeHandle(account);
  const cached = cache.get(handle);
  if (!refresh && cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return { ...cached.data, cached: true };
  }

  const html = await fetchTimelineHtml(handle);
  let posts: XPost[] = [];

  if (html) {
    posts = parseTimelineHtml(html, handle);
    if (!posts.length) {
      console.warn(`[xTimeline] @${handle}: syndication HTML parsed 0 posts (${html.length} bytes)`);
    }
  }

  if (!posts.length) {
    const results = await Promise.all([
      fetchFxTwitterFeed(handle),
      fetchFxTwitterApi(handle),
      fetchNitterFeed(handle),
    ]);
    const best = results
      .filter((r): r is XPost[] => !!r?.length)
      .sort((a, b) => b.length - a.length)[0];
    posts = best ?? [];
  }

  if (posts.length) {
    const tagged = tagPostsForAccount(posts, handle);
    const data: XTimelineResponse = {
      posts: tagged,
      account: handle,
      lastUpdated: new Date().toISOString(),
      cached: false,
    };
    cache.set(handle, { ts: Date.now(), data });
    console.log(`[xTimeline] @${handle}: ${tagged.length} posts`);
    return data;
  }

  if (cached?.data.posts.length) {
    const age = Date.now() - cached.ts;
    const staleNote = age > STALE_MAX_MS ? ' (stale)' : '';
    console.warn(`[xTimeline] @${handle}: serving cache${staleNote}, ${cached.data.posts.length} posts`);
    return { ...cached.data, cached: true };
  }

  return {
    posts: [],
    account: handle,
    lastUpdated: new Date().toISOString(),
    cached: false,
    error: 'empty',
  };
}
