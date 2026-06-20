/**
 * Offline fallback when the backend is unavailable.
 * Auto-derived from shared/data/poolRegistry.ts — do not edit pool IDs manually.
 */
import type { DashboardData } from '../types/index.ts';
import { POOL_REGISTRY, DUNE_BASELINE, registryToPoolData } from '../data/poolRegistry.ts';

const generatePegHistory = (days: number) => {
  const now = Date.now();
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(now - (days - 1 - i) * 86400000).toISOString().split('T')[0],
    price: +(1.0 + Math.sin(i / 6) * 0.0007).toFixed(4),
  }));
};

export const PLACEHOLDER_DASHBOARD: DashboardData = {
  pools: POOL_REGISTRY.map((e) => registryToPoolData(e)),
  partners: POOL_REGISTRY.map((e) => ({
    protocol: e.partner,
    pool: e.stablecoin,
    tvl: `$${(e.duneTvlFallback / 1e6).toFixed(2)}M`,
    apr: '—',
    chain: e.chain,
    status: 'ACTIVE' as const,
    since: e.since,
    description: e.description,
  })),
  frxUsdPrice: 1.0001,
  pegHistory30d: generatePegHistory(30).map((d) => d.price),
  pegHistory90d: generatePegHistory(90),
  chainDistribution: [
    { chain: 'Ethereum', percentage: 89.65 },
    { chain: 'Fraxtal', percentage: 6.87 },
    { chain: 'Others', percentage: 1.26 },
  ],
  totalTvl: DUNE_BASELINE.totalPoolTvl,
  totalFrxUsdInPools: DUNE_BASELINE.totalFrxUsdInPools,
  totalVolume24h: 3_000_000,
  activePools: POOL_REGISTRY.length,
  partnerCount: POOL_REGISTRY.length,
  marketCap: 123_000_000,
  ticker: [
    { symbol: 'frxUSD', price: 1.0001, change: 'flat', type: 'stablecoin' },
    { symbol: 'FRAX', price: 2.45, change: 'down', change24h: -1.2, type: 'volatile' },
    { symbol: 'TVL', price: DUNE_BASELINE.totalPoolTvl, change: 'up', type: 'metric' },
  ],
  cached: true,
  dataSource: DUNE_BASELINE.source,
};
