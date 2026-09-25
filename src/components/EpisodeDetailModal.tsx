import { useCallback, useEffect } from 'react';
import type { ShowData, ShowEpisode } from '../types';
import { hostsForEpisode } from '../../shared/data/showConfig';
import { formatShowDescription } from '../lib/formatShowDescription';

interface EpisodeDetailModalProps {
  episode: ShowEpisode | null;
  show: ShowData;
  onClose: () => void;
  onOpenEpisode?: (episode: ShowEpisode) => void;
}

function formatEpisodeDate(value: string): string {
  return new Intl.DateTimeFormat('en', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(value));
}

export function EpisodeDetailModal({
  episode,
  show,
  onClose,
  onOpenEpisode,
}: EpisodeDetailModalProps) {
  const handleKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!episode) return;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [episode, handleKey]);

  if (!episode) return null;

  const latest = show.episodes[0];
  const hosts = hostsForEpisode(episode.publishedAt, show.hosts);
  const description =
    formatShowDescription(episode.description) ||
    'Official weekly ONCHAIN CA$H episode from the show’s YouTube channel.';
  const showLatestLink = latest && latest.videoId !== episode.videoId;

  return (
    <div
      className="episode-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="episode-modal-title"
      onClick={onClose}
    >
      <div className="episode-modal__panel" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="episode-modal__close" onClick={onClose} aria-label="Close episode">
          ×
        </button>

        <div className="episode-modal__video">
          <iframe
            src={`${episode.embedUrl}?rel=0`}
            title={episode.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>

        <div className="episode-modal__content">
          <div className="episode-modal__main">
            <p className="section-eyebrow">Official ONCHAIN CA$H recording</p>
            <h2 id="episode-modal-title">{episode.title}</h2>
            <p className="episode-modal__description">{description}</p>
          </div>

          <aside className="episode-modal__facts" aria-label="Episode facts">
            <div>
              <span>Published</span>
              <strong>{formatEpisodeDate(episode.publishedAt)}</strong>
            </div>
            <div>
              <span>Live schedule</span>
              <strong>Saturday at 6 PM UTC</strong>
            </div>
            <div>
              <span>Hosted by</span>
              <strong className="episode-modal__hosts">
                {hosts.map((host, index) => (
                  <span key={host.handle}>
                    {index > 0 ? ' · ' : null}
                    <a href={host.url} target="_blank" rel="noopener noreferrer">
                      {host.handle}
                    </a>
                  </span>
                ))}
              </strong>
            </div>
            <a href={episode.watchUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Open on YouTube ↗
            </a>
            {showLatestLink && (
              <button
                type="button"
                className="episode-modal__latest"
                onClick={() => onOpenEpisode?.(latest)}
              >
                <span>Latest episode</span>
                <strong>{latest.title}</strong>
              </button>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
