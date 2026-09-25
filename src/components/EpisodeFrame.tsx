import overlay from '../assets/show/episode-overlay.jpg';

interface EpisodeFrameProps {
  dateLabel: string;
}

export function EpisodeFrame({ dateLabel }: EpisodeFrameProps) {
  return (
    <>
      <span className="episode-frame" aria-hidden>
        <img src={overlay} alt="" className="episode-frame__glow" />
      </span>
      <span className="episode-frame__copy">
        <strong>ONCHAIN CA$H</strong>
        <span>Livestream</span>
        <small>Episode from {dateLabel}</small>
      </span>
    </>
  );
}
