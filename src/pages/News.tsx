import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { NewsItem, NewsResponse } from '../types';
import {
  accountsForFilter,
  prefetchHandlesForFilter,
  type NewsFilter,
  LATEST_X_TAB,
} from '../../shared/data/newsAccounts.ts';
import { fetchNews } from '../services/api';
import {
  filterArticles,
  buildSearchResults,
  CATEGORY_LABELS,
  articlePrimary,
} from '../lib/newsFilters';
import { pickHottest } from '../lib/newsHotScore';
import { NEWS_POLL_MS } from '../lib/newsRefresh';
import { NEWS_HERO_ART } from '../constants/newsHeroArt';
import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LoadingScreen } from '../components/LoadingScreen';
import { XFeedPanel, type XPostEntry } from '../components/XFeedPanel';
import { XAccountPicker } from '../components/XAccountPicker';
import { HottestNewsRail } from '../components/HottestNewsRail';
import { NewsSearchResults } from '../components/NewsSearchResults';
import { PLACEHOLDER_DASHBOARD } from '../data/placeholders';

const FEED_PAGE = 15;

const FILTERS: { key: NewsFilter; label: string }[] = [
  { key: 'all', label: 'All News' },
  { key: 'frax', label: 'Frax News' },
  { key: 'stablecoin', label: 'Stablecoin News' },
  { key: 'defi', label: 'DeFi News' },
  { key: 'rwa', label: 'RWA News' },
  { key: 'regulatory', label: 'Regulatory' },
  { key: 'general', label: 'General News' },
];

const VALID_FILTERS = new Set<string>(FILTERS.map((f) => f.key));

