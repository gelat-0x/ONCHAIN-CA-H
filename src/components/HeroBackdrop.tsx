import { useEffect, useRef, useState } from 'react';

const HERO_VIDEO = '/backgrounds/hub/0701.mp4';
const HERO_POSTER = '/backgrounds/hub/0701-poster.jpg';

/** Background media for hero sections. Assets live in `public/backgrounds/`. */
export function HeroBackdrop() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;
    video.setAttribute('muted', '');
    const tryPlay = () => {
      const play = video.play();
      if (play && typeof play.catch === 'function') {
        play.catch(() => {
          /* autoplay blocked — poster still shows */
        });
      }
    };
    tryPlay();
    video.addEventListener('loadeddata', tryPlay);
    return () => video.removeEventListener('loadeddata', tryPlay);
  }, []);

  return (
    <div className="hero-brutal__backdrop hero-public__backdrop" aria-hidden>
      <div className="hero-brutal__art-wrap">
        {videoOk ? (
          <video
            ref={videoRef}
            className="hero-brutal__video"
            src={HERO_VIDEO}
            poster={HERO_POSTER}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            disablePictureInPicture
            onError={() => setVideoOk(false)}
            onLoadedData={(e) => {
              const v = e.currentTarget;
              v.muted = true;
              void v.play().catch(() => undefined);
            }}
          />
        ) : (
          <img className="hero-brutal__video" src={HERO_POSTER} alt="" draggable={false} />
        )}
      </div>
      <div className="hero-brutal__fade hero-public__fade" />
    </div>
  );
}
