import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, X } from 'lucide-react';

import Seo from '@learn/components/Seo';
import stakeDaoMark from '../../assets/stakedao-boost.png';
import { useHeroApr } from '@learn/hooks/useHeroApr';
import { fetchFrxUsdOpportunities } from '../../services/api';
import {
  fallbackOpportunityLive,
} from '@shared/data/frxUsdOpportunities.ts';
import type { FrxUsdOppDoor, FrxUsdOppLive, FrxUsdOppRow } from '../../types';
import { chainLogoByName, protocolLogo } from '@learn/lib/oppLogos.ts';

function fmtApy(n: number) {
  if (!Number.isFinite(n) || n <= 0) return '—';
  return `${n.toFixed(1)}%`;
}

const DOORS: Array<{ id: FrxUsdOppDoor; title: string; line: string; note?: string; logos: string[]; advanced?: boolean }> = [
  {
    id: 'hold',
    title: 'Hold on FraxNet',
    line: 'KYC once. Hold frxUSD. Earn the reserve yield.',
    note: 'Or swap to sfrxUSD with no KYC. Higher yield, and not riskless.',
    logos: ['frax'],
  },
  {
    id: 'vault',
    title: 'Put in a vault',
    line: 'Deposit frxUSD once. The vault lends it and sends the interest back.',
    logos: ['morpho', 'concrete', 'etherfi'],
  },
  {
    id: 'lend',
    title: 'Lend',
    line: 'Supply frxUSD. Borrowers pay you.',
    logos: ['aave', 'fraxlend', 'resupply'],
  },
  {
    id: 'borrow',
    title: 'Borrow',
    line: 'Post collateral and borrow frxUSD. You pay the borrow rate.',
    logos: ['aave', 'fraxlend', 'resupply'],
  },
  {
    id: 'fx',
    title: 'LP',
    line: 'Pair frxUSD with another token, including a foreign currency. You earn swap fees.',
    logos: ['curve', 'aerodrome'],
  },
  {
    id: 'peg',
    title: 'PegKeeper LP',
    line: 'Pair frxUSD with another dollar so the price stays near $1.',
    logos: ['curve', 'uniswap'],
  },
  {
    id: 'rwa',
    title: 'Tokenized assets',
    line: 'GigaDEX, Midas, and Gearbox. Tokenized funds, stocks, and bonds next to frxUSD.',
    logos: ['giga', 'midas', 'gearbox'],
  },
  {
    id: 'loop',
    title: 'Loop',
    line: 'Post an asset that earns, then borrow frxUSD against it. The gap is the strategy. Gearbox, Midas, Resupply, and similar markets.',
    logos: ['gearbox', 'midas', 'resupply'],
    advanced: true,
  },
  {
    id: 'boost',
    title: 'Boost your LPs',
    line: 'You already hold a Curve LP. Stake it for extra rewards, or let a vault compound them.',
    logos: ['stakedao', 'convex', 'beefy'],
    advanced: true,
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
  const best = [...rows]
    .filter((row) => row.apy > 0)
    .sort((a, b) => b.apy - a.apy || (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0))[0];
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
                  <li key={row.id} className={`${open ? 'is-open' : ''}${best?.id === row.id ? ' is-featured' : ''}`}>
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
                      <strong className={row.apy > 0 ? 'is-rate' : 'is-rate is-soft'}>
                        {row.apy > 0 ? fmtApy(row.apy) : 'See rate'}
                      </strong>
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
  const [chainsOpen, setChainsOpen] = useState(false);
  const [stakeOpen, setStakeOpen] = useState(false);
  const { apr: reserveApr } = useHeroApr();

  useEffect(() => {
    let cancelled = false;
    fetchFrxUsdOpportunities().then((d) => {
      if (!cancelled) setLive(d);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const markets = useMemo(() => {
    const rows = live.rows.filter((row) => row.door);
    const hold: FrxUsdOppRow = {
      id: 'fraxnet-hold',
      venue: 'frax',
      category: 'vault',
      door: 'hold',
      group: 'FraxNet',
      name: 'Hold frxUSD',
      pair: 'frxUSD',
      chain: 'Ethereum',
      chains: ['Ethereum'],
      apy: reserveApr > 0 ? reserveApr : 0,
      happens:
        'After KYC on FraxNet, frxUSD sitting in your wallet earns the reserve yield. The reserves are short-term U.S. government assets, so this is the riskless path. You can also swap to sfrxUSD with no KYC. That yield is higher on a risk-adjusted basis, and it is not riskless.',
      youDo: 'Complete KYC on FraxNet and hold frxUSD. The rate on FraxNet is the one that counts.',
      href: 'https://net.frax.com',
    };
    return rows.some((row) => row.door === 'hold') ? rows : [hold, ...rows];
  }, [live.rows, reserveApr]);

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
      {embedded ? null : <Backdrop paused={stakeOpen} />}

      <div className="fxo-wrap">
        <header className="fxo-hero">
          <h1>Use your frxUSD</h1>
          <p className="fxo-hero__lede">Put in a vault, lend, borrow, loop, or pair with another token.</p>
          <HeroRotator live={live} />
          <button type="button" className="fxo-chain-btn" onClick={() => setChainsOpen(true)}>
            See opportunities per chain
          </button>
        </header>

        <section className="fxo-doors" aria-label="Ways to use frxUSD">
          {DOORS.map((item) => {
            const rows = markets.filter((row) => row.door === item.id);
            const pool =
              item.id === 'fx'
                ? rows.filter((row) => row.group === 'Curve' || row.group === 'Aerodrome')
                : rows;
            const deep = [...(pool.length ? pool : rows)]
              .filter((row) => row.apy > 0)
              .sort((a, b) => b.apy - a.apy || (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0))[0];
            return (
              <button
                key={item.id}
                type="button"
                className={`fxo-door${door === item.id ? ' is-open' : ''}`}
                aria-expanded={door === item.id}
                onClick={() => openDoor(item.id)}
              >
                <span className="fxo-door__art" aria-hidden>
                  {item.logos.map((logo) => <Logo key={logo} id={logo} />)}
                </span>
                <span className="fxo-door__copy">
                  {item.advanced ? <i className="fxo-badge">Advanced</i> : null}
                  <b>{item.title}</b>
                  <small>{item.line}</small>
                  {item.note ? <small className="fxo-door__note">{item.note}</small> : null}
                  <em>
                    {deep
                      ? `${deep.name} · ${item.id === 'hold' ? `${fmtApy(deep.apy)} reserve` : fmtApy(deep.apy)}`
                      : 'See rate'}
                  </em>
                </span>
              </button>
            );
          })}
        </section>

        {chainsOpen ? (
          <ChainPlaces rows={markets} onClose={() => setChainsOpen(false)} />
        ) : null}

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

const ChainPlaces = ({ rows, onClose }: { rows: FrxUsdOppRow[]; onClose: () => void }) => {
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

  const groups = new Map<string, FrxUsdOppRow[]>();
  for (const row of rows) {
    const names = row.chains?.length ? row.chains : [row.chain];
    for (const name of names) {
      const list = groups.get(name) ?? [];
      if (!list.some((item) => item.id === row.id)) list.push(row);
      groups.set(name, list);
    }
  }
  const chains = [...groups.entries()].sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));

  return createPortal(
    <div className="fxo-modal" role="dialog" aria-modal="true" aria-label="Opportunities by chain" onClick={onClose}>
      <div className="fxo-modal__card fxo-modal__card--chains" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="fxo-modal__close" onClick={onClose} aria-label="Close">
          <X className="w-4 h-4" />
        </button>
        <header className="fxo-modal__head">
          <div>
            <h3>By chain</h3>
          </div>
        </header>
        <div className="fxo-bychain">
          {chains.map(([chain, list]) => (
            <section key={chain}>
              <h4>
                <ChainChip name={chain} />
              </h4>
              <ul>
                {list.map((row) => (
                  <li key={`${chain}-${row.id}`}>
                    <Logo id={row.venue} />
                    <span>
                      <b>{row.name}</b>
                      <small>{DOORS.find((door) => door.id === row.door)?.title ?? row.group}</small>
                    </span>
                    <strong className={row.apy > 0 ? 'is-rate' : 'is-rate is-soft'}>
                      {row.apy > 0 ? fmtApy(row.apy) : 'See rate'}
                    </strong>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </div>,
    document.body,
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
                    <em className="is-rate">{fmtApy(p.apy)}</em>
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
