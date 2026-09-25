import type { CSSProperties } from 'react';
import type { NewsItem } from '../types';
import { categoryLabel } from '../lib/newsHotScore';
import { articlePrimary } from '../lib/newsFilters';

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

interface HottestNewsRailProps {
  items: NewsItem[];
}

export function HottestNewsRail({ items }: HottestNewsRailProps) {
  if (!items.length) return null;

  return (
    <section className="hot-rail" aria-label="Hot topics">
      <div className="hot-rail__glow" aria-hidden />
      <header className="hot-rail__head">
        <div>
          <p className="hot-rail__eyebrow">✦ Trending</p>
          <h2 className="hot-rail__title">Hot topics</h2>
        </div>
        <span className="hot-rail__live">
          <span className="hot-rail__pulse" aria-hidden />
          Live
        </span>
      </header>

      <ul className="hot-rail__track">
        {items.map((item, i) => {
          const primary = articlePrimary(item);
          const rank = i + 1;
          return (
            <li
              key={item.id}
              className={`hot-card ${i === 0 ? 'hot-card--hero' : ''}`}
              style={{ '--hot-i': i } as CSSProperties}
            >
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hot-card__link"
              >
                <span className="hot-card__rank tabular-nums">#{rank}</span>
                <span className="hot-card__chip">{categoryLabel(primary)}</span>
                <span className="hot-card__source">{item.source}</span>
                <span className="hot-card__headline">{item.title}</span>
                {item.summary && (
                  <span className="hot-card__tease">{item.summary}</span>
                )}
                <span className="hot-card__foot">
                  <span className="hot-card__time tabular-nums">{timeAgo(item.publishedAt)}</span>
                  <span className="hot-card__cta">Read ↗</span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
