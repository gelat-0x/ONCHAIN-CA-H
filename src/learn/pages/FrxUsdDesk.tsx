import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '@learn/components/Seo';
import { DeskFeed } from '@learn/components/desk/DeskFeed';
import { AdoptionMap } from '@learn/components/desk/AdoptionMap';
import { SupplyBoard } from '@learn/components/desk/SupplyBoard';
import { DeskMap } from '@learn/components/desk/DeskMap';
import { DeskSpark } from '@learn/components/desk/DeskSpark';
import { useFrxUsdIssuance } from '@learn/hooks/useFrxUsdIssuance';
import { useFrxUsdLive } from '@learn/hooks/useFrxUsdLive';
import { useHeroApr } from '@learn/hooks/useHeroApr';
import type { FrxUsdMintRedeemEvent } from '../../types';
import { formatUsdMetric } from '../../lib/formatUsd';
import { assetLogoSrc } from '../lib/deskMarks';
import '../desk.css';

type WindowSpan = '24h' | '7d' | 'All';

const WINDOW_CAPTION: Record<WindowSpan, string> = {
  '24h': 'Last 24 hours',
  '7d': 'Last 7 days',
  All: 'All time',
};

function signedUsd(n: number): string {
  if (!Number.isFinite(n) || n === 0) return '$0';
  const body = formatUsdMetric(Math.abs(n));
  return n > 0 ? `+${body}` : `−${body}`;
}

function sumDaily(days: { mint: number; redeem: number; net: number }[] | undefined) {
  const rows = days ?? [];
  return {
    mint: rows.reduce((s, d) => s + d.mint, 0),
    redeem: rows.reduce((s, d) => s + d.redeem, 0),
    net: rows.reduce((s, d) => s + d.net, 0),
  };
}