function parseFilter(raw: string | null): NewsFilter {
  if (raw && VALID_FILTERS.has(raw)) return raw as NewsFilter;
  return 'all';
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function filterEmptyMessage(filter: NewsFilter, search: string): string {
  if (search.trim()) return 'No headlines match this search.';
  const labels: Record<NewsFilter, string> = {
    all: 'all topics',
    frax: 'Frax',
    stablecoin: 'Stablecoin',
    defi: 'DeFi',
    rwa: 'RWA',
    regulatory: 'Regulatory',
    general: 'General',
  };
  return `No articles for ${labels[filter]} right now.`;
}

export function NewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filter = parseFilter(searchParams.get('topic'));
  const search = searchParams.get('q') ?? '';
  const [searchInput, setSearchInput] = useState(search);

  const [data, setData] = useState<NewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedLimit, setFeedLimit] = useState(FEED_PAGE);
  const [xAccount, setXAccount] = useState(
    () => searchParams.get('x') ?? LATEST_X_TAB,
  );
  const [xPostEntries, setXPostEntries] = useState<XPostEntry[]>([]);

  const visibleAccounts = useMemo(() => accountsForFilter(filter), [filter]);
  const prefetchHandles = useMemo(() => {
    const base = prefetchHandlesForFilter(filter);
    if (xAccount !== LATEST_X_TAB && !base.some((h) => h.toLowerCase() === xAccount.toLowerCase())) {
      return [...base, xAccount];
    }
    return base;
  }, [filter, xAccount]);

  useEffect(() => {
    setSearchInput(search);
  }, [search]);

  useEffect(() => {
    setFeedLimit(FEED_PAGE);
  }, [filter, search]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      if (searchInput === search) return;
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          const trimmed = searchInput.trim();
          if (trimmed) p.set('q', trimmed);
          else p.delete('q');
          return p;
        },
        { replace: true },
      );
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput, search, setSearchParams]);

  const setFilter = useCallback(
    (next: NewsFilter) => {
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (next === 'all') p.delete('topic');
          else p.set('topic', next);
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const selectXAccount = useCallback(
    (handle: string) => {
      setXAccount(handle);
      setSearchParams(
        (prev) => {
          const p = new URLSearchParams(prev);
          if (handle === LATEST_X_TAB) p.delete('x');
          else p.set('x', handle);
          return p;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  useEffect(() => {
    if (xAccount === LATEST_X_TAB) return;
    const handles = visibleAccounts.map((a) => a.handle);
    const adopted = !handles.some((h) => h.toLowerCase() === xAccount.toLowerCase());
    if (!handles.length && !adopted) {
      selectXAccount(LATEST_X_TAB);
    }
  }, [visibleAccounts, xAccount, selectXAccount]);

  const load = useCallback(async (refresh = false) => {
    if (!data) setLoading(true);
    const res = await fetchNews(refresh);
    setData(res);
    setLoading(false);
  }, [data]);

  useEffect(() => {
    void load();
    const tick = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    const id = window.setInterval(tick, NEWS_POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  const filteredArticles = useMemo(() => {
    if (!data?.items.length) return [];
    return filterArticles(data.items, filter, search);
  }, [data, filter, search]);

  const hottestItems = useMemo(() => {
    if (!data?.items.length || search.trim()) return [];
    const pool = filterArticles(data.items, filter, '');
    return pickHottest(pool, filter, search, 5);
  }, [data, filter, search]);

  const hottestIds = useMemo(() => new Set(hottestItems.map((i) => i.id)), [hottestItems]);

  const feedArticles = useMemo(
    () => filteredArticles.filter((item) => !hottestIds.has(item.id)),
    [filteredArticles, hottestIds],
  );

  const visibleFeed = useMemo(
    () => feedArticles.slice(0, feedLimit),
    [feedArticles, feedLimit],
  );

  const searchResults = useMemo(() => {
    if (!search.trim() || !data?.items.length) return [];
    return buildSearchResults(data.items, xPostEntries, filter, search);
  }, [data, xPostEntries, filter, search]);

  const feedFailed = data?.error === 'fetch_failed';
  const feedEmpty = !!data && !data.items.length && data.error !== 'fetch_failed';
  const filterEmpty = !!data?.items.length && filteredArticles.length === 0;
  const isSearchMode = search.trim().length > 0;
  const hasMoreFeed = feedLimit < feedArticles.length;

  const updatedAgo = data?.lastUpdated ? timeAgo(data.lastUpdated) : null;

  return (
    <>
      <LiveTicker items={PLACEHOLDER_DASHBOARD.ticker} />
      <Header />

      <main className="page-pad news-page">
        <header className="news-hero news-hero--split">
          <div className="news-hero__body">
            <p className="section-eyebrow">Live wire</p>
            <h1 className="section-title news-hero__title">News</h1>
            <p className="news-hero__copy">
              DeFi, stablecoin, and regulatory headlines from crypto outlets and ecosystem accounts on X.
            </p>
          </div>
          <img
            src={NEWS_HERO_ART.src}
            alt={NEWS_HERO_ART.alt}
            className="news-hero__art"
            loading="lazy"
            decoding="async"
          />
        </header>

        <div className="news-toolbar news-toolbar--wide">
          <div className="news-toolbar__row">
            <div className="news-search">
              <input
                type="search"
                className="news-search__input"
                placeholder="Search headlines and posts…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                aria-label="Search headlines and posts"
              />
              {searchInput && (
                <button
                  type="button"
                  className="news-search__clear"
                  onClick={() => {
                    setSearchInput('');
                    setSearchParams(
                      (prev) => {
                        const p = new URLSearchParams(prev);
                        p.delete('q');
                        return p;
                      },
                      { replace: true },
                    );
                  }}
                  aria-label="Clear search"
                >
                  ×
                </button>
              )}
            </div>
            {data && !feedFailed && updatedAgo && (
              <span className="news-toolbar__meta tabular-nums">
                Updated {updatedAgo}
              </span>
            )}
          </div>
          <div className="news-chips" role="group" aria-label="Filter news">
            {FILTERS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`news-chip ${filter === key ? 'news-chip--active' : ''}`}
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {!isSearchMode && hottestItems.length > 0 && (
          <HottestNewsRail items={hottestItems} />
        )}

        {isSearchMode ? (
          <NewsSearchResults results={searchResults} query={search} />
        ) : (
          <div className="news-layout">
            <section className="news-feed" aria-live="polite">
              {loading && !data ? (
                <LoadingScreen inline message="Loading news…" />
              ) : feedFailed ? (
                <div className="news-error">
                  <p className="news-error__copy">Could not load the news feed.</p>
                  <p className="news-error__hint">
                    Try again in a moment.
                  </p>
                  <button type="button" className="btn-ghost btn-ghost-sm" onClick={() => void load(true)}>
                    Retry
                  </button>
                </div>
              ) : feedEmpty ? (
                <div className="news-error">
                  <p className="news-error__copy">No headlines returned from sources.</p>
                  <button type="button" className="btn-ghost btn-ghost-sm" onClick={() => void load(true)}>
                    Refresh
                  </button>
                </div>
              ) : filterEmpty ? (
                <div className="news-empty">
                  <p>{filterEmptyMessage(filter, search)}</p>
                  <button
                    type="button"
                    className="btn-ghost btn-ghost-sm"
                    style={{ marginTop: 'var(--space-3)' }}
                    onClick={() => {
                      setFilter('all');
                      setSearchInput('');
                    }}
                  >
                    Reset filters
                  </button>
                </div>
              ) : (
                <>
                  <ul className="news-list">
                    {visibleFeed.map((item) => (
                      <NewsListItem key={item.id} item={item} />
                    ))}
                  </ul>
                  {hasMoreFeed && (
                    <div className="news-load-more">
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => setFeedLimit((n) => n + FEED_PAGE)}
                      >
                        Load more ({feedArticles.length - feedLimit} remaining)
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            <aside className="news-sidebar">
              <div className="news-sidebar__head">
                <p className="section-eyebrow">On X</p>
                <XAccountPicker
                  activeHandle={xAccount}
                  onSelect={selectXAccount}
                  filterAccounts={visibleAccounts}
                />
              </div>
              <XFeedPanel
                visibleAccounts={visibleAccounts}
                prefetchHandles={prefetchHandles}
                activeHandle={xAccount}
                filter={filter}
                search={search}
                onAllPostsChange={setXPostEntries}
              />
            </aside>
          </div>
        )}
      </main>

      <Footer />
    </>
  );
}

function isOfficialFraxSource(source: string): boolean {
  return source === 'Frax Finance';
}

function NewsListItem({ item }: { item: NewsItem }) {
  const official = isOfficialFraxSource(item.source);
  const primary = articlePrimary(item);
  return (
    <li className={`news-item cult-shadow ${official ? 'news-item--official' : ''}`}>
      <a
        href={item.url}
        target="_blank"
        rel="noopener noreferrer"
        className="news-item__link"
      >
        <div className="news-item__head">
          <span className="news-item__source">
            {item.source}
            {official && <span className="news-item__official">Official</span>}
          </span>
          <time className="news-item__time tabular-nums" dateTime={item.publishedAt}>
            {timeAgo(item.publishedAt)}
          </time>
        </div>
        <span className="news-item__title">{item.title}</span>
        <div className="news-item__foot">
          <span className="news-item__tag">{CATEGORY_LABELS[primary]}</span>
          {item.imageUrl && (
            <img
              src={item.imageUrl}
              alt=""
              className="news-item__thumb"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          )}
          <span className="news-item__read">Read ↗</span>
        </div>
      </a>
    </li>
  );
}
