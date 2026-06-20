import { useMemo } from 'react';

interface DotBarVizProps {
  /** Values 0–1 per column */
  values: number[];
  columns?: number;
  maxDots?: number;
  dotSize?: number;
  gap?: number;
  /** Index after which dots are "active" (white) — e.g. playback progress */
  activeFrom?: number;
  className?: string;
}

export function DotBarViz({
  values,
  columns = 28,
  maxDots = 8,
  dotSize = 6,
  gap = 3,
  activeFrom = 0,
  className = '',
}: DotBarVizProps) {
  const cols = useMemo(() => {
    const src = values.length >= columns ? values : Array.from({ length: columns }, (_, i) => {
      const v = values[i % values.length];
      return v ?? 0.15 + Math.sin(i * 0.45) * 0.35 + 0.35;
    });
    return src.slice(0, columns);
  }, [values, columns]);

  return (
    <div
      className={`dot-viz ${className}`}
      style={{ gap: `${gap}px` }}
      aria-hidden
    >
      {cols.map((v, colIdx) => {
        const count = Math.max(1, Math.round(v * maxDots));
        const isActive = colIdx >= activeFrom;
        return (
          <div key={colIdx} className="dot-viz__col" style={{ gap: `${gap}px` }}>
            {Array.from({ length: maxDots }).map((_, rowIdx) => {
              const filled = rowIdx >= maxDots - count;
              const on = filled && isActive;
              const dim = filled && !isActive;
              return (
                <span
                  key={rowIdx}
                  className={`dot-viz__dot${on ? ' dot-viz__dot--on' : ''}${dim ? ' dot-viz__dot--dim' : ''}`}
                  style={{ width: dotSize, height: dotSize }}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/** Animated random heights for audio — call from parent with playing state */
export function useAudioDotValues(playing: boolean, columns = 28): number[] {
  return useMemo(() => {
    if (!playing) {
      return Array.from({ length: columns }, (_, i) =>
        0.08 + (i / columns) * 0.35,
      );
    }
    return Array.from({ length: columns }, (_, i) => {
      const base = 0.2 + Math.sin(i * 0.5) * 0.25;
      return Math.min(1, base + 0.35);
    });
  }, [playing, columns]);
}
