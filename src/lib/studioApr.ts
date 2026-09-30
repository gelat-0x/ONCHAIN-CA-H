import type { PoolData } from '../types';
import { stakeDaoDisplayApr } from '../../shared/lib/stakeDaoApr.ts';

/** Best headline APR for studio cards — Stake DAO when verified, else base pool APR. */
export function studioDisplayApr(pool: PoolData): number {
  const stake = stakeDaoDisplayApr(pool);
  if (stake > 0) return stake;
  if (pool.apr > 0) return pool.apr;
  if (pool.boostedApr && pool.boostedApr > 0) return pool.boostedApr;
  if (pool.rewardsApr && pool.rewardsApr > 0) return pool.rewardsApr;
  return 0;
}

export type StudioRankMetric = 'apr' | 'tvl' | 'volume';

export function studioMetricValue(pool: PoolData, metric: StudioRankMetric): number {
  if (metric === 'tvl') return pool.tvl;
  if (metric === 'volume') return pool.volume24h;
  return studioDisplayApr(pool);
}

/** Highest metric first. `limit` caps a top-five board. */
export function rankStudioPools(
  pools: PoolData[],
  metric: StudioRankMetric,
  limit = 5,
): PoolData[] {
  return [...pools]
    .sort((a, b) => studioMetricValue(b, metric) - studioMetricValue(a, metric))
    .slice(0, limit);
}

export function studioAprLabel(pool: PoolData): string {
  if (stakeDaoDisplayApr(pool) > 0) {
    return pool.onlyBoost ? 'Only Boost APR' : 'Boosted APR';
  }
  if (pool.apr > 0) return 'Pool APR';
  return 'APR';
}

export function studioIsOnlyBoostApr(pool: PoolData): boolean {
  return pool.onlyBoost === true && stakeDaoDisplayApr(pool) > 0;
}

/** Curve / pool APR without Stake DAO boost — rewards layer when present, else trading-fee APR. */
export function studioBaseApr(pool: PoolData): number {
  if (pool.rewardsApr != null && pool.rewardsApr > 0) return pool.rewardsApr;
  if (pool.apr > 0) return pool.apr;
  return 0;
}

export function studioBaseAprLabel(pool: PoolData): string {
  if (pool.rewardsApr != null && pool.rewardsApr > 0) return 'Curve APR';
  return 'Pool APR';
}

/** Show secondary base APR when headline is Stake DAO boosted and a base layer exists. */
export function studioShowBaseApr(pool: PoolData): boolean {
  if (stakeDaoDisplayApr(pool) <= 0) return false;
  return studioBaseApr(pool) > 0;
}
