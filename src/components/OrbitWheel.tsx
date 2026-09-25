import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from 'react';
import type { PoolData } from '../types';
import { formatUsd } from '../lib/formatUsd';
import { TokenLogo } from './TokenLogo';

export const ORBIT_SNAP_PX = 56;

interface OrbitWheelProps {
  pools: PoolData[];
  selectedId?: string;
  /** @deprecated arc mode uses arrow buttons only; kept for fullscreen wheel capture */
  captureRef?: RefObject<HTMLElement | null>;
  onSelect?: (pool: PoolData) => void;
  mode?: 'arc' | 'full';
  className?: string;
}

interface RailItemStyle {
  translateX: number;
  scale: number;
  opacity: number;
  active: boolean;
  tick: boolean;
}

function hapticTick(intensity = 6) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(intensity);
  }
}

function wrapIndex(index: number, count: number): number {
  return ((index % count) + count) % count;
}

function stylesForIndex(activeIndex: number, count: number): RailItemStyle[] {
  return Array.from({ length: count }, (_, i) => {
    const dist = i - activeIndex;
    const abs = Math.abs(dist);
    const translateX = -Math.min(abs * 14, 36);
    const scale = Math.max(0.68, 1.14 - abs * 0.11);
    const opacity =
      abs > 3.2 ? 0 : abs > 2.4 ? 0.28 : abs > 1.2 ? 0.55 : abs > 0.45 ? 0.82 : 1;
    return {
      translateX,
      scale,
      opacity,
      active: abs === 0,
      tick: false,
    };
  });
}

