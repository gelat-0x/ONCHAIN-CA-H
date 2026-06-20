import type { TickerItem } from '../../shared/types/index.ts';

export function changeDirection(pct: number): TickerItem['change'] {
  if (pct > 0.05) return 'up';
  if (pct < -0.05) return 'down';
  return 'flat';
}

export function stablePegDirection(price: number, ref = 1): TickerItem['change'] {
  if (price > ref + 0.0002) return 'up';
  if (price < ref - 0.0002) return 'down';
  return 'flat';
}

export function generatePegDeviation(base: number, n = 7): number[] {
  return Array.from({ length: n }, (_, i) => {
    const noise = Math.sin(i * 0.7) * 0.0006;
    return +((base || 1) + noise).toFixed(4);
  });
}

export function generateSyntheticHistory(
  price: number,
  days: string,
  stable: boolean,
): { date: string; price: number; ts: number }[] {
  const n = days === '1' ? 24 : days === '7' ? 7 : days === '30' ? 30 : days === '90' ? 90 : 365;
  const now = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const ts = now - (n - 1 - i) * 86400000;
    const noise = stable ? Math.sin(i / 5) * 0.0004 : Math.sin(i / 4) * price * 0.03;
    return {
      ts,
      date: new Date(ts).toISOString().split('T')[0],
      price: +(price + noise).toFixed(4),
    };
  });
}
