import { useEffect, useCallback } from 'react';
import type { PoolData } from '../types';
import { formatUsd } from '../lib/formatUsd';
import { formatSinceDate } from '../lib/formatSince';
import { poolCurveUrl } from '../lib/poolFilters';
import { PoolTvlChart } from './charts/PoolTvlChart';
import { TokenLogo } from './TokenLogo';
import { HubShareRing } from './HubShareRing';
import { formatPoolApr, poolChartColor } from '../lib/poolChartColor';
import {
  pegKeeperCurveApr,
  pegKeeperAprMetricLabel,
  poolSupportsStakeDao,
  stakeDaoUnavailableNote,
  whereToStakeCopy,
} from '../lib/pegKeeperApr';
import { stakeDaoDisplayApr } from '../../shared/lib/stakeDaoApr.ts';
import onlyBoostMark from '../assets/onlyboost.png';

interface PoolExploreModalProps {
  pool: PoolData | null;
  onClose: () => void;
}

function aprClass(apr: number): string {
  if (apr > 10) return 'val-green';
  if (apr >= 5) return 'val-warn';
  if (apr > 0) return 'val-red';
  return 'val-muted';
}

export function PoolExploreModal({ pool, onClose }: PoolExploreModalProps) {
  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!pool) return;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, [pool, handleKey]);

  if (!pool) return null;

  const curveHref = poolCurveUrl(pool.id);
  const curveApr = pegKeeperCurveApr(pool);
  const curveYieldLabel = pegKeeperAprMetricLabel(pool) === 'APY' ? 'Curve APY' : 'Curve APR';
  const stakeDaoApr = stakeDaoDisplayApr(pool);
  const stakeDaoAvailable = poolSupportsStakeDao(pool);
  const chartColor = poolChartColor(pool);
  const shareTip =
    pool.frxUsdSharePct != null ? `${pool.frxUsdSharePct.toFixed(1)}% of pool` : undefined;
  const convexHref = pool.onlyBoost ? pool.convexUrl : undefined;

  return (
    <div
      className="pool-modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pool-modal-title"
      onClick={onClose}
    >
      <div className="pool-modal__panel" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="pool-modal__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        <div className="pool-modal__head">
          <TokenLogo
            symbol={pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id}
            poolId={pool.id}
            fallbackInitials={pool.partnerInitials}
            fallbackColor={pool.partnerColor}
            className="pool-card-orb pool-modal__orb"
          />
          <div>
            <div className="pool-modal__since-box">
              Active since {formatSinceDate(pool.since)}
            </div>
            <h2 id="pool-modal-title" className="pool-modal__title">{pool.name}</h2>
          </div>
        </div>

        {pool.description && (
          <p className="pool-modal__desc">{pool.description}</p>
        )}

        <div className="pool-modal__metrics">
          <div className="pool-modal__metric">
            <span className="metric-label">Pool TVL</span>
            <span className="metric-value val-green tabular-nums">{formatUsd(pool.tvl)}</span>
          </div>
          <div className="pool-modal__metric">
            <span className="metric-label">Vol 24h</span>
            <span className="metric-value tabular-nums">{formatUsd(pool.volume24h)}</span>
          </div>
          <div className="pool-modal__metric">
            <span className="metric-label">frxUSD in pool</span>
            <span className="metric-value tabular-nums">
              {pool.frxUsdBalanceUsd != null ? formatUsd(pool.frxUsdBalanceUsd) : '—'}
            </span>
          </div>
          <div className="pool-modal__metric pool-modal__metric--share">
            <span className="metric-label">frxUSD share</span>
            {pool.frxUsdSharePct != null ? (
              <HubShareRing
                percent={pool.frxUsdSharePct}
                accent={chartColor}
                size={56}
                tip={shareTip}
                className="hub-share-ring--pool"
              />
            ) : (
              <span className="metric-sublabel">Unavailable from Curve</span>
            )}
          </div>
        </div>

        <div className="pool-modal__yield">
          <div className="chart-title">Yield breakdown</div>
          <div className="pool-modal__yield-grid">
            <div className="pool-modal__yield-tier">
              <span className="metric-label">Base APR</span>
              <span className={`pool-modal__yield-value tabular-nums ${aprClass(pool.apr)}`}>
                {formatPoolApr(pool.apr)}
              </span>
              <span className="pool-modal__yield-note">
                Trading fees only, what the pool earns from swaps.
              </span>
            </div>
            <div className="pool-modal__yield-tier pool-modal__yield-tier--curve">
              <span className="metric-label">{curveYieldLabel}</span>
              <span className={`pool-modal__yield-value tabular-nums ${aprClass(curveApr)}`}>
                {formatPoolApr(curveApr)}
              </span>
              <span className="pool-modal__yield-note">
                {stakeDaoAvailable
                  ? 'Base + gauge incentives, what you see on curve.fi.'
                  : 'Primary yield for this pool, deposit on Curve to earn this rate.'}
                {curveHref && (
                  <>
                    {' '}
                    <a href={curveHref} target="_blank" rel="noopener noreferrer">
                      View on Curve ↗
                    </a>
                  </>
                )}
              </span>
            </div>
            <div className="pool-modal__yield-tier pool-modal__yield-tier--boost">
              <span className="metric-label pool-modal__boost-label">
                Stake DAO Boost
                {pool.onlyBoost && (
                  <img src={onlyBoostMark} alt="OnlyBoost" className="pool-modal__onlyboost" />
                )}
              </span>
              {stakeDaoAvailable ? (
                <>
                  <span className="pool-modal__yield-value tabular-nums val-green">
                    {formatPoolApr(stakeDaoApr)}
                  </span>
                  <span className="pool-modal__yield-note">
                    Realized Strategy APR when you stake your Curve LP at{' '}
                    {pool.stakeDaoUrl ? (
                      <a href={pool.stakeDaoUrl} target="_blank" rel="noopener noreferrer">
                        Stake DAO ↗
                      </a>
                    ) : (
                      <a
                        href="https://www.stakedao.org/yield?tokenFilter=usd&search=frxUSD"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Stake DAO ↗
                      </a>
                    )}
                    {pool.stakeDaoMaxApr != null && pool.stakeDaoMaxApr > stakeDaoApr && (
                      <> · up to {formatPoolApr(pool.stakeDaoMaxApr)} at max boost</>
                    )}
                    .
                  </span>
                </>
              ) : (
                <>
                  <span className="pool-modal__yield-value tabular-nums val-muted">Not available</span>
                  <span className="pool-modal__yield-note pool-modal__yield-note--muted">
                    {stakeDaoUnavailableNote(pool)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="pool-modal__venues">
          <div className="chart-title">Where to stake</div>
          <p className="pool-modal__venues-copy">{whereToStakeCopy(pool)}</p>
          <div className="pool-modal__venue-row">
            {curveHref && (
              <a href={curveHref} target="_blank" rel="noopener noreferrer" className="btn-ghost-sm">
                Curve ↗
              </a>
            )}
            {stakeDaoAvailable && pool.stakeDaoUrl && (
              <a href={pool.stakeDaoUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost-sm pool-card-stake">
                Stake DAO ↗
              </a>
            )}
            {convexHref && (
              <a
                href={convexHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost-sm"
                title="Only Boost Convex leg — APR is reported via Stake DAO"
              >
                Convex ↗
              </a>
            )}
          </div>
        </div>

        <div className="pool-modal__chart-wrap">
          <div className="chart-title">Pool TVL (7d)</div>
          <PoolTvlChart
            data={pool.tvlHistory7d ?? [pool.tvl]}
            series={pool.tvlHistorySeries}
            height={112}
          />
        </div>

        <div className="pool-modal__foot">
          <span className="pool-modal__since">
            {pool.partner}
            {pool.chain ? ` · ${pool.chain}` : ''}
          </span>
          <div className="pool-modal__foot-actions">
            {curveHref && (
              <a
                href={curveHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary btn-ghost-sm"
              >
                View on Curve ↗
              </a>
            )}
            {stakeDaoAvailable && pool.stakeDaoUrl && (
              <a
                href={pool.stakeDaoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost-sm pool-card-stake"
              >
                Stake DAO ↗
              </a>
            )}
            {convexHref && (
              <a
                href={convexHref}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost-sm"
              >
                Convex ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
