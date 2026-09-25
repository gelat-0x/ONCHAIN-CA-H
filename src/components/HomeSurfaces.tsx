import { Link } from 'react-router-dom';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useUiPrefs } from '../context/UiPrefs';
import { useIntersection } from '../hooks/useIntersection';
import { formatUsd } from '../lib/formatUsd';
import { PEGKEEPER_STABLECOIN_SYMBOLS } from '../lib/tokenLogos';
import { ComingLoad, LearnBook, RadioWave, ShowLive, StudioPosts } from './HubVisuals';
import { TokenLogo } from './TokenLogo';

const CYCLE_MS = 6000;
const TOKEN_STEP_MS = 2800;
const ORBIT_SLOTS = 8;
const SPOTLIGHT_MS = 4000;
const WAVE_ROWS = 8;

interface SurfaceCard {
  id?: string;
  to: string;
  title: string;
  copy: string;
  liveKey: 'pegkeeper' | 'studio' | 'show' | 'learn';
}

const CARDS: SurfaceCard[] = [
  {
    to: '/pegkeeper',
    title: 'PegKeeper Family',
    copy: 'The next generation of successful DeFi stablecoins is paired with frxUSD in Curve pools. frxUSD forwards Treasury reserves back to the ecosystem.',
    liveKey: 'pegkeeper',
  },
  {
    to: '/studio',
    title: 'Studio',
    copy: 'Create your own ecosystem posts in seconds using structured data, ready to turn into clean content.',
    liveKey: 'studio',
  },
  {
    to: '/show',
    title: 'ONCHAIN CA$H Show',
    copy: 'Livestream with Frax Force on every Saturday. A breakdown talk of the week across Frax and the broader ecosystem.',
    liveKey: 'show',
  },
  {
    id: 'home-learn',
    to: '/learn',
    title: 'Learn',
    copy: 'Follow the origins, mechanics, and moving parts behind the ecosystem so you can understand the bigger picture.',
    liveKey: 'learn',
  },
];

const STUDIO_LINES = ['Ready to post', 'Spread content', 'Post about metrics', 'Post APR'];
const LEARN_LINES = ['Learn at your pace', 'Dive in deeper', 'Explore', 'Step up'];
const RADIO_LINES = ['The newest hits', 'Catch the vibe'];

function SurfacesWaves() {
  return (
    <div className="home-surfaces__waves" aria-hidden>
      <div className="home-surfaces__waves-track">
        {[0, 1].map((copy) => (
          <svg
            key={copy}
            className="home-surfaces__waves-svg"
            viewBox={`0 0 1440 ${WAVE_ROWS * 56}`}
            preserveAspectRatio="none"
          >
            {Array.from({ length: WAVE_ROWS }, (_, i) => {
              const y = 28 + i * 56;
              const amp = 11 + (i % 3) * 3;
              const shift = (i % 5) * 36;
              const d = [
                `M ${-80 + shift} ${y}`,
                `C ${120 + shift} ${y - amp}, ${240 + shift} ${y + amp}, ${360 + shift} ${y}`,
                `S ${600 + shift} ${y - amp}, ${720 + shift} ${y}`,
                `S ${960 + shift} ${y + amp}, ${1080 + shift} ${y}`,
                `S ${1320 + shift} ${y - amp}, ${1520 + shift} ${y}`,
              ].join(' ');
              return (
                <path
                  key={i}
                  className={`home-surfaces__wave home-surfaces__wave--${(i % 3) + 1}`}
                  d={d}
                  fill="none"
                  vectorEffect="non-scaling-stroke"
                />
              );
            })}
          </svg>
        ))}
      </div>
    </div>
  );
}

function useCycleIndex(length: number, interval: number, paused: boolean, reduceMotion: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (reduceMotion || paused || length < 2) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % length), interval);
    return () => window.clearInterval(id);
  }, [length, interval, paused, reduceMotion]);
  return index;
}

