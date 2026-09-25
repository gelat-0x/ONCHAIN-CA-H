import { fetchJson } from '../lib/http.ts';
import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import type { ChartPoint, DefiLlamaYieldPool } from '../../shared/types/index.ts';

type LlamaChartRow = { timestamp: string; tvlUsd?: number; apy?: number };

/** Per-pool TVL history from DefiLlama yields chart (cached 30m). */
const poolChartCache = new Map<string, { ts: number; points: ChartPoint[] }>();
const POOL_CHART_CACHE_MS = 30 * 60 * 1000;

export async function fetchPoolTvlSeries(defiLlamaPoolId: string): Promise<ChartPoint[]> {
  const hit = poolChartCache.get(defiLlamaPoolId);
  if (hit && Date.now() - hit.ts < POOL_CHART_CACHE_MS) return hit.points;

  const res = await fetchJson<{ data?: LlamaChartRow[] }>(
    `https://yields.llama.fi/chart/${defiLlamaPoolId}`,
    { timeout: 12_000 },
  );
  const rows = res?.data ?? [];
  const points = rows
    .map((r) => ({ ts: new Date(r.timestamp).getTime(), value: Math.round(Number(r.tvlUsd) || 0) }))
    .filter((p) => p.ts > 0 && p.value >= 0)
    .sort((a, b) => a.ts - b.ts);

  if (points.length) poolChartCache.set(defiLlamaPoolId, { ts: Date.now(), points });
  return points;
}

/** DefiLlama protocol TVL history (api.llama.fi/protocol/{slug}). Cached 60m. */
const protocolCache = new Map<string, { ts: number; points: ChartPoint[] }>();
const PROTOCOL_CACHE_MS = 60 * 60 * 1000;

export async function fetchProtocolTvl(slug: string): Promise<ChartPoint[]> {
  const hit = protocolCache.get(slug);
  if (hit && Date.now() - hit.ts < PROTOCOL_CACHE_MS) return hit.points;

  const res = await fetchJson<{ tvl?: { date: number; tvl?: number; tvlUsd?: number; totalLiquidityUSD?: number; value?: number }[] }>(
    API_ENDPOINTS.defiLlama.protocol(slug),
    { timeout: 12_000 },
  );
  const rows = res?.tvl ?? [];
  const points = rows
    .map((r) => ({
      ts: r.date * 1000,
      value: Math.round(Number(r.totalLiquidityUSD ?? r.tvl ?? r.tvlUsd ?? r.value) || 0),
    }))
    .filter((p) => p.ts > 0 && p.value >= 0)
    .sort((a, b) => a.ts - b.ts);

  if (points.length) protocolCache.set(slug, { ts: Date.now(), points });
  return points;
}

/** frxUSD circulating supply history (best-effort). Cached 60m. */
let frxSupplyCache: { ts: number; points: ChartPoint[] } | null = null;
const SUPPLY_CACHE_MS = 60 * 60 * 1000;

export async function fetchFrxUsdSupplyHistory(frxAssetId?: string): Promise<ChartPoint[]> {
  if (frxAssetId && frxSupplyCache && Date.now() - frxSupplyCache.ts < SUPPLY_CACHE_MS) {
    return frxSupplyCache.points;
  }

  if (!frxAssetId) return [];

  try {
    const chartRows = await fetchJson<{ date: number; totalCirculating?: { peggedUSD?: number } }[]>(
      API_ENDPOINTS.defiLlama.stablecoinChart(frxAssetId),
      { timeout: 12_000 },
    );
    if (chartRows?.length) {
      const points = chartRows
        .map((r) => ({
          ts: r.date * 1000,
          value: Math.round(Number(r.totalCirculating?.peggedUSD) || 0),
        }))
        .filter((p) => p.ts > 0 && p.value >= 0)
        .sort((a, b) => a.ts - b.ts);
      if (points.length) frxSupplyCache = { ts: Date.now(), points };
      return points;
    }

    const res = await fetchJson<{
      historicalCirculating?: { peggedUSD: number; date?: string; timestamp?: number; totalCirculating?: { peggedUSD?: number } }[];
      current?: { peggedUSD?: number };
    }>(API_ENDPOINTS.defiLlama.stablecoinDetail(frxAssetId), { timeout: 12_000 });

    const rows = res?.historicalCirculating ?? [];
    const points = rows
      .map((r, i) => {
        const row = r as { peggedUSD?: number; date?: string; timestamp?: number; totalCirculating?: { peggedUSD?: number } };
        const value = Math.round(Number(row.peggedUSD ?? row.totalCirculating?.peggedUSD) || 0);
        const ts = row.timestamp
          ? row.timestamp * 1000
          : row.date
            ? new Date(row.date).getTime()
            : Date.now() - (rows.length - 1 - i) * 86400000;
        return { ts, value };
      })
      .filter((p) => p.ts > 0 && p.value >= 0)
      .sort((a, b) => a.ts - b.ts);

    if (points.length) frxSupplyCache = { ts: Date.now(), points };
    return points;
  } catch {
    return frxSupplyCache?.points ?? [];
  }
}

/** Find the DefiLlama stablecoin id for frxUSD (separate from the dashboard fetch). */
export async function fetchFrxUsdStablecoinId(): Promise<string | undefined> {
  const res = await fetchJson<{ peggedAssets?: { id: string; symbol: string }[] }>(
    'https://stablecoins.llama.fi/stablecoins',
    { timeout: 12_000 },
  );
  const assets = res?.peggedAssets ?? [];
  return assets.find((a) => a.symbol === 'FRXUSD')?.id;
}

/** Match DefiLlama yield pool id for a registry pool by address (embedded in pool id). */
export function defiLlamaPoolIdForAddress(
  pools: DefiLlamaYieldPool[],
  address?: string,
): string | undefined {
  if (!address) return undefined;
  const target = address.toLowerCase().replace(/^0x/, '');
  const match = pools.find((p) => {
    if (p.project !== 'curve-dex') return false;
    return (p.pool ?? '').toLowerCase().includes(target);
  });
  return match?.pool;
}
