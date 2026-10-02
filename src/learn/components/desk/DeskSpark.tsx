import type { FrxUsdMintRedeemDay } from '../../../../shared/types/index.ts';

export function DeskSpark({ days }: { days: FrxUsdMintRedeemDay[] }) {
  const slice = days.slice(-42);
  if (slice.length < 2) return <div className="desk-spark desk-spark--empty" aria-hidden />;

  const max = Math.max(1, ...slice.flatMap((d) => [d.mint, d.redeem]));
  const w = 640;
  const h = 92;
  const gap = 2;
  const bar = (w - gap * slice.length) / slice.length;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="desk-spark" role="img" aria-label="Daily mint versus redeem">
      {slice.map((d, i) => {
        const x = i * (bar + gap);
        const mintH = (d.mint / max) * 40;
        const redeemH = (d.redeem / max) * 40;
        return (
          <g key={d.ts}>
            <rect x={x} y={42 - mintH} width={bar} height={mintH} className="desk-spark__mint" rx="1" />
            <rect x={x} y={50} width={bar} height={redeemH} className="desk-spark__burn" rx="1" />
          </g>
        );
      })}
      <line x1="0" y1="46" x2={w} y2="46" className="desk-spark__axis" />
    </svg>
  );
}
