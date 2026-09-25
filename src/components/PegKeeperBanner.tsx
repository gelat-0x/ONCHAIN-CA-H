import { useIntersection } from '../hooks/useIntersection';

interface PegKeeperBannerProps {
  poolCount: number;
  partnerCount: number;
}

export function PegKeeperBanner({ poolCount, partnerCount }: PegKeeperBannerProps) {
  const { ref, visible } = useIntersection();

  return (
    <header ref={ref} className={`pegkeeper-hero fade-in ${visible ? 'visible' : ''}`}>
      <h1 className="pegkeeper-hero__title">frxUSD PegKeeper Family</h1>
      <p className="pegkeeper-hero__lead">
        PegKeepers route frxUSD reserve yield into partner pools on Curve, keeping every stablecoin
        in the family near $1 while liquidity providers earn boosted incentives.
      </p>
      <p className="pegkeeper-hero__meta">
        {poolCount} pools · {partnerCount} partner protocols · TVL &amp; APR from{' '}
        <a href="https://curve.finance" target="_blank" rel="noopener noreferrer">
          Curve ↗
        </a>
      </p>
    </header>
  );
}
