import type { FrxUsdAdoption, FrxUsdSupplyUse } from '../../../../shared/types/index.ts';
import { formatUsdMetric } from '../../../lib/formatUsd';

const COLOR: Record<FrxUsdSupplyUse, string> = {
  pegkeeper: 'hsl(204 70% 68%)',
  lp: 'hsl(0 0% 90%)',
  fx: 'hsl(43 78% 64%)',
  rwa: 'hsl(16 72% 66%)',
  lending: 'hsl(262 70% 74%)',
  frax: 'hsl(152 52% 60%)',
  held: 'hsl(0 0% 34%)',
};

export function AdoptionMap({ adoption }: { adoption?: FrxUsdAdoption }) {
  const slices = (adoption?.uses ?? []).filter((slice) => slice.usd > 0);
  if (!adoption || adoption.circulating <= 0 || !slices.length) return null;

  const total = slices.reduce((sum, slice) => sum + slice.usd, 0) || 1;
  let cursor = 0;
  const stops = slices
    .map((slice) => {
      const start = cursor;
      cursor += (slice.usd / total) * 100;
      return `${COLOR[slice.id]} ${start.toFixed(2)}% ${cursor.toFixed(2)}%`;
    })
    .join(', ');

  return (
    <div className="adopt">
      <div className="adopt__ring">
        <div className="adopt__donut-wrap">
          <div
            className="adopt__donut"
            role="img"
            aria-label={slices.map((slice) => `${slice.label} ${formatUsdMetric(slice.usd)}`).join(', ')}
            style={{ background: `conic-gradient(${stops})` }}
          />
          <span>
            <em>Supply</em>
            <b className="tabular-nums">{formatUsdMetric(total)}</b>
          </span>
        </div>
        <ul className="adopt__legend">
          {slices.map((slice) => (
            <li key={slice.id}>
              <i style={{ background: COLOR[slice.id] }} />
              {slice.label}
              <b className="tabular-nums">{formatUsdMetric(slice.usd)}</b>
            </li>
          ))}
        </ul>
      </div>
      <p className="adopt__sum">
        PegKeepers and LP pools, FX markets, tokenized assets, lending, and Frax’s own markets. Held is frxUSD not in those venues. Robinhood Chain is included from Fables and GigaDEX.
      </p>
    </div>
  );
}
