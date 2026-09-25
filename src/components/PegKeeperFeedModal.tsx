import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { PoolData } from '../types';
import { formatUsd } from '../lib/formatUsd';
import { formatSinceDate } from '../lib/formatSince';
import { formatPoolApr } from '../lib/poolChartColor';
import { pegKeeperAprSource, pegKeeperDisplayApr } from '../lib/pegKeeperApr';
import { TokenLogo } from './TokenLogo';

interface PegKeeperFeedModalProps {
  pools: PoolData[];
  selectedId?: string;
  onSelect?: (pool: PoolData) => void;
  onClose: () => void;
}

function poolSymbol(pool: PoolData): string {
  return pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id;
}

function initialIndex(pools: PoolData[], selectedId?: string): number {
  const idx = pools.findIndex((p) => p.id === selectedId);
  return idx >= 0 ? idx : 0;
}

function resolveActiveIndex(
  feed: HTMLElement,
  pools: PoolData[],
  cardRefs: Map<string, HTMLButtonElement>,
): number {
  const centerY = feed.getBoundingClientRect().top + feed.clientHeight / 2;
  let bestIdx = 0;
  let bestDist = Infinity;
  pools.forEach((pool, i) => {
    const el = cardRefs.get(pool.id);
    if (!el) return;
    const cardCenter = el.getBoundingClientRect().top + el.offsetHeight / 2;
    const dist = Math.abs(cardCenter - centerY);
    if (dist < bestDist) {
      bestDist = dist;
      bestIdx = i;
    }
  });
  return bestIdx;
}

