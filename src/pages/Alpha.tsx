import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { MobileWatchCta } from '../components/ShowSection';
import { PLACEHOLDER_DASHBOARD } from '../data/placeholders';

const ALPHA_CALLS = [
  { asset: 'frxUSD/USG LP', action: 'ENTER', thesis: 'Tangent PegKeeper pool at 18.7% APR with $2M+ TVL. Low impermanent loss risk on stable pair.', conviction: 'HIGH', date: 'Jun 14, 2026' },
  { asset: 'frxUSD/USP (Piku)', action: 'MONITOR', thesis: '150%+ APR sustainable? Track debt ratio and Piku DAO governance votes.', conviction: 'MEDIUM', date: 'Jun 7, 2026' },
  { asset: 'FXS Accumulation', action: 'ACCUMULATE', thesis: 'FXS at support with frxUSD volume growth catalyst. 3-6 month horizon.', conviction: 'HIGH', date: 'May 31, 2026' },
  { asset: 'crvUSD/frxUSD Curve LP', action: 'HOLD', thesis: 'Core PegKeeper pool. Steady 12% APR, deepest liquidity.', conviction: 'HIGH', date: 'May 24, 2026' },
  { asset: 'RAAC pmUSD Pool', action: 'WATCH', thesis: 'New partner integration. Monitor TVL growth and peg stability.', conviction: 'LOW', date: 'May 17, 2026' },
];

export function AlphaPage() {
  return (
    <>
      <LiveTicker items={PLACEHOLDER_DASHBOARD.ticker} />
      <Header />
      <MobileWatchCta />

      <div style={{ paddingTop: 'calc(var(--ticker-height) + var(--nav-height) + 48px)' }}>
        <section className="section">
          <div className="section-title">
            <span className="hash">#</span> ALPHA CALLS
          </div>
          <h1 className="section-heading">Alpha Intelligence</h1>
          <p className="section-intro">
            High-conviction trade ideas and early signals from the ONCHAIN CA$H research desk.
            Members-only alpha — subscribe to unlock full access.
          </p>

          <div className="alpha-blur-wrap">
            <div className="alpha-blur-content">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 24 }}>
                {ALPHA_CALLS.map((call) => (
                  <div key={call.asset} className="data-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{ fontSize: 16, fontWeight: 500 }}>{call.asset}</span>
                      <span className={`status-badge ${call.action === 'ENTER' || call.action === 'ACCUMULATE' ? 'status-active' : 'status-alert'}`}>
                        {call.action}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, lineHeight: 1.7 }}>
                      {call.thesis}
                    </p>
                    <div style={{ display: 'flex', gap: 24, fontSize: 11, color: 'var(--faint)' }}>
                      <span>Conviction: {call.conviction}</span>
                      <span>{call.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="alpha-overlay">
              <h2>Subscribe to Unlock</h2>
              <p>Get full access to Alpha Calls, trade alerts, and research notes.</p>
              <button className="btn btn-primary">Subscribe — $29/mo</button>
            </div>
          </div>

          <div style={{ marginTop: 48, padding: 32, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <h3 style={{ fontSize: 16, marginBottom: 12 }}>What you get</h3>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--muted)' }}>
              <li>→ Weekly Alpha Call with entry/exit levels</li>
              <li>→ Real-time PegKeeper alerts via Discord</li>
              <li>→ Pre-show research briefs</li>
              <li>→ Historical alpha call performance tracker</li>
              <li>→ Direct access to the research desk</li>
            </ul>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