export default function FrxUsdDesk({ embedded = false }: { embedded?: boolean }) {
  const { data, error } = useFrxUsdIssuance();
  const live = useFrxUsdLive();
  const { apr } = useHeroApr();
  const [span, setSpan] = useState<WindowSpan>('24h');
  const [held, setHeld] = useState<FrxUsdMintRedeemEvent | null>(null);

  const circulating = data?.circulating || (!live.loading ? live.circulation : 0);
  const reserves = !live.loading ? live.reserves : 0;
  const backing = circulating > 0 && reserves > 0 ? (reserves / circulating) * 100 : 0;

  const allTotals = useMemo(() => {
    if (data?.mintAll != null && Number.isFinite(data.mintAll)) {
      return {
        mint: data.mintAll,
        redeem: data.redeemAll ?? 0,
        net: data.netAll ?? data.mintAll - (data.redeemAll ?? 0),
      };
    }
    return sumDaily(data?.daily);
  }, [data]);

  const minted =
    span === '24h' ? (data?.mint24h ?? 0) : span === '7d' ? (data?.mint7d ?? 0) : allTotals.mint;
  const redeemed =
    span === '24h' ? (data?.redeem24h ?? 0) : span === '7d' ? (data?.redeem7d ?? 0) : allTotals.redeem;
  const net =
    span === '24h' ? (data?.net24h ?? 0) : span === '7d' ? (data?.net7d ?? 0) : allTotals.net;

  const tape = useMemo(() => {
    const events = data?.recentEvents ?? [];
    if (span === 'All') return events;
    const windowMs = span === '24h' ? 86_400_000 : 7 * 86_400_000;
    const cut = Date.now() - windowMs;
    return events.filter((event) => event.ts >= cut);
  }, [data?.recentEvents, span]);

  const chains = useMemo(() => {
    const rows = [...(data?.chainSupply ?? [])];
    const robinhood = data?.supplyMap?.adoption?.robinhoodUsd ?? 0;
    if (robinhood > 0 && !rows.some((row) => row.chain.toLowerCase().includes('robinhood'))) {
      rows.push({ chain: 'Robinhood Chain', circulating: robinhood, sharePct: 0 });
    }
    return rows.sort((a, b) => b.circulating - a.circulating);
  }, [data?.chainSupply, data?.supplyMap?.adoption?.robinhoodUsd]);

  useEffect(() => {
    if (held && !tape.some((event) => event.id === held.id)) setHeld(null);
  }, [held, tape]);

  return (
    <div id="new-dollars" className={`room${embedded ? ' room--embedded' : ''}`}>
      {!embedded ? (
        <Seo
          title="frxUSD issuance"
          description="frxUSD mint and redeem, backing, and where supply sits across chains."
          path="/frxUSD/supply"
        />
      ) : null}

      {!embedded ? (
        <header className="room__bar">
          <Link to="/frxUSD" className="room__back">
            Better Money
          </Link>
        </header>
      ) : null}

      <section className="room__intro" aria-labelledby="new-dollars-heading">
        <div className="room__intro-copy">
          <h2 id="new-dollars-heading" className="room__title">
            New dollars
          </h2>
          <p className="room__line">
            Minted dollars leave the center. Burned dollars come back. Tap one to see the transaction.
          </p>
        </div>
        <div className="room__tools">
          <div className="room__span" role="tablist" aria-label="Time window">
            {(['24h', '7d', 'All'] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={span === key}
                className={span === key ? 'is-on' : ''}
                onClick={() => setSpan(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <p className="room__window-caption">{WINDOW_CAPTION[span]}</p>
          <p className="room__pulse">
            <span aria-hidden="true" />
            Live
          </p>
        </div>
      </section>

      <section className="room__rail" aria-label="Mint figures">
        <article>
          <span>Minted</span>
          <strong className="tabular-nums room__mint">{formatUsdMetric(minted)}</strong>
        </article>
        <article>
          <span>Redeemed</span>
          <strong className="tabular-nums room__burn">{formatUsdMetric(redeemed)}</strong>
        </article>
        <article>
          <span>Net</span>
          <strong className={`tabular-nums ${net < 0 ? 'room__dim' : ''}`}>{signedUsd(net)}</strong>
        </article>
        <article className="room__rail-side">
          <span>Backing</span>
          <strong className="tabular-nums">{backing ? `${backing.toFixed(2)}%` : '—'}</strong>
        </article>
        <article className="room__rail-side">
          <span>Reserve yield</span>
          <strong className="tabular-nums">{apr ? `${apr.toFixed(2)}%` : '—'}</strong>
        </article>
      </section>

      {error && !data ? (
        <p className="room__note">Mint and burn numbers are still loading.</p>
      ) : null}

      <section className="room__stage" aria-label="Mint map and latest">
        <div className="room__floor">
          <DeskMap
            chains={chains}
            events={tape}
            heldId={held?.id ?? null}
            onHold={setHeld}
          />
        </div>
        <aside className="room__tape">
          <div className="room__panel-head">
            <h2>Latest</h2>
            <p>Tap a row to hold it. The code opens the transaction.</p>
          </div>
          <DeskFeed
            events={tape}
            heldId={held?.id ?? null}
            onHold={setHeld}
          />
        </aside>
      </section>

      <section className="room__lower">
        <div>
          <div className="room__panel-head">
            <h2>Where supply sits</h2>
            <p>Each square is one chain. The bar is its share of circulating frxUSD. Open a chain to see every venue.</p>
          </div>
          <AdoptionMap adoption={data?.supplyMap?.adoption} />
          <SupplyBoard map={data?.supplyMap} chains={chains} />
        </div>
        <div>
          <div className="room__panel-head">
            <h2>Collateral routes</h2>
            <p>Mint and redeem by asset</p>
          </div>
          <ol className="room__routes">
            {(data?.routes ?? []).map((route) => {
              const mint =
                span === '24h' ? route.mint24h : span === '7d' ? route.mint7d : minted;
              const burn =
                span === '24h' ? route.redeem24h : span === '7d' ? route.redeem7d : redeemed;
              const total = Math.max(1, mint + burn);
              return (
                <li key={route.id}>
                  <div className="room__asset">
                    <img src={assetLogoSrc(route.asset) ?? '/learn/images/assets/frxusd.png'} alt="" />
                    <div>
                      <strong>{route.asset}</strong>
                      <em>{route.issuer}</em>
                    </div>
                  </div>
                  <span className="room__split" aria-hidden="true">
                    <i style={{ width: `${(mint / total) * 100}%` }} />
                  </span>
                  <span className="tabular-nums">{formatUsdMetric(mint)}</span>
                  <span className="tabular-nums room__dim">{formatUsdMetric(burn)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="room__history">
        <div className="room__panel-head">
          <h2>Each day</h2>
          <p>New dollars above the line. Dollars burned below.</p>
        </div>
        <DeskSpark days={data?.daily ?? []} />
      </section>

      {data?.docsUrl ? (
        <p className="room__source">
          <a href={data.docsUrl} target="_blank" rel="noopener noreferrer">
            How minting works
          </a>
        </p>
      ) : null}
    </div>
  );
}
