import { Link, useLocation } from 'react-router-dom';
import { Logo } from './Logo';

const NAV = [
  { to: '/', label: 'Dashboard' },
  { to: '/pegkeeper', label: 'PegKeeper' },
  { to: '/charts', label: 'Charts' },
  { to: '/show', label: 'Show' },
  { to: '/alpha', label: 'Alpha' },
];

export function Header() {
  const { pathname } = useLocation();

  return (
    <header className="site-header">
      <Link to="/" className="header-logo"><Logo /></Link>
      <nav className="header-nav">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className={pathname === n.to ? 'active' : ''}>{n.label}</Link>
        ))}
      </nav>
      <div className="header-right">
        <button
          type="button"
          className="header-music-btn"
          onClick={() => window.dispatchEvent(new CustomEvent('onchain-play-music'))}
        >
          ♪ MUSIC
        </button>
        <div className="live-badge"><span className="live-dot" /> LIVE</div>
      </div>
    </header>
  );
}
