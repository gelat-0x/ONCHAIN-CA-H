import { useState } from 'react';
import type { SearchResultItem } from '../lib/newsFilters';
import { CATEGORY_LABELS } from '../lib/newsFilters';

const PAGE = 12;

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

interface NewsSearchResultsProps {
  results: SearchResultItem[];
  query: string;
}

export function NewsSearchResults({ results, query }: NewsSearchResultsProps) {
  const [limit, setLimit] = useState(PAGE);
  const visible = results.slice(0, limit);
  const hasMore = limit < results.length;

  return (
    <section className="search-feed" aria-live="polite">
      <header className="search-feed__head">
        <h2 className="search-feed__title">
          Results for <em>{query}</em>
        </h2>
        <p className="search-feed__count tabular-nums">{results.length} matches</p>
      </header>

      {results.length === 0 ? (
        <p className="news-empty">No headlines or posts match this search.</p>
      ) : (
        <>
          <ul className="search-feed__grid">
            {visible.map((r) => (
              <li key={r.id}>
                <SearchResultCard item={r} />
              </li>
            ))}
          </ul>
          {hasMore && (
            <div className="news-load-more">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setLimit((n) => n + PAGE)}
              >
                Load more ({results.length - limit} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function SearchResultCard({ item }: { item: SearchResultItem }) {
  const isPost = item.kind === 'post';
  const excerpt = item.excerpt || item.summary;

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`search-card cult-shadow search-card--${item.kind}`}
    >
      <div className="search-card__top">
        <span className={`search-card__badge search-card__badge--${item.kind}`}>
          {isPost ? 'X Post' : 'Article'}
        </span>
        <span className="search-card__source">{item.source}</span>
        <time className="search-card__time tabular-nums" dateTime={item.publishedAt}>
          {timeAgo(item.publishedAt)}
        </time>
      </div>

      {isPost ? (
        <>
          {item.handle && <span className="search-card__handle">@{item.handle}</span>}
          <blockquote className="search-card__quote">{excerpt}</blockquote>
        </>
      ) : (
        <>
          <h3 className="search-card__title">{item.title}</h3>
          {excerpt && <p className="search-card__excerpt">{excerpt}</p>}
        </>
      )}

      <footer className="search-card__foot">
        <span className="search-card__tag">{CATEGORY_LABELS[item.primary]}</span>
        <span className="search-card__open">{isPost ? 'Open on X ↗' : 'Read source ↗'}</span>
      </footer>
    </a>
  );
}
