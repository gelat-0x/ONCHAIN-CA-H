import type { PoolData } from '../types';
import { poolChartColor } from './poolChartColor';
import { pegKeeperCurveApr } from './pegKeeperApr';
import { stakeDaoDisplayApr } from '../../shared/lib/stakeDaoApr.ts';
import { poolSupportsStakeDao } from './pegKeeperApr';

export interface FamilyAprAverages {
  avgBaseApr: number;
  avgCurveApr: number;
  avgBoostApr: number;
}

function tvlWeightedAverage(
  pools: PoolData[],
  value: (pool: PoolData) => number,
  filter?: (pool: PoolData) => boolean,
): number {
  let weightSum = 0;
  let valueSum = 0;
  for (const pool of pools) {
    if (filter && !filter(pool)) continue;
    const v = value(pool);
    if (v <= 0 || pool.tvl <= 0) continue;
    weightSum += pool.tvl;
    valueSum += v * pool.tvl;
  }
  if (weightSum <= 0) return 0;
  return valueSum / weightSum;
}

/** TVL-weighted family APR averages for the volume dashboard. */
export function computeFamilyAprAverages(pools: PoolData[]): FamilyAprAverages {
  return {
    avgBaseApr: tvlWeightedAverage(pools, (p) => p.apr),
    avgCurveApr: tvlWeightedAverage(pools, pegKeeperCurveApr),
    avgBoostApr: tvlWeightedAverage(
      pools,
      stakeDaoDisplayApr,
      (p) => poolSupportsStakeDao(p) && stakeDaoDisplayApr(p) > 0,
    ),
  };
}

export interface VolumeSegment {
  pool: PoolData;
  pct: number;
  color: string;
}

export type FamilyBarMode = 'volume' | 'tvl';

export interface FamilyBarItem {
  id: string;
  label: string;
  value: number;
  color: string;
  /** Share of the row value that is frxUSD liquidity (0–1). Only meaningful in TVL mode. */
  frxUsdPct: number;
  pool?: PoolData;
}

const OTHERS_COLOR = '#525252';

function metricValue(pool: PoolData, mode: FamilyBarMode): number {
  return mode === 'volume' ? pool.volume24h : pool.tvl;
}

/** frxUSD liquidity sitting in the pool (Dune-sourced, debt field kept for compatibility). */
export function frxUsdSide(pool: PoolData): number {
  const value = pool.frxUsdBalanceUsd ?? pool.pegKeeperDebt ?? 0;
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** frxUSD portion of pool TVL as a 0–1 ratio. */
export function frxUsdShare(pool: PoolData): number {
  if (pool.tvl <= 0) return 0;
  return Math.min(1, frxUsdSide(pool) / pool.tvl);
}

/** Total frxUSD liquidity anchoring the PegKeeper family. */
export function totalFrxUsdLiquidity(pools: PoolData[]): number {
  return pools.reduce((sum, pool) => sum + frxUsdSide(pool), 0);
}

/**
 * Top N pools by metric + Others bucket.
 *
 * Always returns exactly `topN + 1` rows so switching between metrics can never
 * change the row count — that was one source of the layout jump in the old chart.
 */
export function groupPoolBars(
  pools: PoolData[],
  mode: FamilyBarMode,
  topN = 8,
): FamilyBarItem[] {
  const sorted = [...pools].sort((a, b) => metricValue(b, mode) - metricValue(a, mode));

  const top = sorted.slice(0, topN);
  const rest = sorted.slice(topN);
  const othersSum = rest.reduce((s, p) => s + metricValue(p, mode), 0);

  const items: FamilyBarItem[] = top.map((pool) => ({
    id: pool.id,
    label: pool.name,
    value: metricValue(pool, mode),
    color: poolChartColor(pool),
    frxUsdPct: frxUsdShare(pool),
    pool,
  }));

  const othersFrxUsd = rest.reduce((s, p) => s + frxUsdSide(p), 0);
  const othersTvl = rest.reduce((s, p) => s + p.tvl, 0);

  items.push({
    id: '__others__',
    label: 'Others',
    value: othersSum,
    color: OTHERS_COLOR,
    frxUsdPct: othersTvl > 0 ? Math.min(1, othersFrxUsd / othersTvl) : 0,
  });

  return items;
}

/** Sorted volume segments for stacked bar (pools with volume only). */
export function volumeSegments(
  pools: PoolData[],
  total: number,
  colorFor: (pool: PoolData) => string,
): VolumeSegment[] {
  if (total <= 0) return [];
  return [...pools]
    .filter((p) => p.volume24h > 0)
    .sort((a, b) => b.volume24h - a.volume24h)
    .map((pool) => ({
      pool,
      pct: (pool.volume24h / total) * 100,
      color: colorFor(pool),
    }));
}
