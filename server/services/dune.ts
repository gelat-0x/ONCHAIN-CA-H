/**
 * Dune Analytics integration stub.
 *
 * 1. Copy .env.example → .env and set DUNE_API_KEY
 * 2. Set pegkeeperQueryId in shared/constants/apiEndpoints.ts
 * 3. Implement fetchPegKeeperPools() below
 *
 * @see docs/API_INTEGRATION.md#dune-analytics
 */

import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import { envOptional, ENV } from '../config/env.ts';
import { fetchJson } from '../lib/http.ts';

export function isDuneConfigured(): boolean {
  return Boolean(envOptional(ENV.DUNE_API_KEY) && API_ENDPOINTS.dune.pegkeeperQueryId);
}

/** TODO: Replace static Dune fallbacks in shared/data/poolRegistry.ts with live query results */
export async function fetchDunePegKeeperData(): Promise<unknown | null> {
  const apiKey = envOptional(ENV.DUNE_API_KEY);
  const queryId = API_ENDPOINTS.dune.pegkeeperQueryId;
  if (!apiKey || !queryId) return null;

  return fetchJson(`${API_ENDPOINTS.dune.base}/query/${queryId}/results`, 15000);
}
