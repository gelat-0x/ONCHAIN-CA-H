import { forwardRef, useMemo } from 'react';
import type { PoolData } from '../../types';
import { formatUsd } from '../../lib/formatUsd';
import { formatPoolApr, poolChartColor } from '../../lib/poolChartColor';
import { rankStudioPools, studioMetricValue } from '../../lib/studioApr';
import { studioAccentForTone } from '../../lib/studioTone';
import { studioBackgroundTone } from '../../../shared/constants/studioBackgrounds';
import type { StudioPoolMetric } from './studioRegistry';
import { TokenLogo } from '../TokenLogo';
import { StudioCanvasShell } from './StudioCanvasShell';
import { StudioFablesCredit } from './StudioFablesCredit';
import { StudioVenueBadge } from './StudioVenueBadge';

interface TopPoolsCanvasProps {
  pools: PoolData[];
  backgroundId: string;
  /** Ranking metric — APR (default), TVL, or 24h volume. */
  metric?: StudioPoolMetric;
}

const METRIC_COPY: Record<StudioPoolMetric, { topicMain: string; topicSub: string }> = {
  apr: { topicMain: 'Top 5 APR', topicSub: 'Pegkeeper pools by Stake DAO APR' },
  tvl: { topicMain: 'Top 5 TVL', topicSub: 'Pegkeeper pools by TVL' },
  volume: { topicMain: 'Volume 24h', topicSub: 'Pegkeeper pools by 24h volume' },
};

export const TopPoolsCanvas = forwardRef<HTMLDivElement, TopPoolsCanvasProps>(
  function TopPoolsCanvas({ pools, backgroundId, metric = 'apr' }, ref) {
    const tone = studioBackgroundTone(backgroundId);
    const copy = METRIC_COPY[metric];
    const ranked = useMemo(() => rankStudioPools(pools, metric, 5), [pools, metric]);

    const maxValue = ranked[0] ? studioMetricValue(ranked[0], metric) : 0;

    return (
      <StudioCanvasShell
        ref={ref}
        backgroundId={backgroundId}
        topicMain={copy.topicMain}
        topicSub={copy.topicSub}
        className="studio-canvas--top-pools"
        badges={<StudioVenueBadge pools={ranked} />}
      >
        <ol className="top-pools-canvas__list">
          {ranked.map((pool, i) => {
            const value = studioMetricValue(pool, metric);
            const accent = studioAccentForTone(poolChartColor(pool), tone);
            const sym = pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id;
            const isTop = value === maxValue && maxValue > 0;
            const primary = metric === 'apr' ? formatPoolApr(value) : formatUsd(value);

            return (
              <li
                key={pool.id}
                className={`top-pools-canvas__row ${isTop ? 'top-pools-canvas__row--top' : ''}`}
                style={{ ['--row-accent' as string]: accent }}
              >
                <span className="top-pools-canvas__rank tabular-nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <div className="top-pools-canvas__logos">
                  <TokenLogo
                    symbol="frxUSD"
                    fallbackInitials="FX"
                    fallbackColor="#ffffff"
                    size="md"
                    eager
                  />
                  <TokenLogo
                    symbol={sym}
                    poolId={pool.id}
                    fallbackInitials={pool.partnerInitials}
                    fallbackColor={accent}
                    size="md"
                    eager
                  />
                </div>
                <div className="top-pools-canvas__meta">
                  <span className="top-pools-canvas__pair">{pool.name}</span>
                  {pool.venue === 'fables' && <StudioFablesCredit />}
                </div>
                <div className="top-pools-canvas__metrics">
                  <span className="top-pools-canvas__apr tabular-nums">{primary}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </StudioCanvasShell>
    );
  },
);
