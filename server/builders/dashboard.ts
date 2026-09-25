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
import { sanitizeDashboardData } from '../../shared/lib/sanitizeMetrics.ts';
import { matchDefiLlamaPoolForEntry, matchDefiLlamaByAddress, parseDefiLlamaApy } from '../lib/poolMatch.ts';
import { resolveAprLayers } from '../lib/aprLayers.ts';
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
  fetchCurvePricesPoolApy,
  fetchCurvePoolApy,
  fetchCurvePoolDetail,
  parseCurveVolumeApy,
  matchCurvePool,
  matchCurveVolume,
} from '../services/curve.ts';
import { fetchFrxUsdBalanceForPool } from '../services/multichain.ts';
import { fetchPoolTvlHistory } from '../services/poolTvlHistory.ts';
import {
  buildStakeDaoPairSearchUrl,
  fetchStakeDaoCurveStrategies,
  resolveStakeDaoBoost,
} from '../services/stakedao.ts';
import { normalizeUsd, MAX_TOTAL_USD } from '../lib/sanitize.ts';

/**
 * Build dashboard data with strict priority:
 *
 * 1. Curve API (primary live source)
 *    - APR from /getVolumes/ethereum (latestDailyApyPcent — matches curve.fi UI)
 *    - TVL from /getPools/all/ethereum
 *    - Volume from /getVolumes/ethereum
 * 2. DefiLlama (fallback only)
 * 3. Dune (diagnostic / last-resort TVL and volume only)
 * 4. Static fallbacks
 *
 * Current frxUSD pool composition is sourced from Curve's `coins[]` balances
 * using the exact frxUSD token address. Dune transfer replay values are not
 * used as current balances because a cutoff query may omit opening balances.
 */

