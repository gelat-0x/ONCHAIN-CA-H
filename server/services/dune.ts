/**
 * Dune Analytics service for frxUSD PegKeeper pools.
 *
 * Uses the public stablescarab dashboard query (pool overview table).
 * Matching: curvePoolAddress (strict) → stablecoin symbol (registry id).
 */

import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import { ENV, envOptional } from '../config/env.ts';
import { fetchJson, type FetchOptions } from '../lib/http.ts';
import { normSymbol } from '../lib/poolMatch.ts';
import { normalizeUsd, normalizeWeiUsd, MAX_POOL_USD } from '../lib/sanitize.ts';
import type { DunePegKeeperRow, DunePegKeeperResult } from '../../shared/types/index.ts';
import { POOL_REGISTRY, type PoolRegistryEntry } from '../../shared/data/poolRegistry.ts';

const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

function parseLastUpdated(raw: unknown): string {
  if (!raw) return new Date().toISOString();
  let str = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }
  const date = new Date(str);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

/** Normalize Dune dashboard rows (supports overview + detail query shapes). */
function mapDuneRow(r: Record<string, unknown>): DunePegKeeperRow {
  return {
    pool_address: String(r.pool_address ?? r.pool ?? '').toLowerCase().trim(),
    pool_name: String(r.pool_name ?? r.name ?? ''),
    stablecoin: String(r.stablecoin ?? ''),
    total_tvl: normalizeUsd(r.total_tvl ?? r.tvl ?? r.pool_tvl) ?? 0,
    frxusd_balance:
      normalizeUsd(r.frxusd_balance ?? r.frxusd_tvl ?? r.frxusd_tvl_usd) ??
      normalizeWeiUsd(r.frxusd_balance ?? r.frxusd_tvl, MAX_POOL_USD, 0) ??
      0,
    volume_24h: normalizeUsd(r.volume_24h ?? r.volume) ?? 0,
    last_updated: parseLastUpdated(r.last_updated),
  };
}

export function isDuneConfigured(): boolean {
  const apiKey = envOptional(ENV.DUNE_API_KEY);
  const queryId = envOptional(ENV.DUNE_PEGKEEPER_QUERY_ID) || API_ENDPOINTS.dune.pegkeeperQueryId;
  return Boolean(apiKey && queryId);
}

export async function fetchDunePegKeeperData(): Promise<DunePegKeeperResult | null> {
  const apiKey = envOptional(ENV.DUNE_API_KEY);
  const queryId = envOptional(ENV.DUNE_PEGKEEPER_QUERY_ID) || API_ENDPOINTS.dune.pegkeeperQueryId;

  if (!apiKey || !queryId) {
    console.warn('[Dune] Not configured (missing DUNE_API_KEY or DUNE_PEGKEEPER_QUERY_ID)');
    return null;
  }

  const url = `${API_ENDPOINTS.dune.base}/query/${queryId}/results`;
  const options: FetchOptions = {
    timeout: 30_000,
    headers: { 'x-dune-api-key': apiKey },
  };

  try {
    const response = await fetchJson<{
      result?: { rows?: Record<string, unknown>[] };
    }>(url, options);

    const rawRows = response?.result?.rows;
    if (!rawRows?.length) {
      console.warn('[Dune] Query returned no rows');
      return null;
    }

    const rows = rawRows.map(mapDuneRow);
    const hasTimestamps = rows.some(r => r.last_updated && r.last_updated !== new Date(0).toISOString());

    const latestTimestamp = hasTimestamps
      ? rows.map(r => new Date(r.last_updated).getTime()).filter(t => !isNaN(t)).sort((a, b) => b - a)[0]
      : Date.now();

    const lastUpdated = latestTimestamp ? new Date(latestTimestamp) : new Date();
    const isStale = hasTimestamps
      ? (Date.now() - lastUpdated.getTime()) > STALE_THRESHOLD_MS
      : false;

    console.log(`[Dune] Fetched ${rows.length} rows (query ${queryId}), stale=${isStale}`);

    return { rows, lastUpdated, isStale, source: 'dune' };
  } catch (error) {
    console.error('[Dune] Fetch failed:', error);
    return null;
  }
}

function stablecoinMatch(row: DunePegKeeperRow, entry: PoolRegistryEntry): boolean {
  if (!row.stablecoin) return false;
  return normSymbol(row.stablecoin) === normSymbol(entry.stablecoin);
}

/**
 * Match registry pool → Dune row.
 * 1. curvePoolAddress (exact)
 * 2. stablecoin symbol (overview table has no addresses)
 */
export function findDuneRowForPool(
  duneResult: DunePegKeeperResult | null,
  entry: PoolRegistryEntry,
): DunePegKeeperRow | null {
  if (!duneResult?.rows?.length) return null;

  if (entry.curvePoolAddress) {
    const target = entry.curvePoolAddress.toLowerCase().trim();
    const byAddr = duneResult.rows.find(r =>
      (r.pool_address || '').toLowerCase().trim() === target
    );
    if (byAddr) return byAddr;
  }

  const shared = POOL_REGISTRY.filter(
    (e) => normSymbol(e.stablecoin) === normSymbol(entry.stablecoin),
  ).length > 1;
  if (shared) return null;

  const bySymbol = duneResult.rows.filter(r => stablecoinMatch(r, entry));
  if (!bySymbol.length) return null;

  // Prefer highest TVL if duplicate stablecoin rows
  return bySymbol.sort((a, b) => b.total_tvl - a.total_tvl)[0];
}
