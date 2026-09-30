import { POOL_REGISTRY } from '../data/poolRegistry.ts';
import { pegKeeperDisplayApr } from './pegKeeperApr';
import type { PoolData } from '../types/index.ts';

const BY_ID = Object.fromEntries(POOL_REGISTRY.map((e) => [e.id, e]));

export function uniquePartnerCount(): number {
  return new Set(POOL_REGISTRY.map((e) => e.partner)).size;
}

export function poolHasCurveAddress(poolId: string): boolean {
  return Boolean(BY_ID[poolId]?.curvePoolAddress);
}

export function poolCurveUrl(poolId: string): string | undefined {
  const entry = BY_ID[poolId];
  if (!entry?.curvePoolAddress) return undefined;
  const chainSlug =
    entry.chain === 'HyperEVM'
      ? 'hyperliquid'
      : entry.chain?.toLowerCase() === 'ethereum'
        ? 'ethereum'
        : 'ethereum';
  return `https://curve.finance/dex/${chainSlug}/pools/${entry.curvePoolAddress.toLowerCase()}/deposit`;
}

export type PoolFilterKey =
  | 'all'
  | 'active'
  | 'alert'
  | 'on-curve'
  | 'tvl100k'
  | 'boosted'
  | 'high-apr';
export type PoolSortKey = 'tvl' | 'apr' | 'volume' | 'since' | 'boost' | 'name';

/** Registry `since` is `YYYY-MM` or `YYYY-MM-DD`. Higher = newer. A full date ranks after a month-only date in that month. */
export function sinceSortValue(since?: string): number {
  if (!since) return 0;
  const full = since.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (full) return Number(full[1]) * 10000 + Number(full[2]) * 100 + Number(full[3]);
  const month = since.match(/^(\d{4})-(\d{2})$/);
  if (!month) return 0;
  return Number(month[1]) * 10000 + Number(month[2]) * 100;
}

export function filterAndSortPools(
  pools: PoolData[],
  filter: PoolFilterKey,
  sort: PoolSortKey,
): PoolData[] {
  let list = [...pools];

  switch (filter) {
    case 'active':
      list = list.filter((p) => p.status === 'ACTIVE');
      break;
    case 'alert':
      list = list.filter((p) => p.status === 'ALERT');
      break;
    case 'on-curve':
      list = list.filter((p) => poolHasCurveAddress(p.id));
      break;
    case 'tvl100k':
      list = list.filter((p) => p.tvl >= 100_000);
      break;
    case 'boosted':
      list = list.filter((p) => p.onlyBoost || p.boostedApr != null);
      break;
    case 'high-apr':
      list = list.filter((p) => pegKeeperDisplayApr(p) >= 10);
      break;
    default:
      break;
  }

  list.sort((a, b) => {
    if (sort === 'name') return a.partner.localeCompare(b.partner);
    if (sort === 'apr') return pegKeeperDisplayApr(b) - pegKeeperDisplayApr(a);
    if (sort === 'volume') return b.volume24h - a.volume24h;
    if (sort === 'since') return sinceSortValue(b.since) - sinceSortValue(a.since);
    if (sort === 'boost') {
      const ab = (a.onlyBoost ? 1e6 : 0) + (a.boostedApr ?? 0);
      const bb = (b.onlyBoost ? 1e6 : 0) + (b.boostedApr ?? 0);
      return bb - ab;
    }
    return b.tvl - a.tvl;
  });

  return list;
}
