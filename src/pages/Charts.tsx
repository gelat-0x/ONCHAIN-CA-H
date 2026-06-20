import { useCallback, useEffect, useState } from 'react';
import type { ChartRange, ChartsData } from '../types';
import { fetchChartsData } from '../services/api';
import { WATCHLIST_TOKENS } from '../data/tokenCatalog';
import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LivePriceChart } from '../components/charts/LivePriceChart';
import { TokenPriceGrid } from '../components/TokenPriceGrid';

const RANGES: { value: ChartRange; label: string }[] = [
  { value: '1', label: '24H' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: '365', label: '1Y' },
];

export function ChartsPage() {
  const [data, setData] = useState<ChartsData | null>(null);
  const [range, setRange] = useState<ChartRange>('30');
  const [selectedId, setSelectedId] = useState('frxusd');
  const [compareId, setCompareId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (r: ChartRange) => {
    setLoading(true);
    const d = await fetchChartsData(r);
    if (d) setData(d);
    setLoading(false);
  }, []);

  useEffect(() => { load(range); }, [range, load]);

  useEffect(() => {
    const id = setInterval(() => load(range), 60_000);
    return () => clearInterval(id);
  }, [range, load]);

  const tokens = data
    ? WATCHLIST_TOKENS.map((t) => data.tokens[t.id]).filter(Boolean)
    : [];

  const selected = data?.tokens[selectedId] ?? null;
  const compare = compareId ? data?.tokens[compareId] ?? null : null;
  const ticker = data?.ticker ?? [];

  return (
    <>
      <LiveTicker items={ticker.length ? ticker : [{ symbol: 'frxUSD', price: 1, change: 'flat' }]} />
      <Header />

      <main className="page-pad charts-page">
        <section className="section charts-hero">
          <div className="charts-hero__left">
            <p className="section-eyebrow">Live Market Data</p>
            <h1 className="section-title">Charts</h1>
            <p className="section-body">
              Real-time prices from CoinGecko. <strong>frxUSD</strong> is the Frax stablecoin pegged to $1.
              <strong> FRAX</strong> is the volatile ecosystem token — not the stablecoin.
              Watch AAVE, GHO, CRV, CVX, FXN and the full PegKeeper ecosystem.
            </p>
            <div className="token-legend cult-shadow">
              <div className="token-legend__item">
                <span className="token-legend__dot token-legend__dot--stable" />
                <span><strong>Stablecoin</strong> — peg band chart</span>
              </div>
              <div className="token-legend__item">
                <span className="token-legend__dot token-legend__dot--volatile" />
                <span><strong>Volatile</strong> — 24h % change</span>
              </div>
            </div>
          </div>

          <div className="charts-hero__meta cult-shadow">
            <div className="charts-meta-row">
              <span className="text-label">Data Source</span>
              <span className="text-data val-highlight">CoinGecko API</span>
            </div>
            <div className="charts-meta-row">
              <span className="text-label">Refresh</span>
              <span className="text-data">Every 60s</span>
            </div>
            <div className="charts-meta-row">
              <span className="text-label">Last Update</span>
              <span className="text-data tabular-nums">
                {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : '—'}
              </span>
            </div>
            {data?.cached && <span className="cached-label">cached</span>}
          </div>
        </section>

        <div className="range-pills">
          {RANGES.map((r) => (
            <button
              key={r.value}
              type="button"
              className={`range-pill ${range === r.value ? 'range-pill--active' : ''}`}
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loading && !selected ? (
          <div className="loading-screen">
            <div className="loader-ring" />
            <span className="loader-text">Loading live prices…</span>
          </div>
        ) : selected ? (
          <>
            <div className="charts-main">
              <LivePriceChart token={selected} compare={compare} />
            </div>

            <div className="compare-bar">
              <span className="text-label">Compare with</span>
              <div className="compare-pills">
                <button
                  type="button"
                  className={`compare-pill ${!compareId ? 'compare-pill--active' : ''}`}
                  onClick={() => setCompareId(null)}
                >
                  None
                </button>
                {tokens.filter((t) => t.id !== selectedId).map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`compare-pill ${compareId === t.id ? 'compare-pill--active' : ''}`}
                    onClick={() => setCompareId(t.id)}
                  >
                    {t.symbol}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <section className="section section--tight">
          <div className="section-head">
            <h2 className="text-heading">Watchlist</h2>
            <span className="text-caption">{tokens.length} assets · tap to chart</span>
          </div>
          <TokenPriceGrid
            tokens={tokens}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </section>

        <section className="section charts-research cult-shadow-deep">
          <p className="section-eyebrow">What to watch</p>
          <h2 className="text-heading">Research checklist</h2>
          <div className="research-grid">
            <div className="research-card">
              <span className="research-card__num">01</span>
              <h3>frxUSD peg</h3>
              <p>Stablecoin holding $1.00 ±0.2%. Any sustained deviation signals PegKeeper stress.</p>
            </div>
            <div className="research-card">
              <span className="research-card__num">02</span>
              <h3>FRAX / FXS</h3>
              <p>Ecosystem tokens — volatile, not pegged. Track 24h momentum for governance sentiment.</p>
            </div>
            <div className="research-card">
              <span className="research-card__num">03</span>
              <h3>CRV + CVX</h3>
              <p>Curve & Convex drive PegKeeper LP yields. Rising CRV often precedes pool APR spikes.</p>
            </div>
            <div className="research-card">
              <span className="research-card__num">04</span>
              <h3>Partner stables</h3>
              <p>crvUSD, GHO peg charts — partner pool health directly impacts PegKeeper debt ratios.</p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
