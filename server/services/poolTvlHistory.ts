import { fetchJson } from '../lib/http.ts';

type ChartRow = { timestamp: string; tvlUsd?: number };

type HistoryResult = {
  values: number[];
  series: Array<{ ts: number; value: number }>;
  /** True when series came from DefiLlama chart data (not a flat current-TVL fill). */
  live: boolean;
};

const cache = new Map<string, { ts: number; values: number[]; series: Array<{ ts: number; value: number }> }>();
const CACHE_MS = 30 * 60 * 1000;

function sampleToN(values: Array<{ ts: number; value: number }>, n: number): Array<{ ts: number; value: number }> {
  if (values.length <= n) return values;
  const out: Array<{ ts: number; value: number }> = [];
  const step = (values.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) {
    out.push(values[Math.round(i * step)]!);
  }
  return out;
}

/** Flat 7d series at current TVL when no live history exists (no fake waves). */
function flatTvlSeries(currentTvl: number): HistoryResult {
  const v = Math.max(0, Math.round(currentTvl));
  const now = Date.now();
  const series = Array.from({ length: 7 }, (_, i) => ({
    ts: now - (6 - i) * 86400000,
    value: v,
  }));
  return { values: series.map((p) => p.value), series, live: false };
}

/** Fetch 7d TVL history from DefiLlama yields chart (cached 30m). */
export async function fetchPoolTvlHistory(
  defiLlamaPoolId: string | undefined,
  currentTvl: number,
  _poolId: string,
): Promise<HistoryResult> {
  const fallback = flatTvlSeries(currentTvl);

  if (!defiLlamaPoolId) {
    return fallback;
  }

  const hit = cache.get(defiLlamaPoolId);
  if (hit && Date.now() - hit.ts < CACHE_MS) {
    const values = [...hit.values];
    const series = hit.series.map((p) => ({ ...p }));
    if (currentTvl > 0 && values.length) {
      values[values.length - 1] = Math.round(currentTvl);
      series[series.length - 1] = { ...series[series.length - 1]!, value: Math.round(currentTvl) };
    }
    return { values, series, live: true };
  }

  try {
    const res = await fetchJson<{ data?: ChartRow[] }>(
      `https://yields.llama.fi/chart/${defiLlamaPoolId}`,
      { timeout: 12_000 },
    );
    const rows = res?.data ?? [];
    const parsed = rows
      .map((r) => ({
        ts: new Date(r.timestamp).getTime(),
        value: Math.round(Number(r.tvlUsd) || 0),
      }))
      .filter((p) => p.ts > 0 && p.value >= 0)
      .sort((a, b) => a.ts - b.ts);

    if (parsed.length < 2) {
      return fallback;
    }

    const weekAgo = Date.now() - 7 * 86400000;
    let recent = parsed.filter((p) => p.ts >= weekAgo);
    if (recent.length < 2) recent = parsed.slice(-14);

    const series = sampleToN(recent, 7);
    const values = series.map((p) => p.value);
    if (currentTvl > 0) {
      values[values.length - 1] = Math.round(currentTvl);
      series[series.length - 1] = { ...series[series.length - 1]!, value: Math.round(currentTvl) };
    }

    cache.set(defiLlamaPoolId, { ts: Date.now(), values, series });
    return { values, series, live: true };
  } catch {
    return fallback;
  }
}
