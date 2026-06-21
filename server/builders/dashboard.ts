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
  type PoolRegistryEntry,
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
import {
  fetchDunePegKeeperData,
  findDuneRowForPool,
} from '../services/dune.ts';
import {
  fetchCurvePools,
  fetchCurveVolumes,
  matchCurvePool,
  matchCurveVolume,
} from '../services/curve.ts';

/**
 * Build dashboard data with strict priority:
 *
 * 1. Curve API (primary live source)
 *    - TVL/APY from /getPools/all/ethereum
 *    - Volume from /getVolumes/ethereum
 * 2. Dune (PegKeeper-specific frxUSD balance)
 * 3. DefiLlama (fallback only)
 * 4. Static fallbacks
 *
 * IMPORTANT NAMING (Dune validation rule):
 * - `frxUsdBalanceUsd` is populated **only** for pools where live Dune data
 *   was successfully matched via curvePoolAddress.
 * - Use presence/value of `frxUsdBalanceUsd` to verify "Dune was applied".
 * - `pegKeeperDebt` is a legacy field that exists on ALL pools (from registry
 *   fallbacks). It gets overwritten by Dune for matched pools, but you cannot
 *   use it to detect whether Dune data was applied.
 */

export async function buildDashboardData(): Promise<DashboardData> {
  const [dlPools, stableAssets, cg, duneData, curvePools, curveVolumes] = await Promise.all([
    fetchDefiLlamaYields(),
    fetchDefiLlamaStablecoins(),
    fetchCoinGeckoPrices(),
    fetchDunePegKeeperData(),
    fetchCurvePools(),
    fetchCurveVolumes(),
  ]);


  const frxAsset = findFrxUsdAsset(stableAssets);
  const frxPrice = frxAsset?.price ?? cg?.['frax-usd']?.usd ?? 1.0001;
  const marketCap = frxAsset?.circulating?.peggedUSD ?? cg?.['frax-usd']?.usd_market_cap ?? 123_000_000;

  const pools: PoolData[] = POOL_REGISTRY.map((entry: PoolRegistryEntry) => {
    // 1. Curve primary (pools + volumes)
    const curvePool = matchCurvePool(curvePools, entry);
    const curveVol = matchCurveVolume(curveVolumes, entry);

    // 2. Dune (frxUSD balance + volume as secondary)
    const duneRow = findDuneRowForPool(duneData, entry);

    // 3. DefiLlama fallback
    const dl = matchDefiLlamaPool(dlPools, entry.dlSymbols);

    // === Volume priority: Curve volumes > Dune > DefiLlama > 0 ===
    let volume24h = 0;
    if (curveVol?.volumeUsd24h && curveVol.volumeUsd24h > 0) {
      volume24h = Math.round(curveVol.volumeUsd24h);
    } else if (duneRow?.volume_24h && duneRow.volume_24h > 0) {
      volume24h = Math.round(duneRow.volume_24h);
    } else if (dl?.volumeUsd1d && dl.volumeUsd1d > 0) {
      volume24h = Math.round(dl.volumeUsd1d);
    }

    // === TVL / APR priority: Curve > DefiLlama > fallback ===
    const liveData = {
      tvl: curvePool?.tvlUsd ?? dl?.tvlUsd,
      apr: curvePool?.apy ?? dl?.apy,
      volume24h,
    };

    const base = registryToPoolData(entry, liveData, frxPrice);

    // === frxUSD balance from Dune (PegKeeper context) ===
    if (duneRow && !duneData?.isStale) {
      const frxUsdBal = duneRow.frxusd_balance;
      if (frxUsdBal > 50) {
        // Preferred field
        (base as any).frxUsdBalanceUsd = Math.round(frxUsdBal);

        // Compatibility alias for existing frontend
        // TODO: Clarify with product whether this is truly "debt" or pool balance
        base.pegKeeperDebt = Math.round(frxUsdBal);
      }
    }

    return base;
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

  // Chain distribution (still using frxAsset for now)
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

  // Data source string
  const curvePoolCount = POOL_REGISTRY.filter(e =>
    e.curvePoolAddress && matchCurvePool(curvePools, e)
  ).length;

  const duneUsed = duneData && !duneData.isStale && duneData.rows.length > 0;
  const dlUsedCount = POOL_REGISTRY.filter(e => matchDefiLlamaPool(dlPools, e.dlSymbols)).length;

  let dataSource = 'Curve';
  if (curvePoolCount > 0) dataSource += ` (${curvePoolCount} pools)`;
  if (duneUsed) dataSource += ' + Dune (frxUSD balance)';
  if (dlUsedCount > 0) dataSource += ` + DefiLlama fallback`;

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
    dataSource,
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
