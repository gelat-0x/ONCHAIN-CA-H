import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { XNewsAccount } from '../../shared/data/newsAccounts.ts';
import type { NewsFilter } from '../../shared/data/newsAccounts.ts';
import { accountByHandle, adoptHandleFromQuery, LATEST_X_TAB } from '../../shared/data/newsAccounts.ts';
import type { XPost, XTimelineResponse } from '../types';
import { fetchXTimeline } from '../services/api';
import { filterPosts } from '../lib/newsFilters';
import { NEWS_POLL_MS } from '../lib/newsRefresh';
import { TokenLogo } from './TokenLogo';
import { LoadingScreen } from './LoadingScreen';

const POSTS_PAGE = 10;

export interface XPostEntry {
  post: XPost;
  handle: string;
  displayName: string;
  accountCategories: XNewsAccount['categories'];
}

interface XFeedPanelProps {
  visibleAccounts: XNewsAccount[];
  prefetchHandles: string[];
  activeHandle: string;
  filter: NewsFilter;
  search: string;
  onVisiblePostCount?: (count: number) => void;
  onAllPostsChange?: (entries: XPostEntry[]) => void;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatPostText(text: string): ReactNode[] {
  const parts = text.split(/(@[\w]+|#[\w]+)/g);
  return parts.map((part, i) => {
    if (/^@[\w]+$/.test(part)) {
      return (
        <span key={i} className="x-post__mention">
          {part}
        </span>
      );
    }
    if (/^#[\w]+$/.test(part)) {
      return (
        <span key={i} className="x-post__hashtag">
          {part}
        </span>
      );
    }
    return part;
  });
}

function XPostCard({ post, account }: { post: XPost; account: XNewsAccount }) {
  const accent = account.accentColor ?? '#ffffff';

  return (
    <li className="x-post">
      <a
        href={post.url}
        target="_blank"
        rel="noopener noreferrer"
        className="x-post__link"
      >
        <header className="x-post__head">
          {account.logoSymbol ? (
            <TokenLogo
              symbol={account.logoSymbol}
              fallbackInitials={account.initials}
              fallbackColor={accent}
              size="sm"
              className="x-post__logo"
            />
          ) : (
            <span
              className="x-post__avatar"
              style={{ borderColor: accent, color: accent }}
              aria-hidden
            >
              {account.initials ?? account.displayName.slice(0, 2).toUpperCase()}
            </span>
          )}
          <div className="x-post__meta">
            <span className="x-post__name">{account.displayName}</span>
            <span className="x-post__handle">@{account.handle}</span>
          </div>
          <time className="x-post__time tabular-nums" dateTime={post.publishedAt}>
            {timeAgo(post.publishedAt)}
          </time>
        </header>
        <blockquote className="x-post__quote">{formatPostText(post.text)}</blockquote>
        {post.imageUrl && (
          <div className="x-post__media">
            <img
              src={post.imageUrl}
              alt=""
              className="x-post__img"
              loading="lazy"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <span className="x-post__open">Open on X ↗</span>
      </a>
    </li>
  );
}

function PostList({
  posts,
  limit,
  onLoadMore,
}: {
  posts: Array<{ post: XPost; account: XNewsAccount }>;
  limit: number;
  onLoadMore: () => void;
}) {
  const slice = posts.slice(0, limit);
  const hasMore = limit < posts.length;

  return (
    <>
      <ul className="x-post-list">
        {slice.map(({ post, account }) => (
          <XPostCard key={`${account.handle}-${post.id}`} post={post} account={account} />
        ))}
      </ul>
      {hasMore && (
        <div className="x-post-more">
          <button type="button" className="btn-ghost btn-ghost-sm" onClick={onLoadMore}>
            Load more
          </button>
        </div>
      )}
    </>
  );
}

function dedupeMergedPosts(
  entries: Array<{ post: XPost; account: XNewsAccount }>,
): Array<{ post: XPost; account: XNewsAccount }> {
  const seen = new Set<string>();
  const out: Array<{ post: XPost; account: XNewsAccount }> = [];
  for (const entry of entries) {
    if (seen.has(entry.post.id)) continue;
    seen.add(entry.post.id);
    out.push(entry);
  }
  return out.sort(
    (a, b) => new Date(b.post.publishedAt).getTime() - new Date(a.post.publishedAt).getTime(),
  );
}

function AccountTimeline({
  account,
  data,
  loading,
  filter,
  search,
  isActive,
  limit,
  onLoadMore,
  onRetry,
}: {
  account: XNewsAccount;
  data: XTimelineResponse | null;
  loading: boolean;
  filter: NewsFilter;
  search: string;
  isActive: boolean;
  limit: number;
  onLoadMore: () => void;
  onRetry: () => void;
}) {
  const profileUrl = `https://x.com/${account.handle}`;
  const failed = data?.error === 'fetch_failed';
  const posts = useMemo(
    () =>
      data?.posts
        ? filterPosts(
            data.posts,
            filter,
            search,
            account.categories,
            account.handle,
            account.displayName,
          )
        : [],
    [data, filter, search, account],
  );
  const empty = data?.error === 'empty' || (data && !data.posts.length && !failed);
  const filterEmpty = !!data?.posts.length && !posts.length && !failed;

  const mapped = posts.map((post) => ({ post, account }));

  if (!isActive) return null;

  return (
    <div className="x-sidebar__panel x-sidebar__panel--active" role="tabpanel">
      {loading && !data ? (
        <LoadingScreen inline message="Loading posts…" />
      ) : failed ? (
        <div className="x-sidebar__fallback">
          <p className="x-sidebar__fallback-copy">Could not load posts from X.</p>
          <button type="button" className="btn-ghost btn-ghost-sm" onClick={onRetry}>
            Retry
          </button>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-ghost-sm">
            Open @{account.handle} ↗
          </a>
        </div>
      ) : empty ? (
        <div className="x-sidebar__fallback">
          <p className="x-sidebar__fallback-copy">No posts loaded yet.</p>
          <button type="button" className="btn-ghost btn-ghost-sm" onClick={onRetry}>
            Retry
          </button>
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost btn-ghost-sm">
            Open @{account.handle} ↗
          </a>
        </div>
      ) : filterEmpty ? (
        <div className="x-sidebar__fallback">
          <p className="x-sidebar__fallback-copy">No posts match this filter.</p>
        </div>
      ) : (
        <PostList posts={mapped} limit={limit} onLoadMore={onLoadMore} />
      )}
    </div>
  );
}

function LatestTimeline({
  entries,
  filter,
  search,
  loading,
  isActive,
  limit,
  onLoadMore,
}: {
  entries: XPostEntry[];
  filter: NewsFilter;
  search: string;
  loading: boolean;
  isActive: boolean;
  limit: number;
  onLoadMore: () => void;
}) {
  const posts = useMemo(() => {
    const merged: Array<{ post: XPost; account: XNewsAccount }> = [];
    for (const e of entries) {
      const account = accountByHandle(e.handle) ?? adoptHandleFromQuery(e.handle);
      if (!account) continue;
      const filtered = filterPosts(
        [e.post],
        filter,
        search,
        e.accountCategories,
        e.handle,
        e.displayName,
      );
      if (filtered.length) merged.push({ post: filtered[0], account });
    }
    return dedupeMergedPosts(merged);
  }, [entries, filter, search]);

  if (!isActive) return null;

  return (
    <div className="x-sidebar__panel x-sidebar__panel--active" role="tabpanel">
      {loading && !entries.length ? (
        <LoadingScreen inline message="Loading posts…" />
      ) : !posts.length ? (
        <div className="x-sidebar__fallback">
          <p className="x-sidebar__fallback-copy">No posts match this filter.</p>
        </div>
      ) : (
        <PostList posts={posts} limit={limit} onLoadMore={onLoadMore} />
      )}
    </div>
  );
}

export function XFeedPanel({
  visibleAccounts,
  prefetchHandles,
  activeHandle,
  filter,
  search,
  onVisiblePostCount,
  onAllPostsChange,
}: XFeedPanelProps) {
  const [timelines, setTimelines] = useState<Map<string, XTimelineResponse>>(new Map());
  const [loadingHandles, setLoadingHandles] = useState<Set<string>>(new Set());
  const [postLimits, setPostLimits] = useState<Record<string, number>>({});
  const inflight = useRef(new Set<string>());

  const postLimit = postLimits[activeHandle] ?? POSTS_PAGE;

  const bumpLimit = useCallback(() => {
    setPostLimits((prev) => ({
      ...prev,
      [activeHandle]: (prev[activeHandle] ?? POSTS_PAGE) + POSTS_PAGE,
    }));
  }, [activeHandle]);

  const allPrefetch = useMemo(() => {
    const set = new Set(prefetchHandles.map((h) => h.toLowerCase()));
    if (activeHandle !== LATEST_X_TAB) set.add(activeHandle.toLowerCase());
    return [...set];
  }, [prefetchHandles, activeHandle]);

  const prefetch = useCallback(async (handles: string[], refresh = false) => {
    const unique = [...new Set(handles.map((h) => h.toLowerCase()))];
    const toFetch = unique.filter((h) => !inflight.current.has(h));
    if (!toFetch.length) return;

    for (const h of toFetch) inflight.current.add(h);
    setLoadingHandles((prev) => {
      const next = new Set(prev);
      for (const h of toFetch) next.add(h);
      return next;
    });

    await Promise.all(
      toFetch.map(async (handle) => {
        try {
          const res = await fetchXTimeline(handle, refresh);
          setTimelines((prev) => {
            const next = new Map(prev);
            next.set(handle, res);
            return next;
          });
        } finally {
          inflight.current.delete(handle);
          setLoadingHandles((prev) => {
            const next = new Set(prev);
            next.delete(handle);
            return next;
          });
        }
      }),
    );
  }, []);

  useEffect(() => {
    if (activeHandle === LATEST_X_TAB) {
      void prefetch(allPrefetch, false);
      return;
    }
    void prefetch([activeHandle], false);
    const rest = allPrefetch.filter((h) => h !== activeHandle.toLowerCase());
    if (rest.length) void prefetch(rest, false);
  }, [allPrefetch, activeHandle, prefetch]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      void prefetch(allPrefetch, true);
    };
    const id = window.setInterval(tick, NEWS_POLL_MS);
    return () => window.clearInterval(id);
  }, [allPrefetch, prefetch]);

  const allEntries = useMemo((): XPostEntry[] => {
    const out: XPostEntry[] = [];
    for (const handle of allPrefetch) {
      const data = timelines.get(handle);
      const account = accountByHandle(handle) ?? adoptHandleFromQuery(handle);
      if (!data?.posts.length || !account) continue;
      for (const post of data.posts) {
        out.push({
          post,
          handle: account.handle,
          displayName: account.displayName,
          accountCategories: account.categories,
        });
      }
    }
    return out;
  }, [timelines, allPrefetch]);

  useEffect(() => {
    onAllPostsChange?.(allEntries);
  }, [allEntries, onAllPostsChange]);

  const isLatest = activeHandle === LATEST_X_TAB;
  const activeAccount =
    !isLatest
      ? accountByHandle(activeHandle) ?? adoptHandleFromQuery(activeHandle)
      : null;

  const visiblePostCount = useMemo(() => {
    if (isLatest) {
      const merged: Array<{ post: XPost; account: XNewsAccount }> = [];
      for (const e of allEntries) {
        const account = accountByHandle(e.handle) ?? adoptHandleFromQuery(e.handle);
        if (!account) continue;
        const filtered = filterPosts(
          [e.post],
          filter,
          search,
          e.accountCategories,
          e.handle,
          e.displayName,
        );
        if (filtered.length) merged.push({ post: filtered[0], account });
      }
      return dedupeMergedPosts(merged).length;
    }
    if (!activeAccount) return 0;
    const data = timelines.get(activeAccount.handle.toLowerCase());
    if (!data?.posts.length) return 0;
    return filterPosts(
      data.posts,
      filter,
      search,
      activeAccount.categories,
      activeAccount.handle,
      activeAccount.displayName,
    ).length;
  }, [isLatest, allEntries, activeAccount, timelines, filter, search]);

  useEffect(() => {
    onVisiblePostCount?.(visiblePostCount);
  }, [visiblePostCount, onVisiblePostCount]);

  const anyLoading = allPrefetch.some((h) => loadingHandles.has(h));
  const activeData = activeAccount ? timelines.get(activeAccount.handle.toLowerCase()) : null;

  const accountsToRender = useMemo(() => {
    const list = [...visibleAccounts];
    if (
      activeAccount &&
      !list.some((a) => a.handle.toLowerCase() === activeAccount.handle.toLowerCase())
    ) {
      list.push(activeAccount);
    }
    return list;
  }, [visibleAccounts, activeAccount]);

  const retryActive = useCallback(() => {
    if (isLatest) {
      void prefetch(allPrefetch, true);
      return;
    }
    if (activeAccount) void prefetch([activeAccount.handle], true);
  }, [isLatest, allPrefetch, activeAccount, prefetch]);

  return (
    <div className="x-sidebar">
      <div className="x-sidebar__panels">
        {isLatest ? (
          <LatestTimeline
            entries={allEntries}
            filter={filter}
            search={search}
            loading={anyLoading}
            isActive
            limit={postLimit}
            onLoadMore={bumpLimit}
          />
        ) : (
          activeAccount &&
          accountsToRender
            .filter((a) => a.handle.toLowerCase() === activeHandle.toLowerCase())
            .map((account) => (
              <AccountTimeline
                key={account.handle}
                account={account}
                data={timelines.get(account.handle.toLowerCase()) ?? null}
                loading={loadingHandles.has(account.handle.toLowerCase())}
                filter={filter}
                search={search}
                isActive
                limit={postLimit}
                onLoadMore={bumpLimit}
                onRetry={retryActive}
              />
            ))
        )}
      </div>
      {visiblePostCount > 0 && (
        <p className="x-sidebar__status tabular-nums" aria-live="polite">
          {visiblePostCount} posts
        </p>
      )}
      {!visiblePostCount && (activeData || allEntries.length > 0) && anyLoading && (
        <p className="x-sidebar__status tabular-nums" aria-live="polite">
          Loading…
        </p>
      )}
    </div>
  );
}

export { LATEST_X_TAB };
