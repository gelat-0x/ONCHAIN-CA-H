import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { PoolData } from '../types';
import {
  EXAMPLE_PRINCIPAL,
  EXAMPLE_RATE,
  EXAMPLE_HORIZONS,
  formatExampleYield,
  projectExampleYield,
} from '../lib/pegKeeperYield';
import { useIntersection } from '../hooks/useIntersection';

interface PegKeeperYieldEngineProps {
  pools: PoolData[];
}

const CYCLE_MS = 3200;
const PULSE_MS = 2400;
const RESERVES_URL = 'https://frax.com/transparency';
const SUPERIOR_PEGKEEPER_URL =
  'https://x.com/fraxfinance/status/2060052551743987807?s=20';

const STEPS: Array<{
  step: string;
  title: string;
  note: string;
  back: ReactNode;
  emphasis?: boolean;
}> = [
  {
    step: 'STEP 1',
    title: 'frxUSD reserves',
    note: 'Tokenized treasuries and money market funds',
    back: (
      <>
        <p>
          Mostly backed by short-term U.S. T-bills, one of the safest assets available, managed by
          BlackRock, WisdomTree, and other major players.
        </p>
        <a
          className="pk-yield__flip-link"
          href={RESERVES_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
        >
          View reserves →
        </a>
      </>
    ),
  },
  {
    step: 'STEP 2',
    title: 'Reserve income',
    note: 'What those holdings earn',
    back: (
      <p>
        That backing earns yield, and Frax shares it directly with the ecosystem instead of keeping
        it.
      </p>
    ),
  },
  {
    step: 'STEP 3',
    title: "The pool's incentives",
    note: 'Frax forwards it here',
    emphasis: true,
    back: (
      <p>
        Frax routes that yield into pool incentives, powering liquidity that runs on frxUSD.
      </p>
    ),
  },
];

function YieldFlipCard({
  item,
  pulsing,
}: {
  item: (typeof STEPS)[number];
  pulsing: boolean;
}) {
  const [flipped, setFlipped] = useState(false);

  const canHover =
    typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches;

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setFlipped((f) => !f);
    }
  };

  return (
    <article
      className={[
        'pk-yield__flip',
        item.emphasis ? 'pk-yield__flip--emphasis' : '',
        flipped ? 'pk-yield__flip--flipped' : '',
        pulsing ? 'pk-yield__flip--pulse' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      role="button"
      tabIndex={0}
      aria-pressed={flipped}
      aria-label={`${item.title}, hover or tap for details`}
      onMouseEnter={() => {
        if (canHover) setFlipped(true);
      }}
      onMouseLeave={() => {
        if (canHover) setFlipped(false);
      }}
      onClick={() => setFlipped((f) => !f)}
      onKeyDown={onKeyDown}
    >
      <div className="pk-yield__flip-inner">
        <div className="pk-yield__flip-face pk-yield__flip-face--front" aria-hidden={flipped}>
          <span className="pk-yield__step-kicker">{item.step}</span>
          <span className="pk-yield__step-title">{item.title}</span>
          <span className="pk-yield__step-note">{item.note}</span>
          <span className="pk-yield__flip-hint">
            <span className="pk-yield__flip-hint--hover">Hover for details</span>
            <span className="pk-yield__flip-hint--tap">Tap for details</span>
          </span>
        </div>
        <div className="pk-yield__flip-face pk-yield__flip-face--back" aria-hidden={!flipped}>
          <span className="pk-yield__step-kicker">{item.step}</span>
          <div className="pk-yield__flip-back-body">{item.back}</div>
        </div>
      </div>
    </article>
  );
}

export function PegKeeperYieldEngine({ pools: _pools }: PegKeeperYieldEngineProps) {
  const { ref, visible } = useIntersection(0.2);
  const [horizonIndex, setHorizonIndex] = useState(0);
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => {
      setHorizonIndex((i) => (i + 1) % EXAMPLE_HORIZONS.length);
    }, CYCLE_MS);
    return () => window.clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => {
      setPulseIndex((i) => (i + 1) % STEPS.length);
    }, PULSE_MS);
    return () => window.clearInterval(id);
  }, [visible]);

  const horizon = EXAMPLE_HORIZONS[horizonIndex] ?? EXAMPLE_HORIZONS[0];
  const exampleResult = useMemo(
    () => projectExampleYield(EXAMPLE_PRINCIPAL, EXAMPLE_RATE, horizon.years),
    [horizon.years],
  );
  const ratePct = (EXAMPLE_RATE * 100).toFixed(1);

  return (
    <section
      ref={ref}
      className={`section pk-yield ${visible ? 'pk-yield--visible' : ''}`}
      id="pegkeeper-yield"
      aria-label="frxUSD yield forwarding"
    >
      <div className="pk-yield__card">
        <div className="pk-yield__layout">
          <div className="pk-yield__main">
            <header className="pk-yield__head">
              <p className="section-eyebrow">For partner protocols</p>
              <h2 className="section-title">Revenue stream from frxUSD reserves</h2>
              <p className="pk-yield__thesis">
                frxUSD forwards real yield back to partner liquidity.
              </p>
            </header>

            <div
              className="pk-yield__steps"
              role="list"
              aria-label="Where the pool's incentives come from"
            >
              {STEPS.map((item, index) => (
                <div key={item.step} className="pk-yield__step-wrap" role="listitem">
                  {index > 0 ? (
                    <span
                      className={[
                        'pk-yield__step-arrow',
                        pulseIndex === index ? 'pk-yield__step-arrow--lit' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      aria-hidden
                    >
                      →
                    </span>
                  ) : null}
                  <YieldFlipCard item={item} pulsing={pulseIndex === index} />
                </div>
              ))}
            </div>
          </div>

          <aside className="pk-yield__explain" aria-label="Illustrative yield example">
            <div className="pk-yield__example">
              <p className="pk-yield__example-label">
                Example · $100K at {ratePct}% / yr
              </p>
              <div className="pk-yield__example-result" key={horizon.key} aria-live="polite">
                <span className="pk-yield__example-horizon">{horizon.label}</span>
                <span className="pk-yield__example-value tabular-nums">
                  {formatExampleYield(exampleResult)}
                </span>
              </div>
            </div>

            <a
              className="pk-yield__explain-link"
              href={SUPERIOR_PEGKEEPER_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn more about why frxUSD is the superior pegkeeper →
            </a>
          </aside>
        </div>
      </div>
    </section>
  );
}
