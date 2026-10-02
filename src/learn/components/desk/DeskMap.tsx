import { useEffect, useMemo, useRef } from 'react';
import { useReducedMotion } from 'motion/react';
import { FRXUSD_DESK_KEY_ALIASES, FRXUSD_DESK_SEATS } from '../../../../shared/data/frxUsdDeskLayout.ts';
import type { FrxUsdChainSupply, FrxUsdMintRedeemEvent } from '../../../../shared/types/index.ts';
import { normalizeChainKey } from '../../../lib/chainColors';
import { assetLogoSrc, chainLogoSrc, explorerTxUrl, formatPrintUsd, shortTx } from '../../lib/deskMarks';

const W = 760;
const H = 480;
const CX = W / 2;
const CY = 118;
const ROW_Y = 348;

type MapNode = {
  key: string;
  label: string;
  x: number;
  y: number;
  circulating: number;
  sharePct: number;
  live: boolean;
};

type Particle = {
  id: number;
  eventId: string;
  kind: 'mint' | 'redeem';
  t: number;
  speed: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  cx: number;
  cy: number;
  destKey: string;
  amountUsd: number;
};

function seatKey(name: string): string {
  const n = normalizeChainKey(name);
  return FRXUSD_DESK_KEY_ALIASES[n] ?? n;
}

function quad(t: number, x0: number, y0: number, cx: number, cy: number, x1: number, y1: number) {
  const u = 1 - t;
  return {
    x: u * u * x0 + 2 * u * t * cx + t * t * x1,
    y: u * u * y0 + 2 * u * t * cy + t * t * y1,
  };
}

function controlArc(x0: number, y0: number, x1: number, y1: number, bend: number, lift: number) {
  return { cx: (x0 + x1) / 2 + bend, cy: (y0 + y1) / 2 + lift };
}

