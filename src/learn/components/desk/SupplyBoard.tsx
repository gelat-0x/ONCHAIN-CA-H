import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUpRight, X } from 'lucide-react';
import type {
  FrxUsdChainSupply,
  FrxUsdOppRow,
  FrxUsdSupplyChainBlock,
  FrxUsdSupplyMap,
  FrxUsdSupplyPlace,
} from '../../../../shared/types/index.ts';
import { fallbackOpportunityLive } from '@shared/data/frxUsdOpportunities.ts';
import { formatUsdMetric } from '../../../lib/formatUsd';
import { fetchFrxUsdOpportunities } from '../../../services/api';
import { chainLogoSrc } from '../../lib/deskMarks';
import { protocolLogo } from '../../lib/oppLogos';

const CHAIN_ALIAS: Record<string, string> = {
  opmainnet: 'optimism',
  op: 'optimism',
  bnb: 'bsc',
  bnbchain: 'bsc',
  binance: 'bsc',
  matic: 'polygon',
  polygonpos: 'polygon',
  avalanchecchain: 'avalanche',
  avax: 'avalanche',
};

function chainKey(name: string): string {
  const raw = name.toLowerCase().replace(/[^a-z0-9]/g, '');
  return CHAIN_ALIAS[raw] ?? raw;
}

function formatShare(share: number): string {
  if (!(share > 0)) return '—';
  if (share >= 10 && Math.abs(share - Math.round(share)) < 0.05) return `${Math.round(share)}%`;
  if (share >= 1) return `${share.toFixed(1)}%`;
  return `${share.toFixed(2)}%`;
}

function placeLogo(place: FrxUsdSupplyPlace, chain: string): string | undefined {
  if (place.logo === 'wallet') return chainLogoSrc(place.chain || chain);
  return protocolLogo(place.logo);
}

function onThisChain(row: FrxUsdOppRow, chain: string): boolean {
  const target = chainKey(chain);
  return [row.chain, ...(row.chains ?? [])].some((name) => chainKey(name) === target);
}

const DOOR_LABEL: Record<string, string> = {
  hold: 'Hold on FraxNet',
  vault: 'Vaults',
  lend: 'Lending',
  borrow: 'Borrow',
  fx: 'LP',
  peg: 'PegKeeper LP',
  rwa: 'Tokenized',
  loop: 'Loop',
  boost: 'Boost',
};

const DOOR_ORDER = ['vault', 'lend', 'borrow', 'fx', 'peg', 'rwa', 'loop', 'boost', 'hold'];

const VENUE_GROUPS: Array<{
  id: string;
  label: string;
  test: (place: FrxUsdSupplyPlace) => boolean;
}> = [
  {
    id: 'vaults',
    label: 'Vaults',
    test: (place) => place.use === 'frax' && place.category !== 'lending' && place.category !== 'wallets',
  },
  {
    id: 'lending',
    label: 'Lending',
    test: (place) => place.category === 'lending',
  },
  {
    id: 'peg',
    label: 'PegKeeper LP',
    test: (place) => place.kind === 'pegkeeper' || place.use === 'pegkeeper',
  },
  {
    id: 'lp',
    label: 'LP',
    test: (place) => place.category === 'pairs' && place.kind !== 'pegkeeper' && place.use !== 'pegkeeper' && place.use !== 'fx' && place.use !== 'rwa',
  },
  {
    id: 'fx',
    label: 'FX',
    test: (place) => place.use === 'fx',
  },
  {
    id: 'rwa',
    label: 'Tokenized',
    test: (place) => place.use === 'rwa',
  },
  {
    id: 'wallets',
    label: 'Held in wallets',
    test: (place) => place.category === 'wallets',
  },
];

