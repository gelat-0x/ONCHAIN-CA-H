interface Point {
  value: number;
}

interface SimpleBarChartProps {
  data: Point[];
  height?: number;
  color?: string;
  yMin?: number;
  yMax?: number;
  className?: string;
}

/** Price bars — height reflects level in range (unique per token history). */
export function SimpleBarChart({
  data,
  height = 320,
  color = '#ffffff',
  yMin,
  yMax,
  className = '',
}: SimpleBarChartProps) {
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
  const plotH = h - 36;
  const baseY = h - 18;

  const barSlot = w / data.length;
  const barW = Math.max(2, barSlot * 0.72);
  const gap = (barSlot - barW) / 2;

  const toY = (v: number) => baseY - ((v - lo) / (hi - lo)) * plotH;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={`simple-bar-chart ${className}`.trim()}
      preserveAspectRatio="none"
      role="img"
      aria-hidden
    >
      <line
        x1={0}
        y1={baseY}
        x2={w}
        y2={baseY}
        stroke="rgba(255,255,255,0.08)"
        strokeWidth={1}
      />
      {data.map((d, i) => {
        const yTop = toY(d.value);
        const barH = Math.max(2, baseY - yTop);
        const x = i * barSlot + gap;
        const prev = i > 0 ? data[i - 1]!.value : d.value;
        const up = d.value >= prev;
        const fill = up ? color : `${color}99`;
        return (
          <rect
            key={`${i}-${d.value}`}
            x={x}
            y={yTop}
            width={barW}
            height={barH}
            fill={fill}
            rx={1.2}
          />
        );
      })}
    </svg>
  );
}
