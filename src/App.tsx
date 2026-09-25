import { lazy, Suspense, useEffect } from 'react';
import { BackgroundLayer } from './components/BackgroundLayer';
import { AudioPlayer } from './components/AudioPlayer';
import { ScrollToTop } from './components/ScrollToTop';
import { PageGate } from './components/PageGate';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { prefetchDashboardData } from './services/api';
import { UiPrefsProvider } from './context/UiPrefs';

const PegKeeperPage = lazy(() =>
  import('./pages/PegKeeper').then((m) => ({ default: m.PegKeeperPage })),
);
const ShowPage = lazy(() => import('./pages/Show').then((m) => ({ default: m.ShowPage })));
const ContentStudioPage = lazy(() =>
  import('./pages/ContentStudio').then((m) => ({ default: m.ContentStudioPage })),
);
const LearnPage = lazy(() => import('./pages/Learn').then((m) => ({ default: m.LearnPage })));

export default function App() {
  useEffect(() => {
    prefetchDashboardData();
  }, []);

  return (
    <UiPrefsProvider>
      <BrowserRouter>
        <ScrollToTop />
        <BackgroundLayer />
        <AudioPlayer />
        <Suspense fallback={<PageGate ready={false} message="Loading…" />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pegkeeper" element={<PegKeeperPage />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/charts" element={<Navigate to="/" replace />} />
            <Route path="/show" element={<ShowPage />} />
            <Route path="/news" element={<Navigate to="/" replace />} />
            <Route path="/studio" element={<ContentStudioPage />} />
            <Route path="/learn/*" element={<LearnPage />} />
            <Route path="/alpha" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </UiPrefsProvider>
  );
}
