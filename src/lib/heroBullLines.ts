import type { DashboardData } from '../types';
import { formatUsd } from './formatUsd';

const BRAND_LINES = [
  'FrxGM',
  'ONCHAIN CA$H is built for you, so you can get the bigger picture.',
  'Every Friday at 6 PM UTC, Frax Force goes live with our dedicated ONCHAIN CA$H Show.',
  'Join our Frax Force Discord and connect with like minded people.',
  'Generate your own content in Studio.',
  'FRAX TO THE MOON.',
  'FRAX IT UP.',
  'PAMPAMENTALS',
  'STREAM SOME HITS w/ ONCHAIN RADIO',
] as const;

function fraxTokenPrice(data: DashboardData): number | null {
  const hit = data.ticker.find(
    (t) => t.symbol.toUpperCase() === 'FRAX' || t.symbol.toUpperCase() === 'FXS',
  );
  if (!hit || !(hit.price > 0)) return null;
  return hit.price;
}

/**
 * Curated speech-bubble lines for the hero bull.
 * Brand lines always available; data lines only when the metric exists.
 */
export function buildHeroBullLines(data: DashboardData | null): string[] {
  const dataLines: string[] = [];

  if (data) {
    if (data.activePools > 0) {
      dataLines.push(`${data.activePools} PegKeeper pools keep paired liquidity in motion.`);
    }
    if (data.totalTvl > 0) {
      dataLines.push(`PegKeeper family TVL sits at ${formatUsd(data.totalTvl)}.`);
    }
    if (data.totalVolume24h > 0) {
      dataLines.push(`${formatUsd(data.totalVolume24h)} routed through partner pools in 24h.`);
    }
    if (data.totalFrxUsdInPools > 0) {
      dataLines.push(`${formatUsd(data.totalFrxUsdInPools)} frxUSD anchoring Curve partner lanes.`);
    }
    const fraxPrice = fraxTokenPrice(data);
    if (fraxPrice != null) {
      dataLines.push(`FRAX token price sits at $${fraxPrice.toFixed(2)}.`);
    }
    const topPool = [...data.pools].sort((a, b) => b.tvl - a.tvl)[0];
    if (topPool?.tvl > 0) {
      const symbol = topPool.stablecoin ?? topPool.name.split('/')[1]?.trim() ?? topPool.id;
      dataLines.push(`${symbol} leads the family at ${formatUsd(topPool.tvl)} TVL.`);
    }
  }

  // Interleave brand + data so rotation stays varied without duplicates.
  const out: string[] = [];
  const brand = [...BRAND_LINES];
  let bi = 0;
  let di = 0;
  while (bi < brand.length || di < dataLines.length) {
    if (bi < brand.length) out.push(brand[bi++]);
    if (di < dataLines.length) out.push(dataLines[di++]);
  }

  return out;
}
