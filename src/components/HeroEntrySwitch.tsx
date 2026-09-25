import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PEGKEEPER_STABLECOIN_SYMBOLS, resolveTokenLogoUrl } from '../lib/tokenLogos';
import { TokenLogo } from './TokenLogo';
import { LearnBook, ShowLive, StudioPosts } from './HubVisuals';

const ENTRIES = [
  {
    id: 'pegkeeper',
    to: '/pegkeeper',
    label: 'PegKeeper Family',
    line: 'Scan the live frxUSD family',
    cta: 'Explore',
  },
  {
    id: 'studio',
    to: '/studio',
    label: 'Studio',
    line: 'Turn live data into posts',
    cta: 'Create',
  },
  {
    id: 'show',
    to: '/show',
    label: 'ONCHAIN CA$H Show',
    line: 'Friday 18:00 UTC with Frax Force',
    cta: 'Watch',
  },
  {
    id: 'learn',
    to: '/learn',
    label: 'Learn',
    line: 'Origins, mechanics, the bigger picture',
    cta: 'Start',
  },
] as const;

const CYCLE_MS = 6000;
const REAR_SWAP_MS = 1850;

const PARTNER_TOKENS = PEGKEEPER_STABLECOIN_SYMBOLS.filter(
  (symbol) => symbol !== 'frxUSD' && Boolean(resolveTokenLogoUrl(symbol)),
);

function PegKeeperFaces({
  active,
  reduceMotion,
}: {
  active: boolean;
  reduceMotion: boolean;
}) {
  const [swap, setSwap] = useState(0);
  const partners = PARTNER_TOKENS.length ? PARTNER_TOKENS : PEGKEEPER_STABLECOIN_SYMBOLS;

  useEffect(() => {
    if (!active || reduceMotion || partners.length < 2) return;
    const id = window.setInterval(() => setSwap((s) => s + 1), REAR_SWAP_MS);
    return () => window.clearInterval(id);
  }, [active, reduceMotion, partners.length]);

  const rear = useMemo(() => {
    const a = partners[swap % partners.length];
    const b = partners[(swap + 1) % partners.length];
    return [a, b] as const;
  }, [partners, swap]);

  return (
    <div className="hero-entry__coins" aria-hidden>
      <TokenLogo symbol="frxUSD" size="md" className="hero-entry__coin hero-entry__coin--1" eager />
      {rear.map((symbol, i) => (
        <TokenLogo
          key={`${i}-${symbol}`}
          symbol={symbol}
          size="md"
          className={`hero-entry__coin hero-entry__coin--${i + 2}`}
          eager
        />
      ))}
    </div>
  );
}

export function HeroEntrySwitch() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduceMotion || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % ENTRIES.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [paused, reduceMotion]);

  const entry = ENTRIES[index];

  return (
    <div
      className="hero-entry"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="hero-entry__visual">
        <div className={`hero-entry__face ${entry.id === 'pegkeeper' ? 'is-on' : ''}`}>
          <PegKeeperFaces active={entry.id === 'pegkeeper'} reduceMotion={reduceMotion} />
        </div>
        <div className={`hero-entry__face ${entry.id === 'studio' ? 'is-on' : ''}`}>
          <StudioPosts mini />
        </div>
        <div className={`hero-entry__face ${entry.id === 'show' ? 'is-on' : ''}`}>
          <ShowLive mini />
        </div>
        <div className={`hero-entry__face ${entry.id === 'learn' ? 'is-on' : ''}`}>
          <LearnBook mini />
        </div>
      </div>

      <div className="hero-entry__copy" key={entry.id}>
        <p className="hero-entry__label">{entry.label}</p>
        <p className="hero-entry__line">{entry.line}</p>
      </div>

      <button type="button" className="hero-entry__cta" onClick={() => navigate(entry.to)}>
        <span>{entry.cta}</span>
        <span aria-hidden>→</span>
      </button>

      <div className="hero-entry__dots" role="tablist" aria-label="What you can do">
        {ENTRIES.map((item, i) => (
          <button
            key={item.to}
            type="button"
            className={`hero-entry__dot ${i === index ? 'is-active' : ''}`}
            aria-label={item.label}
            aria-current={i === index ? 'true' : undefined}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}
