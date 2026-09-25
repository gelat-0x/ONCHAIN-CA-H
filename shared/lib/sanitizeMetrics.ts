import type { DashboardData, PartnerProtocol, PoolData, TickerItem } from '../types/index.ts';
import type { PoolRegistryEntry } from '../data/poolRegistry.ts';
import { DUNE_BASELINE, generateTvlHistory } from '../data/poolRegistry.ts';

export const MAX_POOL_USD = 100_000_000;
export const MAX_TOTAL_USD = 500_000_000;

const registryMap = (registry: PoolRegistryEntry[]) =>
  Object.fromEntries(registry.map((e) => [e.id, e]));

function isPlausibleUsd(n: number, max = MAX_POOL_USD): boolean {
  return Number.isFinite(n) && n > 0 && n <= max;
}

function sanitizeUsd(n: number, fallback: number, max = MAX_POOL_USD): number {
  if (isPlausibleUsd(n, max)) return Math.round(n);
  return fallback;
}

function formatPartnerTvl(tvl: number): string {
  if (!isPlausibleUsd(tvl)) return '$—';
  if (tvl >= 1_000_000) return `$${(tvl / 1e6).toFixed(2)}M`;
  if (tvl >= 1_000) return `$${Math.round(tvl / 1_000)}K`;
  return `$${Math.round(tvl)}`;
}

function rebuildPartners(pools: PoolData[]): PartnerProtocol[] {
  return pools.map((p) => ({
    protocol: p.partner,
    pool: p.stablecoin ?? p.name.split('/')[1]?.trim() ?? '—',
    tvl: formatPartnerTvl(p.tvl),
    apr: p.apr > 0 ? `${p.apr.toFixed(1)}%` : '—',
    chain: p.chain ?? 'Ethereum',
    status: p.status,
    since: p.since ?? '—',
    description: p.description,
  }));
}

function rebuildTicker(ticker: TickerItem[] | undefined): TickerItem[] {
  if (!ticker?.length) return [];
  return ticker.filter((item) => item.type !== 'metric' && item.type !== 'stablecoin');
}

/** Client + server guard against garbage API numbers. */
export function sanitizeDashboardData(
  data: DashboardData,
  registry: PoolRegistryEntry[],
): DashboardData {
  const byId = registryMap(registry);

  const pools: PoolData[] = data.pools.map((p) => {
    const reg = byId[p.id];
    const tvlFb = reg?.duneTvlFallback ?? 0;
    const tvl = sanitizeUsd(p.tvl, tvlFb);
    const volume24h = sanitizeUsd(p.volume24h, 0);
    const apr = Number.isFinite(p.apr) && p.apr > 0 && p.apr <= 500 ? +p.apr.toFixed(1) : 0;

    const okLayerApr = (n: unknown): number | undefined => {
      const v = Number(n);
      return Number.isFinite(v) && v > 0 && v <= 500 ? +v.toFixed(2) : undefined;
    };
    const stakeDaoApr = okLayerApr(p.stakeDaoApr);
    const boostedApr = okLayerApr(p.boostedApr);
    const stakedApr = okLayerApr(p.stakedApr);
    const rewardsApr = okLayerApr(p.rewardsApr);
    const stakeDaoMaxApr = okLayerApr(p.stakeDaoMaxApr);
    const tvlChange7dPct =
      p.tvlChange7dPct != null && Number.isFinite(p.tvlChange7dPct) && Math.abs(p.tvlChange7dPct) < 500
        ? +p.tvlChange7dPct.toFixed(2)
        : undefined;
    const convexPoolId =
      p.convexPoolId != null && Number.isFinite(p.convexPoolId) && p.convexPoolId > 0
        ? Math.round(p.convexPoolId)
        : undefined;

    const rawFrxUsdBalance = Number(p.frxUsdBalanceUsd);
    const frxUsdBalanceUsd =
      p.frxUsdBalanceUsd != null &&
      Number.isFinite(rawFrxUsdBalance) &&
      rawFrxUsdBalance >= 0 &&
      rawFrxUsdBalance <= MAX_POOL_USD
        ? Math.round(rawFrxUsdBalance)
        : undefined;
    const rawShare = Number(p.frxUsdSharePct);
    const frxUsdSharePct =
      p.frxUsdSharePct != null && Number.isFinite(rawShare) && rawShare >= 0 && rawShare <= 100
        ? +rawShare.toFixed(2)
        : frxUsdBalanceUsd != null && tvl > 0
          ? +Math.min(100, (frxUsdBalanceUsd / tvl) * 100).toFixed(2)
          : undefined;

    return {
      ...p,
      tvl,
      pegKeeperDebt: frxUsdBalanceUsd ?? 0,
      volume24h,
      apr,
      status: tvl > 1000 ? 'ACTIVE' : 'ALERT',
      tvlHistory7d:
        p.tvlHistory7d?.length >= 2 ? p.tvlHistory7d : generateTvlHistory(tvl),
      ...(p.tvlHistorySeries?.length ? { tvlHistorySeries: p.tvlHistorySeries } : {}),
      ...(frxUsdBalanceUsd != null
        ? {
            frxUsdBalanceUsd,
            ...(frxUsdSharePct != null ? { frxUsdSharePct } : {}),
            ...(p.frxUsdBalanceSource ? { frxUsdBalanceSource: p.frxUsdBalanceSource } : {}),
          }
        : {}),
      ...(stakeDaoApr != null ? { stakeDaoApr } : {}),
      ...(boostedApr != null ? { boostedApr } : {}),
      ...(stakedApr != null ? { stakedApr } : {}),
      ...(rewardsApr != null ? { rewardsApr } : {}),
      ...(stakeDaoMaxApr != null ? { stakeDaoMaxApr } : {}),
      ...(p.onlyBoost ? { onlyBoost: true } : {}),
      ...(p.stakeDaoUrl ? { stakeDaoUrl: p.stakeDaoUrl } : {}),
      ...(p.stakeDaoVerified ? { stakeDaoVerified: true } : {}),
      ...(convexPoolId != null ? { convexPoolId } : {}),
      ...(p.convexUrl ? { convexUrl: p.convexUrl } : {}),
      ...(tvlChange7dPct != null ? { tvlChange7dPct } : {}),
      ...(p.tvlHistoryLive ? { tvlHistoryLive: true } : {}),
    };
  });

  const totalTvl = Math.min(
    pools.reduce((s, p) => s + p.tvl, 0) || DUNE_BASELINE.totalPoolTvl,
    MAX_TOTAL_USD,
  );
  const totalFrxUsdInPools = Math.min(
    pools.reduce((s, p) => s + (p.frxUsdBalanceUsd ?? 0), 0),
    MAX_TOTAL_USD,
  );
  const totalVolume24h = Math.min(
    pools.reduce((s, p) => s + p.volume24h, 0) || 0,
    MAX_TOTAL_USD,
  );

  const marketCap = isPlausibleUsd(data.marketCap, MAX_TOTAL_USD)
    ? Math.round(data.marketCap)
    : 123_000_000;

  return {
    ...data,
    pools,
    partners: rebuildPartners(pools),
    totalTvl,
    totalFrxUsdInPools,
    totalVolume24h,
    marketCap,
    activePools: pools.length,
    partnerCount: registry.length,
    ticker: rebuildTicker(data.ticker),
  };
}
