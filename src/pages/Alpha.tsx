import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PLACEHOLDER_DASHBOARD } from '../data/placeholders';

const ALPHA_CALLS = [
  { asset: 'frxUSD/USG LP', action: 'ENTER', thesis: 'Tangent PegKeeper pool at 18.7% APR with $2M+ TVL. Low impermanent loss risk on a stable pair.', conviction: 'HIGH', date: 'Jun 14, 2026' },
  { asset: 'frxUSD/USP (Piku)', action: 'MONITOR', thesis: 'Is 150%+ APR sustainable? Track debt ratio and Piku DAO governance votes.', conviction: 'MEDIUM', date: 'Jun 7, 2026' },
  { asset: 'FXS Accumulation', action: 'ACCUMULATE', thesis: 'FXS at support with frxUSD volume growth as catalyst. 3–6 month horizon.', conviction: 'HIGH', date: 'May 31, 2026' },
  { asset: 'crvUSD/frxUSD Curve LP', action: 'HOLD', thesis: 'Core PegKeeper pool. Steady 12% APR, deepest liquidity in the family.', conviction: 'HIGH', date: 'May 24, 2026' },
  { asset: 'RAAC pmUSD Pool', action: 'WATCH', thesis: 'New partner integration. Monitor TVL growth and peg stability before sizing.', conviction: 'LOW', date: 'May 17, 2026' },
];

const PERKS = [
  'Weekly Alpha Call with entry/exit levels',
  'Real-time PegKeeper alerts via Discord',
  'Pre-show research briefs',
  'Historical alpha call performance tracker',
  'Direct access to the research desk',
];

export function AlphaPage() {
  return (
    <>
      <LiveTicker items={PLACEHOLDER_DASHBOARD.ticker} />
      <Header />

      <main className="page-pad alpha-page">
        <header className="alpha-hero">
          <p className="section-eyebrow">Research desk</p>
          <h1 className="section-title alpha-hero__title">Alpha Intelligence</h1>
          <p className="alpha-hero__copy">
            High-conviction calls and early signals from the ONCHAIN CA$H research desk.
            Members-only alpha, the data layer stays open, this is the gated surface.
          </p>
        </header>

        <section className="section section--tight">
          <div className="alpha-gate cult-shadow-deep">
            <div className="alpha-gate__blur">
              <div className="alpha-calls">
                {ALPHA_CALLS.map((call) => (
                  <article key={call.asset} className="alpha-call">
                    <div className="alpha-call__head">
                      <span className="alpha-call__asset">{call.asset}</span>
                      <span
                        className={`alpha-call__badge ${
                          call.action === 'ENTER' || call.action === 'ACCUMULATE'
                            ? 'alpha-call__badge--bull'
                            : 'alpha-call__badge--neutral'
                        }`}
                      >
                        {call.action}
                      </span>
                    </div>
                    <p className="alpha-call__thesis">{call.thesis}</p>
                    <div className="alpha-call__foot">
                      <span className="alpha-call__conviction">Conviction · {call.conviction}</span>
                      <span className="alpha-call__date">{call.date}</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="alpha-gate__overlay">
              <h2 className="alpha-gate__title">Subscribe to unlock</h2>
              <p className="alpha-gate__copy">
                Full Alpha Calls, trade alerts, and research notes, $29/mo.
              </p>
              <button type="button" className="btn-primary alpha-gate__cta">Subscribe, $29/mo</button>
            </div>
          </div>
        </section>

        <section className="section alpha-perks">
          <div className="alpha-perks__card cult-shadow">
            <h3 className="alpha-perks__title">What you get</h3>
            <ul className="alpha-perks__list">
              {PERKS.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
