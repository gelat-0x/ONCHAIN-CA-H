import type { FrxUsdMintRedeemData } from '../types';
import { formatUsd } from '../lib/formatUsd';
import { MintRedeemChart } from './charts/MintRedeemChart';

function timeAgo(iso: number): string {
  const ms = Date.now() - iso;
  if (ms < 60_000) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function netClass(n: number): string {
  if (n > 0) return 'frx-mr-metric__value--up';
  if (n < 0) return 'frx-mr-metric__value--down';
  return '';
}

interface FrxUsdMintRedeemPanelProps {
  data: FrxUsdMintRedeemData;
}

export function FrxUsdMintRedeemPanel({ data }: FrxUsdMintRedeemPanelProps) {
  const maxRoute = Math.max(
    1,
    ...data.routes.flatMap((r) => [r.mint30d, r.redeem30d]),
  );

  return (
    <section className="frx-mr" aria-labelledby="frx-mr-title">
      <header className="frx-mr__head">
        <div>
          <p className="section-eyebrow">frxUSD issuance</p>
          <h2 id="frx-mr-title" className="frx-mr__title">Mint &amp; redeem overview</h2>
          <p className="frx-mr__sub">
            Live mint/redeem across Ethereum custodian routes (USDC, USTB, BUIDL, WTGXX, USDB) and cross-chain supply.
          </p>
        </div>
        <a
          href={data.docsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="frax-analysis__link"
        >
          Frax docs ↗
        </a>
      </header>

      <div className="frx-mr-metrics">
        <div className="frx-mr-metric cult-shadow">
          <span className="frx-mr-metric__label">Circulating</span>
          <span className="frx-mr-metric__value tabular-nums">{formatUsd(data.circulating)}</span>
        </div>
        <div className="frx-mr-metric cult-shadow">
          <span className="frx-mr-metric__label">Mint 24h</span>
          <span className="frx-mr-metric__value frx-mr-metric__value--up tabular-nums">
            {formatUsd(data.mint24h)}
          </span>
        </div>
        <div className="frx-mr-metric cult-shadow">
          <span className="frx-mr-metric__label">Redeem 24h</span>
          <span className="frx-mr-metric__value frx-mr-metric__value--down tabular-nums">
            {formatUsd(data.redeem24h)}
          </span>
        </div>
        <div className="frx-mr-metric cult-shadow">
          <span className="frx-mr-metric__label">Net 24h</span>
          <span className={`frx-mr-metric__value tabular-nums ${netClass(data.net24h)}`}>
            {data.net24h >= 0 ? '+' : ''}{formatUsd(Math.abs(data.net24h))}
          </span>
        </div>
        <div className="frx-mr-metric cult-shadow">
          <span className="frx-mr-metric__label">Mint 7d</span>
          <span className="frx-mr-metric__value tabular-nums">{formatUsd(data.mint7d)}</span>
        </div>
        <div className="frx-mr-metric cult-shadow">
          <span className="frx-mr-metric__label">Redeem 7d</span>
          <span className="frx-mr-metric__value tabular-nums">{formatUsd(data.redeem7d)}</span>
        </div>
      </div>

      <div className="frx-mr-grid">
        <article className="protocol-chart-card cult-shadow frx-mr-card">
          <div className="section-head protocol-chart-card__head">
            <div>
              <p className="section-eyebrow">Daily flow</p>
              <h3 className="protocol-chart-card__title">Mint vs redeem</h3>
            </div>
            <span className="protocol-chart-card__source">{data.source}</span>
          </div>
          <MintRedeemChart daily={data.daily} />
        </article>

        <article className="protocol-chart-card cult-shadow frx-mr-card">
          <div className="section-head protocol-chart-card__head">
            <div>
              <p className="section-eyebrow">Ethereum routes</p>
              <h3 className="protocol-chart-card__title">By collateral (30d)</h3>
            </div>
          </div>
          <ul className="frx-mr-routes">
            {data.routes.map((route) => (
              <li key={route.id} className="frx-mr-route">
                <div className="frx-mr-route__head">
                  <span className="frx-mr-route__asset">{route.asset}</span>
                  <span className="frx-mr-route__issuer">{route.issuer}</span>
                </div>
                <div className="frx-mr-route__bars">
                  <div className="frx-mr-route__row">
                    <span className="frx-mr-route__tag frx-mr-route__tag--mint">Mint</span>
                    <div className="frx-mr-route__bar">
                      <span
                        className="frx-mr-route__fill frx-mr-route__fill--mint"
                        style={{ width: `${Math.max(4, (route.mint30d / maxRoute) * 100)}%` }}
                      />
                    </div>
                    <span className="frx-mr-route__amt tabular-nums">{formatUsd(route.mint30d)}</span>
                  </div>
                  <div className="frx-mr-route__row">
                    <span className="frx-mr-route__tag frx-mr-route__tag--redeem">Redeem</span>
                    <div className="frx-mr-route__bar">
                      <span
                        className="frx-mr-route__fill frx-mr-route__fill--redeem"
                        style={{ width: `${Math.max(4, (route.redeem30d / maxRoute) * 100)}%` }}
                      />
                    </div>
                    <span className="frx-mr-route__amt tabular-nums">{formatUsd(route.redeem30d)}</span>
                  </div>
                </div>
                <div className="frx-mr-route__foot tabular-nums">
                  24h: +{formatUsd(route.mint24h)} / −{formatUsd(route.redeem24h)}
                </div>
              </li>
            ))}
          </ul>
        </article>
      </div>

      {data.chainSupply.length > 0 && (
        <div className="frx-chains cult-shadow">
          <div className="frx-chains__head">
            <h3 className="frx-chains__title">frxUSD by chain (cross-chain mint destinations)</h3>
            <span className="frx-chains__source">DefiLlama</span>
          </div>
          <ul className="frx-chains__list">
            {data.chainSupply.slice(0, 10).map(({ chain, circulating, sharePct }) => (
              <li key={chain} className="frx-chain-row">
                <div className="frx-chain-row__label">
                  <span>{chain}</span>
                  <span className="tabular-nums">
                    {formatUsd(circulating)} · {sharePct}%
                  </span>
                </div>
                <div className="frx-chain-row__bar" aria-hidden="true">
                  <span
                    className="frx-chain-row__fill"
                    style={{ width: `${Math.max(4, sharePct)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.recentEvents.length > 0 && (
        <article className="protocol-chart-card cult-shadow frx-mr-events">
          <div className="section-head protocol-chart-card__head">
            <div>
              <p className="section-eyebrow">On-chain</p>
              <h3 className="protocol-chart-card__title">Recent mint &amp; redeem</h3>
            </div>
          </div>
          <ul className="frx-mr-events__list">
            {data.recentEvents.map((ev) => (
              <li key={ev.id} className="frx-mr-event">
                <span className={`frx-mr-event__type frx-mr-event__type--${ev.type}`}>
                  {ev.type === 'mint' ? 'Mint' : 'Redeem'}
                </span>
                <span className="frx-mr-event__asset">{ev.asset}</span>
                <span className="frx-mr-event__amt tabular-nums">{formatUsd(ev.amountUsd)}</span>
                <time className="frx-mr-event__time tabular-nums">{timeAgo(ev.ts)}</time>
                <a
                  href={`https://etherscan.io/tx/${ev.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="frx-mr-event__tx"
                >
                  Etherscan ↗
                </a>
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}
