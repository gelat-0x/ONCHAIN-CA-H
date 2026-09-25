interface Point {
  value: number;
}

interface SimpleAreaChartProps {
  data: Point[];
  height?: number;
  color?: string;
  yMin?: number;
  yMax?: number;
  className?: string;
}

/** Lightweight SVG area chart — always renders visibly (no Chart.js). */
export function SimpleAreaChart({
  data,
  height = 320,
  color = '#ffffff',
  yMin,
  yMax,
  className = '',
}: SimpleAreaChartProps) {
  if (data.length < 2) return null;

  const w = 1000;
  const h = height;
  const values = data.map((d) => d.value);
  const min = yMin ?? Math.min(...values);
  const max = yMax ?? Math.max(...values);
  const range = max - min || Math.max(Math.abs(max), 1) * 0.02;
  const pad = range * 0.06;
  const lo = min - pad;
  const hi = max + pad;

  const toX = (i: number) => (i / (data.length - 1)) * w;
  const toY = (v: number) => {
    const t = (v - lo) / (hi - lo);
    return h - 16 - t * (h - 32);
  };

  const line = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(2)} ${toY(d.value).toFixed(2)}`)
    .join(' ');
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`simple-area-chart ${className}`.trim()}
      preserveAspectRatio="none"
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id="simple-area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#simple-area-fill)" />
      <path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
