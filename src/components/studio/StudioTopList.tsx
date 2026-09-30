import { useState } from 'react';
import type { PoolData } from '../../types';
import { formatUsd } from '../../lib/formatUsd';
import { poolChartColor } from '../../lib/poolChartColor';
import { TokenLogo } from '../TokenLogo';
import { StudioPoolPickerModal } from './StudioPoolPickerModal';

const MAX_POOLS = 5;

function poolSymbol(pool: PoolData): string {
  return pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id;
}

interface StudioTopListProps {
  pools: PoolData[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function StudioTopList({ pools, selectedIds, onChange, disabled = false }: StudioTopListProps) {
  const [open, setOpen] = useState(false);
  const selected = selectedIds
    .map((id) => pools.find((pool) => pool.id === id))
    .filter((pool): pool is PoolData => Boolean(pool));
  const room = selected.length < MAX_POOLS;

  return (
    <div className="studio-top-list">
      <div className="studio-top-list__head">
        <span className="studio-pair-slot__label">Pools</span>
        <span className="studio-top-list__count tabular-nums">
          {selected.length} / {MAX_POOLS}
        </span>
      </div>
      <ul className="studio-top-list__rows">
        {selected.map((pool) => (
          <li key={pool.id} className="studio-top-list__row">
            <div className="studio-pair-slot__logos" aria-hidden>
              <TokenLogo symbol="frxUSD" fallbackInitials="FX" fallbackColor="#fff" size="xs" />
              <TokenLogo
                symbol={poolSymbol(pool)}
                poolId={pool.id}
                fallbackInitials={pool.partnerInitials}
                fallbackColor={poolChartColor(pool)}
                size="xs"
              />
            </div>
            <div className="studio-pair-slot__meta">
              <span className="studio-pair-slot__name">{pool.name}</span>
              <span className="studio-pair-slot__partner">{pool.partner}</span>
            </div>
            <span className="studio-pair-slot__tvl tabular-nums">{formatUsd(pool.tvl)}</span>
            <button
              type="button"
              className="studio-top-list__remove"
              onClick={() => onChange(selectedIds.filter((id) => id !== pool.id))}
              disabled={disabled}
              aria-label={`Remove ${pool.name}`}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      {room && (
        <button
          type="button"
          className="studio-top-list__add"
          onClick={() => setOpen(true)}
          disabled={disabled}
        >
          Add pool
        </button>
      )}
      <StudioPoolPickerModal
        open={open}
        title="Add pool"
        pools={pools}
        value=""
        excludeIds={selectedIds}
        onSelect={(id) => {
          if (selectedIds.includes(id) || selectedIds.length >= MAX_POOLS) return;
          onChange([...selectedIds, id]);
        }}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
