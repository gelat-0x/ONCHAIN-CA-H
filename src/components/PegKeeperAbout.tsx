import { useIntersection } from '../hooks/useIntersection';

export function PegKeeperAbout() {
  const { ref, visible } = useIntersection();

  return (
    <section
      ref={ref}
      id="pegkeeper-about"
      className={`section pegkeeper-about fade-in ${visible ? 'visible' : ''}`}
    >
      <div className="pegkeeper-about__card">
        <p className="section-eyebrow">Metric sources</p>
        <h2 className="text-heading">Live values, with the source made explicit</h2>
        <p>
          Current pool composition comes from Curve&apos;s coin balances. Stake DAO APR appears only after an exact
          pool-to-strategy match. Dune supports historical diagnostics, while DefiLlama is used only when the primary
          TVL source is unavailable.
        </p>
        <p className="pegkeeper-about__foot">
          Current balances and share: Curve or explicit onchain RPC · Volume and Curve APR: Curve · Strategy APR:
          Stake DAO · Historical analysis: Dune · TVL fallback: DefiLlama.
        </p>
      </div>
    </section>
  );
}
