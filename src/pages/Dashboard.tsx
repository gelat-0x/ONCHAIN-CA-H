import { useEffect, useState } from 'react';
import type { DashboardData, PoolData } from '../types';
import { fetchDashboardData } from '../services/api';
import { PLACEHOLDER_DASHBOARD } from '../data/placeholders';
import { POOL_REGISTRY } from '../data/poolRegistry';
import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { SectionDivider } from '../components/SectionDivider';
import { FrxUsdHub } from '../components/FrxUsdHub';
import { PoolsTable } from '../components/PoolsTable';
import { AggregateStats } from '../components/AggregateStats';
import { PegDeviationChart } from '../components/charts/PegDeviationChart';
import { FrxUsdCard, ShowSection, MobileWatchCta } from '../components/ShowSection';
import { CountUpNumber } from '../components/CountUpNumber';
import { Logo } from '../components/Logo';
export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [selectedPool, setSelectedPool] = useState<PoolData | null>(null);

  useEffect(() => {
    fetchDashboardData().then((d) => {
      setData(d);
      setSelectedPool(d.pools[0] ?? null);
    });
  }, []);

  const ticker = data?.ticker ?? PLACEHOLDER_DASHBOARD.ticker;

  return (
    <>
      <LiveTicker items={ticker} />
      <Header />
      <MobileWatchCta />

      {!data ? (
        <div className="page-pad loading-screen">
          <div className="loader-ring" />
          <span className="loader-text">Loading PegKeeper intelligence…</span>
        </div>
      ) : (
        <>
          {/* CINEMATIC HERO */}
          <section className="hero-brutal" id="dashboard">
            <div className="hero-brutal__content">
              <div className="hero-cinema__left">
                <div className="hero-tag">
                  <span className="live-dot" /> LIVE · {data.partnerCount} POOLS
                </div>
                <Logo size="lg" />
                <p className="hero-cinema__sub">frxUSD PegKeeper intelligence on Curve.</p>
                <p className="hero-cinema__desc">
                  Reserve yield from frxUSD backing flows back into LP incentives across partner stablecoin pools.
                  Track TVL, PegKeeper debt, and peg health in one terminal.
                </p>

                <div className="hero-cinema__actions">
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="btn-primary">
                    Watch Episode
                  </a>
                  <a href="/charts" className="btn-ghost">Live Charts →</a>
                  <a href="#pools" className="btn-ghost">Enter Terminal ↓</a>
                </div>

                <div className="hero-stats-row">
                  <div className="hero-stat">
                    <span className="hero-stat__val val-highlight tabular-nums">
                      <CountUpNumber end={Math.round(data.totalTvl / 1e6)} prefix="$" suffix="M" decimals={1} />
                    </span>
                    <span className="hero-stat__label">PegKeeper TVL</span>
                  </div>
                  <div className="hero-stat-divider" />
                  <div className="hero-stat">
                    <span className="hero-stat__val tabular-nums">
                      <CountUpNumber end={data.partnerCount} />
                    </span>
                    <span className="hero-stat__label">Partner pools</span>
                  </div>
                  <div className="hero-stat-divider" />
                  <div className="hero-stat">
                    <span className="hero-stat__val tabular-nums">
                      $<CountUpNumber end={data.frxUsdPrice} decimals={4} />
                    </span>
                    <span className="hero-stat__label">frxUSD Peg</span>
                  </div>
                </div>
              </div>

              <div className="hero-cinema__right">
                <div className="brutal-card brutal-card--hub">
                  <FrxUsdHub
                    pools={data.pools}
                    selectedId={selectedPool?.id}
                    onSelect={setSelectedPool}
                    frxUsdPrice={data.frxUsdPrice}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="section section--stats">
            <AggregateStats
              totalTvl={data.totalTvl}
              totalVolume24h={data.totalVolume24h}
              activePools={data.activePools}
              partnerCount={data.partnerCount}
            />
          </section>

          <SectionDivider name="PEGKEEPER POOLS" />

          <section className="section" id="pools">
            <div className="section-head">
              <div>
                <div className="section-eyebrow"><span className="hash">#</span> FRXUSD HUB</div>
                <h2 className="section-title">{POOL_REGISTRY.length} partner stablecoin pools</h2>
                <p className="section-body section-body--inline">
                  Each pool pairs frxUSD with a partner stablecoin on Curve. PegKeeper debt shows how much frxUSD backs each market.
                </p>
              </div>
              <a
                href="https://dune.com/stablescarab/frax-frxusd-pegkeeper-pools"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost btn-ghost-sm"
              >
                Dune Analytics ↗
              </a>
            </div>

            <PoolsTable pools={data.pools} totalTvl={data.totalTvl} />

            <PegDeviationChart data={data.pegHistory90d} />
          </section>

          <SectionDivider name="ONCHAIN CA$H LIVE" />

          <section className="section" id="show">
            <ShowSection />
          </section>

          <SectionDivider name="FRXUSD" />

          <section className="section">
            <FrxUsdCard chainDistribution={data.chainDistribution} cached={data.cached} />
          </section>

          <Footer />
        </>
      )}
    </>
  );
}