export function PegKeeperFeedModal({
  pools,
  selectedId,
  onSelect,
  onClose,
}: PegKeeperFeedModalProps) {
  const feedRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map());
  const isProgrammaticScroll = useRef(false);
  const selectDebounceRef = useRef<number | null>(null);
  const [navIndex, setNavIndex] = useState(() => initialIndex(pools, selectedId));

  const syncOrbitSelection = useCallback(
    (index: number) => {
      const pool = pools[index];
      if (pool) onSelect?.(pool);
    },
    [pools, onSelect],
  );

  const debouncedSyncOrbit = useCallback(
    (index: number) => {
      if (selectDebounceRef.current !== null) {
        window.clearTimeout(selectDebounceRef.current);
      }
      selectDebounceRef.current = window.setTimeout(() => {
        syncOrbitSelection(index);
        selectDebounceRef.current = null;
      }, 120);
    },
    [syncOrbitSelection],
  );

  const scrollToIndex = useCallback(
    (index: number, behavior: ScrollBehavior = 'smooth') => {
      const clamped = Math.max(0, Math.min(index, pools.length - 1));
      const pool = pools[clamped];
      const el = cardRefs.current.get(pool?.id ?? '');
      const feed = feedRef.current;
      if (!el || !feed || !pool) return;

      isProgrammaticScroll.current = true;
      const top = el.offsetTop - (feed.clientHeight - el.clientHeight) / 2;
      feed.scrollTo({ top: Math.max(0, top), behavior });
      setNavIndex(clamped);
      syncOrbitSelection(clamped);

      window.setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, behavior === 'auto' ? 0 : 350);
    },
    [pools, syncOrbitSelection],
  );

  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    let ticking = false;
    const onScroll = () => {
      if (isProgrammaticScroll.current) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const idx = resolveActiveIndex(feed, pools, cardRefs.current);
        setNavIndex((prev) => {
          if (prev !== idx) debouncedSyncOrbit(idx);
          return idx;
        });
        ticking = false;
      });
    };

    feed.addEventListener('scroll', onScroll, { passive: true });
    return () => feed.removeEventListener('scroll', onScroll);
  }, [pools, debouncedSyncOrbit]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        scrollToIndex(navIndex + 1);
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        scrollToIndex(navIndex - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
      if (selectDebounceRef.current !== null) {
        window.clearTimeout(selectDebounceRef.current);
      }
    };
  }, [onClose, navIndex, scrollToIndex]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      scrollToIndex(initialIndex(pools, selectedId), 'auto');
    }, 0);
    return () => window.clearTimeout(t);
    // Only scroll into place when the modal opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const modal = (
    <div
      className="pegkeeper-feed-modal"
      role="dialog"
      aria-modal="true"
      aria-label="All PegKeepers"
      onClick={onClose}
    >
      <div className="pegkeeper-feed-modal__panel" onClick={(e) => e.stopPropagation()}>
        <header className="pegkeeper-feed-modal__head">
          <div>
            <p className="section-eyebrow">frxUSD family</p>
            <h3 className="pegkeeper-feed-modal__title">All PegKeepers</h3>
          </div>
          <button
            type="button"
            className="pegkeeper-feed-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        <div className="pegkeeper-feed-modal__body">
          <div ref={feedRef} className="pegkeeper-feed-modal__feed">
            <div className="pegkeeper-feed-modal__spacer" aria-hidden />
            {pools.map((pool) => {
              const sym = poolSymbol(pool);
              const apr = pegKeeperDisplayApr(pool);
              const aprSource = pegKeeperAprSource(pool);
              const active = pools[navIndex]?.id === pool.id;
              return (
                <button
                  key={pool.id}
                  type="button"
                  ref={(el) => {
                    if (el) cardRefs.current.set(pool.id, el);
                    else cardRefs.current.delete(pool.id);
                  }}
                  className={`pegkeeper-feed-card ${active ? 'pegkeeper-feed-card--active' : ''}`}
                  aria-current={active ? 'true' : undefined}
                  tabIndex={active ? 0 : -1}
                  onClick={() => scrollToIndex(pools.findIndex((p) => p.id === pool.id))}
                >
                  <div className="pegkeeper-feed-card__head">
                    <TokenLogo
                      symbol={sym}
                      poolId={pool.id}
                      fallbackInitials={pool.partnerInitials}
                      fallbackColor={pool.partnerColor}
                      size="sm"
                      className="pegkeeper-feed-card__logo"
                    />
                    <div className="pegkeeper-feed-card__identity">
                      <span className="pegkeeper-feed-card__token">{sym}</span>
                      <span className="pegkeeper-feed-card__partner">{pool.partner}</span>
                    </div>
                  </div>
                  <p className="pegkeeper-feed-card__desc">{pool.description}</p>
                  <div className="pegkeeper-feed-card__metrics tabular-nums">
                    <span>TVL {formatUsd(pool.tvl)}</span>
                    <span>Vol {formatUsd(pool.volume24h)}</span>
                    <span>APR {apr > 0 ? formatPoolApr(apr) : '—'} · {aprSource}</span>
                    <span>
                      frxUSD {pool.frxUsdBalanceUsd != null ? formatUsd(pool.frxUsdBalanceUsd) : '—'}
                      {pool.frxUsdSharePct != null ? ` · ${pool.frxUsdSharePct.toFixed(1)}%` : ''}
                    </span>
                    <span>Since {formatSinceDate(pool.since)}</span>
                  </div>
                </button>
              );
            })}
            <div className="pegkeeper-feed-modal__spacer" aria-hidden />
          </div>

          <nav className="pegkeeper-feed-modal__nav" aria-label="Navigate feed">
            <button
              type="button"
              className="pegkeeper-feed-modal__nav-btn"
              disabled={navIndex <= 0}
              onClick={(e) => {
                e.stopPropagation();
                scrollToIndex(navIndex - 1);
              }}
              aria-label="Previous PegKeeper"
            >
              ↑
            </button>
            <button
              type="button"
              className="pegkeeper-feed-modal__nav-btn"
              disabled={navIndex >= pools.length - 1}
              onClick={(e) => {
                e.stopPropagation();
                scrollToIndex(navIndex + 1);
              }}
              aria-label="Next PegKeeper"
            >
              ↓
            </button>
          </nav>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
