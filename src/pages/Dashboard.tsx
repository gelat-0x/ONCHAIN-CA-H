import { useEffect, useState } from 'react';
import type { DashboardData } from '../types';
import { fetchDashboardData } from '../services/api';
import { PLACEHOLDER_DASHBOARD } from '../data/placeholders';
import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { HeroBackdrop } from '../components/HeroBackdrop';
import { HeroBull } from '../components/HeroBull';
import { HeroEntrySwitch } from '../components/HeroEntrySwitch';
import { HomeSurfaces } from '../components/HomeSurfaces';
import { HomeThesis } from '../components/HomeThesis';
import { FraxForceSection } from '../components/FraxForceSection';
import { Footer } from '../components/Footer';
import { HomeSectionRail } from '../components/HomeSectionRail';
import { useHomeBlockScroll } from '../hooks/useHomeBlockScroll';

const SECTIONS = [
  { id: 'home-intro', label: 'Start', snap: true },
  { id: 'home-surfaces', label: 'Surfaces', snap: true },
  { id: 'home-thesis', label: 'Thesis', snap: true },
  { id: 'home-frax-force', label: 'Frax Force', snap: true },
];

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData().then(setData);
  }, []);

  const { active, jumpTo } = useHomeBlockScroll(SECTIONS, true);
  const railSections = SECTIONS.filter((section) => section.snap);
  const railActiveIdx = railSections.findIndex((section) => section.id === SECTIONS[active]?.id);
  const railActive = railActiveIdx >= 0 ? railActiveIdx : Math.max(0, railSections.length - 1);
  const jumpRail = (railIdx: number) => {
    const id = railSections[railIdx]?.id;
    const fullIdx = SECTIONS.findIndex((section) => section.id === id);
    if (fullIdx >= 0) jumpTo(fullIdx);
  };

  const ticker = data?.ticker?.length ? data.ticker : PLACEHOLDER_DASHBOARD.ticker;

  return (
    <>
      <LiveTicker items={ticker} />
      <Header />
      <HomeSectionRail sections={railSections} active={railActive} onJump={jumpRail} />

      <section className="hero-public home-block" id="home-intro">
        <HeroBackdrop />
        <div className="hero-public__layout">
          <div className="hero-public__inner">
            <p className="hero-public__eyebrow">Built by Frax Force as a public good</p>
            <h1 className="hero-public__title">
              <span className="hero-public__onchain">ONCHAIN</span>{' '}
              <span className="hero-public__cash">CA$H</span>
            </h1>
            <p className="hero-public__desc">
              There&apos;s a lot happening onchain if you want the bigger picture. We built
              ONCHAIN CA$H to bring innovation, education, and culture onto one surface.
            </p>

            <HeroEntrySwitch />
          </div>

          <HeroBull data={data} />
        </div>

        <button
          type="button"
          className="home-scroll-get-in"
          onClick={() => scrollToId('home-surfaces')}
          aria-label="Scroll to get in"
        >
          <span>Scroll to get in</span>
        </button>
      </section>

      <HomeSurfaces
        totalTvl={data?.totalTvl}
        activePools={data?.activePools}
        poolCount={data?.pools.length}
        totalVolume24h={data?.totalVolume24h}
        partnerCount={data?.partnerCount}
      />
      <HomeThesis />
      <FraxForceSection />
      <div className="home-footer-zone" id="home-footer">
        <Footer deferUntilVisible />
      </div>
    </>
  );
}
