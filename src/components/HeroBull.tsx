import { useEffect, useMemo, useRef, useState } from 'react';
import fraxBull from '../assets/frax-bull.png';
import { buildHeroBullLines } from '../lib/heroBullLines';
import type { DashboardData } from '../types';

interface HeroBullProps {
  data: DashboardData | null;
}

const OPENING_LINE = 'FrxGM';
const VISIBLE_MS = 5850;
const FADE_MS = 410;
const PAUSE_MS = 1240;

function shuffle<T>(items: T[]): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Next index in a shuffled deck; reshuffle when exhausted, avoiding an immediate repeat. */
function nextShuffledIndex(length: number, current: number, deckRef: { current: number[] }): number {
  if (length <= 1) return 0;
  if (deckRef.current.length === 0) {
    const order = shuffle(Array.from({ length }, (_, i) => i));
    if (order[0] === current) {
      const swap = order.findIndex((i) => i !== current);
      if (swap > 0) [order[0], order[swap]] = [order[swap], order[0]];
    }
    deckRef.current = order;
  }
  return deckRef.current.shift() ?? 0;
}

export function HeroBull({ data }: HeroBullProps) {
  const lines = useMemo(() => {
    const pool = buildHeroBullLines(data).filter((line) => line !== OPENING_LINE);
    return [OPENING_LINE, ...pool];
  }, [data]);
  const deckRef = useRef<number[]>([]);
  const rootRef = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'shown' | 'out' | 'pause'>('in');
  const [showName, setShowName] = useState(false);

  useEffect(() => {
    // Always open on FrxGM; randomize only after that.
    deckRef.current = [];
    setIndex(0);
    setPhase('in');
  }, [lines]);

  useEffect(() => {
    if (lines.length === 0) return;

    let timer: number;
    if (phase === 'in') {
      timer = window.setTimeout(() => setPhase('shown'), FADE_MS);
    } else if (phase === 'shown') {
      timer = window.setTimeout(() => setPhase('out'), VISIBLE_MS);
    } else if (phase === 'out') {
      timer = window.setTimeout(() => setPhase('pause'), FADE_MS);
    } else {
      timer = window.setTimeout(() => {
        setIndex((i) => nextShuffledIndex(lines.length, i, deckRef));
        setPhase('in');
      }, PAUSE_MS);
    }

    return () => window.clearTimeout(timer);
  }, [phase, lines.length]);

  useEffect(() => {
    if (!showName) return;
    const hideTimer = window.setTimeout(() => setShowName(false), 3000);
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setShowName(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setShowName(false);
    };
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(hideTimer);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [showName]);

  const visible = phase === 'in' || phase === 'shown';
  const line = lines[index] ?? '';

  return (
    <aside ref={rootRef} className="hero-bull" aria-label="Frax Force mascot">
      <div
        className={`hero-bull__bubble ${visible && !showName ? 'hero-bull__bubble--visible' : ''}`}
        aria-live="polite"
      >
        <p className="hero-bull__bubble-text">{line}</p>
      </div>
      <button
        type="button"
        className="hero-bull__stage"
        aria-expanded={showName}
        aria-label="Who is this bull?"
        onClick={() => setShowName((open) => !open)}
      >
        {showName && (
          <div className="hero-bull__nameplate" role="status">
            <p>his name is bull, FRAX bull.</p>
          </div>
        )}
        <img src={fraxBull} alt="" className="hero-bull__img" draggable={false} loading="eager" decoding="async" />
      </button>
    </aside>
  );
}
