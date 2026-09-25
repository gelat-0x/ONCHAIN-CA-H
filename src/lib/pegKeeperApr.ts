import type { PoolData } from '../types';
import { hasStakeDaoLink, stakeDaoDisplayApr } from '../../shared/lib/stakeDaoApr.ts';

/** Best headline yield for PegKeeper cards: Stake DAO APR, else Curve Total APY, else Curve APR. */
export function pegKeeperDisplayApr(pool: PoolData): number {
  const stake = stakeDaoDisplayApr(pool);
  if (stake > 0) return stake;
  if (pool.rewardsApy && pool.rewardsApy > 0) return pool.rewardsApy;
  if (pool.rewardsApr && pool.rewardsApr > 0) return pool.rewardsApr;
  if (pool.apr > 0) return pool.apr;
  return 0;
}

export function pegKeeperAprSource(
  pool: PoolData,
): 'Stake DAO' | 'Curve total APY' | 'Curve total' | 'Curve base' | 'Unavailable' {
  if (stakeDaoDisplayApr(pool) > 0) return 'Stake DAO';
  if (pool.rewardsApy && pool.rewardsApy > 0) return 'Curve total APY';
  if (pool.rewardsApr && pool.rewardsApr > 0) return 'Curve total';
  if (pool.apr > 0) return 'Curve base';
  return 'Unavailable';
}

/** Curve pool yield for display — Total APY when available (matches curve.fi), else APR. */
export function pegKeeperCurveApr(pool: PoolData): number {
  if (pool.rewardsApy != null && pool.rewardsApy > 0) return pool.rewardsApy;
  if (pool.rewardsApr != null && pool.rewardsApr > 0) return pool.rewardsApr;
  if (pool.apr > 0) return pool.apr;
  return 0;
}

export function pegKeeperAprMetricLabel(pool: PoolData): 'APR' | 'APY' {
  const source = pegKeeperAprSource(pool);
  if (source === 'Curve total APY') return 'APY';
  return 'APR';
}

/** Stake DAO boost is Ethereum-only for PegKeeper pools today. */
export function poolSupportsStakeDao(pool: PoolData): boolean {
  if (pool.chain && pool.chain !== 'Ethereum') return false;
  return hasStakeDaoLink(pool);
}

export function stakeDaoUnavailableNote(pool: PoolData): string {
  if (pool.chain === 'HyperEVM') {
    return 'Stake DAO does not support HyperEVM pools yet. Earn yield via Curve on Hyperliquid — use the Curve APR above and deposit directly on Curve.';
  }
  if (pool.chain && pool.chain !== 'Ethereum') {
    return `Stake DAO boost is not available on ${pool.chain}. Use Curve pool APR and deposit on Curve for this chain.`;
  }
  return 'Stake DAO boost is not available for this pool yet. Use Curve pool APR and deposit on Curve.';
}

/** Copy for the explore modal — only mentions Convex when this pool actually uses Only Boost. */
export function whereToStakeCopy(pool: PoolData): string {
  if (!poolSupportsStakeDao(pool)) {
    if (pool.chain === 'HyperEVM') {
      return 'Provide liquidity on Curve to receive LP tokens, then stake them in the Curve gauge. Stake DAO does not support HyperEVM yet, so this pool’s yield is the Curve APR only.';
    }
    if (pool.chain && pool.chain !== 'Ethereum') {
      return `Provide liquidity on Curve to receive LP tokens, then stake them in the Curve gauge. Stake DAO boost is not available on ${pool.chain}.`;
    }
    return 'Provide liquidity on Curve to receive LP tokens, then stake them in the Curve gauge to earn this pool’s APR. Stake DAO does not list a matching strategy for this pair yet.';
  }
  if (pool.onlyBoost) {
    return 'Provide liquidity on Curve first to receive LP tokens. Stake those LP tokens once on Stake DAO to earn boosted gauge rewards without locking your own veCRV. This strategy uses Only Boost: Stake DAO may route part of the deposit through Convex when Convex currently has a stronger effective boost. You do not manage the Convex leg yourself. The APR shown is always Stake DAO’s Strategy figure — Convex is infrastructure, not a second APR.';
  }
  return 'Provide liquidity on Curve first to receive LP tokens. Stake those LP tokens on Stake DAO to earn boosted gauge rewards without locking your own veCRV.';
}
