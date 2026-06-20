import { useMemo } from 'react';
import type { PoolData } from '../types';

interface PoolConstellationProps {
  pools: PoolData[];
  onSelect?: (pool: PoolData) => void;
  selectedId?: string;
}

export function PoolConstellation({ pools, onSelect, selectedId }: PoolConstellationProps) {
  const nodes = useMemo(() => {
    const maxTvl = Math.max(...pools.map((p) => p.tvl), 1);
    return pools.map((pool, i) => {
      const angle = (i / pools.length) * Math.PI * 2 - Math.PI / 2;
      const radius = 28 + (1 - pool.tvl / maxTvl) * 18;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      const size = 4 + (pool.tvl / maxTvl) * 14;
      return { pool, x, y, size, angle };
    });
  }, [pools]);

  return (
    <div className="constellation-wrap">
      <div className="constellation-scene">
        <div className="constellation-ring constellation-ring--outer" />
        <div className="constellation-ring constellation-ring--inner" />
        <svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          <circle cx="50" cy="50" r="2" fill="#FFFFFF" opacity="0.8" />
          {nodes.map(({ pool, x, y }) => (
            <line
              key={`line-${pool.id}`}
              x1="50"
              y1="50"
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="0.15"
            />
          ))}
        </svg>
        {nodes.map(({ pool, x, y, size }) => (
          <button
            key={pool.id}
            type="button"
            className={`constellation-node ${selectedId === pool.id ? 'selected' : ''}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              boxShadow: `0 0 ${size * 2}px ${pool.partnerColor}44`,
              borderColor: pool.partnerColor,
            }}
            onClick={() => onSelect?.(pool)}
            title={`${pool.name} — $${(pool.tvl / 1e6).toFixed(2)}M`}
          >
            <span className="constellation-label">{pool.stablecoin ?? pool.name.split('/')[1]?.trim()}</span>
          </button>
        ))}
      </div>
      <div className="constellation-caption">
        {pools.length} PegKeeper pools · live constellation
      </div>
    </div>
  );
}