/* ── Vertical picker (arc / hero mode) — arrow-only navigation ── */
function VerticalPicker({
  pools,
  selectedId,
  onSelect,
  className,
}: Omit<OrbitWheelProps, 'mode' | 'captureRef'>) {
  const sorted = useMemo(
    () => [...pools].sort((a, b) => b.tvl - a.tvl),
    [pools],
  );
  const count = sorted.length || 1;

  const indexRef = useRef(0);
  const tickTimerRef = useRef<number | null>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportH, setViewportH] = useState(320);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const measure = () => setViewportH(el.clientHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const selectedIndex = Math.max(0, sorted.findIndex((p) => p.id === selectedId));
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const [activeIndex, setActiveIndex] = useState(safeIndex);
  const [itemStyles, setItemStyles] = useState<RailItemStyle[]>(() =>
    stylesForIndex(safeIndex, count),
  );

  const lineGradId = useId().replace(/:/g, '');

  const pulseTick = useCallback((index: number) => {
    setItemStyles((prev) =>
      prev.map((s, i) => ({ ...s, tick: i === index })),
    );
    if (tickTimerRef.current != null) window.clearTimeout(tickTimerRef.current);
    tickTimerRef.current = window.setTimeout(() => {
      setItemStyles((prev) => prev.map((s) => ({ ...s, tick: false })));
    }, 140);
  }, []);

  const goToIndex = useCallback(
    (index: number, notify = true) => {
      const wrapped = wrapIndex(index, count);
      if (wrapped === indexRef.current && notify) return;
      indexRef.current = wrapped;
      setActiveIndex(wrapped);
      setItemStyles(stylesForIndex(wrapped, count));
      pulseTick(wrapped);
      if (notify) {
        hapticTick(8);
        onSelect?.(sorted[wrapped]);
      }
    },
    [count, onSelect, pulseTick, sorted],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      goToIndex(indexRef.current + dir);
    },
    [goToIndex],
  );

  useEffect(() => {
    if (safeIndex === indexRef.current) return;
    goToIndex(safeIndex, false);
  }, [safeIndex, goToIndex]);

  useEffect(
    () => () => {
      if (tickTimerRef.current != null) window.clearTimeout(tickTimerRef.current);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      e.preventDefault();
      step(e.key === 'ArrowDown' ? 1 : -1);
    },
    [step],
  );

  const activePool = sorted[activeIndex];
  const canStepUp = count > 1;
  const canStepDown = count > 1;
  const activeCenterY = activeIndex * ORBIT_SNAP_PX + ORBIT_SNAP_PX / 2;
  const trackTranslateY = viewportH / 2 - activeCenterY;

  return (
    <div
      className={`orbit-wheel orbit-wheel--arc ${className ?? ''}`.trim()}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="listbox"
      aria-label="Partner pool picker"
      aria-activedescendant={activePool ? `orbit-pool-${activePool.id}` : undefined}
    >
      <div className="orbit-wheel__picker">
        <svg className="orbit-wheel__arc-guide" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          <path
            d="M 28 12 Q 72 50 28 88"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="0.6"
          />
        </svg>

        <div className="orbit-wheel__core-hub">
          <TokenLogo
            symbol="frxUSD"
            fallbackInitials="FX"
            fallbackColor="#ffffff"
            size="lg"
            className="orbit-wheel__core-hub-token"
          />
          <span className="orbit-wheel__core-hub-label">frxUSD</span>
        </div>

        {activePool && (
          <svg className="orbit-wheel__lines orbit-wheel__lines--picker" viewBox="0 0 100 100" aria-hidden>
            <defs>
              <linearGradient id={lineGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(255,255,255,0.45)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
              </linearGradient>
            </defs>
            <line x1="40" y1="50" x2="78" y2="50" stroke={`url(#${lineGradId})`} strokeWidth="0.5" strokeLinecap="round" />
          </svg>
        )}

        <div className="orbit-wheel__rail-mask">
          <div ref={viewportRef} className="orbit-wheel__rail-viewport">
            <div
              className="orbit-wheel__rail-track"
              style={{ transform: `translateY(${trackTranslateY}px)` }}
            >
              {sorted.map((pool, i) => {
                const sym = pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id;
                const st = itemStyles[i] ?? {
                  translateX: 0,
                  scale: 0.8,
                  opacity: 0.4,
                  active: false,
                  tick: false,
                };
                const scale = st.tick ? st.scale * 1.08 : st.scale;
                const style: CSSProperties = {
                  transform: `translateX(${st.translateX}px) scale(${scale})`,
                  opacity: st.opacity,
                  ['--node-accent' as string]: pool.partnerColor,
                  ['--node-i' as string]: i,
                };

                return (
                  <div
                    key={pool.id}
                    id={`orbit-pool-${pool.id}`}
                    className={`orbit-wheel__snap ${st.active ? 'orbit-wheel__snap--active' : ''}`}
                    role="option"
                    aria-selected={st.active}
                  >
                    {st.active && (
                      <span className="orbit-wheel__partner-label">{sym}</span>
                    )}
                    <button
                      type="button"
                      className={`orbit-wheel__node ${st.active ? 'orbit-wheel__node--active' : ''}`}
                      style={style}
                      onClick={() => goToIndex(i)}
                      title={`${pool.name} · ${formatUsd(pool.tvl)}`}
                      aria-label={pool.name}
                    >
                      <TokenLogo
                        symbol={sym}
                        poolId={pool.id}
                        fallbackInitials={pool.partnerInitials}
                        fallbackColor={pool.partnerColor}
                        size="xs"
                        className="orbit-wheel__logo"
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="orbit-wheel__nav" aria-label="Browse partner pools">
          <button
            type="button"
            className="orbit-wheel__nav-btn"
            onClick={() => step(-1)}
            disabled={!canStepUp}
            aria-label="Previous partner"
            title="Previous"
          >
            ↑
          </button>
          <button
            type="button"
            className="orbit-wheel__nav-btn"
            onClick={() => step(1)}
            disabled={!canStepDown}
            aria-label="Next partner"
            title="Next"
          >
            ↓
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Full ring (fullscreen mode) ── */
function FullRing({
  pools,
  selectedId,
  onSelect,
  className,
  captureRef,
}: Omit<OrbitWheelProps, 'mode'>) {
  const sorted = useMemo(
    () => [...pools].sort((a, b) => b.tvl - a.tvl),
    [pools],
  );

  const count = sorted.length || 1;
  const stepDeg = 360 / count;
  const selectedIndex = Math.max(0, sorted.findIndex((p) => p.id === selectedId));
  const safeIndex = selectedIndex >= 0 ? selectedIndex : 0;

  const rotationRef = useRef(-safeIndex * stepDeg);
  const indexRef = useRef(safeIndex);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [, bump] = useState(0);
  const forceRender = () => bump((n) => n + 1);

  const cx = 50;
  const cy = 50;
  const radius = 42;
  const rotation = rotationRef.current;

  const snapToIndex = useCallback(
    (index: number) => {
      const clamped = wrapIndex(index, count);
      indexRef.current = clamped;
      rotationRef.current = -clamped * stepDeg;
      hapticTick();
      onSelect?.(sorted[clamped]);
      forceRender();
    },
    [count, onSelect, sorted, stepDeg],
  );

  useEffect(() => {
    if (safeIndex === indexRef.current) return;
    snapToIndex(safeIndex);
  }, [safeIndex, snapToIndex]);

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const dir = e.deltaY > 0 ? 1 : -1;
      snapToIndex(indexRef.current + dir);
    },
    [snapToIndex],
  );

  useEffect(() => {
    const el = captureRef?.current ?? wheelRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      const dir = ev.deltaY > 0 ? 1 : -1;
      snapToIndex(indexRef.current + dir);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [captureRef, snapToIndex]);

  const layouts = useMemo(() => {
    const rot = rotationRef.current;
    return sorted.map((pool, i) => {
      const angleDeg = i * stepDeg + rot;
      const rad = (angleDeg * Math.PI) / 180;
      return {
        pool,
        x: cx + radius * Math.cos(rad),
        y: cy + radius * Math.sin(rad),
        active: pool.id === sorted[indexRef.current]?.id,
      };
    });
  }, [sorted, stepDeg, rotation, cx, cy, radius]);

  const activeLayout = layouts.find((l) => l.active);

  return (
    <div
      ref={wheelRef}
      className={`orbit-wheel orbit-wheel--full ${className ?? ''}`.trim()}
      onWheel={handleWheel}
      tabIndex={0}
      role="listbox"
      aria-label="Full partner orbit"
    >
      <div className="orbit-wheel__canvas">
        <div className="orbit-wheel__ring-guide" />
        <svg className="orbit-wheel__lines" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
          {activeLayout && (
            <line
              x1={cx}
              y1={cy}
              x2={activeLayout.x}
              y2={activeLayout.y}
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="0.24"
              strokeLinecap="round"
            />
          )}
        </svg>
        <div className="orbit-wheel__core" style={{ left: `${cx}%`, top: `${cy}%` }}>
          <TokenLogo symbol="frxUSD" fallbackInitials="FX" fallbackColor="#ffffff" size="md" />
          <span className="orbit-wheel__core-label">frxUSD</span>
        </div>
        {layouts.map(({ pool, x, y, active }) => {
          const sym = pool.stablecoin ?? pool.name.split('/')[1]?.trim() ?? pool.id;
          return (
            <button
              key={pool.id}
              type="button"
              className={`orbit-wheel__node ${active ? 'orbit-wheel__node--active' : ''}`}
              style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) scale(${active ? 1.14 : 0.9})`,
                opacity: active ? 1 : 0.78,
                ['--node-accent' as string]: pool.partnerColor,
              }}
              onClick={() => snapToIndex(sorted.findIndex((p) => p.id === pool.id))}
              title={`${pool.name} · ${formatUsd(pool.tvl)}`}
              aria-label={pool.name}
              aria-current={active ? 'true' : undefined}
            >
              <TokenLogo
                symbol={sym}
                poolId={pool.id}
                fallbackInitials={pool.partnerInitials}
                fallbackColor={pool.partnerColor}
                size="xs"
                className="orbit-wheel__logo"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function OrbitWheel(props: OrbitWheelProps) {
  if (props.mode === 'full') return <FullRing {...props} />;
  return <VerticalPicker {...props} />;
}
