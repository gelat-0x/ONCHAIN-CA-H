import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useIntersection } from '../hooks/useIntersection';

const LAYERS = [
  {
    key: 'foundation',
    index: '01',
    label: 'Foundation',
    title: 'Frax Finance & Partners',
    body: 'Bringing real innovation to the table.',
  },
  {
    key: 'force',
    index: '02',
    label: 'Force',
    title: 'Frax Force',
    body: 'A growing network of believers who recognize that innovation early and choose to build around it.',
  },
  {
    key: 'cult',
    index: '03',
    label: 'Cult',
    title: 'Cult',
    body: 'Shared conviction turns into culture, and that culture grows stronger with every new builder, listener, and participant.',
  },
  {
    key: 'education',
    index: '04',
    label: 'Education',
    title: 'Education',
    body: 'That energy naturally turns outward: into context, explanation, and better ways to help others understand where finance is going.',
  },
  {
    key: 'surface',
    index: '05',
    label: 'Surface',
    title: 'ONCHAIN CA$H',
    body: 'A brand formed out of that energy, the living expression of the stack, made visible.',
  },
] as const;

export function HomeThesis() {
  const { ref, visible } = useIntersection(0.35);
  const videoRef = useRef<HTMLVideoElement>(null);
  const playedRef = useRef(false);
  const [openLayer, setOpenLayer] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !visible || playedRef.current) return;

    playedRef.current = true;
    // Don't seek to 0 — resetting on enter causes a visible pop/reload.
    const play = video.play();
    if (play && typeof play.catch === 'function') {
      play.catch(() => {
        /* autoplay may be blocked; first frame still paints from preload */
      });
    }
  }, [visible]);

  return (
    <section
      ref={ref}
      className={`section home-block home-thesis fade-in ${visible ? 'visible' : ''}`}
      id="home-thesis"
    >
      <div className="home-thesis__media home-block__exit-content" aria-hidden>
        <video
          ref={videoRef}
          className="home-thesis__video"
          src="/videos/0729.mp4"
          muted
          playsInline
          preload={visible ? 'auto' : 'metadata'}
          loop={false}
          disablePictureInPicture
        />
        <div className="home-thesis__veil" />
      </div>

      <div className="home-block__inner home-thesis__inner home-block__exit-content">
        <div className="home-thesis__left">
          <h2 className="home-thesis__title">
            <span className="home-thesis__title-line">
              <span className="home-thesis__title-brand">ONCHAIN CA$H</span>
              {' '}is a brand
            </span>
            <span className="home-thesis__title-line">built on top of</span>
            <span className="home-thesis__title-line home-thesis__title-line--accent">
              Frax Force.
            </span>
          </h2>
          <p className="home-thesis__show-note">
            One of our first ONCHAIN CA$H products is the weekly live show, every Friday we go live
            and talk through what moved onchain that week.
          </p>
          <Link to="/show" className="home-thesis__show-cta">
            Check out our show
          </Link>
        </div>

        <ol className="belief-stack" aria-label="How ONCHAIN CA$H is built">
          {LAYERS.map((layer, i) => {
            const expanded = openLayer === layer.key;
            return (
              <li
                key={layer.key}
                className={`belief-stack__layer belief-stack__layer--${layer.key}${
                  expanded ? ' is-open' : ''
                }`}
                style={
                  {
                    /* 0 = foundation (bottom / widest), 4 = surface (top / smallest) */
                    '--stack-rise': i,
                    '--stack-z': i + 1,
                  } as CSSProperties
                }
              >
                <button
                  type="button"
                  className="belief-stack__hit"
                  aria-expanded={expanded}
                  onClick={() =>
                    setOpenLayer((current) => (current === layer.key ? null : layer.key))
                  }
                >
                  <div className="belief-stack__meta">
                    <span className="belief-stack__index">{layer.index}</span>
                    <span className="belief-stack__label">{layer.label}</span>
                  </div>
                  <h3 className="belief-stack__title">{layer.title}</h3>
                  <p className="belief-stack__body">{layer.body}</p>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
