import { useEffect, useId, useRef, useState } from 'react';
import fraxForceBanner from '../assets/frax-force-banner.png';
import fraxForceCrest from '../assets/frax-force-crest.webp';
import { FRAX_FORCE_DISCORD_URL } from '../../shared/constants/socialLinks.ts';
import { useIntersection } from '../hooks/useIntersection';

/** Placeholder until a live donation address is configured. */
const SUPPORT_WALLET_PLACEHOLDER = '0x… · address coming soon';

const SUPPORT_WORDS = ['Mission', 'Vision', 'Concept', 'Cult', 'Force'] as const;
const WORD_ROTATE_MS = 3000;
const WORD_FADE_MS = 320;

const TREASURY_INFO =
  'The Frax Force Treasury is controlled by a 3-of-3 DVN among three of our members. The vision is to generate strategic revenue streams that power this social engine, funding more output, reach, and ecosystem work over time. A fuller roadmap will follow.';

export function FraxForceSection() {
  const { ref, visible } = useIntersection();
  const [copied, setCopied] = useState(false);
  const [wordIndex, setWordIndex] = useState(0);
  const [wordVisible, setWordVisible] = useState(true);
  const [learnSoon, setLearnSoon] = useState(false);
  const [treasuryOpen, setTreasuryOpen] = useState(false);
  const treasuryRef = useRef<HTMLDivElement>(null);
  const treasuryPanelId = useId();
  const canCopy = !SUPPORT_WALLET_PLACEHOLDER.includes('coming soon');

  const handleCopy = async () => {
    if (!canCopy) return;
    try {
      await navigator.clipboard.writeText(SUPPORT_WALLET_PLACEHOLDER);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleLearnMore = () => {
    setLearnSoon(true);
    window.setTimeout(() => setLearnSoon(false), 1600);
  };

  useEffect(() => {
    let fadeTimer: number;
    const cycle = window.setInterval(() => {
      setWordVisible(false);
      fadeTimer = window.setTimeout(() => {
        setWordIndex((i) => (i + 1) % SUPPORT_WORDS.length);
        setWordVisible(true);
      }, WORD_FADE_MS);
    }, WORD_ROTATE_MS);

    return () => {
      window.clearInterval(cycle);
      window.clearTimeout(fadeTimer);
    };
  }, []);

  useEffect(() => {
    if (!treasuryOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!treasuryRef.current?.contains(event.target as Node)) {
        setTreasuryOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTreasuryOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [treasuryOpen]);

  return (
    <section
      ref={ref}
      className={`section home-block frax-force fade-in ${visible ? 'visible' : ''}`}
      id="home-frax-force"
    >
      <div className="frax-force__atmosphere" aria-hidden>
        <img src={fraxForceBanner} alt="" className="frax-force__atmosphere-img" draggable={false} loading="lazy" decoding="async" />
        <div className="frax-force__atmosphere-veil" />
      </div>

      <div className="home-block__inner frax-force__inner home-block__exit-content">
        <div className="frax-force__stage">
          <div className="frax-force__manifest">
            <p className="section-eyebrow">Social Engine</p>
            <h2 className="frax-force__title">Frax Force</h2>
            <p className="frax-force__lead">
              We take ecosystem depth and give it reach through content, culture, education, and
              repetition.
            </p>

            <div className="frax-force__learn-wrap">
              <button
                type="button"
                className={`frax-force__learn-btn${learnSoon ? ' is-soon' : ''}`}
                onClick={handleLearnMore}
                aria-label="Learn more about Frax Force, coming soon"
              >
                {learnSoon ? 'Soon' : 'Learn more about Frax Force'}
              </button>
            </div>
          </div>

          <div className="frax-force__emblem" aria-hidden={!visible}>
            <div className="frax-force__emblem-pedestal" />
            <div className="frax-force__emblem-orbit">
              <div className="frax-force__emblem-coin">
                <img
                  className="frax-force__emblem-face frax-force__emblem-face--front"
                  src={fraxForceCrest}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
                <img
                  className="frax-force__emblem-face frax-force__emblem-face--back"
                  src={fraxForceCrest}
                  alt=""
                  draggable={false}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="frax-force__slab" aria-label="Support and social">
          <div className="frax-force__slab-main">
            <div className="frax-force__slab-copy">
              <p className="frax-force__slab-label" aria-live="polite">
                <span className="frax-force__slab-fixed">Support the</span>{' '}
                <span className="frax-force__slab-word-slot">
                  <span
                    className={`frax-force__slab-word ${
                      wordVisible ? 'frax-force__slab-word--visible' : ''
                    }`}
                  >
                    {SUPPORT_WORDS[wordIndex]}
                  </span>
                </span>
              </p>
              <p className="frax-force__slab-help">
                If you want to back the work behind ONCHAIN CA$H and Frax Force, you can contribute
                directly onchain.
              </p>
            </div>

            <div className="frax-force__slab-ops">
              <div className="frax-force__wallet">
                <code className="frax-force__wallet-addr">{SUPPORT_WALLET_PLACEHOLDER}</code>
                <button
                  type="button"
                  className="frax-force__copy"
                  onClick={handleCopy}
                  disabled={!canCopy}
                  aria-label="Copy wallet address"
                >
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="frax-force__trust-row" ref={treasuryRef}>
                <p className="frax-force__trust">
                  The address links to the Frax Force Treasury
                </p>
                <button
                  type="button"
                  className={`frax-force__info-btn${treasuryOpen ? ' is-open' : ''}`}
                  aria-expanded={treasuryOpen}
                  aria-controls={treasuryPanelId}
                  onClick={() => setTreasuryOpen((v) => !v)}
                >
                  i
                  <span className="sr-only">Treasury info</span>
                </button>

                {treasuryOpen ? (
                  <div
                    id={treasuryPanelId}
                    className="frax-force__info-card"
                    role="dialog"
                    aria-label="Frax Force Treasury"
                  >
                    <p className="frax-force__info-card-title">Frax Force Treasury</p>
                    <p className="frax-force__info-card-body">{TREASURY_INFO}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="frax-force__ctas">
            <a
              className="frax-force__discord"
              href={FRAX_FORCE_DISCORD_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Join our Discord
              <span aria-hidden>↗</span>
            </a>
            <a
              className="frax-force__x"
              href="https://x.com/FraxForce"
              target="_blank"
              rel="noopener noreferrer"
            >
              Join on X
              <span aria-hidden>↗</span>
            </a>
          </div>
        </aside>
      </div>
    </section>
  );
}