function CycleLine({
  lines,
  reduceMotion,
  className = 'hub-teaser__live',
}: {
  lines: string[];
  reduceMotion: boolean;
  className?: string;
}) {
  const index = useCycleIndex(lines.length, CYCLE_MS, false, reduceMotion);
  const line = lines[index] ?? lines[0] ?? '';
  return (
    <span className={className} aria-live="polite">
      <span key={line} className="hub-cycle">
        {line}
      </span>
    </span>
  );
}

function nextShowUtc(now: number): Date {
  const d = new Date(now);
  const day = d.getUTCDay();
  let add = (6 - day + 7) % 7;
  const candidate = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + add, 18, 0, 0));
  if (candidate.getTime() <= now) {
    candidate.setUTCDate(candidate.getUTCDate() + (add === 0 ? 7 : 0));
    if (candidate.getTime() <= now) candidate.setUTCDate(candidate.getUTCDate() + 7);
  }
  return candidate;
}

function showTimeLeft(now: number): string {
  const ms = Math.max(0, nextShowUtc(now).getTime() - now);
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h left`;
  const mins = Math.max(1, Math.floor((ms % 3_600_000) / 60_000));
  return `${mins}m left`;
}

function TokenOrbit({ reduceMotion, paused }: { reduceMotion: boolean; paused: boolean }) {
  const symbols = PEGKEEPER_STABLECOIN_SYMBOLS;
  const batchCount = Math.max(1, Math.ceil(symbols.length / ORBIT_SLOTS));
  const batch = useCycleIndex(batchCount, TOKEN_STEP_MS, paused, reduceMotion);
  const start = batch * ORBIT_SLOTS;

  return (
    <div className="hub-orbit" aria-hidden>
      <div className={`hub-orbit__spin ${reduceMotion ? 'is-static' : ''}`}>
        {Array.from({ length: ORBIT_SLOTS }, (_, slot) => {
          const symbol = symbols[(start + slot) % symbols.length];
          const angle = (360 / ORBIT_SLOTS) * slot;
          return (
            <div
              key={slot}
              className="hub-orbit__slot"
              style={{ transform: `rotate(${angle}deg) translate(58px) rotate(${-angle}deg)` }}
            >
              <div className={`hub-orbit__face ${reduceMotion ? 'is-static' : ''}`}>
                <TokenLogo symbol={symbol} size="sm" eager />
              </div>
            </div>
          );
        })}
      </div>
      <TokenLogo symbol="frxUSD" size="md" className="hub-orbit__core" eager />
    </div>
  );
}

interface HomeSurfacesProps {
  totalTvl?: number;
  activePools?: number;
  poolCount?: number;
  totalVolume24h?: number;
  partnerCount?: number;
}

export function HomeSurfaces({
  totalTvl,
  activePools,
  poolCount,
  totalVolume24h,
  partnerCount,
}: HomeSurfacesProps) {
  const { ref, visible } = useIntersection(0.28);
  const { setOnchainRadio } = useUiPrefs();
  const [revealed, setRevealed] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false,
  );
  const [spotlight, setSpotlight] = useState(0);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const openOnchainRadio = () => {
    setOnchainRadio(true);
    window.dispatchEvent(new CustomEvent('onchain-play-music'));
  };

  useEffect(() => {
    if (window.matchMedia('(max-width: 768px)').matches) {
      setRevealed(true);
      return;
    }

    const el = document.getElementById('home-surfaces');
    if (!el) return;

    const update = () => {
      const rect = el.getBoundingClientRect();
      const threshold = window.innerHeight * 0.42;
      if (rect.top < threshold) {
        setRevealed(true);
        window.removeEventListener('scroll', update);
        window.removeEventListener('resize', update);
      }
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  useEffect(() => {
    if (reduceMotion || paused || !visible) return;
    const id = window.setInterval(() => {
      setSpotlight((i) => (i + 1) % CARDS.length);
    }, SPOTLIGHT_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion, visible]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const pegkeeperLines = useMemo(() => {
    const pools = activePools ?? poolCount;
    const lines: string[] = [];
    if (totalTvl != null) lines.push(`${formatUsd(totalTvl)} TVL`);
    if (pools != null) lines.push(`${pools} pools`);
    if (totalVolume24h != null) lines.push(`${formatUsd(totalVolume24h)} 24h volume`);
    if (partnerCount != null) lines.push(`${partnerCount} partners`);
    return lines.length ? lines : ['Live PegKeeper family'];
  }, [totalTvl, activePools, poolCount, totalVolume24h, partnerCount]);

  const showLines = useMemo(
    () => ['Next Saturday', showTimeLeft(now), 'Stay ahead', 'Frax Force keeps you in the loop'],
    [now],
  );

  const artFor = (key: SurfaceCard['liveKey']): ReactNode => {
    if (key === 'pegkeeper') return <TokenOrbit reduceMotion={reduceMotion} paused={!visible} />;
    if (key === 'studio') return <StudioPosts />;
    if (key === 'show') return <ShowLive />;
    return <LearnBook />;
  };

  const linesFor = (key: SurfaceCard['liveKey']): string[] => {
    if (key === 'pegkeeper') return pegkeeperLines;
    if (key === 'studio') return STUDIO_LINES;
    if (key === 'show') return showLines;
    return LEARN_LINES;
  };

  return (
    <section
      ref={ref}
      className={`section home-block home-surfaces fade-in ${visible ? 'visible' : ''} ${
        revealed ? 'home-surfaces--revealed' : ''
      }`}
      id="home-surfaces"
    >
      <SurfacesWaves />
      <div className="home-surfaces__veil" aria-hidden />

      <div className="home-block__inner home-block__exit-content">
        <div className="home-surfaces__head">
          <h2 className="section-title home-surfaces__title">What lives here</h2>
        </div>

        <div className="hub-teaser__grid">
          {CARDS.map((card, i) => (
            <Link
              key={card.title}
              id={card.id}
              to={card.to}
              className={`hub-teaser__card ${spotlight === i && !reduceMotion ? 'is-spotlight' : ''}`}
              style={{ animationDelay: `${i * 70}ms` }}
              onMouseEnter={() => {
                setPaused(true);
                setSpotlight(i);
              }}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => {
                setPaused(true);
                setSpotlight(i);
              }}
              onBlur={() => setPaused(false)}
            >
              <span className="hub-teaser__sheen" aria-hidden />
              <div className="hub-teaser__art">{artFor(card.liveKey)}</div>
              <div className="hub-teaser__body">
                <span className="hub-teaser__title">{card.title}</span>
                <span className="hub-teaser__copy">{card.copy}</span>
                <CycleLine lines={linesFor(card.liveKey)} reduceMotion={reduceMotion || !visible} />
              </div>
              <span className="hub-teaser__progress" aria-hidden />
            </Link>
          ))}
        </div>

        <div className="home-surfaces__lower">
          <button
            type="button"
            className="home-surfaces__soon-card home-surfaces__soon-card--live"
            onClick={openOnchainRadio}
          >
            <span className="hub-teaser__sheen" aria-hidden />
            <RadioWave />
            <span className="home-surfaces__soon-label">ONCHAIN RADIO</span>
            <CycleLine
              lines={RADIO_LINES}
              reduceMotion={reduceMotion || !visible}
              className="home-surfaces__soon-copy"
            />
            <span className="home-surfaces__soon-note home-surfaces__soon-note--new">New</span>
          </button>
          <div className="home-surfaces__coming">
            <span className="hub-teaser__sheen" aria-hidden />
            <p className="home-surfaces__coming-beta">
              All of this is still in beta and will expand over time.
            </p>
            <ComingLoad />
          </div>
        </div>
      </div>
    </section>
  );
}
