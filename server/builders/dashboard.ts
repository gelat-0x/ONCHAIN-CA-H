import type {
  DashboardData,
  PartnerProtocol,
  ChainDistribution,
  PoolData,
} from '../../shared/types/index.ts';
import {
  POOL_REGISTRY,
  DUNE_BASELINE,
  registryToPoolData,
} from '../../shared/data/poolRegistry.ts';
import { matchDefiLlamaPool } from '../lib/poolMatch.ts';
import { generatePegDeviation } from '../lib/helpers.ts';
import { buildTickerOnly } from './ticker.ts';
import {
  fetchCoinGeckoPrices,
  fetchTokenHistory,
} from '../services/coingecko.ts';
import {
  fetchDefiLlamaYields,
  fetchDefiLlamaStablecoins,
  findFrxUsdAsset,
} from '../services/defillama.ts';

export async function buildDashboardData(): Promise<DashboardData> {
  const [dlPools, stableAssets, cg] = await Promise.all([
    fetchDefiLlamaYields(),
    fetchDefiLlamaStablecoins(),
    fetchCoinGeckoPrices(),
  ]);

  const frxAsset = findFrxUsdAsset(stableAssets);
  const frxPrice = frxAsset?.price ?? cg?.['frax-usd']?.usd ?? 1.0001;
  const marketCap = frxAsset?.circulating?.peggedUSD ?? cg?.['frax-usd']?.usd_market_cap ?? 123_000_000;

  const pools: PoolData[] = POOL_REGISTRY.map((entry) => {
    const dl = matchDefiLlamaPool(dlPools, entry.dlSymbols);
    return registryToPoolData(entry, {
      tvl: dl?.tvlUsd,
      apr: dl?.apy,
      volume24h: dl?.volumeUsd1d,
    }, frxPrice);
  }).sort((a, b) => b.tvl - a.tvl);

  const totalTvl = pools.reduce((s, p) => s + p.tvl, 0);
  const totalFrxUsdInPools = pools.reduce((s, p) => s + p.pegKeeperDebt, 0);
  const totalVolume24h = pools.reduce((s, p) => s + p.volume24h, 0);
  const activePools = pools.filter((p) => p.status === 'ACTIVE').length;

  const partners: PartnerProtocol[] = pools.map((p) => ({
    protocol: p.partner,
    pool: p.stablecoin ?? p.name.split('/')[1]?.trim() ?? '—',
    tvl: p.tvl >= 1_000_000 ? `$${(p.tvl / 1e6).toFixed(2)}M` : p.tvl >= 1000 ? `$${(p.tvl / 1e3).toFixed(0)}K` : '$—',
    apr: p.apr > 0 ? `${p.apr.toFixed(1)}%` : '—',
    chain: p.chain ?? 'Ethereum',
    status: p.status,
    since: p.since ?? '—',
    description: p.description,
  }));

  let chainDistribution: ChainDistribution[] = [];
  if (frxAsset?.chainCirculating) {
    const total = Object.values(frxAsset.chainCirculating).reduce(
      (s, v) => s + (v.current?.peggedUSD ?? 0), 0,
    ) || marketCap;
    const entries = Object.entries(frxAsset.chainCirculating)
      .map(([chain, v]) => ({
        chain: chain.charAt(0).toUpperCase() + chain.slice(1),
        percentage: +(((v.current?.peggedUSD ?? 0) / total) * 100).toFixed(2),
      }))
      .filter((e) => e.percentage > 0.3)
      .sort((a, b) => b.percentage - a.percentage);
    chainDistribution = entries.slice(0, 5);
    const others = entries.slice(5).reduce((s, e) => s + e.percentage, 0);
    if (others > 0.1) chainDistribution.push({ chain: 'Others', percentage: +others.toFixed(2) });
  }
  if (!chainDistribution.length) {
    chainDistribution = [
      { chain: 'Ethereum', percentage: 89.65 },
      { chain: 'Fraxtal', percentage: 6.87 },
      { chain: 'Sonic', percentage: 1.79 },
      { chain: 'Base', percentage: 0.43 },
      { chain: 'Others', percentage: 1.26 },
    ];
  }

  const history = await fetchTokenHistory('frax-usd', '90');
  let pegHistory90d = history.map((h) => ({ date: h.date, price: h.price }));
  if (!pegHistory90d.length) {
    const now = Date.now();
    pegHistory90d = Array.from({ length: 90 }, (_, i) => ({
      date: new Date(now - (89 - i) * 86400000).toISOString().split('T')[0],
      price: +(1.0 + Math.sin(i / 6) * 0.0007).toFixed(4),
    }));
  }

  const liveDlCount = pools.filter((p) => {
    const entry = POOL_REGISTRY.find((e) => e.id === p.id);
    return entry && matchDefiLlamaPool(dlPools, entry.dlSymbols);
  }).length;

  return {
    pools,
    partners,
    frxUsdPrice: +frxPrice.toFixed(4),
    pegHistory30d: pegHistory90d.slice(-30).map((d) => d.price),
    pegHistory90d,
    chainDistribution,
    totalTvl: totalTvl || DUNE_BASELINE.totalPoolTvl,
    totalFrxUsdInPools: totalFrxUsdInPools || DUNE_BASELINE.totalFrxUsdInPools,
    totalVolume24h,
    activePools,
    partnerCount: POOL_REGISTRY.length,
    marketCap: Math.round(marketCap),
    ticker: buildTickerOnly(cg, totalTvl, frxPrice),
    cached: false,
    dataSource: `CoinGecko + DefiLlama (${liveDlCount}/${POOL_REGISTRY.length} pools)`,
    lastUpdated: new Date().toISOString(),
  };
}

export function buildDashboardFallback(): DashboardData {
  return {
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
    pegHistory30d: generatePegDeviation(1, 30),
    pegHistory90d: [],
    chainDistribution: [{ chain: 'Ethereum', percentage: 89.65 }],
    totalTvl: DUNE_BASELINE.totalPoolTvl,
    totalFrxUsdInPools: DUNE_BASELINE.totalFrxUsdInPools,
    totalVolume24h: 3_000_000,
    activePools: POOL_REGISTRY.length,
    partnerCount: POOL_REGISTRY.length,
    marketCap: 123_000_000,
    ticker: buildTickerOnly({}, DUNE_BASELINE.totalPoolTvl, 1.0001),
    cached: true,
    dataSource: DUNE_BASELINE.source,
  };
}
