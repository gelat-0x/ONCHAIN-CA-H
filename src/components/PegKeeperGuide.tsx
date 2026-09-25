import { useState, type ReactNode } from 'react';
import { useIntersection } from '../hooks/useIntersection';

interface GuideItem {
  id: string;
  title: string;
  body: ReactNode | ((openItem: (id: string) => void) => ReactNode);
}

const ITEMS: GuideItem[] = [
  {
    id: 'pegkeeper',
    title: 'What is a PegKeeper?',
    body: (openItem) => (
      <>
        <p>
          A PegKeeper is Curve-specific infrastructure built to hold <strong>crvUSD</strong> near
          its dollar peg. It uses a set of major stablecoins that have access to the real dollar,
          typically cash-redeemable names such as USDC and USDT, so that when crvUSD trades off
          peg, the keeper can swap against those dollars and pull it back.
        </p>
        <p>
          Now it gets interesting, since <strong>frxUSD</strong> is also one of these major
          PegKeepers. It has the same standards as USDT, USDC, and the rest of that set, but with
          additional advantages.{' '}
          <button
            type="button"
            className="pegkeeper-faq__crosslink"
            onClick={() => openItem('why-frxusd')}
          >
            See why pair with frxUSD
          </button>
          .
        </p>
      </>
    ),
  },
  {
    id: 'frxusd',
    title: 'What is frxUSD?',
    body: (
      <p>
        <strong>frxUSD</strong> is a GENIUS-compliant payment stablecoin built by Frax Finance. It
        is fiat-redeemable and fully collateralized. Each frxUSD is backed 1-to-1 by permitted
        cash-equivalent reserves such as tokenized U.S. Treasury funds (for example BUIDL, USTB,
        and other approved reserve assets), held with regulated custodians and managed by Frax Inc
        under delegation from the Frax DAO.
      </p>
    ),
  },
  {
    id: 'why-frxusd',
    title: 'Why pair with frxUSD?',
    body: (
      <>
        <p>
          DeFi protocols are pairing with frxUSD instead of parking liquidity only against other
          cash-access dollars, because of how backing yield is treated.
        </p>
        <p>
          frxUSD is backed by Treasury-style reserves. That yield is forwarded into the ecosystem,
          streamlined and transparent, instead of staying with the issuer. Pairing with frxUSD lets
          protocols put the dollar side of their liquidity to work, and make more from the same
          capital.
        </p>
      </>
    ),
  },
  {
    id: 'what-is-apr',
    title: 'What does APR mean here?',
    body: (
      <p>
        <strong>APR</strong> (Annual Percentage Rate) is an annualized estimate of the yield a
        liquidity position can earn from the sources shown on each card. It is not a fixed
        guaranteed return. It moves with volume, gauge weight, incentives, pool composition, boost,
        and strategy fees.
      </p>
    ),
  },
  {
    id: 'apr-layers',
    title: 'The three APR layers',
    body: (
      <>
        <p>Liquidity providers can stack several return sources. This dashboard separates them into three layers:</p>
        <ul>
          <li>
            <strong>Curve base APR</strong>, annualized trading fees the pool earns from swaps, shared by LPs
            according to their pool share. Higher volume generally raises this layer; idle pools earn little here.
          </li>
          <li>
            <strong>Curve total APR</strong>, APR-equivalent of Curve&apos;s <em>Total APY</em> at max boost. On
            curve.finance, Total APY = Base APY + CRV (and extra) rewards, with CRV shown after daily compounding and
            often as a max-boost vs unboosted range. This dashboard takes that max Total APY and converts it to APR
            (removing the autocompound assumption) so every card uses one APR unit. Gauge weight is set by veCRV
            voting; more weight means more token rewards for that pool&apos;s staked LPs.
          </li>
          <li>
            <strong>Stake DAO APR</strong>, the verified Strategy APR for staking eligible Curve LP tokens through
            Stake DAO. This is the path for users who want boosted gauge access without holding their own veCRV. It
            appears only when this dashboard has an exact pool-to-strategy match. On the card, that figure is labeled
            APR with the Stake DAO mark next to the number, hover the mark to confirm the source.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'curve-vs-stakedao',
    title: 'Why is Curve’s max APR higher than Stake DAO APR?',
    body: (
      <>
        <p>
          Curve may display a <strong>maximum boosted APR</strong> for a gauge. That figure is the theoretical yield
          for a position receiving the full Curve boost, before external strategy fees.
        </p>
        <p>
          Stake DAO can use its veCRV (via Liquid Lockers) to approach or obtain that boost for LP tokens deposited
          into its Strategy. The full gross boost is not passed 1:1 to depositors, because Stake DAO charges
          performance fees when gauge rewards are harvested.
        </p>
        <ul>
          <li>
            <strong>Curve maximum boosted APR</strong> ≈ gross yield before Stake DAO fees.
          </li>
          <li>
            <strong>Stake DAO Strategy APR</strong> ≈ depositor yield after applicable performance fees.
          </li>
        </ul>
        <p>
          So Stake DAO&apos;s shown APR is normally lower than Curve&apos;s maximum, even when the Strategy captures
          the same underlying boost. Do not compare Stake DAO only against Curve&apos;s maximum. A direct Curve
          depositor reaches that maximum only by holding enough veCRV relative to LP size; without it, they earn the
          unboosted or partially boosted rate.
        </p>
        <p>
          Stake DAO&apos;s value is shared boost without buying, locking, and managing CRV yourself. Strategy fees are
          performance fees on harvest, not deposit/withdraw fees. The live fee rate is shown on each Strategy page and
          can vary by integration.
        </p>
      </>
    ),
  },
  {
    id: 'only-boost',
    title: 'What is Stake DAO Only Boost?',
    body: (
      <>
        <p>
          <strong>OnlyBoost</strong> is Stake DAO&apos;s Curve strategy that does not leave every deposit sitting in
          Stake DAO&apos;s own locker. Instead it splits LP across Stake DAO and{' '}
          <strong>Convex</strong> so the position gets the best effective gauge boost available at the time.
        </p>
        <p>
          The split is calculated from each venue&apos;s veCRV balance (including delegated boost) relative to LP
          already sitting there. When Convex can deliver a stronger boost, Only Boost routes that share through a
          Convex implementation contract, then rebalances and harvests rewards together. Users still deposit once on
          Stake DAO, they do not manage the Convex leg themselves.
        </p>
        <p>
          The OnlyBoost wordmark appears only after you open a pool card, not on the grid. Venue links for Curve,
          Stake DAO, and Convex (when used) live inside that opened card. The APR on this dashboard is always the
          verified Stake DAO Strategy figure. Convex is infrastructure Only Boost may use under the hood,
          documented at{' '}
          <a href="https://docs.stakedao.org/only-boost" target="_blank" rel="noopener noreferrer">
            docs.stakedao.org/only-boost
          </a>
          . Convex is listed only on pools that actually use Only Boost.
        </p>
      </>
    ),
  },
  {
    id: 'earn',
    title: 'How do users earn?',
    body: (
      <>
        <ol>
          <li>
            Open a pool with Explore, then use the Curve link and supply liquidity to receive Curve LP tokens
            representing your share of the pool.
          </li>
          <li>
            Keep the LP unstaked if you only want pool ownership and fee exposure, or stake it where rewards are
            available.
          </li>
          <li>
            On Curve, stake LP into the pool gauge to earn gauge emissions. Full personal boost normally requires your
            own veCRV relative to your LP size.
          </li>
          <li>
            If you do not hold veCRV, stake the same LP in Stake DAO when a Strategy exists. Strategies marked{' '}
            <strong>OnlyBoost</strong> automatically allocate between Stake DAO and Convex for optimal boost, so a
            Convex link inside the opened card is a venue, not a second APR to compare.
          </li>
          <li>
            Compare the labeled APRs in the opened card. Stake DAO is not available for every pool; when it is missing, use
            Curve directly.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: 'strategy-earn',
    title: 'How do Stake DAO Strategy depositors earn?',
    body: (
      <>
        <p>Depositors in a Stake DAO Curve Strategy earn from two main sources:</p>
        <ul>
          <li>
            <strong>Trading fees</strong>, the underlying Curve LP still earns its share of pool swap fees, whether
            the LP sits directly on Curve or is deposited through Stake DAO.
          </li>
          <li>
            <strong>Curve gauge rewards</strong>, once LP tokens are in the matching gauge, they earn CRV emissions
            and any extra incentive tokens allocated to that gauge. Stake DAO uses veCRV held by its Liquid Locker to
            boost those gauge rewards, so depositors can receive higher CRV yield without a personal four-year CRV
            lock.
          </li>
        </ul>
        <p>
          After harvest, the Strategy&apos;s published APR reflects rewards net of Stake DAO performance fees. Always
          read the live Strategy page for the current fee and breakdown.
        </p>
      </>
    ),
  },
  {
    id: 'cards',
    title: 'How to read each pool card',
    body: (
      <ul>
        <li>
          <strong>TVL</strong>, total USD liquidity currently reported for the Curve pool.
        </li>
        <li>
          <strong>frxUSD in pool</strong>, USD value of the frxUSD coin balance reported by Curve.
          The mini ring next to that figure is the frxUSD share of pool TVL, hover it for the
          exact percentage.
        </li>
        <li>
          <strong>Vol 24h</strong>, trading volume over the latest available 24-hour period.
        </li>
        <li>
          <strong>APR</strong>, the card APR. When the Stake DAO mark sits next to the number, hover
          it: shown APR is coming from Stake DAO. Otherwise the figure is Curve total or Curve base.
        </li>
        <li>
          <strong>Explore</strong> opens the pool. Curve, Stake DAO, and Convex links, plus the
          OnlyBoost wordmark when that strategy is active, live inside the opened card, not on the
          grid.
        </li>
      </ul>
    ),
  },
];

export function PegKeeperGuide() {
  const { ref, visible } = useIntersection();
  const [openId, setOpenId] = useState<string | null>(ITEMS[0]?.id ?? null);

  const openItem = (id: string) => {
    setOpenId(id);
    window.requestAnimationFrame(() => {
      document.getElementById(`pegkeeper-faq-${id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
  };

  return (
    <section
      ref={ref}
      id="pegkeeper-guide"
      className={`section pegkeeper-faq fade-in ${visible ? 'visible' : ''}`}
    >
      <p className="section-eyebrow">Learn</p>
      <h2 className="section-title pegkeeper-faq__title">UNDERSTAND THE PEGKEEPER FAMILY</h2>

      <ul className="pegkeeper-faq__list">
        {ITEMS.map((item) => {
          const open = openId === item.id;
          return (
            <li
              key={item.id}
              id={`pegkeeper-faq-${item.id}`}
              className={`pegkeeper-faq__item ${open ? 'pegkeeper-faq__item--open' : ''}`}
            >
              <button
                type="button"
                className="pegkeeper-faq__trigger"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : item.id)}
              >
                <span className="pegkeeper-faq__trigger-text">{item.title}</span>
                <span className="pegkeeper-faq__chevron" aria-hidden>
                  ▾
                </span>
              </button>
              <div className="pegkeeper-faq__panel">
                <div className="pegkeeper-faq__panel-inner">
                  {typeof item.body === 'function' ? item.body(openItem) : item.body}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
