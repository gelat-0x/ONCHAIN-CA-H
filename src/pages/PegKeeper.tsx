import { useEffect, useState } from 'react';
import type { DashboardData } from '../types';
import { fetchDashboardData } from '../services/api';
import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PoolCard } from '../components/PoolCard';
import { AggregateStats } from '../components/AggregateStats';
import { PegDeviationChart } from '../components/charts/PegDeviationChart';
import { CountUpNumber } from '../components/CountUpNumber';
import { MobileWatchCta } from '../components/ShowSection';
import { POOL_REGISTRY } from '../data/poolRegistry';

export function PegKeeperPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData().then(setData);
  }, []);

  return (
    <>
      <LiveTicker items={data?.ticker ?? []} />
      <Header />
      <MobileWatchCta />

      <div className="page-pad">
        <section className="section">
          <div className="section-eyebrow"><span className="hash">#</span> DEEP DIVE</div>
          <h1 className="section-title">PegKeeper Intelligence Hub</h1>
          <p className="section-body">
            All {POOL_REGISTRY.length} frxUSD PegKeeper pools with debt tracking and peg history.
            Source: <a href="https://dune.com/stablescarab/frax-frxusd-pegkeeper-pools" target="_blank" rel="noopener noreferrer">Dune Analytics ↗</a>
          </p>

          {data && (
            <>
              <AggregateStats
                totalTvl={data.totalTvl}
                totalVolume24h={data.totalVolume24h}
                activePools={data.activePools}
                partnerCount={data.partnerCount}
              />

              <div className="pool-grid" style={{ marginTop: 48 }}>
                {data.pools.map((pool, i) => (
                  <PoolCard key={pool.id} pool={pool} index={i} />
                ))}
              </div>

              <div style={{ marginTop: 32 }} className="chart-container">
                <div className="chart-title">Total frxUSD Deployed in PegKeeper Pools</div>
                <div style={{ fontWeight: 700, fontSize: 36, color: 'var(--accent)', marginTop: 8 }}>
                  <CountUpNumber end={data.totalFrxUsdInPools ?? data.pools.reduce((s, p) => s + p.pegKeeperDebt, 0)} prefix="$" />
                </div>
              </div>

              <PegDeviationChart data={data.pegHistory90d} />
            </>
          )}
        </section>
      </div>
      <Footer />
    </>
  );
}