function motionT(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function hash01(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return (h >>> 0) / 4294967295;
}

function destForEvent(nodes: MapNode[], event: FrxUsdMintRedeemEvent): MapNode | undefined {
  const live = nodes.filter((n) => n.live);
  const pool = live.length ? live : nodes;
  if (!pool.length) return undefined;
  const total = pool.reduce((s, n) => s + Math.max(n.circulating, 1), 0);
  let cursor = hash01(event.id) * total;
  for (const node of pool) {
    cursor -= Math.max(node.circulating, 1);
    if (cursor <= 0) return node;
  }
  return pool.find((n) => seatKey(n.label) === seatKey(event.chain)) ?? pool[0];
}

function ago(ts: number): string {
  const ms = Date.now() - ts;
  if (ms < 45_000) return 'just now';
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function DeskMap({
  chains,
  events,
  heldId,
  onHold,
}: {
  chains: FrxUsdChainSupply[];
  events: FrxUsdMintRedeemEvent[];
  heldId: string | null;
  onHold: (event: FrxUsdMintRedeemEvent | null) => void;
}) {
  const reduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coinRef = useRef<HTMLImageElement | null>(null);
  const particles = useRef<Particle[]>([]);
  const nextId = useRef(1);
  const cursor = useRef(0);
  const primed = useRef(false);
  const knownIds = useRef(new Set<string>());
  const eventsRef = useRef(events);
  const nodesRef = useRef<MapNode[]>([]);
  const heldRef = useRef(heldId);
  const spawnRef = useRef<(event: FrxUsdMintRedeemEvent, t?: number) => void>(() => undefined);

  eventsRef.current = events;
  heldRef.current = heldId;

  const nodes = useMemo(() => {
    const liveRows = chains.filter((row) => row.circulating > 0);
    const robinhood = liveRows.find((row) => row.chain.toLowerCase().includes('robinhood'));
    const rest = liveRows.filter((row) => row !== robinhood);
    const picked = robinhood ? [...rest.slice(0, 6), robinhood] : rest.slice(0, 7);
    const source = picked.length
      ? picked
      : FRXUSD_DESK_SEATS.slice(0, 6).map((seat) => ({
          chain: seat.label,
          circulating: 0,
          sharePct: 0,
        }));

    return source.map((row, i, rows) => {
      const x = rows.length === 1 ? CX : 64 + ((W - 128) * i) / (rows.length - 1);
      return {
        key: `${seatKey(row.chain)}-${i}`,
        label: row.chain,
        x,
        y: ROW_Y,
        circulating: row.circulating,
        sharePct: row.sharePct,
        live: row.circulating > 0,
      };
    });
  }, [chains]);

  nodesRef.current = nodes;

  const eventById = useMemo(() => {
    const map = new Map<string, FrxUsdMintRedeemEvent>();
    for (const event of events) map.set(event.id, event);
    return map;
  }, [events]);

  const held = heldId ? eventById.get(heldId) ?? null : null;

  spawnRef.current = (event: FrxUsdMintRedeemEvent, t = 0) => {
    if (particles.current.some((p) => p.eventId === event.id)) return;
    const node = destForEvent(nodesRef.current, event);
    if (!node) return;
    const from = event.type === 'mint' ? { x: CX, y: CY } : { x: node.x, y: node.y };
    const to = event.type === 'mint' ? { x: node.x, y: node.y } : { x: CX, y: CY };
    const bend = (hash01(event.id) - 0.5) * 120;
    const lift = event.type === 'mint' ? -46 : 26;
    const c = controlArc(from.x, from.y, to.x, to.y, bend, lift);
    particles.current.push({
      id: nextId.current++,
      eventId: event.id,
      kind: event.type,
      t,
      speed: 1 / 3200,
      x0: from.x,
      y0: from.y,
      x1: to.x,
      y1: to.y,
      cx: c.cx,
      cy: c.cy,
      destKey: node.key,
      amountUsd: event.amountUsd,
    });
    if (particles.current.length > 3) {
      const drop = particles.current.findIndex((p) => p.eventId !== heldRef.current);
      if (drop >= 0) particles.current.splice(drop, 1);
    }
  };

  useEffect(() => {
    const tape = eventsRef.current;
    if (!tape.length) return;
    for (const event of tape) {
      if (knownIds.current.has(event.id)) continue;
      knownIds.current.add(event.id);
      if (primed.current) spawnRef.current(event, 0);
    }
    if (!primed.current) {
      primed.current = true;
      tape.slice(0, 2).forEach((event, i) => spawnRef.current(event, i * 0.45));
    }
  }, [events]);

  useEffect(() => {
    if (!heldId) return;
    const event = eventById.get(heldId);
    if (event) spawnRef.current(event, 0.42);
  }, [heldId, eventById]);

  useEffect(() => {
    const img = new Image();
    img.src = '/learn/images/assets/frxusd.png';
    coinRef.current = img;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || reduceMotion) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    let last = performance.now();
    let spawnAcc = 0;

    const tickFrame = (now: number) => {
      const dt = Math.min(32, now - last);
      last = now;
      spawnAcc += dt;
      const tape = eventsRef.current;
      const interval = 2100;
      while (spawnAcc > interval) {
        spawnAcc -= interval;
        if (!tape.length) break;
        const inFlight = new Set(particles.current.map((p) => p.eventId));
        let picked: FrxUsdMintRedeemEvent | undefined;
        for (let i = 0; i < tape.length; i++) {
          const event = tape[(cursor.current + i) % tape.length];
          if (event && !inFlight.has(event.id)) {
            picked = event;
            cursor.current = (cursor.current + i + 1) % tape.length;
            break;
          }
        }
        if (picked) spawnRef.current(picked, 0);
        else cursor.current += 1;
      }

      ctx.clearRect(0, 0, W, H);
      const heldEventId = heldRef.current;
      particles.current = particles.current.filter((p) => {
        const frozen = heldEventId !== null && p.eventId === heldEventId;
        if (!frozen) p.t += p.speed * dt;
        if (p.t >= 1 && !frozen) return false;
        const t = Math.min(p.t, 0.999);
        const at = (linear: number) => {
          const eased = motionT(linear);
          return quad(eased, p.x0, p.y0, p.cx, p.cy, p.x1, p.y1);
        };
        const pos = at(t);
        const alpha = t < 0.08 ? t / 0.08 : t > 0.92 ? (1 - t) / 0.08 : 1;
        const radius = frozen ? 12 : 10;
        const ink = p.kind === 'mint' ? '61, 220, 151' : '248, 113, 113';
        const coin = coinRef.current;

        ctx.beginPath();
        [0.18, 0.12, 0.06, 0].forEach((back, index) => {
          const sample = at(Math.max(0, t - back));
          if (index === 0) ctx.moveTo(sample.x, sample.y);
          else ctx.lineTo(sample.x, sample.y);
        });
        ctx.strokeStyle = `rgba(${ink}, ${0.42 * alpha})`;
        ctx.lineWidth = 2.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        if (t > 0.8) {
          const arrive = (t - 0.8) / 0.2;
          ctx.beginPath();
          ctx.arc(p.x1, p.y1, 16 + arrive * 22, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${ink}, ${(1 - arrive) * 0.55 * alpha})`;
          ctx.lineWidth = 1.25;
          ctx.stroke();
        }

        const glow = ctx.createRadialGradient(pos.x, pos.y, radius * 0.2, pos.x, pos.y, radius * 2.4);
        glow.addColorStop(0, `rgba(${ink}, ${0.35 * alpha})`);
        glow.addColorStop(1, `rgba(${ink}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 2.4, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.clip();
        if (coin && coin.complete && coin.naturalWidth > 0) {
          ctx.drawImage(coin, pos.x - radius, pos.y - radius, radius * 2, radius * 2);
        } else {
          ctx.fillStyle = `rgba(${ink}, ${0.95 * alpha})`;
          ctx.fill();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius + 3, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ink}, ${0.85 * alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        return true;
      });
      raf = requestAnimationFrame(tickFrame);
    };

    raf = requestAnimationFrame(tickFrame);
    return () => cancelAnimationFrame(raf);
  }, [reduceMotion]);

  const hitParticle = (clientX: number, clientY: number): Particle | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * W;
    const y = ((clientY - rect.top) / rect.height) * H;
    let best: Particle | null = null;
    let bestDist = 28;
    for (const p of particles.current) {
      const eased = motionT(Math.min(p.t, 0.999));
      const pos = quad(eased, p.x0, p.y0, p.cx, p.cy, p.x1, p.y1);
      const d = Math.hypot(pos.x - x, pos.y - y);
      if (d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    return best;
  };

  const heldDest = held ? destForEvent(nodes, held)?.key ?? null : null;

  return (
    <div
      className="desk-map"
      aria-label="Live frxUSD prints leaving the mint floor for each chain"
    >
      <div className="desk-map__frame">
      <svg viewBox={`0 0 ${W} ${H}`} className="desk-map__svg" role="img">
        <line x1={56} y1={ROW_Y} x2={W - 56} y2={ROW_Y} className="desk-map__base" />
        {nodes.map((n) => (
          <line
            key={`spoke-${n.key}`}
            x1={CX}
            y1={CY + 22}
            x2={n.x}
            y2={n.y - 22}
            className={n.live ? 'desk-map__spoke desk-map__spoke--live' : 'desk-map__spoke'}
          />
        ))}
      </svg>

      <button
        type="button"
        className="desk-map__factory-mark"
        style={{ left: `${(CX / W) * 100}%`, top: `${(CY / H) * 100}%` }}
        onClick={() => onHold(null)}
        aria-label="Mint floor"
      >
        <img src="/learn/images/assets/frxusd.png" alt="frxUSD" />
      </button>

      {nodes.map((n) => (
        <div
          key={n.key}
          className={`desk-map__seat${heldDest === n.key ? ' is-held' : ''}`}
          style={{ left: `${(n.x / W) * 100}%`, top: `${(n.y / H) * 100}%` }}
        >
          <img
            src={chainLogoSrc(n.label)}
            alt={n.label}
            className="desk-map__logo"
            onError={(e) => {
              e.currentTarget.style.visibility = 'hidden';
            }}
          />
          <span className="desk-map__name">{n.label}</span>
          {n.live ? (
            <span className="desk-map__pct">{n.sharePct.toFixed(n.sharePct >= 10 ? 0 : 1)}%</span>
          ) : null}
        </div>
      ))}

      <canvas
        ref={canvasRef}
        className="desk-map__particles"
        onPointerDown={(e) => {
          const hit = hitParticle(e.clientX, e.clientY);
          if (!hit) {
            onHold(null);
            return;
          }
          const event = eventById.get(hit.eventId) ?? null;
          onHold(event && heldId === event.id ? null : event);
        }}
      />

      {held ? (
        <aside className={`desk-map__card desk-map__card--${held.type}`} role="dialog" aria-label="Print details">
          <p className="desk-map__card-kicker">{held.type === 'mint' ? 'Mint' : 'Burn'}</p>
          <p className="desk-map__card-amt tabular-nums">{formatPrintUsd(held.amountUsd)}</p>
          <p className="desk-map__card-meta">
            <img src={assetLogoSrc(held.asset) ?? '/learn/images/assets/frxusd.png'} alt="" />
            {held.asset}
            <img src={chainLogoSrc(held.chain ?? 'Ethereum')} alt="" />
            {held.chain ?? 'Ethereum'} · {ago(held.ts)}
          </p>
          <a href={explorerTxUrl(held)} target="_blank" rel="noopener noreferrer">
            {shortTx(held.txHash)}
          </a>
          <button type="button" onClick={() => onHold(null)}>
            Release
          </button>
        </aside>
      ) : null}
      </div>

      <div className="desk-map__legend">
        <span>
          <i className="desk-map__dot desk-map__dot--mint" /> Mint
        </span>
        <span>
          <i className="desk-map__dot desk-map__dot--burn" /> Burn
        </span>
      </div>
    </div>
  );
}