function ChainSheet({
  block,
  uses,
  onClose,
}: {
  block: FrxUsdSupplyChainBlock;
  uses: FrxUsdOppRow[];
  onClose: () => void;
}) {
  const share = block.sharePct;
  const [openBox, setOpenBox] = useState<string | null>(null);
  const groups = VENUE_GROUPS.map((group) => ({
    ...group,
    rows: block.places.filter(group.test).sort((a, b) => b.usd - a.usd),
  })).filter((group) => group.rows.length > 0);
  const scale = Math.max(
    block.circulating,
    ...block.places.map((place) => place.usd),
    1,
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const onlyHeld = block.places.every((place) => place.category === 'wallets');
  const hasDex = block.places.some((place) => place.category === 'pairs');
  const key = block.chain.toLowerCase();
  const note = key.includes('robinhood')
    ? 'Frax does not mint on Robinhood Chain. These dollars are in Fables and GigaDEX, counted from those venues.'
    : key === 'other chains'
      ? 'Smaller chains, each with its own frxUSD balance.'
      : key === 'somnia'
        ? 'Somnia also runs USDso, a white-label dollar backed 1:1 by frxUSD in a Frax vault. No indexed frxUSD DEX on this chain.'
        : key === 'sonic'
          ? hasDex
            ? 'Sonic also runs USSD, a white-label dollar on Frax infrastructure. The LP rows are the frxUSD pools DexScreener lists here.'
            : 'Sonic also runs USSD, a white-label dollar on Frax infrastructure. DexScreener is not listing a frxUSD pool on this chain right now.'
          : onlyHeld
            ? 'No indexed DEX or lending market for frxUSD on this chain. This is the balance reported for the chain.'
            : null;

  return createPortal(
    <div className="chain-sheet" onClick={onClose}>
      <div
        className="chain-sheet__card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chain-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="chain-sheet__top">
        <button type="button" className="chain-sheet__close" onClick={onClose} aria-label="Close">
          <X className="w-4 h-4" />
        </button>
        <header className="chain-sheet__head">
          <img
            src={chainLogoSrc(block.chain)}
            alt=""
            onError={(event) => {
              event.currentTarget.style.visibility = 'hidden';
            }}
          />
          <div>
            <h3 id="chain-sheet-title">{block.chain}</h3>
            <p>
              {formatShare(share)} of supply
              <span> · </span>
              <b className="tabular-nums">{formatUsdMetric(block.circulating)}</b>
            </p>
          </div>
        </header>
        </div>
        {note ? <p className="chain-sheet__note">{note}</p> : null}

        <div className="chain-boxes">
        {groups.map((group) => {
          const total = group.rows.reduce((sum, place) => {
            const sitting = place.borrowedUsd ? Math.max(0, place.usd - place.borrowedUsd) : place.usd;
            return sum + sitting;
          }, 0);
          const open = openBox === group.id;
          return (
            <section key={group.id} className={`chain-box${open ? ' is-open' : ''}${group.id === 'wallets' ? ' is-wallets' : ''}`}>
              <button
                type="button"
                className="chain-box__toggle"
                aria-expanded={open}
                onClick={() => setOpenBox(open ? null : group.id)}
              >
                <strong>
                  {group.id === 'wallets' ? <span className="chain-box__pulse" aria-hidden="true" /> : null}
                  {group.label}
                </strong>
                <em>{group.rows.length}</em>
                <b className="tabular-nums">{formatUsdMetric(total)}</b>
              </button>
              {open ? (
                <ul>
                  {group.rows.map((place) => {
                    const src = placeLogo(place, block.chain);
                    const width = Math.min(100, (place.usd / scale) * 100);
                    const amount = formatUsdMetric(place.usd);
                    return (
                      <li key={place.id} className={group.id === 'wallets' ? 'is-wallet' : undefined}>
                        {src ? (
                          <img
                            src={src}
                            alt=""
                            className={/fraxlend|usdb/i.test(src) ? 'is-plate' : undefined}
                          />
                        ) : (
                          <i aria-hidden="true" />
                        )}
                        <span>
                          <strong>{place.name}</strong>
                          {place.borrowedUsd ? (
                            <em>{formatUsdMetric(place.borrowedUsd)} borrowed out</em>
                          ) : null}
                          <span className="chain-sheet__meter" aria-hidden="true">
                            <i style={{ width: `${Math.max(width, width > 0 ? 4 : 0)}%` }} />
                          </span>
                        </span>
                        {place.href ? (
                          <a href={place.href} target="_blank" rel="noopener noreferrer">
                            {amount}
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </a>
                        ) : (
                          <b className="tabular-nums">{amount}</b>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </section>
          );
        })}

        {uses.length ? (
          <section className={`chain-box${openBox === 'use' ? ' is-open' : ''}`}>
            <button
              type="button"
              className="chain-box__toggle"
              aria-expanded={openBox === 'use'}
              onClick={() => setOpenBox(openBox === 'use' ? null : 'use')}
            >
              <strong>On this chain</strong>
              <em>{uses.length}</em>
              <b>Use</b>
            </button>
            {openBox === 'use' ? (
              <ul>
                {uses.map((row) => {
                  const src = protocolLogo(row.venue);
                  return (
                    <li key={row.id}>
                      {src ? <img src={src} alt="" /> : <i aria-hidden="true" />}
                      <span>
                        <strong>{row.name}</strong>
                        <em>{DOOR_LABEL[row.door ?? ''] ?? row.group}</em>
                      </span>
                      <a href={row.href} target="_blank" rel="noopener noreferrer">
                        {row.apy > 0 ? `${row.apy.toFixed(1)}%` : 'Open'}
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : null}
          </section>
        ) : null}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function SupplyBoard({
  map,
  chains,
}: {
  map?: FrxUsdSupplyMap;
  chains: FrxUsdChainSupply[];
}) {
  const [picked, setPicked] = useState<string | null>(null);
  const [uses, setUses] = useState<FrxUsdOppRow[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchFrxUsdOpportunities()
      .then((live) => {
        if (!cancelled) setUses(live.rows ?? []);
      })
      .catch(() => {
        if (!cancelled) setUses(fallbackOpportunityLive().rows);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const blocks = useMemo(() => {
    if (map?.chains?.length) return map.chains;
    return [...chains]
      .sort((a, b) => b.circulating - a.circulating)
      .map((row) => ({
        ...row,
        places: [
          {
            id: `wallets-${row.chain}`,
            chain: row.chain,
            category: 'wallets' as const,
            name: 'Held in wallets',
            usd: row.circulating,
            logo: 'wallet',
          },
        ],
      }));
  }, [map?.chains, chains]);

  const open = blocks.find((block) => block.chain === picked) ?? null;
  const openUses = open
    ? uses
        .filter((row) => row.door && onThisChain(row, open.chain))
        .sort((a, b) => {
          const order = DOOR_ORDER.indexOf(a.door ?? '') - DOOR_ORDER.indexOf(b.door ?? '');
          if (order !== 0) return order;
          return (b.apy || 0) - (a.apy || 0);
        })
    : [];

  if (!blocks.length) return null;

  return (
    <>
      <div className="chain-grid">
        {blocks.map((block) => {
          const share = block.sharePct;
          const fill = share > 0 ? Math.min(100, Math.max(share, share < 1 ? 2 : 6)) : 0;
          return (
            <button
              key={block.chain}
              type="button"
              className="chain-tile"
              onClick={() => setPicked(block.chain)}
              aria-label={`${block.chain}, ${formatShare(share)}, ${formatUsdMetric(block.circulating)}. Show venues.`}
            >
              <span className="chain-tile__top">
                <img
                  src={chainLogoSrc(block.chain)}
                  alt=""
                  onError={(event) => {
                    event.currentTarget.style.visibility = 'hidden';
                  }}
                />
                <strong>{block.chain}</strong>
              </span>
              <span className="chain-tile__foot">
                <em className="tabular-nums">{formatShare(share)}</em>
                <span className="chain-tile__bar" aria-hidden="true">
                  <i style={{ width: `${fill}%` }} />
                </span>
                <b className="tabular-nums">{formatUsdMetric(block.circulating)}</b>
              </span>
            </button>
          );
        })}
      </div>
      {open ? (
        <ChainSheet
          block={open}
          uses={openUses}
          onClose={() => setPicked(null)}
        />
      ) : null}
    </>
  );
}
