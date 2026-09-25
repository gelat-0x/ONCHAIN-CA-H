import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ChartsData, TokenMarketData } from '../types';
import { fetchChartsWatchlist } from '../services/api';
import { CHART_RANGES, type ChartRangeId } from '../../shared/constants/chartRanges';
import { WATCHLIST_TOKENS } from '../data/tokenCatalog';
import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { GeckoTerminalChart } from '../components/charts/GeckoTerminalChart';
import { ProtocolChartsPanel } from '../components/ProtocolChartsPanel';
import { TokenPriceGrid } from '../components/TokenPriceGrid';
import { LoadingScreen } from '../components/LoadingScreen';

type ChartMode = 'token' | 'protocol';

export function ChartsPage() {
  const [watchlist, setWatchlist] = useState<ChartsData | null>(null);
  const [mode, setMode] = useState<ChartMode>('token');
  const [range, setRange] = useState<ChartRangeId>('5m');
  const [selectedId, setSelectedId] = useState('frax');
  const [loadingWatchlist, setLoadingWatchlist] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadWatchlist = useCallback(async (silent = false, refresh = false) => {
    if (!silent) setLoadingWatchlist(true);
    else setRefreshing(true);

    const data = await fetchChartsWatchlist(refresh);
    if (data && Object.keys(data.tokens).length > 0) {
      setWatchlist(data);
      if (!silent) setError(null);
    } else if (!silent) {
      setError('Chart API unreachable, run `npm run dev:all` and reload.');
    }

    setLoadingWatchlist(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadWatchlist(false, true);
  }, [loadWatchlist]);

  useEffect(() => {
    const id = setInterval(() => loadWatchlist(true, true), 60_000);
    return () => clearInterval(id);
  }, [loadWatchlist]);

  const tokens = watchlist
    ? WATCHLIST_TOKENS.map((t) => watchlist.tokens[t.id]).filter(Boolean)
    : [];

  const selected: TokenMarketData | null = useMemo(() => {
    return watchlist?.tokens[selectedId] ?? watchlist?.tokens.frax ?? tokens[0] ?? null;
  }, [watchlist, selectedId, tokens]);

  const ticker = watchlist?.ticker ?? [];
  const initialLoad = loadingWatchlist && !watchlist && mode === 'token';

  return (
    <>
      <LiveTicker items={ticker.length ? ticker : [{ symbol: 'frxUSD', price: 1, change: 'flat' }]} />
      <Header />

      <main className="page-pad charts-page">
        <header className="charts-top">
          <div className="charts-top__head">
            <p className="section-eyebrow">Protocol dashboard</p>
            <h1 className="section-title charts-top__title">Dashboard</h1>
            <p className="text-caption charts-top__sub">
              Token prices · protocol metrics · DefiLlama (Frax, Aave, Curve)
            </p>
          </div>

          <div className="charts-mode-row">
            <div className="charts-mode-tabs" role="tablist" aria-label="Chart mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'token'}
                className={`charts-mode-tab ${mode === 'token' ? 'charts-mode-tab--active' : ''}`}
                onClick={() => setMode('token')}
              >
                Token charts
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'protocol'}
                className={`charts-mode-tab ${mode === 'protocol' ? 'charts-mode-tab--active' : ''}`}
                onClick={() => setMode('protocol')}
              >
                Protocol dashboard
              </button>
            </div>

            {mode === 'token' && (
              <div className="range-pills range-pills--toolbar">
                {CHART_RANGES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    className={`range-pill ${range === r.id ? 'range-pill--active' : ''}`}
                    onClick={() => setRange(r.id)}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </header>

        {error && mode === 'token' && !initialLoad && (
          <p className="pool-filter-empty charts-error">{error}</p>
        )}

        {mode === 'token' ? (
          initialLoad ? (
            <LoadingScreen inline className="charts-loading" message="Loading prices…" />
          ) : selected ? (
            <div className="charts-stack">
              <div className="charts-main charts-main--hero" id="charts-live-panel">
                <GeckoTerminalChart
                  key={`${selectedId}-${range}`}
                  token={selected}
                  range={range}
                />
                {refreshing && <span className="charts-refresh-hint">Updating prices…</span>}
              </div>

              <section className="charts-watchlist">
                <div className="section-head charts-watchlist__head">
                  <h2 className="text-heading">Watchlist</h2>
                  <span className="text-caption">{tokens.length} assets · tap to chart</span>
                </div>
                <TokenPriceGrid
                  tokens={tokens}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              </section>
            </div>
          ) : null
        ) : (
          <section className="charts-protocol" id="charts-protocol">
            <ProtocolChartsPanel />
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
