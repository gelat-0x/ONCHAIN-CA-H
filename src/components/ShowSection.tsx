import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { ShowData, ShowEpisode } from '../types';
import {
  ONCHAIN_CASH_HOSTS,
  ONCHAIN_CASH_SEGMENTS,
  ONCHAIN_CASH_SHOW,
} from '../../shared/data/showConfig.ts';
import { LiveCountdown } from './LiveCountdown';
import { getShowCountdown } from '../lib/showSchedule';
import { EpisodeFrame } from './EpisodeFrame';

interface ShowSectionProps {
  show?: ShowData;
  onOpenEpisode?: (episode: ShowEpisode) => void;
}

const FALLBACK_SHOW: ShowData = {
  channelId: ONCHAIN_CASH_SHOW.youtubeChannelId,
  channelUrl: ONCHAIN_CASH_SHOW.youtubeChannelUrl,
  liveEmbedUrl: `https://www.youtube-nocookie.com/embed/live_stream?channel=${ONCHAIN_CASH_SHOW.youtubeChannelId}`,
  schedule: { ...ONCHAIN_CASH_SHOW.schedule },
  hosts: ONCHAIN_CASH_HOSTS,
  segments: ONCHAIN_CASH_SEGMENTS,
  episodes: [],
  source: 'youtube-rss',
  lastUpdated: new Date(0).toISOString(),
  cached: false,
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function ShowSection({ show, onOpenEpisode }: ShowSectionProps) {
  const data = show ?? FALLBACK_SHOW;
  const featured = data.episodes[0];
  const [isLiveWindow, setIsLiveWindow] = useState(
    () => getShowCountdown(new Date(), data.schedule).isLive,
  );

  useEffect(() => {
    const update = () => setIsLiveWindow(getShowCountdown(new Date(), data.schedule).isLive);
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, [data.schedule]);

  return (
    <section className="show-cinematic-hero" aria-labelledby="show-hero-title">
      <div className="show-cinematic-hero__media" aria-hidden="true">
        <div className="show-cinematic-hero__stars" />
        <div className="show-cinematic-hero__world" />
        <div className="show-cinematic-hero__grid" />
      </div>
      <div className="show-cinematic-hero__veil" aria-hidden="true" />

      <div className="show-cinematic-hero__content">
        <div className="show-cinematic-hero__intro">
          <div className="show-live-kicker">
            <span className="show-live-kicker__dot" />
            Every Saturday at 6 PM UTC
          </div>

          <h1 id="show-hero-title" className="show-cinematic-hero__title">
            ONCHAIN CA$H
          </h1>
          <p className="show-cinematic-hero__lead">
            The weekly breakdown of everything that happened onchain this week, with our personal
            take!
          </p>

          <div className="show-cinematic-hero__hosts" aria-label="Show hosts">
            <span>Hosted by</span>
            <a
              href={ONCHAIN_CASH_SHOW.xUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {ONCHAIN_CASH_SHOW.fraxForceHandle}
            </a>
          </div>

          <div className="show-hero-facts" aria-label="Show facts">
            <div>
              <span>When</span>
              <strong>Every Saturday, 6 PM UTC</strong>
            </div>
            <div>
              <span>Where</span>
              <strong>Live on X / YouTube</strong>
            </div>
            <a href="#show-topic-submit" className="show-hero-facts__submit">
              <span>Contribute</span>
              <strong>Submit your topic for the next show →</strong>
            </a>
          </div>

          <div className="show-cinematic-hero__actions">
            <a href="#show-catchup" className="btn btn-primary">Catch up now</a>
            <a href={data.channelUrl} target="_blank" rel="noopener noreferrer" className="show-ghost-link">
              Open channel ↗
            </a>
          </div>
        </div>

        <aside className="show-now-card" aria-label="Next live show and latest episode">
          <div className="show-now-card__head">
            <span>{isLiveWindow ? 'Live now' : 'Next broadcast'}</span>
            <strong>ONCHAIN CA$H</strong>
          </div>

          <LiveCountdown schedule={data.schedule} label="Next livestream starts in:" />

          {isLiveWindow ? (
            <div className="show-now-card__video">
              <iframe
                src={data.liveEmbedUrl}
                title="ONCHAIN CA$H live stream"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : featured ? (
            <button
              type="button"
              className="show-now-card__episode"
              onClick={() => onOpenEpisode?.(featured)}
              aria-label={`Open latest episode: ${featured.title}`}
            >
              <img src={featured.thumbnailUrl} alt="" />
              <EpisodeFrame dateLabel={formatDate(featured.publishedAt)} />
              <span className="show-now-card__play" aria-hidden="true">▶</span>
            </button>
          ) : (
            <div className="show-now-card__loading">Loading the official episode feed…</div>
          )}
        </aside>
      </div>

      <a href="#show-catchup" className="show-scroll-cue" aria-label="Scroll to latest shows">
        <span>Explore latest shows</span>
        <b>↓</b>
      </a>
    </section>
  );
}

/** Sticky mobile CTA — only show on the home thesis (“brand”) band. */
export function MobileWatchCta({ visible = false }: { visible?: boolean }) {
  useEffect(() => {
    const root = document.documentElement;
    if (visible) root.dataset.watchCta = 'on';
    else delete root.dataset.watchCta;
    return () => {
      delete root.dataset.watchCta;
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="mobile-watch-cta is-visible">
      <Link to="/show" className="btn btn-primary">
        Watch Show
      </Link>
    </div>
  );
}
