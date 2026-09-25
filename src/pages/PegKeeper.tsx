import { Link } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { DashboardData, PoolData } from '../types';
import { fetchDashboardData } from '../services/api';
import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PoolCard } from '../components/PoolCard';
import { PoolExploreModal } from '../components/PoolExploreModal';
import { PegKeeperHero } from '../components/PegKeeperHero';
import { FrxUsdHub } from '../components/FrxUsdHub';
import { PegKeeperGuide } from '../components/PegKeeperGuide';
import { PoolSortControl } from '../components/PoolSortControl';
import { PegKeeperFamilyBreakdown } from '../components/PegKeeperFamilyBreakdown';
import { PegKeeperYieldEngine } from '../components/PegKeeperYieldEngine';
import { PageGate } from '../components/PageGate';
import { PegKeeperBackdrop } from '../components/PegKeeperBackdrop';
import { TokenLogo } from '../components/TokenLogo';
import { filterAndSortPools, type PoolSortKey } from '../lib/poolFilters';

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function PegKeeperPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [sort, setSort] = useState<PoolSortKey>('tvl');
  const [explorePool, setExplorePool] = useState<PoolData | null>(null);
  const [hubPoolId, setHubPoolId] = useState<string | undefined>();
  const [poolsExpanded, setPoolsExpanded] = useState(false);
  const [gridCols, setGridCols] = useState(5);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardData().then((d) => {
      if (cancelled) return;
      setData(d);
      setHubPoolId(d.pools[0]?.id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const visiblePools = useMemo(() => {
    if (!data) return [];
    return filterAndSortPools(data.pools, 'all', sort);
  }, [data, sort]);

  useEffect(() => {
    if (!visiblePools.length) return;
    if (!hubPoolId || !visiblePools.some((p) => p.id === hubPoolId)) {
      setHubPoolId(visiblePools[0].id);
    }
  }, [visiblePools, hubPoolId]);

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;

    const read = () => {
      const raw = getComputedStyle(el).gridTemplateColumns;
      const n = raw.split(' ').filter((part) => part && part !== 'none').length;
      if (n > 0) setGridCols(n);
    };

    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, [data]);

  const previewCount = gridCols * 3;
  const peekCount = gridCols;
  const collapsedCap = previewCount + peekCount;
  const hasMorePools = visiblePools.length > previewCount;

  if (!data) {
    return <PageGate ready={false} message="Loading PegKeeper…" />;
  }

  const hub = (
    <FrxUsdHub
      pools={visiblePools}
      selectedId={hubPoolId}
      onSelect={(p) => setHubPoolId(p.id)}
      onViewPools={() => scrollToSection('pegkeeper-pools')}
      frxUsdPrice={data.frxUsdPrice}
    />
  );

  return (
    <>
      <LiveTicker items={data.ticker ?? []} />
      <Header />

      <div className="page-pad">
        <section className="section section--pegkeeper">
          <PegKeeperBackdrop />
          <div className="pegkeeper-layout">
            <div className="pegkeeper-hero-row">
              <PegKeeperHero
                totalTvl={data.totalTvl}
                totalVolume24h={data.totalVolume24h}
                totalFrxUsdInPools={data.totalFrxUsdInPools}
                activePools={data.activePools}
                onNavClick={scrollToSection}
                onScrollDown={() => scrollToSection('pegkeeper-pools')}
              />
              <aside className="pegkeeper-hero-row__orbit" id="pegkeeper-orbit">
                {hub}
              </aside>
            </div>

            <div className="pegkeeper-layout__body">
              <section id="pegkeeper-pools" className="pegkeeper-pools">
                <div className="pegkeeper-pools__toolbar">
                  <h2 className="pegkeeper-pools__title">
                    <TokenLogo
                      symbol="frxUSD"
                      fallbackInitials="FX"
                      fallbackColor="#ffffff"
                      size="sm"
                      className="pegkeeper-pools__title-logo"
                      alt="frxUSD"
                    />
                    PegKeeper overview
                  </h2>
                  <PoolSortControl sort={sort} onSortChange={setSort} />
                </div>
                <div className="pool-grid-block">
                  <div ref={gridRef} className="pool-grid pegkeeper-pools__grid">
                    {visiblePools.map((pool, i) => {
                      if (!poolsExpanded && hasMorePools && i >= collapsedCap) return null;
                      const peek = !poolsExpanded && hasMorePools && i >= previewCount;
                      return (
                        <PoolCard
                          key={pool.id}
                          pool={pool}
                          index={i}
                          className={peek ? 'pool-card--peek' : undefined}
                          inert={peek}
                          onExplore={setExplorePool}
                        />
                      );
                    })}
                  </div>
                  {!poolsExpanded && hasMorePools && (
                    <div className="pool-grid-more">
                      <div className="pool-grid-more__veil" aria-hidden />
                      <button
                        type="button"
                        className="pool-grid-more__btn"
                        onClick={() => setPoolsExpanded(true)}
                      >
                        View all pools
                      </button>
                    </div>
                  )}
                </div>
                {visiblePools.length === 0 && (
                  <p className="pool-filter-empty">No pools match this filter.</p>
                )}
              </section>

              <PegKeeperFamilyBreakdown
                pools={data.pools}
                totalVolume24h={data.totalVolume24h}
                totalTvl={data.totalTvl}
              />

              <PegKeeperYieldEngine pools={data.pools} />

              <PegKeeperGuide />

              <div className="pegkeeper-final-cta">
                <Link to="/studio" className="pegkeeper-final-cta__btn">
                  Create your PegKeeper Content
                  <span aria-hidden>→</span>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
      <PoolExploreModal pool={explorePool} onClose={() => setExplorePool(null)} />
    </>
  );
}
