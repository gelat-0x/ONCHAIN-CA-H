/**
 * Dune Analytics service for frxUSD PegKeeper pools.
 *
 * v1 strategy: Scheduled query in Dune + backend fetches /results only.
 * Dune is used as an ENHANCEMENT, mainly for accurate frxUSD balance (exposed as frxUsdBalanceUsd).
 *
 * Matching: STRICT address-only using curvePoolAddress from registry.
 * No stablecoin fallback (disabled for v1 until more pools have validated addresses).
 */

import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import { ENV, envOptional } from '../config/env.ts';
import { fetchJson, type FetchOptions } from '../lib/http.ts';
import type { DunePegKeeperRow, DunePegKeeperResult } from '../../shared/types/index.ts';
import type { PoolRegistryEntry } from '../../shared/data/poolRegistry.ts';

const STALE_THRESHOLD_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Robustly parses last_updated from Dune (handles ISO and Dune display format).
 */
function parseLastUpdated(raw: any): string {
  if (!raw) return new Date().toISOString();

  let str = String(raw).trim();

  // Dune display format "2026-06-20 21:26:25" -> treat as UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
    str = str.replace(' ', 'T') + 'Z';
  }

  const date = new Date(str);
  if (!isNaN(date.getTime())) {
    return date.toISOString();
  }

  return new Date().toISOString();
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
      result?: { rows?: any[] };
      execution_time?: number;
      row_count?: number;
    }>(url, options);

    if (!response?.result?.rows) {
      console.warn('[Dune] Query returned no result object');
      return null;
    }

    const rawRows = response.result.rows;

    if (!rawRows.length) {
      console.warn('[Dune] Query returned no rows');
      return null;
    }

    const rows: DunePegKeeperRow[] = rawRows.map((r: any) => ({
      pool_address: String(r.pool_address ?? '').toLowerCase().trim(),
      pool_name: String(r.pool_name ?? ''),
      stablecoin: String(r.stablecoin ?? ''),
      total_tvl: Number(r.total_tvl) || 0,
      frxusd_balance: Number(r.frxusd_balance) || 0,
      volume_24h: Number(r.volume_24h) || 0,
      last_updated: parseLastUpdated(r.last_updated),
    }));

    const latestTimestamp = rows
      .map(r => new Date(r.last_updated).getTime())
      .filter(t => !isNaN(t))
      .sort((a, b) => b - a)[0];

    const lastUpdated = latestTimestamp ? new Date(latestTimestamp) : null;
    const isStale = lastUpdated ? (Date.now() - lastUpdated.getTime()) > STALE_THRESHOLD_MS : true;

    if (isStale) {
      console.warn('[Dune] Data is stale (last_updated > 4h ago)');
    } else {
      console.log(`[Dune] Fetched ${rows.length} rows, lastUpdated=${lastUpdated?.toISOString()}, isStale=${isStale}`);
    }

    return {
      rows,
      lastUpdated,
      isStale,
      source: 'dune',
    };
  } catch (error) {
    console.error('[Dune] Fetch failed:', error);
    return null;
  }
}

/**
 * Find Dune row — address-only matching for v1.
 *
 * Dune frxUSD balance data is ONLY applied to pools that have a
 * verified curvePoolAddress that exactly matches a row from the
 * scheduled Dune query.
 *
 * Stablecoin fallback is DISABLED for now.
 */
export function findDuneRowForPool(
  duneResult: DunePegKeeperResult | null,
  entry: PoolRegistryEntry
): DunePegKeeperRow | null {
  if (!duneResult?.rows?.length) return null;

  // Strict address-only match
  if (entry.curvePoolAddress) {
    const target = entry.curvePoolAddress.toLowerCase().trim();
    const match = duneResult.rows.find(r =>
      (r.pool_address || '').toLowerCase().trim() === target
    );
    if (match) return match;
  }

  // No fallback whatsoever
  return null;
}
