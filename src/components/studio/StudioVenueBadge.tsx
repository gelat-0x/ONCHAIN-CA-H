import type { PoolData } from '../../types';
import { TokenLogo } from '../TokenLogo';
import uniswapMark from '../../assets/venues/uniswap.jpg';

function venueFlags(pools: PoolData[]): { curve: boolean; uniswap: boolean } {
  const uniswap = pools.some((pool) => pool.venue === 'fables');
  const curve = pools.some((pool) => pool.venue !== 'fables');
  return { curve, uniswap };
}

export function StudioVenueBadge({ pools }: { pools: PoolData[] }) {
  const { curve, uniswap } = venueFlags(pools);
  const label = uniswap && curve
    ? 'Live on Curve and Uniswap'
    : uniswap
      ? 'Live on Uniswap'
      : 'Live on Curve';

  return (
    <span className="studio-canvas__badge studio-canvas__badge--curve">
      {label}
      {curve && (
        <TokenLogo
          symbol="CRV"
          fallbackInitials="CR"
          fallbackColor="#3465a4"
          size="xs"
          eager
          className="studio-canvas__badge-logo"
        />
      )}
      {uniswap && (
        <img src={uniswapMark} alt="" className="studio-canvas__badge-mark" />
      )}
    </span>
  );
}
