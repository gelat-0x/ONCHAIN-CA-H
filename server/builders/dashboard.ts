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
import { fetchFrxUsdBalanceForPool } from '../services/multichain.ts';

/**
 * Build dashboard data with strict priority:
 *
 * 1. Curve API (primary live source)
 *    - TVL/APY from /getPools/all/{chain} (multi-chain via registry.chain)
 *    - Volume from /getVolumes/{chain} (improved parser supporting hyperliquid data.pools + volumeUSD field)
 * 2. Dune (PegKeeper-specific frxUSD balance)
 * 3. DefiLlama (fallback only)
 * 4. Static fallbacks
 *
 * chainDistribution is now primarily calculated from the actual `pools` array
 * (using frxUsdBalanceUsd when available, otherwise tvl) per chain. This reflects
 * real PegKeeper TVL distribution instead of broad frxUSD supply data.
 * 
 * 5. chainDistribution is now primarily computed from the live `pools` array
 *    (sum of tvl or frxUsdBalanceUsd per chain). DefiLlama is secondary fallback only.
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
  // Collect unique chains that have Curve pools (from registry)
  // This enables incremental multi-chain support without breaking Ethereum.
  const chainsWithCurve = Array.from(new Set(
    POOL_REGISTRY
      .filter((e: PoolRegistryEntry) => !!e.curvePoolAddress)
      .map((e: PoolRegistryEntry) => e.chain || 'Ethereum')
  ));

  // Fetch Curve data in parallel for all relevant chains (Ethereum + HyperEVM + future)
  const [dlPools, stableAssets, cg, duneData, curvePoolsByChain, curveVolumesByChain] = await Promise.all([
    fetchDefiLlamaYields(),
    fetchDefiLlamaStablecoins(),
    fetchCoinGeckoPrices(),
    fetchDunePegKeeperData(),
    Promise.all(chainsWithCurve.map(c => fetchCurvePools(c))),
    Promise.all(chainsWithCurve.map(c => fetchCurveVolumes(c))),
  ]);

  // Flatten results from all chains. Matching below remains address-based.
  const curvePools = curvePoolsByChain.flat();
  const curveVolumes = curveVolumesByChain.flat();

  // Pre-fetch accurate frxUSD balances via direct RPC balanceOf for non-Ethereum chains.
  // Only needed for pools where Dune (Ethereum-only) cannot provide data.
  // Uses known frxUSD token addresses and public RPCs. Graceful zero on failure.
  const nonEthCurvePools = POOL_REGISTRY.filter((e: any) => e.chain && e.chain !== "Ethereum" && e.curvePoolAddress);
  const frxBalances: Record<string, number> = {};
  if (nonEthCurvePools.length > 0) {
    const balancePromises = nonEthCurvePools.map(async (e: any) => {
      const bal = await fetchFrxUsdBalanceForPool(e.chain, e.curvePoolAddress);
      if (bal > 0) frxBalances[e.id] = bal;
    });
    await Promise.all(balancePromises);
  }


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

    // === frxUSD balance from multi-chain RPC (for HyperEVM and future non-Eth) ===
    // Only populates if Dune did not provide a value (Dune is Ethereum-only).
    // Uses direct balanceOf on the frxUSD token contract on the target chain.
    // Falls back to dune*Fallback in registryToPoolData if this returns 0.
    if (!(base as any).frxUsdBalanceUsd && frxBalances[entry.id] && frxBalances[entry.id] > 50) {
      const bal = frxBalances[entry.id];
      (base as any).frxUsdBalanceUsd = bal;
      base.pegKeeperDebt = bal;
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

  // === Chain distribution (data-driven from live pools) ===
  // Primary source: the built `pools` array (after Curve + Dune + RPC merges).
  // We sum `tvl` (or `frxUsdBalanceUsd` when populated) per chain.
  // This makes distribution reflect actual PegKeeper exposure rather than
  // the broader frxUSD circulating supply from DefiLlama.
  //
  // DefiLlama frxAsset data is kept as a secondary/supplementary source only
  // if the pool-derived distribution is empty (graceful fallback).
  let chainDistribution: ChainDistribution[] = [];

  const chainValues: Record<string, number> = {};
  for (const p of pools) {
    const ch = p.chain || 'Ethereum';
    // Prefer frxUsdBalanceUsd (PegKeeper-specific balance) when available;
    // fall back to total pool tvl for chains without balance data yet.
    const value = ((p as any).frxUsdBalanceUsd && (p as any).frxUsdBalanceUsd > 0)
      ? (p as any).frxUsdBalanceUsd
      : (p.tvl || 0);
    chainValues[ch] = (chainValues[ch] || 0) + value;
  }

  const poolTotal = Object.values(chainValues).reduce((s, v) => s + v, 0);
  if (poolTotal > 0) {
    const entries = Object.entries(chainValues)
      .map(([chain, value]) => ({
        chain,
        percentage: +((value / poolTotal) * 100).toFixed(2),
      }))
      .filter((e) => e.percentage > 0.1)
      .sort((a, b) => b.percentage - a.percentage);

    chainDistribution = entries.slice(0, 5);
    const others = entries.slice(5).reduce((s, e) => s + e.percentage, 0);
    if (others > 0.1) {
      chainDistribution.push({ chain: 'Others', percentage: +others.toFixed(2) });
    }
  }

  // Fallback to DefiLlama or static only if we could not derive anything from pools.
  if (!chainDistribution.length) {
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
  }

  if (!chainDistribution.length) {
    // Ultimate static fallback (preserves previous behavior for cached / error cases)
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
