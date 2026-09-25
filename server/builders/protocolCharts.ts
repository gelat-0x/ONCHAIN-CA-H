import type { ChartPoint, ProtocolChartsData } from '../../shared/types/index.ts';
import { POOL_REGISTRY, type PoolRegistryEntry } from '../../shared/data/poolRegistry.ts';
import { DEFILLAMA_SOURCE } from '../../shared/constants/defiLlamaProtocols.ts';
import { fetchDefiLlamaYields } from '../services/defillama.ts';
import { fetchDashboardProtocolAnalyses } from '../services/defiLlamaProtocolAnalysis.ts';
import { fetchFrxUsdMintRedeemOverview } from '../services/frxUsdMintRedeem.ts';
import {
  defiLlamaPoolIdForAddress,
  fetchFrxUsdStablecoinId,
  fetchFrxUsdSupplyHistory,
  fetchPoolTvlSeries,
} from '../services/protocolCharts.ts';

/** Sort ascending, dedupe timestamps (keep last), clamp negatives to 0. */
function normalizeSeries(points: ChartPoint[]): ChartPoint[] {
  if (!points.length) return [];
  const map = new Map<number, number>();
  for (const p of points) {
    const v = Number.isFinite(p.value) ? Math.max(0, p.value) : 0;
    map.set(p.ts, v);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, value]) => ({ ts, value }));
}

function hasSignal(points: ChartPoint[]): boolean {
  if (points.length < 2) return false;
  return points.some((p) => p.value > 0);
}

function aggregateFamily(poolSeries: Map<string, ChartPoint[]>): ChartPoint[] {
  const byDay = new Map<number, number>();
  for (const series of poolSeries.values()) {
    for (const p of series) {
      const day = Math.floor(p.ts / 86_400_000) * 86_400_000;
      byDay.set(day, (byDay.get(day) ?? 0) + p.value);
    }
  }
  return [...byDay.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, value]) => ({ ts, value }));
}

async function pooled<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const batch = items.slice(i, i + limit);
    out.push(...(await Promise.all(batch.map(fn))));
  }
  return out;
}

export async function buildProtocolCharts(): Promise<ProtocolChartsData> {
  const yields = await fetchDefiLlamaYields();
  const poolIds = new Map<string, string>();
  for (const entry of POOL_REGISTRY) {
    const pid = defiLlamaPoolIdForAddress(yields, entry.curvePoolAddress);
    if (pid) poolIds.set(entry.id, pid);
  }

  const ranked = [...POOL_REGISTRY]
    .filter((e) => poolIds.get(e.id))
    .sort((a, b) => (b.duneTvlFallback ?? 0) - (a.duneTvlFallback ?? 0))
    .slice(0, 14) as PoolRegistryEntry[];

  const seriesMap = new Map<string, ChartPoint[]>();
  await pooled(ranked, 5, async (entry) => {
    const pid = poolIds.get(entry.id)!;
    const pts = await fetchPoolTvlSeries(pid);
    if (pts.length) seriesMap.set(entry.id, pts);
    return null;
  });

  const [protocolAnalyses, frxUsdMintRedeem, frxId] = await Promise.all([
    fetchDashboardProtocolAnalyses(),
    fetchFrxUsdMintRedeemOverview(),
    fetchFrxUsdStablecoinId(),
  ]);

  const frxSupply = normalizeSeries(await fetchFrxUsdSupplyHistory(frxId));
  const familyTvl = normalizeSeries(aggregateFamily(seriesMap));

  const anyLive =
    hasSignal(familyTvl) ||
    hasSignal(frxSupply) ||
    protocolAnalyses.length > 0 ||
    !!frxUsdMintRedeem;

  return {
    familyTvl: {
      label: 'PegKeeper family TVL',
      source: DEFILLAMA_SOURCE,
      points: hasSignal(familyTvl) ? familyTvl : [],
    },
    frxUsdSupply: {
      label: 'frxUSD circulating supply',
      source: DEFILLAMA_SOURCE,
      points: hasSignal(frxSupply) ? frxSupply : [],
    },
    protocolAnalyses,
    frxUsdMintRedeem,
    lastUpdated: new Date().toISOString(),
    cached: false,
    dataSource: anyLive ? 'live' : 'partial',
  };
}
