import type { PoolData } from '../types';

function fmt(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n}`;
}

export function PoolBento({ pools }: { pools: PoolData[] }) {
  const top = pools.slice(0, 6);
  const maxTvl = top[0]?.tvl ?? 1;

  return (
    <div className="bento">
      {top.map((pool, i) => (
        <a
          key={pool.id}
          href={pool.curveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`bento-cell bento-cell--${i + 1}`}
          style={{ '--accent-color': pool.partnerColor } as React.CSSProperties}
        >
          <div className="bento-rank">#{i + 1}</div>
          <div className="bento-pair">{pool.stablecoin ?? pool.name.split('/')[1]?.trim()}</div>
          <div className="bento-partner">{pool.partner}</div>
          <div className="bento-tvl">{fmt(pool.tvl)}</div>
          <div className="bento-bar">
            <span style={{ width: `${(pool.tvl / maxTvl) * 100}%` }} />
          </div>
          {pool.apr > 0 && <div className="bento-apr">{pool.apr.toFixed(1)}% APR</div>}
        </a>
      ))}
    </div>
  );
}

export function PoolTickerStrip({ pools }: { pools: PoolData[] }) {
  const items = [...pools.slice(0, 12), ...pools.slice(0, 12)];
  return (
    <div className="pool-strip-wrap">
      <div className="pool-strip">
        {items.map((p, i) => (
          <span key={`${p.id}-${i}`} className="pool-strip-item">
            <span className="pool-strip-name">{p.stablecoin}</span>
            <span className="pool-strip-tvl">{fmt(p.tvl)}</span>
            <span className="pool-strip-sep">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
