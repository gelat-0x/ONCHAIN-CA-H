import { CountUpNumber } from './CountUpNumber';
import { useIntersection } from '../hooks/useIntersection';
import { formatUsd } from '../lib/formatUsd';

interface AggregateStatsProps {
  totalTvl: number;
  totalVolume24h: number;
  partnerCount: number;
}

export function AggregateStats({
  totalTvl,
  totalVolume24h,
  partnerCount,
}: AggregateStatsProps) {
  const { ref, visible } = useIntersection();

  return (
    <div ref={ref} className={`aggregate-bar aggregate-bar--3 fade-in ${visible ? 'visible' : ''}`}>
      <div className="aggregate-stat">
        <div className="aggregate-stat-value tabular-nums">
          {formatUsd(totalTvl)}
        </div>
        <div className="aggregate-stat-label">Total PegKeeper TVL</div>
      </div>
      <div className="aggregate-stat">
        <div className="aggregate-stat-value tabular-nums">
          {formatUsd(totalVolume24h)}
        </div>
        <div className="aggregate-stat-label">Total 24h Volume</div>
      </div>
      <div className="aggregate-stat">
        <div className="aggregate-stat-value">
          <CountUpNumber end={partnerCount} />
        </div>
        <div className="aggregate-stat-label">Partner Protocols</div>
      </div>
    </div>
  );
}
