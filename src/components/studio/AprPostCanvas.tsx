import { forwardRef } from 'react';
import type { PoolData } from '../../types';
import { formatUsd } from '../../lib/formatUsd';
import { formatPoolApr, poolChartColor } from '../../lib/poolChartColor';
import {
  studioAprLabel,
  studioBaseApr,
  studioBaseAprLabel,
  studioDisplayApr,
  studioIsOnlyBoostApr,
  studioShowBaseApr,
} from '../../lib/studioApr';
import { STUDIO_EXPORT_HEIGHT, STUDIO_EXPORT_WIDTH } from '../../lib/studioExport';
import { studioAccentForTone, studioToneClass } from '../../lib/studioTone';
import {
  studioBackgroundBase,
  studioBackgroundTone,
} from '../../../shared/constants/studioBackgrounds';
import { TokenLogo } from '../TokenLogo';
import { StudioCanvasBackground } from './StudioCanvasBackground';
import onlyBoostMark from '../../assets/onlyboost.png';

interface AprPostCanvasProps {
  pools: PoolData[];
  backgroundId: string;
}

function poolSymbol(pool: PoolData): string {
  return pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id;
}

function headerTitle(_pools: PoolData[]): { main: string; pairStyle: boolean } {
  return {
    main: 'frxUSD pegkeeper yields',
    pairStyle: false,
  };
}

function CoinPair({
  pool,
  accent,
  variant,
}: {
  pool: PoolData;
  accent: string;
  variant: 'hero' | 'dual' | 'triple';
}) {
  return (
    <div className={`apr-canvas__coins apr-canvas__coins--${variant}`} aria-hidden>
      <TokenLogo
        symbol="frxUSD"
        fallbackInitials="FX"
        fallbackColor="#ffffff"
        size="2xl"
        eager
        className="apr-canvas__coin apr-canvas__coin--base"
      />
      <TokenLogo
        symbol={poolSymbol(pool)}
        poolId={pool.id}
        fallbackInitials={pool.partnerInitials}
        fallbackColor={accent}
        size="2xl"
        eager
        className="apr-canvas__coin apr-canvas__coin--pair"
      />
    </div>
  );
}

function AprBlock({ pool, accent }: { pool: PoolData; accent: string }) {
  const apr = studioDisplayApr(pool);
  const onlyBoost = studioIsOnlyBoostApr(pool);

  return (
    <div className="apr-canvas__apr-block">
      <div className={`apr-canvas__apr-kicker ${onlyBoost ? 'is-boost' : ''}`}>
        {onlyBoost ? (
          <>
            <img src={onlyBoostMark} alt="" className="apr-canvas__onlyboost" />
            <span className="apr-canvas__apr-label">APR by Stake DAO</span>
          </>
        ) : (
          <span className="apr-canvas__apr-label">{studioAprLabel(pool)}</span>
        )}
      </div>
      <span className="apr-canvas__apr-value tabular-nums" style={{ color: accent }}>
        {formatPoolApr(apr)}
      </span>
      {studioShowBaseApr(pool) && (
        <div className="apr-canvas__apr-secondary">
          <span className="apr-canvas__apr-secondary-label">{studioBaseAprLabel(pool)}</span>
          <span className="apr-canvas__apr-secondary-value tabular-nums">
            {formatPoolApr(studioBaseApr(pool))}
          </span>
        </div>
      )}
    </div>
  );
}

function StatRow({ pool, layout }: { pool: PoolData; layout: 'inline' | 'stack' }) {
  return (
    <div className={`apr-canvas__stats apr-canvas__stats--${layout}`}>
      <div className="apr-canvas__stat">
        <span className="apr-canvas__stat-label">TVL</span>
        <span className="apr-canvas__stat-value tabular-nums">{formatUsd(pool.tvl)}</span>
      </div>
      <div className="apr-canvas__stat">
        <span className="apr-canvas__stat-label">Volume</span>
        <span className="apr-canvas__stat-value tabular-nums">{formatUsd(pool.volume24h)}</span>
      </div>
    </div>
  );
}

