interface HubShareRingProps {
  percent: number;
  accent: string;
  size?: number;
  /** Hover / focus label, e.g. "41.2% of pool". */
  tip?: string;
  className?: string;
}

export function HubShareRing({
  percent,
  accent,
  size = 44,
  tip,
  className = '',
}: HubShareRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const stroke = size <= 22 ? 3 : size >= 52 ? 6 : 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;

  const ring = (
    <svg
      className={`hub-share-ring ${className}`.trim()}
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden
    >
      <circle
        className="hub-share-ring__track"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
      />
      <circle
        className="hub-share-ring__arc"
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        stroke={accent}
        strokeDasharray={`${dash} ${c - dash}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );

  if (!tip) return ring;

  return (
    <span className="hub-share-ring-wrap" aria-label={tip}>
      {ring}
      <span className="hub-share-ring__tip" role="tooltip">
        {tip}
      </span>
    </span>
  );
}
