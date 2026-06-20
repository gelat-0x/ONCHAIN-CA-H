import { BackgroundLayer } from './components/BackgroundLayer';
import { AudioPlayer } from './components/AudioPlayer';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './pages/Dashboard';
import { PegKeeperPage } from './pages/PegKeeper';
import { ShowPage } from './pages/Show';
import { AlphaPage } from './pages/Alpha';
import { ChartsPage } from './pages/Charts';

export default function App() {
  return (
    <BrowserRouter>
      <BackgroundLayer />
      <AudioPlayer />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/pegkeeper" element={<PegKeeperPage />} />
        <Route path="/charts" element={<ChartsPage />} />
        <Route path="/show" element={<ShowPage />} />
        <Route path="/alpha" element={<AlphaPage />} />
      </Routes>
    </BrowserRouter>
  );
}
