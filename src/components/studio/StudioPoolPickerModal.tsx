import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PoolData } from '../../types';
import { formatUsd } from '../../lib/formatUsd';
import { formatPoolApr, poolChartColor } from '../../lib/poolChartColor';
import { studioDisplayApr } from '../../lib/studioApr';
import { TokenLogo } from '../TokenLogo';

function poolSymbol(pool: PoolData): string {
  return pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id;
}

interface StudioPoolPickerModalProps {
  open: boolean;
  title: string;
  pools: PoolData[];
  value: string;
  excludeIds?: string[];
  onSelect: (poolId: string) => void;
  onClose: () => void;
}

export function StudioPoolPickerModal({
  open,
  title,
  pools,
  value,
  excludeIds = [],
  onSelect,
  onClose,
}: StudioPoolPickerModalProps) {
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  /** Only keyboard / open should auto-scroll rows — mouse hover must not fight wheel scroll. */
  const syncScrollRef = useRef(false);

  const options = useMemo(() => {
    const blocked = new Set(excludeIds.filter(Boolean));
    const q = query.trim().toLowerCase();
    return [...pools]
      .filter((p) => !blocked.has(p.id) || p.id === value)
      .filter((p) => {
        if (!q) return true;
        return (
          p.name.toLowerCase().includes(q) ||
          p.partner.toLowerCase().includes(q) ||
          (p.stablecoin ?? '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => b.tvl - a.tvl);
  }, [pools, excludeIds, value, query]);

  const suggested = useMemo(() => {
    const blocked = new Set(excludeIds.filter(Boolean));
    const eligible = pools.filter((p) => !blocked.has(p.id));
    const byTvl = [...eligible].sort((a, b) => b.tvl - a.tvl).slice(0, 2);
    const byApr = [...eligible]
      .filter((p) => studioDisplayApr(p) > 0)
      .sort((a, b) => studioDisplayApr(b) - studioDisplayApr(a))
      .slice(0, 2);
    const seen = new Set<string>();
    const out: PoolData[] = [];
    for (const p of [...byTvl, ...byApr]) {
      if (seen.has(p.id)) continue;
      seen.add(p.id);
      out.push(p);
      if (out.length >= 3) break;
    }
    return out;
  }, [pools, excludeIds]);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setHighlight(0);
      return;
    }
    document.body.style.overflow = 'hidden';
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => {
      document.body.style.overflow = '';
      window.clearTimeout(t);
    };
  }, [open]);

  // Keep highlight on the selected pool when reopening; only jump to top while searching.
  useEffect(() => {
    if (!open) return;
    syncScrollRef.current = true;
    if (query.trim()) {
      setHighlight(0);
      return;
    }
    const idx = options.findIndex((p) => p.id === value);
    setHighlight(idx >= 0 ? idx : 0);
  }, [query, open, options, value]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        syncScrollRef.current = true;
        setHighlight((h) => Math.min(h + 1, options.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        syncScrollRef.current = true;
        setHighlight((h) => Math.max(h - 1, 0));
        return;
      }
      if (e.key === 'Enter' && options[highlight]) {
        e.preventDefault();
        onSelect(options[highlight].id);
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, options, highlight, onSelect, onClose]);

  useEffect(() => {
    if (!open || !syncScrollRef.current) return;
    syncScrollRef.current = false;
    const el = listRef.current?.children[highlight] as HTMLElement | undefined;
    if (!el) return;
    // Center the selected row when reopening; nearest while searching / arrowing.
    el.scrollIntoView({ block: query.trim() ? 'nearest' : 'center' });
  }, [highlight, open, query]);

  const pick = useCallback(
    (id: string) => {
      onSelect(id);
      onClose();
    },
    [onSelect, onClose],
  );

  if (!open) return null;

  return createPortal(
    <div className="studio-pool-modal" role="presentation">
      <button
        type="button"
        className="studio-pool-modal__backdrop"
        aria-label="Close pool picker"
        onClick={onClose}
      />
      <div
        className="studio-pool-modal__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="studio-pool-modal-title"
      >
        <header className="studio-pool-modal__head">
          <h2 id="studio-pool-modal-title" className="studio-pool-modal__title">
            {title}
          </h2>
          <button type="button" className="studio-pool-modal__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>

        <div className="studio-pool-modal__search-wrap">
          <input
            ref={inputRef}
            type="search"
            className="studio-pool-modal__search"
            placeholder="Search pair, partner, token…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search pools"
          />
        </div>

        {suggested.length > 0 && !query.trim() && (
          <div className="studio-pool-modal__suggested">
            <span className="studio-pool-modal__suggested-label">Suggested</span>
            <div className="studio-pool-modal__suggested-row">
              {suggested.map((p) => {
                const apr = studioDisplayApr(p);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`studio-pool-modal__chip ${value === p.id ? 'studio-pool-modal__chip--active' : ''}`}
                    onClick={() => pick(p.id)}
                  >
                    <span className="studio-pool-modal__chip-logos" aria-hidden>
                      <TokenLogo symbol="frxUSD" fallbackInitials="FX" fallbackColor="#fff" size="xs" />
                      <TokenLogo
                        symbol={poolSymbol(p)}
                        poolId={p.id}
                        fallbackInitials={p.partnerInitials}
                        fallbackColor={poolChartColor(p)}
                        size="xs"
                      />
                    </span>
                    <span className="studio-pool-modal__chip-name">
                      {p.name}
                      <span className="studio-pool-modal__chip-partner">{p.partner}</span>
                    </span>
                    {apr > 0 && (
                      <span className="studio-pool-modal__chip-apr tabular-nums">
                        {formatPoolApr(apr)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <ul
          ref={listRef}
          className="studio-pool-modal__list"
          role="listbox"
          tabIndex={-1}
          onWheel={(e) => {
            // Keep wheel scrolling on this list — don't let page/snap handlers steal it.
            e.stopPropagation();
          }}
        >
          {options.length === 0 ? (
            <li className="studio-pool-modal__empty">No pools match your search.</li>
          ) : (
            options.map((pool, i) => {
              const accent = poolChartColor(pool);
              const sym = poolSymbol(pool);
              const apr = studioDisplayApr(pool);
              return (
                <li key={pool.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={pool.id === value}
                    className={`studio-pool-modal__row ${i === highlight ? 'studio-pool-modal__row--highlight' : ''} ${pool.id === value ? 'studio-pool-modal__row--selected' : ''}`}
                    onClick={() => pick(pool.id)}
                    onMouseEnter={() => setHighlight(i)}
                  >
                    <span className="studio-pool-modal__row-rank tabular-nums">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <div className="studio-pool-modal__row-logos">
                      <TokenLogo symbol="frxUSD" fallbackInitials="FX" fallbackColor="#fff" size="xs" />
                      <TokenLogo
                        symbol={sym}
                        poolId={pool.id}
                        fallbackInitials={pool.partnerInitials}
                        fallbackColor={accent}
                        size="xs"
                      />
                    </div>
                    <div className="studio-pool-modal__row-meta">
                      <span className="studio-pool-modal__row-pair">{pool.name}</span>
                      <span className="studio-pool-modal__row-partner">{pool.partner}</span>
                    </div>
                    <div className="studio-pool-modal__row-stats tabular-nums">
                      {apr > 0 && (
                        <span className="studio-pool-modal__row-apr">{formatPoolApr(apr)}</span>
                      )}
                      <span className="studio-pool-modal__row-tvl">{formatUsd(pool.tvl)}</span>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </div>
    </div>,
    document.body,
  );
}
