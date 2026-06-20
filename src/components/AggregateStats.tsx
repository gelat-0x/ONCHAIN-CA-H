import { CountUpNumber } from './CountUpNumber';
import { useIntersection } from '../hooks/useIntersection';

interface AggregateStatsProps {
  totalTvl: number;
  totalVolume24h: number;
  activePools: number;
  partnerCount: number;
}

export function AggregateStats({
  totalTvl,
  totalVolume24h,
  activePools,
  partnerCount,
}: AggregateStatsProps) {
  const { ref, visible } = useIntersection();

  return (
    <div ref={ref} className={`aggregate-bar fade-in ${visible ? 'visible' : ''}`}>
      <div className="aggregate-stat">
        <div className="aggregate-stat-value">
          <CountUpNumber end={totalTvl} prefix="$" />
        </div>
        <div className="aggregate-stat-label">Total PegKeeper TVL</div>
      </div>
      <div className="aggregate-stat">
        <div className="aggregate-stat-value">
          <CountUpNumber end={totalVolume24h} prefix="$" />
        </div>
        <div className="aggregate-stat-label">Total 24h Volume</div>
      </div>
      <div className="aggregate-stat">
        <div className="aggregate-stat-value">
          <CountUpNumber end={activePools} />
        </div>
        <div className="aggregate-stat-label">Active Pools</div>
      </div>
      <div className="aggregate-stat">
        <div className="aggregate-stat-value">
          <CountUpNumber end={partnerCount} suffix="+" />
        </div>
        <div className="aggregate-stat-label">Partner Protocols</div>
      </div>
    </div>
  );
}
