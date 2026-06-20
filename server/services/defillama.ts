import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import type { DefiLlamaStablecoin, DefiLlamaYieldPool } from '../../shared/types/index.ts';
import { fetchJson } from '../lib/http.ts';

export async function fetchDefiLlamaYields(): Promise<DefiLlamaYieldPool[]> {
  const res = await fetchJson<{ data?: DefiLlamaYieldPool[] }>(API_ENDPOINTS.defiLlama.yields);
  return res?.data ?? [];
}

export async function fetchDefiLlamaStablecoins(): Promise<DefiLlamaStablecoin[]> {
  const res = await fetchJson<{ peggedAssets?: DefiLlamaStablecoin[] }>(
    API_ENDPOINTS.defiLlama.stablecoins,
  );
  return res?.peggedAssets ?? [];
}

export function findFrxUsdAsset(assets: DefiLlamaStablecoin[]): DefiLlamaStablecoin | undefined {
  return assets.find((a) => a.symbol === 'FRXUSD');
}
