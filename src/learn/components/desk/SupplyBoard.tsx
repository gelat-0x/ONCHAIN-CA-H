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
  if (place.logo === 'wallet') {
    const named = place.name === 'In wallets' ? chain : place.name;
    return chainLogoSrc(named);
  }
  return protocolLogo(place.logo);
}

function onThisChain(row: FrxUsdOppRow, chain: string): boolean {
  const target = chainKey(chain);
  return [row.chain, ...(row.chains ?? [])].some((name) => chainKey(name) === target);
}

const VENUE_GROUPS: Array<{
  id: string;
  label: string;
  hint: string;
  test: (place: FrxUsdSupplyPlace) => boolean;
}> = [
  {
    id: 'lending',
    label: 'Lending',
    hint: 'Deposited into a lending market. Borrowed dollars have already left.',
    test: (place) => place.category === 'lending',
  },
  {
    id: 'peg',
    label: 'PegKeepers',
    hint: 'frxUSD paired with another dollar so the price stays near $1.',
    test: (place) => place.kind === 'pegkeeper',
  },
  {
    id: 'dex',
    label: 'DEXes',
    hint: 'Trading pools on this chain, including FX markets.',
    test: (place) => place.category === 'pairs' && place.kind !== 'pegkeeper' && place.use !== 'rwa',
  },
  {
    id: 'rwa',
    label: 'Tokenized assets',
    hint: 'frxUSD paired with a tokenized bond, stock, or Frax bond.',
    test: (place) => place.use === 'rwa',
  },
  {
    id: 'wallets',
    label: 'Held',
    hint: 'frxUSD on this chain that is not in a venue above.',
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
  const robinhood = block.chain.toLowerCase().includes('robinhood');
  const note = robinhood
    ? 'Frax does not mint on Robinhood Chain. These dollars are in Fables and GigaDEX, counted from those venues.'
    : block.chain === 'Other chains'
      ? 'Smaller chains, each with its own frxUSD balance.'
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

        {groups.map((group) => (
          <section key={group.id} className="chain-sheet__group">
            <h4>{group.label}</h4>
            <p>{group.hint}</p>
            <ul>
              {group.rows.map((place) => {
                const src = placeLogo(place, block.chain);
                const width = Math.min(100, (place.usd / scale) * 100);
                return (
                  <li key={place.id}>
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
                    <b className="tabular-nums">{formatUsdMetric(place.usd)}</b>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

        {uses.length ? (
          <section className="chain-sheet__group">
            <h4>Ways to use it</h4>
            <p>Vaults and lending markets on this chain. Rates come from the venue.</p>
            <ul>
              {uses.map((row) => {
                const src = protocolLogo(row.venue);
                return (
                  <li key={row.id}>
                    {src ? <img src={src} alt="" /> : <i aria-hidden="true" />}
                    <span>
                      <strong>{row.name}</strong>
                      <em>{row.door === 'vault' ? 'Vault' : row.door === 'lend' ? 'Lending' : 'Loop'}</em>
                    </span>
                    <a href={row.href} target="_blank" rel="noopener noreferrer">
                      {row.apy > 0 ? `${row.apy.toFixed(1)}%` : 'On venue'}
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}
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
            name: 'Held on this chain',
            usd: row.circulating,
            logo: 'wallet',
          },
        ],
      }));
  }, [map?.chains, chains]);

  const open = blocks.find((block) => block.chain === picked) ?? null;
  const openUses = open
    ? uses
        .filter((row) => (row.door === 'vault' || row.door === 'lend' || row.door === 'loop') && onThisChain(row, open.chain))
        .sort((a, b) => (b.apy || 0) - (a.apy || 0))
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