export async function buildDashboardData(): Promise<DashboardData> {
  const chainsWithCurve = Array.from(
    new Set(
      POOL_REGISTRY.filter((e: PoolRegistryEntry) => !!e.curvePoolAddress).map(
        (e: PoolRegistryEntry) => e.chain || 'Ethereum',
      ),
    ),
  );

  const [dlPools, stableAssets, cg, duneData, curvePoolsByChain, curveVolumesByChain, sdStrats] =
    await Promise.all([
    fetchDefiLlamaYields(),
    fetchDefiLlamaStablecoins(),
    fetchCoinGeckoPrices(),
    fetchDunePegKeeperData(),
    Promise.all(chainsWithCurve.map((c) => fetchCurvePools(c))),
    Promise.all(chainsWithCurve.map((c) => fetchCurveVolumes(c))),
    // Non-blocking: 4s timeout + never rejects the whole build.
    fetchStakeDaoCurveStrategies().catch(() => [] as Awaited<ReturnType<typeof fetchStakeDaoCurveStrategies>>),
  ]);

  const curvePools = curvePoolsByChain.flat();
  const curveVolumes = curveVolumesByChain.flat();

  const nonEthPools = POOL_REGISTRY.filter(
    (e: PoolRegistryEntry) => e.chain && e.chain !== 'Ethereum' && e.curvePoolAddress,
  );
  const frxBalances: Record<string, number> = {};
  if (nonEthPools.length > 0) {
    await Promise.all(
      nonEthPools.map(async (e: PoolRegistryEntry) => {
        const bal = await fetchFrxUsdBalanceForPool(e.chain, e.curvePoolAddress);
        if (bal > 0) frxBalances[e.id] = bal;
      }),
    );
  }

  const frxAsset = findFrxUsdAsset(stableAssets);
  const frxPrice = frxAsset?.price ?? cg?.['frax-usd']?.usd ?? 1.0001;
  const marketCap = frxAsset?.circulating?.peggedUSD ?? cg?.['frax-usd']?.usd_market_cap ?? 123_000_000;

  const pools: PoolData[] = (
    await Promise.all(
      POOL_REGISTRY.map(async (entry: PoolRegistryEntry) => {
    // 1. Curve primary (pools + volumes)
    const curvePool = matchCurvePool(curvePools, entry);
    const curveVol = matchCurveVolume(curveVolumes, entry);

    // 2. Dune (frxUSD balance + volume as secondary)
    const duneRow = findDuneRowForPool(duneData, entry);

    // 3. DefiLlama fallback
    const dl = matchDefiLlamaPoolForEntry(dlPools, entry);

    // === Volume priority: Curve volumes > Dune > DefiLlama > 0 ===
    let volume24h = 0;
    const curveVolUsd = normalizeUsd(curveVol?.volumeUsd24h);
    const duneVolUsd = normalizeUsd(duneRow?.volume_24h);
    const dlVolUsd = normalizeUsd(dl?.volumeUsd1d);
    if (curveVolUsd) volume24h = Math.round(curveVolUsd);
    else if (duneVolUsd) volume24h = Math.round(duneVolUsd);
    else if (dlVolUsd) volume24h = Math.round(dlVolUsd);

    // === TVL priority: Curve current pool > DefiLlama > Dune diagnostic fallback ===
    const liveTvl = normalizeUsd(
      curvePool?.tvlUsd && curvePool.tvlUsd > 0
        ? curvePool.tvlUsd
        : dl?.tvlUsd && dl.tvlUsd > 0
          ? dl.tvlUsd
          : duneRow?.total_tvl && duneRow.total_tvl > 0
            ? duneRow.total_tvl
            : 0,
    ) ?? 0;

    const volumeApy = parseCurveVolumeApy(curveVol);
    const boost = resolveStakeDaoBoost(sdStrats, entry);
    const layers = resolveAprLayers({ volumeApy, curvePool, dl, boost });

    // Non-Ethereum: pool-list APY + gauge rewards (volume/detail endpoints often empty)
    let baseApr = layers.baseApr;
    let rewardsApr = layers.rewardsApr;
    if (entry.chain && entry.chain !== 'Ethereum') {
      const curveHeadline =
        (curvePool?.apy && curvePool.apy > 0 ? curvePool.apy : undefined) ??
        (curvePool?.incentivesApy && curvePool.incentivesApy > 0
          ? (layers.baseApr > 0 ? layers.baseApr : 0) + curvePool.incentivesApy
          : undefined);
      if (curveHeadline != null && curveHeadline > 0) {
        const rounded = +curveHeadline.toFixed(1);
        if (baseApr < 0.05) baseApr = rounded;
        if (!rewardsApr || rewardsApr < rounded) rewardsApr = rounded;
      }
    }

    const curveFrxBalance = curvePool?.frxUsdBalanceUsd;
    const rpcFrxBalance = frxBalances[entry.id];
    const liveFrxBalance =
      curveFrxBalance != null
        ? curveFrxBalance
        : rpcFrxBalance != null
          ? rpcFrxBalance
          : undefined;

    const liveData = {
      tvl: liveTvl,
      apr: baseApr,
      volume24h,
      frxUsdBalance: liveFrxBalance,
    };

    const base = registryToPoolData(entry, liveData);
    if (curveFrxBalance != null) {
      base.frxUsdBalanceSource = 'curve';
      if (base.frxUsdBalanceUsd != null && base.tvl > 0) {
        base.frxUsdSharePct = +Math.min(100, (base.frxUsdBalanceUsd / base.tvl) * 100).toFixed(2);
      }
    } else if (rpcFrxBalance != null) {
      base.frxUsdBalanceSource = 'onchain-rpc';
      if (base.tvl > 0) {
        base.frxUsdSharePct = +Math.min(100, (rpcFrxBalance / base.tvl) * 100).toFixed(2);
      }
    }

    const dlPoolId =
      dl?.pool ?? matchDefiLlamaByAddress(dlPools, entry.curvePoolAddress)?.pool;

    const hist = await fetchPoolTvlHistory(dlPoolId, base.tvl, entry.id);
    base.tvlHistory7d = hist.values;
    base.tvlHistorySeries = hist.series;
    if (hist.live) {
      base.tvlHistoryLive = true;
      const first = hist.series[0]?.value;
      const last = hist.series[hist.series.length - 1]?.value;
      if (first != null && last != null && first > 0) {
        base.tvlChange7dPct = +(((last - first) / first) * 100).toFixed(2);
      }
    }

    if (rewardsApr != null) base.rewardsApr = rewardsApr;
    if (layers.rewardsApy != null) base.rewardsApy = layers.rewardsApy;
    if (boost) {
      if (boost.displayApr != null && boost.displayApr > 0) {
        base.stakeDaoApr = boost.displayApr;
      }
      if (boost.boostedApr > 0) base.boostedApr = boost.boostedApr;
      else if (boost.displayApr != null && boost.displayApr > 0) base.boostedApr = boost.displayApr;
      if (boost.stakedApr != null) base.stakedApr = boost.stakedApr;
      if (boost.maxApr != null) base.stakeDaoMaxApr = boost.maxApr;
      if (boost.onlyBoost) base.onlyBoost = true;
      if (boost.strategyUrl) base.stakeDaoUrl = boost.strategyUrl;
      else base.stakeDaoUrl = buildStakeDaoPairSearchUrl(entry);
      base.stakeDaoVerified = true;
      if (boost.convexPoolId != null) base.convexPoolId = boost.convexPoolId;
      if (boost.convexUrl) base.convexUrl = boost.convexUrl;
    }

    return base;
      }),
    )
  ).sort((a, b) => b.tvl - a.tvl);

  // Second pass: Curve API for pools still missing APR (HyperEVM, zero-volume pools)
  for (const pool of pools) {
    if (pool.apr >= 0.05) continue;
    const entry = POOL_REGISTRY.find((e) => e.id === pool.id);
    if (!entry) continue;

    if (entry.curvePoolAddress) {
      const matched = matchCurvePool(curvePools, entry);
      const fromList = matched?.apy;
      const apy =
        (fromList != null && fromList >= 0.005 ? fromList : undefined) ??
        (await fetchCurvePoolApy(entry.curvePoolAddress, entry.chain)) ??
        (await fetchCurvePricesPoolApy(entry.curvePoolAddress, entry.chain));

      if (apy != null && apy >= 0.005) {
        const rounded = apy < 0.05 ? 0.01 : +apy.toFixed(1);
        pool.apr = rounded;
        pool.rewardsApr = pool.rewardsApr ?? rounded;
        continue;
      }

      if (pool.tvl < 1000 && entry.chain && entry.chain !== 'Ethereum') {
        const detail = await fetchCurvePoolDetail(entry.curvePoolAddress, entry.chain);
        if (detail?.tvlUsd && detail.tvlUsd > 0) pool.tvl = Math.round(detail.tvlUsd);
        if (detail?.apy && detail.apy >= 0.005) {
          const rounded = detail.apy < 0.05 ? 0.01 : +detail.apy.toFixed(1);
          pool.apr = rounded;
          pool.rewardsApr = pool.rewardsApr ?? rounded;
          continue;
        }
      }

      await new Promise((r) => setTimeout(r, 40));
    }

    const dl = matchDefiLlamaPoolForEntry(dlPools, entry);
    const dlApy =
      parseDefiLlamaApy(dl) ??
      parseDefiLlamaApy(matchDefiLlamaByAddress(dlPools, entry.curvePoolAddress));
    if (dlApy && dlApy > 0) {
      pool.apr = +dlApy.toFixed(1);
      pool.rewardsApr = pool.rewardsApr ?? +dlApy.toFixed(1);
    }
  }

  const totalTvl = Math.min(
    pools.reduce((s, p) => s + p.tvl, 0),
    MAX_TOTAL_USD,
  );
  const totalFrxUsdInPools = Math.min(
    pools.reduce((s, p) => s + (p.frxUsdBalanceUsd ?? 0), 0),
    MAX_TOTAL_USD,
  );
  const totalVolume24h = Math.min(
    pools.reduce((s, p) => s + p.volume24h, 0),
    MAX_TOTAL_USD,
  );
  const activePools = pools.length;

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
  let pegHistory90d = history.map((h) => ({
    date: h.date.split('T')[0] ?? h.date,
    price: h.price,
  }));
  if (!pegHistory90d.length) {
    const today = new Date().toISOString().split('T')[0];
    pegHistory90d = [{ date: today, price: +frxPrice.toFixed(4) }];
  }

  // Data source string
  const curvePoolCount = POOL_REGISTRY.filter(e =>
    e.curvePoolAddress && matchCurvePool(curvePools, e)
  ).length;

  const duneUsed = duneData && !duneData.isStale && duneData.rows.length > 0;
  const dlUsedCount = POOL_REGISTRY.filter((e) => matchDefiLlamaPoolForEntry(dlPools, e)).length;

  const sdMatched = pools.filter((p) => p.stakeDaoVerified && p.stakeDaoApr != null && p.stakeDaoApr > 0).length;
  const sdLinked = pools.filter((p) => p.stakeDaoVerified && p.stakeDaoUrl).length;
  console.log(
    `[StakeDAO] ${sdStrats.length} strategies · ${sdLinked} linked · ${sdMatched}/${pools.length} verified APR`,
  );

  let dataSource = 'Dune PegKeeper';
  if (duneUsed) dataSource += ` (${duneData!.rows.length} pools)`;
  if (curvePoolCount > 0) dataSource += ` + Curve (${curvePoolCount} matched)`;
  if (dlUsedCount > 0) dataSource += ` + DefiLlama APR fallback (no Curve address)`;

  return sanitizeDashboardData({
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
  }, POOL_REGISTRY);
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
