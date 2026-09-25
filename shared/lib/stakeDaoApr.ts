import type { PoolData } from '../types/index.ts';

/** Headline Stake DAO APR for PegKeeper cards — verified vault data only. */
export function stakeDaoDisplayApr(
  pool: Pick<PoolData, 'stakeDaoApr' | 'stakeDaoVerified'>,
): number {
  if (!pool.stakeDaoVerified) return 0;
  if (pool.stakeDaoApr != null && pool.stakeDaoApr > 0) return pool.stakeDaoApr;
  return 0;
}

export function hasStakeDaoPool(
  pool: Pick<PoolData, 'stakeDaoApr' | 'onlyBoost' | 'stakeDaoVerified'>,
): boolean {
  return stakeDaoDisplayApr(pool) > 0 || Boolean(pool.onlyBoost && pool.stakeDaoVerified);
}

export function hasStakeDaoLink(
  pool: Pick<PoolData, 'stakeDaoUrl' | 'stakeDaoVerified'>,
): boolean {
  return Boolean(pool.stakeDaoVerified && pool.stakeDaoUrl);
}
