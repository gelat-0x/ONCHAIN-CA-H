import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import type { ShowEpisode } from '../types';
import { formatShowDescription } from '../lib/formatShowDescription';
import { EpisodeFrame } from './EpisodeFrame';

interface EpisodeCarouselProps {
  episodes: ShowEpisode[];
  onOpen: (episode: ShowEpisode) => void;
}

function formatEpisodeDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

function summary(description: string): string {
  const clean = formatShowDescription(description).replace(/\s+/g, ' ').trim();
  if (!clean) {
    return 'The latest weekly ONCHAIN CA$H conversation on markets, DeFi, and the Frax ecosystem.';
  }
  return clean.length > 320 ? `${clean.slice(0, 317)}…` : clean;
}

function relativeOffset(index: number, activeIndex: number, total: number): number {
  let offset = index - activeIndex;
  if (offset > total / 2) offset -= total;
  if (offset < -total / 2) offset += total;
  return offset;
}

export function EpisodeCarousel({ episodes, onOpen }: EpisodeCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = episodes[activeIndex];

  if (!active) return null;

  // ← focuses the card on the left; → focuses the card on the right.
  const slideDeckLeft = () => {
    setActiveIndex((current) => (current - 1 + episodes.length) % episodes.length);
  };
  const slideDeckRight = () => {
    setActiveIndex((current) => (current + 1) % episodes.length);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      slideDeckLeft();
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      slideDeckRight();
    }
    if (event.key === 'Enter') onOpen(active);
  };

  return (
    <section
      id="show-catchup"
      className="show-catchup"
      aria-labelledby="show-catchup-title"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <div className="show-catchup__heading">
        <h2 id="show-catchup-title">Catch up the latest shows</h2>
      </div>

      <div className="episode-orbit" aria-label="Episode carousel">
        <div className="episode-orbit__nav-wrap episode-orbit__nav-wrap--prev">
          <span className="episode-orbit__nav-label">Newer episodes</span>
          <button
            type="button"
            className="episode-orbit__nav"
            onClick={slideDeckLeft}
            aria-label="Newer episodes"
          >
            ←
          </button>
        </div>

        <div className="episode-orbit__stage">
          {episodes.map((episode, index) => {
            const offset = relativeOffset(index, activeIndex, episodes.length);
            const distance = Math.abs(offset);
            const visible = distance <= 2;
            const style = {
              '--episode-offset': offset,
              '--episode-depth': distance,
            } as CSSProperties;

            return (
              <button
                type="button"
                key={episode.videoId}
                className={`episode-orbit__card ${visible ? 'episode-orbit__card--visible' : ''} ${offset === 0 ? 'episode-orbit__card--active' : ''}`}
                style={style}
                onClick={() => (offset === 0 ? onOpen(episode) : setActiveIndex(index))}
                aria-label={offset === 0 ? `Read more about ${episode.title}` : `Select ${episode.title}`}
                aria-hidden={!visible}
                tabIndex={visible ? 0 : -1}
              >
                <img src={episode.thumbnailUrl} alt="" loading={distance > 1 ? 'lazy' : 'eager'} />
                <EpisodeFrame dateLabel={formatEpisodeDate(episode.publishedAt)} />
                {offset === 0 && <span className="episode-orbit__play" aria-hidden="true">▶</span>}
              </button>
            );
          })}
        </div>

        <div className="episode-orbit__nav-wrap episode-orbit__nav-wrap--next">
          <span className="episode-orbit__nav-label">Older episodes</span>
          <button
            type="button"
            className="episode-orbit__nav"
            onClick={slideDeckRight}
            aria-label="Older episodes"
          >
            →
          </button>
        </div>
      </div>

      <div className="episode-orbit__details" aria-live="polite">
        <div>
          <span className="episode-orbit__date">
            {activeIndex === 0 ? 'Latest episode' : 'From the archive'} · {formatEpisodeDate(active.publishedAt)}
          </span>
          <h3>{active.title}</h3>
          <p>{summary(active.description)}</p>
        </div>
        <button type="button" className="btn btn-primary episode-orbit__read" onClick={() => onOpen(active)}>
          Read more
        </button>
      </div>

      <div className="episode-orbit__counter tabular-nums" aria-hidden="true">
        {String(activeIndex + 1).padStart(2, '0')} / {String(episodes.length).padStart(2, '0')}
      </div>
    </section>
  );
}
