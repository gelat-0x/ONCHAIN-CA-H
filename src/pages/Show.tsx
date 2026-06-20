import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { ShowSection, MobileWatchCta } from '../components/ShowSection';
import { PLACEHOLDER_DASHBOARD } from '../data/placeholders';

const EPISODES = [
  { title: 'Episode 24 — PegKeeper Wars', date: 'Jun 14, 2026', duration: '1h 42m', desc: 'Deep dive into frxUSD PegKeeper mechanics and partner integrations.' },
  { title: 'Episode 23 — The $500M Milestone', date: 'Jun 7, 2026', duration: '1h 38m', desc: 'frxUSD volume milestones and Chaos Labs PoR breakdown.' },
  { title: 'Episode 22 — Sonic & Fraxtal Expansion', date: 'May 31, 2026', duration: '1h 55m', desc: 'Multi-chain frxUSD deployment and cross-chain liquidity.' },
  { title: 'Episode 21 — Alpha Season', date: 'May 24, 2026', duration: '2h 01m', desc: 'Yield farming strategies and PegKeeper APR analysis.' },
  { title: 'Episode 20 — FUD Watch Special', date: 'May 17, 2026', duration: '1h 28m', desc: 'Debunking stablecoin FUD and reserve transparency.' },
  { title: 'Episode 19 — Curve Wars 2.0', date: 'May 10, 2026', duration: '1h 45m', desc: 'PegKeeper incentives and crvUSD integration deep dive.' },
];

export function ShowPage() {
  return (
    <>
      <LiveTicker items={PLACEHOLDER_DASHBOARD.ticker} />
      <Header />
      <MobileWatchCta />

      <div style={{ paddingTop: 'calc(var(--ticker-height) + var(--nav-height) + 48px)' }}>
        <section className="section">
          <div className="section-title">
            <span className="hash">#</span> SHOW ARCHIVE
          </div>
          <h1 className="section-heading">ONCHAIN CA$H Live</h1>
          <p className="section-intro">
            Weekly onchain intelligence. Macro, DeFi, frxUSD ecosystem updates,
            and alpha — every episode archived here.
          </p>

          <ShowSection />

          <div style={{ marginTop: 64 }}>
            <h2 className="section-heading" style={{ fontSize: 20, marginBottom: 24 }}>All Episodes</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {EPISODES.map((ep) => (
                <div
                  key={ep.title}
                  className="data-card"
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 0 }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 500, marginBottom: 4 }}>{ep.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>{ep.date} · {ep.duration}</div>
                    <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 4 }}>{ep.desc}</div>
                  </div>
                  <a
                    href="https://youtube.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                  >
                    Watch ↗
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
