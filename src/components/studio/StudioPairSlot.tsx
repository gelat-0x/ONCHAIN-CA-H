import { useState } from 'react';
import type { PoolData } from '../../types';
import { formatUsd } from '../../lib/formatUsd';
import { poolChartColor } from '../../lib/poolChartColor';
import { TokenLogo } from '../TokenLogo';
import { StudioPoolPickerModal } from './StudioPoolPickerModal';

function poolSymbol(pool: PoolData): string {
  return pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id;
}

interface StudioPairSlotProps {
  label: string;
  pools: PoolData[];
  value: string;
  onChange: (poolId: string) => void;
  excludeIds?: string[];
  disabled?: boolean;
}

export function StudioPairSlot({
  label,
  pools,
  value,
  onChange,
  excludeIds = [],
  disabled = false,
}: StudioPairSlotProps) {
  const [open, setOpen] = useState(false);
  const selected = pools.find((p) => p.id === value);

  return (
    <div className="studio-pair-slot">
      <span className="studio-pair-slot__label">{label}</span>

      <button
        type="button"
        className={`studio-pair-slot__trigger ${selected ? 'studio-pair-slot__trigger--filled' : ''}`}
        onClick={() => setOpen(true)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        {selected ? (
          <>
            <div className="studio-pair-slot__logos">
              <TokenLogo symbol="frxUSD" fallbackInitials="FX" fallbackColor="#fff" size="xs" />
              <TokenLogo
                symbol={poolSymbol(selected)}
                poolId={selected.id}
                fallbackInitials={selected.partnerInitials}
                fallbackColor={poolChartColor(selected)}
                size="xs"
              />
            </div>
            <div className="studio-pair-slot__meta">
              <span className="studio-pair-slot__name">{selected.name}</span>
              <span className="studio-pair-slot__partner">{selected.partner}</span>
            </div>
            <span className="studio-pair-slot__tvl tabular-nums">{formatUsd(selected.tvl)}</span>
          </>
        ) : (
          <span className="studio-pair-slot__placeholder">Choose a pool…</span>
        )}
        <span className="studio-pair-slot__chevron" aria-hidden>
          ›
        </span>
      </button>

      <StudioPoolPickerModal
        open={open}
        title={label}
        pools={pools}
        value={value}
        excludeIds={excludeIds}
        onSelect={onChange}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
