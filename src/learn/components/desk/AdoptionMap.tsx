import type { FrxUsdAdoption } from '../../../../shared/types/index.ts';
import { formatUsdMetric } from '../../../lib/formatUsd';

export function AdoptionMap({ adoption }: { adoption?: FrxUsdAdoption }) {
  if (!adoption || adoption.circulating <= 0) return null;

  const bar = [
    { id: 'core', label: 'Core', usd: adoption.coreUsd },
    { id: 'lending', label: 'In markets', usd: adoption.lendingSitting },
    { id: 'pegkeeper', label: 'PegKeepers', usd: adoption.pegkeeperUsd },
    { id: 'fraxnet', label: 'FraxNet', usd: adoption.fraxnetUsd },
  ].filter((slice) => slice.usd > 0);
  const barTotal = bar.reduce((sum, slice) => sum + slice.usd, 0) || 1;

  return (
    <div className="adopt">
      <p className="adopt__total">
        <span>Circulating</span>
        <strong className="tabular-nums">{formatUsdMetric(adoption.circulating)}</strong>
      </p>
      <div className="adopt__bar" role="img" aria-label="Circulating frxUSD split by Core, markets, PegKeepers, and FraxNet">
        {bar.map((slice) => (
          <i
            key={slice.id}
            className={`adopt__seg adopt__seg--${slice.id}`}
            style={{ width: `${(slice.usd / barTotal) * 100}%` }}
          />
        ))}
      </div>
      <ul className="adopt__legend">
        {bar.map((slice) => (
          <li key={slice.id}>
            <i className={`adopt__seg adopt__seg--${slice.id}`} />
            {slice.label}
            <b className="tabular-nums">{formatUsdMetric(slice.usd)}</b>
          </li>
        ))}
      </ul>
      <p className="adopt__sum">
        The bar is circulating frxUSD. Robinhood sits outside it. Reserves are backing, not a second supply.
      </p>
    </div>
  );
}
