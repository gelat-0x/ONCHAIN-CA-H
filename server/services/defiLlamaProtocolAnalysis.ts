import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import {
  DEFILLAMA_SOURCE,
  DASHBOARD_DEFILLAMA_PROTOCOLS,
  defiLlamaProtocolUrl,
} from '../../shared/constants/defiLlamaProtocols.ts';
import type {
  ChartPoint,
  DefiLlamaProtocolAnalysis,
  ProtocolChainTvl,
  ProtocolHeadlineMetric,
} from '../../shared/types/index.ts';
import { fetchJson } from '../lib/http.ts';

type LlamaTvlRow = {
  date: number;
  tvl?: number;
  tvlUsd?: number;
  totalLiquidityUSD?: number;
  value?: number;
};

type LlamaProtocolResponse = {
  name?: string;
  slug?: string;
  category?: string;
  description?: string;
  url?: string;
  chains?: string[];
  tvl?: LlamaTvlRow[];
  currentChainTvls?: Record<string, number>;
  change_1d?: number;
  change_7d?: number;
  change_1m?: number;
};

type LlamaDimensionSummary = {
  displayName?: string;
  total24h?: number;
  total48hto24h?: number;
  total7d?: number;
  total30d?: number;
  total1y?: number;
  totalAllTime?: number;
  change_1d?: number;
  change_7d?: number;
  change_1m?: number;
  totalDataChart?: ([number, number] | { date: number; value: number })[];
};

const analysisCache = new Map<string, { ts: number; data: DefiLlamaProtocolAnalysis | null }>();
const ANALYSIS_CACHE_MS = 5 * 60 * 1000;

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

function parseTvlHistory(rows: LlamaTvlRow[] | undefined): ChartPoint[] {
  return normalizeSeries(
    (rows ?? [])
      .map((r) => ({
        ts: r.date * 1000,
        value: Math.round(
          Number(r.totalLiquidityUSD ?? r.tvlUsd ?? r.tvl ?? r.value) || 0,
        ),
      }))
      .filter((p) => p.ts > 0),
  );
}

function parseDimensionChart(
  rows: LlamaDimensionSummary['totalDataChart'],
): ChartPoint[] {
  return normalizeSeries(
    (rows ?? [])
      .map((row) => {
        if (Array.isArray(row)) {
          const [ts, value] = row;
          return { ts: ts * 1000, value: Math.round(Number(value) || 0) };
        }
        return {
          ts: row.date * 1000,
          value: Math.round(Number(row.value) || 0),
        };
      })
      .filter((p) => p.ts > 0),
  );
}

function parseChainTvl(current?: Record<string, number>): ProtocolChainTvl[] {
  if (!current) return [];
  const skip = /staking|borrowed|pool2|vesting|treasury|off-chain|double-counted/i;
  return Object.entries(current)
    .filter(([chain, tvl]) => !skip.test(chain) && Number.isFinite(tvl) && tvl > 0)
    .map(([chain, tvl]) => ({ chain, tvl: Math.round(tvl) }))
    .sort((a, b) => b.tvl - a.tvl);
}

function metric(
  key: string,
  label: string,
  value: number | null | undefined,
  changePct?: number | null,
): ProtocolHeadlineMetric {
  const v = value != null && Number.isFinite(value) ? Math.round(value) : null;
  return {
    key,
    label,
    value: v,
    changePct: changePct != null && Number.isFinite(changePct) ? changePct : null,
  };
}

function annualizedFromDaily(daily: number | undefined): number | null {
  if (daily == null || !Number.isFinite(daily) || daily <= 0) return null;
  return Math.round(daily * 365);
}

function buildHeadlines(
  prefix: string,
  label: string,
  summary: LlamaDimensionSummary | null | undefined,
): ProtocolHeadlineMetric[] {
  if (!summary) return [];
  return [
    metric(`${prefix}24h`, `${label} 24h`, summary.total24h, summary.change_1d),
    metric(`${prefix}7d`, `${label} 7d`, summary.total7d, summary.change_7d),
    metric(`${prefix}30d`, `${label} 30d`, summary.total30d, summary.change_1m),
    metric(`${prefix}AllTime`, `Cumulative ${label.toLowerCase()}`, summary.totalAllTime),
    metric(
      `${prefix}Annualized`,
      `${label} (annualized)`,
      annualizedFromDaily(summary.total24h),
    ),
  ];
}