function HeroSinglePanel({ pool, accent }: { pool: PoolData; accent: string }) {
  return (
    <div className="apr-canvas__hero">
      <div className="apr-canvas__hero-content">
        <AprBlock pool={pool} accent={accent} />
        <StatRow pool={pool} layout="inline" />
      </div>
      <div className="apr-canvas__hero-side">
        <p className="apr-canvas__pair apr-canvas__pair--hero">{pool.name}</p>
        <CoinPair pool={pool} accent={accent} variant="hero" />
      </div>
    </div>
  );
}

function PairPanel({
  pool,
  accent,
  highlighted,
  compact,
}: {
  pool: PoolData;
  accent: string;
  highlighted: boolean;
  compact?: boolean;
}) {
  return (
    <article
      className={`apr-canvas__panel ${highlighted ? 'apr-canvas__panel--highlight' : ''}`}
      style={{ ['--panel-accent' as string]: accent }}
    >
      <div className="apr-canvas__pair-meta">
        <p className="apr-canvas__pair">{pool.name}</p>
      </div>
      <AprBlock pool={pool} accent={accent} />
      <CoinPair pool={pool} accent={accent} variant={compact ? 'triple' : 'dual'} />
      <StatRow pool={pool} layout="stack" />
    </article>
  );
}

export const AprPostCanvas = forwardRef<HTMLDivElement, AprPostCanvasProps>(
  function AprPostCanvas({ pools, backgroundId }, ref) {
    const count = pools.length;
    const tone = studioBackgroundTone(backgroundId);
    const layoutClass =
      count >= 3 ? 'apr-canvas--triple' : count === 2 ? 'apr-canvas--dual' : 'apr-canvas--single';

    const maxApr = Math.max(...pools.map(studioDisplayApr), 0);
    const baseColor = studioBackgroundBase(backgroundId);
    const heading = headerTitle(pools);

    const dateLabel = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div
        ref={ref}
        className={`apr-canvas studio-canvas ${layoutClass} ${studioToneClass(backgroundId)}`.trim()}
        style={{
          width: STUDIO_EXPORT_WIDTH,
          height: STUDIO_EXPORT_HEIGHT,
          backgroundColor: baseColor,
        }}
      >
        <StudioCanvasBackground backgroundId={backgroundId} />

        <header className="studio-canvas__head">
          <div className="studio-canvas__context">
            <span
              className={[
                'studio-canvas__topic-main',
                heading.pairStyle
                  ? 'studio-canvas__topic-main--pair'
                  : 'studio-canvas__topic-main--yields',
              ].join(' ')}
            >
              {heading.main}
            </span>
          </div>
          <div className="studio-canvas__badges">
            <span className="studio-canvas__badge studio-canvas__badge--curve">
              Live on Curve
              <TokenLogo
                symbol="CRV"
                fallbackInitials="CR"
                fallbackColor="#3465a4"
                size="xs"
                eager
                className="studio-canvas__badge-logo"
              />
            </span>
          </div>
        </header>

        <div className="apr-canvas__body studio-canvas__body">
          {count === 1 && pools[0] ? (
            <HeroSinglePanel
              pool={pools[0]}
              accent={studioAccentForTone(poolChartColor(pools[0]), tone)}
            />
          ) : (
            pools.map((pool) => (
              <PairPanel
                key={pool.id}
                pool={pool}
                accent={studioAccentForTone(poolChartColor(pool), tone)}
                highlighted={studioDisplayApr(pool) === maxApr && maxApr > 0 && count > 1}
                compact={count >= 3}
              />
            ))
          )}
        </div>

        <footer className="studio-canvas__foot">
          <span className="studio-canvas__foot-source">{dateLabel}</span>
          <span className="studio-canvas__foot-credit">
            created with ONCHAIN CA$H Content studio
          </span>
        </footer>
      </div>
    );
  },
);
