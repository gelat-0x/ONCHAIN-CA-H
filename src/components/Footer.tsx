import { Link } from 'react-router-dom';
import { Logo } from './Logo';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div>
          <Logo />
          <p className="footer-tagline">The onchain intelligence show.</p>
        </div>

        <div className="footer-links">
          <Link to="/">Dashboard</Link>
          <Link to="/pegkeeper">PegKeeper</Link>
          <Link to="/charts">Charts</Link>
          <Link to="/show">Show</Link>
          <Link to="/alpha">Alpha</Link>
          <a href="https://frax.finance" target="_blank" rel="noopener noreferrer">
            Frax Finance ↗
          </a>
          <a href="https://curve.fi" target="_blank" rel="noopener noreferrer">
            Curve Finance ↗
          </a>
        </div>

        <div className="footer-sources">
          Data sources: Curve Finance API | Chaos Labs PoR | Frax Finance | Sharpe Terminal
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 ONCHAIN CA$H — Community-produced. Not financial advice.
      </div>
    </footer>
  );
}