async function fetchDimensionSummary(
  slug: string,
  dataType: string,
  dex = false,
): Promise<LlamaDimensionSummary | null> {
  const url = dex
    ? API_ENDPOINTS.defiLlama.dexVolumeSummary(slug, dataType)
    : API_ENDPOINTS.defiLlama.feesSummary(slug, dataType);
  return fetchJson<LlamaDimensionSummary>(url, { timeout: 15_000 });
}

export async function fetchDefiLlamaProtocolAnalysis(
  slug: string,
  label: string,
  options: { dex?: boolean } = {},
): Promise<DefiLlamaProtocolAnalysis | null> {
  const hit = analysisCache.get(slug);
  if (hit && Date.now() - hit.ts < ANALYSIS_CACHE_MS) return hit.data;

  const [protocol, fees, revenue, holdersRevenue, tvlNow, volume] = await Promise.all([
    fetchJson<LlamaProtocolResponse>(API_ENDPOINTS.defiLlama.protocol(slug), {
      timeout: 15_000,
    }),
    fetchDimensionSummary(slug, 'dailyFees'),
    fetchDimensionSummary(slug, 'dailyRevenue'),
    fetchDimensionSummary(slug, 'dailyHoldersRevenue'),
    fetchJson<number>(API_ENDPOINTS.defiLlama.protocolTvl(slug), { timeout: 10_000 }),
    options.dex ? fetchDimensionSummary(slug, 'dailyVolume', true) : Promise.resolve(null),
  ]);

  if (!protocol && !fees && !revenue) {
    analysisCache.set(slug, { ts: Date.now(), data: null });
    return null;
  }

  const tvlSeries = parseTvlHistory(protocol?.tvl);
  const latestTvl =
    typeof tvlNow === 'number' && Number.isFinite(tvlNow)
      ? Math.round(tvlNow)
      : tvlSeries.at(-1)?.value ?? null;

  const feeSeries = parseDimensionChart(fees?.totalDataChart);
  const revenueSeries = parseDimensionChart(revenue?.totalDataChart);
  const holdersSeries = parseDimensionChart(holdersRevenue?.totalDataChart);
  const volumeSeries = parseDimensionChart(volume?.totalDataChart);

  const headlines: ProtocolHeadlineMetric[] = [
    metric('tvl', 'TVL', latestTvl, protocol?.change_1d),
    metric('tvlChange7d', 'TVL change 7d', null, protocol?.change_7d),
    ...buildHeadlines('fees', 'Fees', fees),
    ...buildHeadlines('revenue', 'Revenue', revenue),
    ...buildHeadlines('holdersRevenue', 'Holders revenue', holdersRevenue),
    ...(volume ? buildHeadlines('volume', 'DEX volume', volume) : []),
  ].filter((m) => m.value != null || m.changePct != null);

  const data: DefiLlamaProtocolAnalysis = {
    slug,
    name: protocol?.name ?? fees?.displayName ?? label,
    category: protocol?.category ?? 'DeFi',
    description: protocol?.description,
    url: protocol?.url ?? defiLlamaProtocolUrl(slug),
    chains: protocol?.chains ?? [],
    headlines,
    chainTvl: parseChainTvl(protocol?.currentChainTvls),
    series: {
      tvl: tvlSeries,
      fees: feeSeries,
      revenue: revenueSeries,
      ...(holdersSeries.length >= 2 ? { holdersRevenue: holdersSeries } : {}),
      ...(volumeSeries.length >= 2 ? { volume: volumeSeries } : {}),
    },
    source: DEFILLAMA_SOURCE,
  };

  analysisCache.set(slug, { ts: Date.now(), data });
  return data;
}

/** Fetch Frax, Aave, and Curve analyses with bounded concurrency. */
export async function fetchDashboardProtocolAnalyses(): Promise<DefiLlamaProtocolAnalysis[]> {
  const results: DefiLlamaProtocolAnalysis[] = [];
  for (const entry of DASHBOARD_DEFILLAMA_PROTOCOLS) {
    const analysis = await fetchDefiLlamaProtocolAnalysis(entry.slug, entry.label, {
      dex: entry.dex,
    });
    if (analysis) results.push(analysis);
  }
  return results;
}

/** @deprecated Use fetchDefiLlamaProtocolAnalysis('frax-finance', ...) */
export async function fetchFraxProtocolAnalysis(): Promise<DefiLlamaProtocolAnalysis | null> {
  const entry = DASHBOARD_DEFILLAMA_PROTOCOLS[0];
  return fetchDefiLlamaProtocolAnalysis(entry.slug, entry.label, { dex: entry.dex });
}

export { FRAX_FINANCE_SLUG } from '../../shared/constants/defiLlamaProtocols.ts';
