import type { PoolData } from '../types';
import { MiniSparkline } from './charts/MiniSparkline';
import { formatUsd } from '../lib/formatUsd';
import { formatPoolApr, poolChartColor } from '../lib/poolChartColor';
import { cumulativeVolume, isFablesPool, pegKeeperAprMetricLabel, pegKeeperAprSource, pegKeeperDisplayApr, volumeSeriesLabel } from '../lib/pegKeeperApr';
import stakeDaoBoost from '../assets/stakedao-boost.png';
import robinhoodMark from '../assets/venues/robinhood.png';
import type { PoolTag } from '../lib/poolTags';
import { TokenLogo } from './TokenLogo';
import { HubShareRing } from './HubShareRing';

function formatFineApr(apr: number | undefined): string {
  if (apr == null || !Number.isFinite(apr) || apr <= 0) return '—';
  return `${apr.toFixed(2)}%`;
}

function aprClass(apr: number): string {
  if (apr > 10) return 'val-green';
  if (apr >= 5) return 'val-warn';
  if (apr > 0) return 'val-red';
  return 'val-muted';
}

interface PoolCardProps {
  pool: PoolData;
  index: number;
  featured?: boolean;
  highlighted?: boolean;
  tags?: PoolTag[];
  className?: string;
  inert?: boolean;
  onExplore?: (pool: PoolData) => void;
}

export function PoolCard({
  pool,
  index,
  featured,
  highlighted,
  tags,
  className = '',
  inert = false,
  onExplore,
}: PoolCardProps) {
  const chartColor = poolChartColor(pool);
  const clickable = Boolean(onExplore) && !inert;
  const stagger = (index % 12) * 35;
  const displayApr = pegKeeperDisplayApr(pool);
  const aprSource = pegKeeperAprSource(pool);
  const aprMetricLabel = pegKeeperAprMetricLabel(pool);
  const fables = isFablesPool(pool);
  const volumeSeries = fables && pool.volumeHistory?.length ? cumulativeVolume(pool.volumeHistory) : null;
  const shareTip =
    pool.frxUsdSharePct != null ? `${pool.frxUsdSharePct.toFixed(1)}% of pool` : undefined;

  return (
    <article
      className={`pool-card ${featured ? 'pool-card--featured' : ''} ${highlighted ? 'pool-card--highlight' : ''} ${clickable ? 'pool-card--clickable' : ''} ${className}`.trim()}
      style={{
        ['--pool-stagger' as string]: `${stagger}ms`,
        ['--pool-accent' as string]: chartColor,
      }}
      aria-hidden={inert || undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={clickable ? () => onExplore!(pool) : undefined}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onExplore!(pool);
              }
            }
          : undefined
      }
    >
      <div className="pool-card-top">
        <div>
          <div className="pool-card-pair">{pool.name}</div>
          {fables && (
            <span className="pool-card-chain">
              <img src={robinhoodMark} alt="" />
              Robinhood Chain
            </span>
          )}
        </div>
        <div className="pool-card-mark">
          <TokenLogo
            symbol={pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id}
            poolId={pool.id}
            fallbackInitials={pool.partnerInitials}
            fallbackColor={chartColor}
            className="pool-card-orb"
          />
          <span className="pool-card-partner">{pool.partner}</span>
        </div>
      </div>

      {tags && tags.length > 0 && (
        <div className="pool-card-tags" aria-label="Pool labels">
          {tags.map((tag) => (
            <span
              key={tag.kind}
              className={`pool-card-tag pool-card-tag--${tag.kind}`}
            >
              {tag.label}
            </span>
          ))}
        </div>
      )}

      <div className="pool-card-spark" aria-hidden={volumeSeries ? undefined : true}>
        {volumeSeries && <span className="pool-card-spark-label">{volumeSeriesLabel(volumeSeries)}</span>}
        <MiniSparkline
          data={volumeSeries ? volumeSeries.map((point) => point.value) : (pool.tvlHistory7d ?? [pool.tvl])}
          series={volumeSeries ?? pool.tvlHistorySeries}
          height={48}
          color={chartColor}
        />
      </div>

      {fables && (
        <div className="pool-card-yields pool-card-yields--fables">
          <a
            className="pool-card-yield"
            href={pool.fablesUrl ?? 'https://www.fables.fi/markets/eusd'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="metric-label">Swap fees</span>
            <span className={`metric-value tabular-nums ${aprClass(pool.swapFeeApr ?? 0)}`}>
              {formatFineApr(pool.swapFeeApr)}
            </span>
          </a>
          <a
            className="pool-card-yield pool-card-yield--merkl"
            href={pool.merklUrl ?? 'https://app.merkl.xyz/opportunities/8537301425693662925'}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="metric-label">Merkl</span>
            <span className={`metric-value tabular-nums ${aprClass(pool.merklApr ?? 0)}`}>
              {formatFineApr(pool.merklApr)}
            </span>
          </a>
        </div>
      )}

      <div className="pool-card-metrics">
        <div className="pool-metric">
          <span className="metric-label">TVL</span>
          <span className="metric-value val-green tabular-nums">{formatUsd(pool.tvl)}</span>
        </div>
        {!fables && (
        <div className="pool-metric pool-metric--apr">
          <span className="metric-label">{aprMetricLabel}</span>
          <span className="metric-value-row">
            <span
              className={`metric-value tabular-nums ${displayApr > 0 ? aprClass(displayApr) : 'val-muted'}`}
            >
              {formatPoolApr(displayApr)}
            </span>
            {aprSource === 'Stake DAO' && (
              <span
                className="pool-card-apr-mark"
                title="Shown APR is coming from Stake DAO"
              >
                <img src={stakeDaoBoost} alt="" aria-hidden />
              </span>
            )}
          </span>
        </div>
        )}
        <div className="pool-metric">
          <span className="metric-label">Vol 24h</span>
          <span className="metric-value tabular-nums">{formatUsd(pool.volume24h)}</span>
        </div>
        <div
          className="pool-metric"
          title={
            fables
              ? 'frxUSD currently sitting in the Fables pool.'
              : 'Current frxUSD-side liquidity reported by Curve.'
          }
        >
          <span className="metric-label">frxUSD in pool</span>
          <span className="metric-value-row">
            <span className="metric-value tabular-nums">
              {pool.frxUsdBalanceUsd != null ? formatUsd(pool.frxUsdBalanceUsd) : '—'}
            </span>
            {pool.frxUsdSharePct != null && (
              <HubShareRing
                percent={pool.frxUsdSharePct}
                accent={chartColor}
                size={20}
                tip={shareTip}
                className="hub-share-ring--pool"
              />
            )}
          </span>
        </div>
      </div>

      <div className="pool-card-foot">
        {clickable && <span className="pool-card-explore-btn">Explore</span>}
      </div>
    </article>
  );
}
