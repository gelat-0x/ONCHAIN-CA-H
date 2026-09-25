import { useEffect, useMemo, useState } from 'react';
import stakeDaoBoost from '../assets/stakedao-boost.png';
import { formatUsd } from '../lib/formatUsd';
import { useIntersection } from '../hooks/useIntersection';

interface PegKeeperHeroProps {
  totalTvl: number;
  totalVolume24h: number;
  totalFrxUsdInPools: number;
  activePools: number;
  onNavClick: (anchor: string) => void;
  onScrollDown: () => void;
}

const FACT_MS = 3400;

export function PegKeeperHero({
  totalTvl,
  totalVolume24h,
  totalFrxUsdInPools,
  activePools,
  onNavClick,
  onScrollDown,
}: PegKeeperHeroProps) {
  const { ref, visible } = useIntersection();
  const facts = useMemo(
    () =>
      [
        { label: 'Total value locked', value: formatUsd(totalTvl) },
        { label: 'frxUSD in pools', value: formatUsd(totalFrxUsdInPools) },
        { label: '24h volume', value: formatUsd(totalVolume24h) },
        { label: 'Active PegKeepers', value: String(activePools) },
      ] as const,
    [totalTvl, totalFrxUsdInPools, totalVolume24h, activePools],
  );
  const [factIndex, setFactIndex] = useState(0);
  const [factVisible, setFactVisible] = useState(true);

  useEffect(() => {
    if (facts.length <= 1) return;
    let hideTimer = 0;
    const tick = window.setInterval(() => {
      setFactVisible(false);
      hideTimer = window.setTimeout(() => {
        setFactIndex((i) => (i + 1) % facts.length);
        setFactVisible(true);
      }, 280);
    }, FACT_MS);
    return () => {
      window.clearInterval(tick);
      window.clearTimeout(hideTimer);
    };
  }, [facts.length]);

  const fact = facts[factIndex] ?? facts[0];

  return (
    <section
      ref={ref}
      className={`pegkeeper-hero-block pegkeeper-hero-block--frame fade-in ${visible ? 'visible' : ''}`}
    >
      <div id="pegkeeper-hero" className="pegkeeper-hero-block__left">
        <p className="section-eyebrow">frxUSD PegKeeper Family</p>
        <h1 className="pegkeeper-hero-block__title">
          frxUSD PegKeepers on Curve
        </h1>
        <p className="pegkeeper-hero-block__copy">
          Pools that hold the dollar and share positive yield from frxUSD reserves.
        </p>

        <div className="pegkeeper-kpi-strip" role="list">
          <div className="pegkeeper-kpi" role="listitem">
            <span className="pegkeeper-kpi__value tabular-nums">{formatUsd(totalTvl)}</span>
            <span className="pegkeeper-kpi__label">TVL</span>
          </div>
          <div className="pegkeeper-kpi" role="listitem">
            <span className="pegkeeper-kpi__value tabular-nums">{formatUsd(totalVolume24h)}</span>
            <span className="pegkeeper-kpi__label">24h Volume</span>
          </div>
          <div className="pegkeeper-kpi" role="listitem">
            <span className="pegkeeper-kpi__value tabular-nums">{activePools}</span>
            <span className="pegkeeper-kpi__label">PegKeepers</span>
          </div>
        </div>

        <div className="pegkeeper-fact-rotate" aria-live="polite">
          <p className="pegkeeper-fact-rotate__eyebrow">Key metrics</p>
          <div
            className={`pegkeeper-fact-rotate__panel${factVisible ? ' is-visible' : ''}`}
            key={fact.label}
          >
            <span className="pegkeeper-fact-rotate__value tabular-nums">{fact.value}</span>
            <span className="pegkeeper-fact-rotate__label">{fact.label}</span>
          </div>
          <div className="pegkeeper-fact-rotate__dots" aria-hidden>
            {facts.map((item, i) => (
              <span
                key={item.label}
                className={`pegkeeper-fact-rotate__dot${i === factIndex ? ' is-active' : ''}`}
              />
            ))}
          </div>
        </div>

        <nav className="pegkeeper-nav" aria-label="PegKeeper sections">
          <button type="button" className="pegkeeper-nav__btn pegkeeper-nav__btn--primary" onClick={onScrollDown}>
            Explore pools
          </button>
          <button type="button" className="pegkeeper-nav__btn" onClick={() => onNavClick('pegkeeper-guide')}>
            About PegKeepers
          </button>
          <a
            href="https://www.stakedao.org/yield?tokenFilter=usd&search=frxUSD"
            target="_blank"
            rel="noopener noreferrer"
            className="pegkeeper-nav__btn pegkeeper-nav__btn--boost"
          >
            <img src={stakeDaoBoost} alt="" className="pegkeeper-nav__boost-icon" aria-hidden />
            <span>Boosted yield</span>
            <span className="pegkeeper-nav__boost-arrow" aria-hidden>↗</span>
          </a>
        </nav>

        <button
          type="button"
          className="pegkeeper-scroll-cue pegkeeper-scroll-cue--inline"
          onClick={onScrollDown}
          aria-label="Scroll to pool list"
        >
          <span className="pegkeeper-scroll-cue__label">Pool list</span>
          <span className="pegkeeper-scroll-cue__arrow" aria-hidden>↓</span>
        </button>
      </div>
    </section>
  );
}
