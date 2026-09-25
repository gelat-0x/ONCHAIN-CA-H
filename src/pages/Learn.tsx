import { lazy, Suspense, useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PageGate } from '../components/PageGate';
import { fetchDashboardData } from '../services/api';
import type { TickerItem } from '../types';
import Navigation from '../learn/components/Navigation';
import BackArrow from '../learn/components/BackArrow';
import '../learn/learn.css';

const Index = lazy(() => import('../learn/pages/Index'));
const TheBeginner = lazy(() => import('../learn/pages/TheBeginner'));
const WhatIsMoney = lazy(() => import('../learn/pages/WhatIsMoney'));
const WhatIsBlockchain = lazy(() => import('../learn/pages/WhatIsBlockchain'));
const WhatIsStablecoins = lazy(() => import('../learn/pages/WhatIsStablecoins'));
const WhatIsFrax = lazy(() => import('../learn/pages/WhatIsFrax'));
const TheBusiness = lazy(() => import('../learn/pages/TheBusiness'));
const HistoryDeepDive = lazy(() => import('../learn/pages/HistoryDeepDive'));
const ExploreBetterMoney = lazy(() => import('../learn/pages/ExploreBetterMoney'));
const NotFound = lazy(() => import('../learn/pages/NotFound'));

/** Video / cinematic lessons keep their own atmosphere. */
const CINEMATIC_PATHS = new Set([
  '/learn/what-is-money',
  '/learn/what-is-blockchain',
  '/learn/what-is-stablecoins',
  '/learn/what-is-frax',
  '/learn/explore-better-money',
  '/learn/history-deep-dive',
]);

function LearnShell() {
  const location = useLocation();
  const isHub = location.pathname === '/learn' || location.pathname === '/learn/';
  const cinematic = CINEMATIC_PATHS.has(location.pathname);

  return (
    <div
      className={[
        'learn-root',
        cinematic ? 'learn-root--cinematic' : '',
        isHub ? 'learn-root--hub' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Navigation />
      {!isHub ? <BackArrow /> : null}
      <main className="learn-main">
        <Suspense fallback={<PageGate ready={false} message="Loading lesson…" />}>
          <Outlet />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}

export function LearnPage() {
  const [ticker, setTicker] = useState<TickerItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardData()
      .then((data) => {
        if (!cancelled) setTicker(data.ticker ?? []);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <HelmetProvider>
      <LiveTicker items={ticker} />
      <Header />
      <Routes>
        <Route element={<LearnShell />}>
          <Route index element={<Index />} />
          <Route path="the-beginner" element={<TheBeginner />} />
          <Route path="what-is-money" element={<WhatIsMoney />} />
          <Route path="what-is-blockchain" element={<WhatIsBlockchain />} />
          <Route path="what-is-stablecoins" element={<WhatIsStablecoins />} />
          <Route path="what-is-frax" element={<WhatIsFrax />} />
          <Route path="the-business" element={<TheBusiness />} />
          <Route path="the-advanced" element={<Navigate to="/learn" replace />} />
          <Route path="history-deep-dive" element={<HistoryDeepDive />} />
          <Route path="explore-better-money" element={<ExploreBetterMoney />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </HelmetProvider>
  );
}
