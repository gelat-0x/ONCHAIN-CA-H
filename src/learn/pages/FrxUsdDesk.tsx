import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from 'react-router-dom';
import Seo from '@learn/components/Seo';
import { DeskFeed } from '@learn/components/desk/DeskFeed';
import { AdoptionMap } from '@learn/components/desk/AdoptionMap';
import { SupplyBoard } from '@learn/components/desk/SupplyBoard';
import { DeskMap } from '@learn/components/desk/DeskMap';
import { DeskSpark } from '@learn/components/desk/DeskSpark';
import { useFrxUsdIssuance } from '@learn/hooks/useFrxUsdIssuance';
import { useFrxUsdLive } from '@learn/hooks/useFrxUsdLive';
import type { FrxUsdMintRedeemEvent, FrxUsdWindowPeak } from '../../types';
import { formatUsdMetric } from '../../lib/formatUsd';
import { assetLogoSrc } from '../lib/deskMarks';
import '../desk.css';

type WindowSpan = '24h' | '7d' | 'All';

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

function peakCopy(span: WindowSpan, side: 'mint' | 'burn', peak: FrxUsdWindowPeak) {
  const basis = side === 'mint' ? peak.mintBasis : peak.redeemBasis;
  const amount = side === 'mint' ? peak.mint : peak.redeem;
  const window =
    span === '24h' ? 'the last 24 hours' : span === '7d' ? 'the last 7 days' : 'on record';
  const verb = side === 'mint' ? 'minted' : 'burned';
  const title = basis === 'day' ? `Biggest day ${verb}` : `Biggest amount ${verb}`;
  return { title, window, amount, key: `${span}-${side}-${basis}` };
}

function PeakCard({
  span,
  peak,
}: {
  span: WindowSpan;
  peak?: FrxUsdWindowPeak;
}) {
  const [side, setSide] = useState<'mint' | 'burn'>('mint');

  useEffect(() => {
    const id = window.setInterval(() => {
      setSide((current) => (current === 'mint' ? 'burn' : 'mint'));
    }, 7000);
    return () => window.clearInterval(id);
  }, []);

  if (!peak) {
    return (
      <article className="room__rail-side room__peak">
        <span>Biggest mint</span>
        <strong><i className="room__skel" /></strong>
      </article>
    );
  }

  const copy = peakCopy(span, side, peak);
  return (
    <article className="room__rail-side room__peak">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={copy.key}
          className="room__peak-slide"
          initial={{ opacity: 0, filter: 'blur(6px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, filter: 'blur(6px)' }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <span>{copy.title}</span>
          <strong className="tabular-nums">{formatUsdMetric(copy.amount)}</strong>
          <em>{copy.window}</em>
        </motion.div>
      </AnimatePresence>
    </article>
  );
}

export default function FrxUsdDesk({ embedded = false }: { embedded?: boolean }) {
  const { data, error } = useFrxUsdIssuance();
  const live = useFrxUsdLive();
  const [span, setSpan] = useState<WindowSpan>('24h');
  const [settling, setSettling] = useState(false);
  const [held, setHeld] = useState<FrxUsdMintRedeemEvent | null>(null);

  const chooseSpan = (next: WindowSpan) => {
    if (next === span) return;
    setSpan(next);
    setSettling(true);
    window.setTimeout(() => setSettling(false), 480);
  };

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
    const cut = Date.now() - 86_400_000;
    return events.filter((event) => event.ts >= cut);
  }, [data?.recentEvents]);

  const chains = useMemo(() => {
    const mapped = data?.supplyMap?.chains;
    if (mapped?.length) {
      return mapped.map((row) => ({
        chain: row.chain,
        circulating: row.circulating,
        sharePct: row.sharePct,
      }));
    }
    return [...(data?.chainSupply ?? [])].sort((a, b) => b.circulating - a.circulating);
  }, [data?.supplyMap?.chains, data?.chainSupply]);

  const ready = Boolean(data);
  const peak = span === '24h' ? data?.peaks?.h24 : span === '7d' ? data?.peaks?.d7 : data?.peaks?.all;

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
            Mint & Burn Factory
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
                onClick={() => chooseSpan(key)}
              >
                {key}
              </button>
            ))}
          </div>
          <p className="room__pulse">
            <span aria-hidden="true" />
            Live
          </p>
        </div>
      </section>

      <section className="room__rail" aria-label="Mint figures">
        <article>
          <span>Minted</span>
          <strong className={`tabular-nums room__mint${settling ? ' is-settling' : ''}`}>
            {ready ? formatUsdMetric(minted) : <i className="room__skel" />}
          </strong>
        </article>
        <article>
          <span>Redeemed</span>
          <strong className={`tabular-nums room__burn${settling ? ' is-settling' : ''}`}>
            {ready ? formatUsdMetric(redeemed) : <i className="room__skel" />}
          </strong>
        </article>
        <article>
          <span>Net</span>
          <strong className={`tabular-nums${net < 0 ? ' room__dim' : ''}${settling ? ' is-settling' : ''}`}>
            {ready ? signedUsd(net) : <i className="room__skel" />}
          </strong>
        </article>
        <article className="room__rail-side">
          <span>Backing</span>
          <strong className="tabular-nums">{backing ? `${backing.toFixed(2)}%` : '—'}</strong>
        </article>
        <PeakCard span={span} peak={peak} />
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
          </div>
          <AdoptionMap adoption={data?.supplyMap?.adoption} />
          <SupplyBoard map={data?.supplyMap} chains={chains} />
        </div>
        <div>
          <div className="room__panel-head">
            <h2>Collateral routes</h2>
            <p>Each print is frxUSD. When the same transaction moves a reserve asset, that asset is named.</p>
          </div>
          <ol className="room__routes">
            {(data?.routes ?? []).map((route) => {
              const mint = route.mint24h;
              const burn = route.redeem24h;
              const total = Math.max(1, mint + burn);
              return (
                <li key={route.id}>
                  <div className="room__asset">
                    <img src={assetLogoSrc(route.asset) ?? '/learn/images/assets/frxusd.png'} alt="" />
                    <div>
                      <strong>{route.asset === 'frxUSD' ? 'frxUSD' : route.asset}</strong>
                      <em>{route.asset === 'frxUSD' ? 'All prints' : route.issuer}</em>
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
          <p>Net change in circulating supply. New supply above the line. Supply that left below.</p>
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
