import { useEffect, useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { fetchDashboardData } from '../services/api';
import type { TickerItem } from '../types';
import ExploreBetterMoney from '../learn/pages/ExploreBetterMoney';
import '../learn/learn.css';

export function FrxUsdPage() {
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
      <div className="learn-root learn-root--cinematic">
        <main className="learn-main">
          <ExploreBetterMoney />
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
}
