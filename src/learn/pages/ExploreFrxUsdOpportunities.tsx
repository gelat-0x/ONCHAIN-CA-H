import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';

import Seo from '@learn/components/Seo';
import stakeDaoMark from '../../assets/stakedao-boost.png';
import { fetchFrxUsdOpportunities } from '../../services/api';
import {
  FRXUSD_ACTIVE_PLACES,
  FRXUSD_OTHER_PLACES,
  fallbackOpportunityLive,
} from '@shared/data/frxUsdOpportunities.ts';
import type { FrxUsdOppDoor, FrxUsdOppLive, FrxUsdOppRow } from '../../types';
import { chainLogo, chainLogoByName, protocolLogo } from '@learn/lib/oppLogos.ts';

function fmtApy(n: number) {
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${n.toFixed(1)}%`;
}

const DOORS: Array<{ id: FrxUsdOppDoor; title: string; line: string; logos: string[] }> = [
  {
    id: 'vault',
    title: 'Vaults',
    line: 'Deposit frxUSD once. The vault lends it and sends the interest back.',
    logos: ['morpho', 'concrete', 'etherfi'],
  },
  {
    id: 'lend',
    title: 'Lending / borrowing',
    line: 'You lend frxUSD in a market. Borrowers pay you. You can also borrow against collateral.',
    logos: ['aave', 'fraxlend', 'resupply'],
  },
  {
    id: 'loop',
    title: 'Looping strategies',
    line: 'Borrow frxUSD against a yield asset and hold both in one account.',
    logos: ['frax'],
  },
  {
    id: 'fx',
    title: 'FX LP pairs',
    line: 'Add frxUSD and a foreign currency. You earn swap fees when people trade the pair.',
    logos: ['curve', 'aerodrome'],
  },
  {
    id: 'peg',
    title: 'PegKeeper LP',
    line: 'Add frxUSD and another dollar on Curve. Uniswap dollar pairs are listed apart.',
    logos: ['curve', 'uniswap'],
  },
  {
    id: 'boost',
    title: 'Boost your LPs',
    line: 'You already hold a Curve LP. Stake it for extra rewards, or let a vault compound them.',
    logos: ['stakedao', 'convex', 'beefy'],
  },
];

const WavyGrid = ({ paused }: { paused: boolean }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();
  const still = Boolean(reduceMotion) || paused;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let hidden = document.hidden;
    let w = 0;
    let h = 0;
    const step = 68;
    const seg = 14;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const warp = (x: number, y: number, t: number): [number, number] => {
      const dx = Math.sin(y * 0.011 + t * 0.55) * 9 + Math.sin((x + y) * 0.0055 - t * 0.32) * 6;
      const dy = Math.cos(x * 0.0105 - t * 0.47) * 9 + Math.sin((x - y) * 0.0062 + t * 0.38) * 6;
      return [x + dx, y + dy];
    };

    const draw = (now: number) => {
      const t = now / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      for (let x = -step; x <= w + step; x += step) {
        ctx.beginPath();
        for (let y = -step, first = true; y <= h + step; y += seg, first = false) {
          const [px, py] = warp(x, y, t);
          if (first) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      for (let y = -step; y <= h + step; y += step) {
        ctx.beginPath();
        for (let x = -step, first = true; x <= w + step; x += seg, first = false) {
          const [px, py] = warp(x, y, t);
          if (first) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      if (!still && !hidden) raf = window.requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      hidden = document.hidden;
      if (!hidden && !still) {
        window.cancelAnimationFrame(raf);
        raf = window.requestAnimationFrame(draw);
      }
    };

    const ro = new ResizeObserver(() => {
      resize();
      if (still) draw(performance.now());
    });
    ro.observe(canvas);
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    raf = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      ro.disconnect();
    };
  }, [still]);

  return <canvas ref={ref} className="fxo-bg__grid" aria-hidden />;
};

const HeroRotator = ({ live }: { live: FrxUsdOppLive }) => {
  const reduceMotion = useReducedMotion();
  const slides = useMemo(
    () => [
      `${live.liveCount} opportunities`,
      `${fmtApy(live.averageApy)} average APR`,
      `Live across ${FRXUSD_ACTIVE_PLACES.length}+ chains`,
    ],
    [live.liveCount, live.averageApy],
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (reduceMotion || slides.length < 2) return;
    const timer = window.setInterval(() => setIdx((cur) => (cur + 1) % slides.length), 4200);
    return () => window.clearInterval(timer);
  }, [reduceMotion, slides.length]);

  return (
    <p className="fxo-hero__stats" aria-live="polite">
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={slides[idx]}
          className="fxo-hero__stat"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          {slides[idx]}
        </motion.span>
      </AnimatePresence>
    </p>
  );
};

const Backdrop = ({ paused }: { paused: boolean }) => (
  <div className="fxo-bg" aria-hidden>
    <WavyGrid paused={paused} />
    <img src="/learn/images/usd-coins-bg.png" alt="" className="fxo-bg__coins" />
    <div className="fxo-bg__veil" />
  </div>
);

const Logo = ({ id, className }: { id: string; className?: string }) => {
  const src = protocolLogo(id);
  const plate = id === 'fraxlend' || id === 'usdb' ? ' is-plate' : '';
  if (!src) return <span className={`fxo-logo fxo-logo--fallback ${className ?? ''}`}>{id.slice(0, 2)}</span>;
  return <img src={src} alt="" className={`fxo-logo${plate} ${className ?? ''}`} />;
};

const ChainChip = ({ name, live }: { name: string; live?: boolean }) => {
  const src = chainLogoByName(name);
  return (
    <span className={`fxo-chip ${live ? 'is-live' : ''}`}>
      {src ? <img src={src} alt="" /> : null}
      {name}
    </span>
  );
};

const Out = ({
  href,
  internal,
  children,
  className,
}: {
  href: string;
  internal?: boolean;
  children: ReactNode;
  className?: string;
}) =>
  internal ? (
    <Link to={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  );

const MarketList = ({
  door,
  rows,
  stakeCount,
  onStake,
}: {
  door: FrxUsdOppDoor;
  rows: FrxUsdOppRow[];
  stakeCount: number;
  onStake: () => void;
}) => {
  const spec = DOORS.find((item) => item.id === door);
  const [picked, setPicked] = useState<string | null>(null);
  const groups: string[] = [];
  for (const row of rows) {
    const name = row.group ?? row.name;
    if (!groups.includes(name)) groups.push(name);
  }
  return (
    <section className="fxo-markets" id="fxo-markets">
      <header>
        <h2>{spec?.title}</h2>
        <p>{spec?.line}</p>
      </header>
      {rows.length === 0 ? <p className="fxo-markets__empty">Markets are still loading.</p> : null}
      {groups.map((group) => (
        <div key={group} className="fxo-market-group">
          <h3>{group}</h3>
          <ul>
            {rows
              .filter((row) => (row.group ?? row.name) === group)
              .map((row) => {
                const open = picked === row.id;
                return (
                  <li key={row.id} className={open ? 'is-open' : undefined}>
                    <button
                      type="button"
                      className="fxo-pick"
                      aria-expanded={open}
                      onClick={() => setPicked(open ? null : row.id)}
                    >
                      <Logo id={row.venue} />
                      <span>
                        <b>{row.name}</b>
                        <ChainChip name={row.chain} />
                      </span>
                      <strong>{row.apy > 0 ? fmtApy(row.apy) : 'On venue'}</strong>
                    </button>
                    {open ? (
                      <div className="fxo-market-detail">
                        <p>{row.happens}</p>
                        {row.youDo ? (
                          <p className="fxo-markets__do">
                            <span>What you do</span> {row.youDo}
                          </p>
                        ) : null}
                        <Out href={row.href} internal={row.internal} className="fxo-btn">
                          Open <ArrowUpRight className="w-3.5 h-3.5" />
                        </Out>
                      </div>
                    ) : null}
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
      {door === 'boost' ? (
        <button type="button" className="fxo-btn fxo-btn--solid" onClick={onStake}>
          All {stakeCount} Stake DAO pools
        </button>
      ) : null}
    </section>
  );
};

const DoorWindow = ({
  door,
  rows,
  stakeCount,
  onStake,
  onClose,
}: {
  door: FrxUsdOppDoor;
  rows: FrxUsdOppRow[];
  stakeCount: number;
  onStake: () => void;
  onClose: () => void;
}) => {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fxo-modal" role="dialog" aria-modal="true" aria-label="Markets" onClick={onClose}>
      <div className="fxo-modal__card fxo-modal__card--markets" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="fxo-modal__close" onClick={onClose} aria-label="Close">
          <X className="w-4 h-4" />
        </button>
        <MarketList door={door} rows={rows} stakeCount={stakeCount} onStake={onStake} />
      </div>
    </div>,
    document.body,
  );
};

const ExploreFrxUsdOpportunities = ({ embedded = false }: { embedded?: boolean }) => {
  const [live, setLive] = useState<FrxUsdOppLive>(fallbackOpportunityLive);
  const [door, setDoor] = useState<FrxUsdOppDoor | null>(null);
  const [placesOpen, setPlacesOpen] = useState(false);
  const [mintOpen, setMintOpen] = useState(false);
  const [stakeOpen, setStakeOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchFrxUsdOpportunities().then((d) => {
      if (!cancelled) setLive(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const markets = useMemo(
    () => live.rows.filter((row) => row.door),
    [live.rows],
  );

  const openDoor = (id: FrxUsdOppDoor) => {
    setDoor(id);
  };

  return (
    <div className={embedded ? 'fxo fxo--embedded' : 'fxo'} id={embedded ? 'opportunities' : undefined}>
      {embedded ? null : (
      <Seo
        title="Use your frxUSD"
        description="Put frxUSD in a vault, or pair it with another token. Live rates in simple words."
        path="/learn/explore-frxusd-opportunities"
      />
      )}
      <Backdrop paused={stakeOpen} />

      <div className="fxo-wrap">
        <header className="fxo-hero">
          <h1>Use your frxUSD</h1>
          <p className="fxo-hero__lede">Put it in a vault or pair it with another token.</p>
          <HeroRotator live={live} />

          <button
            type="button"
            className="fxo-places-link"
            aria-expanded={placesOpen}
            onClick={() => {
              setPlacesOpen((v) => {
                if (v) setMintOpen(false);
                return !v;
              });
            }}
          >
            {FRXUSD_ACTIVE_PLACES.length} chains with live rates
          </button>
          {placesOpen ? (
            <div className="fxo-places-wrap">
              <p>These four chains have live rates on this page.</p>
              <ul className="fxo-places">
                {FRXUSD_ACTIVE_PLACES.map((c) => {
                  const src = chainLogo(c.id);
                  return (
                    <li key={c.id} className="is-live">
                      {src ? <img src={src} alt="" /> : null}
                      {c.name}
                    </li>
                  );
                })}
              </ul>
              <button
                type="button"
                className="fxo-places__more"
                onClick={() => setMintOpen((v) => !v)}
                aria-expanded={mintOpen}
              >
                {mintOpen ? 'Hide' : 'Show'} {FRXUSD_OTHER_PLACES.length} more chains where you can mint
              </button>
              {mintOpen ? (
                <ul className="fxo-places">
                  {FRXUSD_OTHER_PLACES.map((c) => {
                    const src = chainLogo(c.id);
                    return (
                      <li key={c.id}>
                        {src ? <img src={src} alt="" /> : null}
                        {c.name}
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          ) : null}
        </header>

        <section className="fxo-doors" aria-label="Ways to use frxUSD">
          {DOORS.map((item) => {
            const rows = markets.filter((row) => row.door === item.id);
            const deep = rows
              .filter((row) => row.apy > 0)
              .filter((row) => item.id !== 'fx' || row.group === 'Curve' || row.group === 'Aerodrome')
              .sort((a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0))[0];
            return (
              <button
                key={item.id}
                type="button"
                className={`fxo-door${door === item.id ? ' is-open' : ''}`}
                aria-expanded={door === item.id}
                onClick={() => openDoor(item.id)}
              >
                <span className="fxo-door__art" aria-hidden>
                  {item.id === 'loop' ? (
                    <>
                      <span className="fxo-mark">G</span>
                      <span className="fxo-mark">M</span>
                    </>
                  ) : (
                    item.logos.map((logo) => <Logo key={logo} id={logo} />)
                  )}
                </span>
                <span className="fxo-door__copy">
                  <b>{item.title}</b>
                  <small>{item.line}</small>
                  <em>
                    {deep
                      ? `${deep.name} · ${fmtApy(deep.apy)}`
                      : item.id === 'loop'
                        ? 'Gearbox × Midas · rate on the venue'
                        : 'Open a market'}
                  </em>
                </span>
              </button>
            );
          })}
        </section>

        {door ? (
          <DoorWindow
            door={door}
            rows={markets.filter((row) => row.door === door)}
            stakeCount={live.stakeDao.count}
            onStake={() => {
              setDoor(null);
              setStakeOpen(true);
            }}
            onClose={() => setDoor(null)}
          />
        ) : null}

        <footer className="fxo-end">
          <p>
            Rates change. You can lose money. This is not advice — open the venue and check before
            you put money in.
          </p>
          {embedded ? null : <Link to="/frxUSD">Back to frxUSD</Link>}
        </footer>
      </div>

      <StakeSheet
        open={stakeOpen}
        pools={live.stakeDao.pools}
        count={live.stakeDao.count}
        onClose={() => setStakeOpen(false)}
      />
    </div>
  );
};

const StakeSheet = ({
  open,
  pools,
  count,
  onClose,
}: {
  open: boolean;
  pools: FrxUsdOppRow[];
  count: number;
  onClose: () => void;
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fxo-modal"
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="fxo-modal__card"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="fxo-modal__close" onClick={onClose} aria-label="Close">
              <X className="w-4 h-4" />
            </button>
            <header className="fxo-modal__head">
              <img src={stakeDaoMark} alt="" className="fxo-modal__logo" />
              <div>
                <h3>Boost a pair you already made</h3>
                <p>{count} Curve pools with frxUSD</p>
              </div>
            </header>
            <ul className="fxo-lp">
              {pools.map((p) => (
                <li key={p.id}>
                  <a href={p.href} target="_blank" rel="noopener noreferrer">
                    <span>
                      <b>{p.pair}</b>
                      <small>{p.chain}</small>
                    </span>
                    <em>{fmtApy(p.apy)}</em>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </a>
                </li>
              ))}
            </ul>
            <footer className="fxo-modal__foot">
              <a
                href="https://www.stakedao.org/yield?tokenFilter=usd&search=frxUSD"
                target="_blank"
                rel="noopener noreferrer"
                className="fxo-btn fxo-btn--solid"
              >
                Open Stake DAO <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </footer>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default ExploreFrxUsdOpportunities;
