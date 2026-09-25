import { useRef, useState } from 'react';

const PEGKEEPER_BG_MP4 = '/videos/pegkeeper-background.mp4';
const PEGKEEPER_BG_FALLBACK = '/videos/pegkeeper-background.mov';
const PEGKEEPER_POSTER = '/videos/pegkeeper-background-poster.jpg';
const PLAYBACK_RATE = 0.62;

/** Full-page ambient background for the PegKeeper route. */
export function PegKeeperBackdrop() {
  const [videoOk, setVideoOk] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const applyPlaybackRate = () => {
    const el = videoRef.current;
    if (el) el.playbackRate = PLAYBACK_RATE;
  };

  return (
    <div className="pegkeeper-backdrop" aria-hidden>
      {videoOk ? (
        <video
          ref={videoRef}
          className="pegkeeper-backdrop__video"
          poster={PEGKEEPER_POSTER}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onLoadedData={applyPlaybackRate}
          onCanPlay={applyPlaybackRate}
          onError={() => setVideoOk(false)}
        >
          <source src={PEGKEEPER_BG_MP4} type="video/mp4" />
          <source src={PEGKEEPER_BG_FALLBACK} type="video/quicktime" />
        </video>
      ) : (
        <img className="pegkeeper-backdrop__video" src={PEGKEEPER_POSTER} alt="" />
      )}
      <div className="pegkeeper-backdrop__scrim" />
    </div>
  );
}
