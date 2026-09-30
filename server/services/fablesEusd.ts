import type { PoolData } from '../../shared/types/index.ts';
import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import { registryToPoolData, type PoolRegistryEntry } from '../../shared/data/poolRegistry.ts';
import { fetchJson } from '../lib/http.ts';

/**
 * Own eUSD / frxUSD on Fables (Uniswap v4, Robinhood Chain).
 * Pool id and the $500 weekly Merkl budget are published in the Fables app config.
 * Swap-fee APR = 24h fees / TVL × 365. Merkl APR = (weekly / 7) × 365 / TVL.
 */
const FABLES_POOL_ID = '0xdc844c8cc27ad9a1d122c03adeadc8b3652d29008d88344823ad9d52555b926b';
const MERKL_WEEKLY_USD = 500;

interface FablesPoolTvl {
  tvlUsd?: number;
  supply0?: number;
  supply1?: number;
}

interface FablesPoolVolume {
  volumeUsd?: number;
  feesUsd?: number;
}

interface FablesGw<T> {
  pools?: Record<string, T>;
}

export interface FablesEusdLive {
  tvlUsd: number;
  volumeUsd: number;
  frxUsdUsd: number;
  swapFeeApr: number;
  merklApr: number;
  merklWeeklyUsd: number;
}

function pickPool<T>(pools: Record<string, T> | undefined, id: string): T | undefined {
  if (!pools) return undefined;
  if (pools[id]) return pools[id];
  const target = id.toLowerCase();
  const hit = Object.entries(pools).find(([key]) => key.toLowerCase() === target);
  return hit?.[1];
}

export async function fetchFablesEusdPool(): Promise<FablesEusdLive | null> {
  const headers = { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' };
  const [tvlBody, volBody] = await Promise.all([
    fetchJson<FablesGw<FablesPoolTvl>>(API_ENDPOINTS.fables.poolTvl, { headers }),
    fetchJson<FablesGw<FablesPoolVolume>>(API_ENDPOINTS.fables.poolVolume24h, { headers }),
  ]);

  const tvl = pickPool(tvlBody?.pools, FABLES_POOL_ID);
  const vol = pickPool(volBody?.pools, FABLES_POOL_ID);
  const tvlUsd = tvl?.tvlUsd;
  if (tvlUsd == null || !Number.isFinite(tvlUsd) || tvlUsd <= 0) return null;

  const feesUsd = vol?.feesUsd;
  const swapFeeApr =
    feesUsd != null && Number.isFinite(feesUsd) && feesUsd >= 0 ? (feesUsd / tvlUsd) * 365 * 100 : 0;
  const merklApr = (MERKL_WEEKLY_USD / 7) * 365 / tvlUsd * 100;
  const frxUsdUsd = tvl?.supply0;

  return {
    tvlUsd,
    volumeUsd: vol?.volumeUsd != null && Number.isFinite(vol.volumeUsd) ? vol.volumeUsd : 0,
    frxUsdUsd: frxUsdUsd != null && Number.isFinite(frxUsdUsd) ? frxUsdUsd : 0,
    swapFeeApr,
    merklApr,
    merklWeeklyUsd: MERKL_WEEKLY_USD,
  };
}

export function applyFablesLive(entry: PoolRegistryEntry, live: FablesEusdLive | null): PoolData {
  const base = registryToPoolData(
    entry,
    live
      ? {
          tvl: live.tvlUsd,
          apr: live.swapFeeApr,
          volume24h: live.volumeUsd,
          frxUsdBalance: live.frxUsdUsd,
        }
      : { frxUsdBalance: entry.duneFrxUsdTvlFallback },
  );

  if (!live) return base;

  base.swapFeeApr = +live.swapFeeApr.toFixed(2);
  base.merklApr = +live.merklApr.toFixed(2);
  base.merklWeeklyUsd = live.merklWeeklyUsd;
  base.apr = base.swapFeeApr;
  base.frxUsdBalanceSource = 'fables';
  if (base.frxUsdBalanceUsd != null && base.tvl > 0) {
    base.frxUsdSharePct = +Math.min(100, (base.frxUsdBalanceUsd / base.tvl) * 100).toFixed(2);
  }
  return base;
}
