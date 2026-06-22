/**
 * Curve Finance API service (v1).
 *
 * PRIMARY live data source for frxUSD PegKeeper pools.
 *
 * Multi-chain support (incremental, starting with HyperEVM):
 * - fetchCurvePools(chain?) and fetchCurveVolumes(chain?) accept optional chain from registry.
 * - CURVE_CHAIN_SLUGS maps registry 'chain' -> Curve API blockchainId.
 *   'HyperEVM' -> 'hyperliquid' (verified; contains the usdp-hyper pool at 0x0b69...).
 * - Existing Ethereum calls (no arg) remain unchanged.
 * - Data from multiple chains is fetched in parallel and flattened in the builder.
 * - Matching is strictly by curvePoolAddress (address-based, works cross-chain).
 *
 * Endpoints used:
 * - /getPools/all/{slug}
 * - /getVolumes/{slug}
 */

import { fetchJson } from '../lib/http.ts';
import type { PoolRegistryEntry } from '../../shared/data/poolRegistry.ts';

export interface CurvePoolData {
  address: string;
  tvlUsd?: number;
  apy?: number;
  // Raw for debugging and potential per-coin balance extraction (e.g. frxUSD on non-Eth)
  raw?: any;
}

export interface CurveVolumeData {
  address: string;
  volumeUsd24h?: number;
  // Raw for debugging
  raw?: any;
}

const CURVE_API = 'https://api.curve.fi/v1';

/**
 * Mapping from our registry.chain values to Curve API blockchainId slugs.
 * 
 * Verified working slugs:
 * - HyperEVM: 'hyperliquid' (API returns our exact pool: address 0x0B695b6F4c8ffc910326B0938F83Ea448B2aB735, name USDp/frxUSD)
 */
const CURVE_CHAIN_SLUGS: Record<string, string> = {
  'Ethereum': 'ethereum',
  'HyperEVM': 'hyperliquid',
  // Add future chains here as Curve support expands or we verify:
  // 'Fraxtal': 'fraxtal',
  // 'Sonic': 'sonic',
  // 'Base': 'base',
  // 'Arbitrum': 'arbitrum',
};

/**
 * Internal helper: fetch pools for a Curve slug.
 */
async function fetchCurvePoolsForSlug(slug: string): Promise<CurvePoolData[]> {
  try {
    const url = `${CURVE_API}/getPools/all/${slug}`;
    const res = await fetchJson<any>(url, { timeout: 20_000 });

    // Curve responses are often { success: true, data: { poolData: [...] } }
    const poolData = res?.data?.poolData ?? res?.poolData ?? [];

    return (poolData as any[]).map((p: any) => {
      const address = (p.address || p.pool_address || '').toLowerCase();
      const tvl = p.usdTotal ?? p.tvlUsd ?? p.tvl ?? p.usd_total ?? p.totalUsd;
      const apy = p.apy ?? p.baseApy ?? p.gaugeCrvApy?.[0] ?? p.gaugeApy;

      return {
        address,
        tvlUsd: tvl ? Number(tvl) : undefined,
        apy: apy ? Number(apy) : undefined,
        raw: p, // keep for validation/debug
      };
    }).filter(p => p.address);
  } catch (err) {
    console.warn(`[Curve] Failed to fetch /getPools/all/${slug}:`, err);
    return [];
  }
}

/**
 * Fetch all pools from Curve's unified endpoint.
 * 
 * @param chain - registry chain name (e.g. 'Ethereum', 'HyperEVM'). Defaults to Ethereum.
 */
export async function fetchCurvePools(chain: string = 'Ethereum'): Promise<CurvePoolData[]> {
  const slug = CURVE_CHAIN_SLUGS[chain] || 'ethereum';
  return fetchCurvePoolsForSlug(slug);
}

/**
 * Internal helper: fetch volumes for a Curve slug.
 *
 * Updated to correctly handle the response format used by both ethereum and hyperliquid:
 *   { success: true, data: { pools: [{ address, volumeUSD: number, ... }], ... } }
 * 
 * The previous generic parser only partially worked for hyperliquid (returning very few entries).
 */
async function fetchCurveVolumesForSlug(slug: string): Promise<CurveVolumeData[]> {
  try {
    const url = `${CURVE_API}/getVolumes/${slug}`;
    const res = await fetchJson<any>(url, { timeout: 20_000 });

    // Curve volumes response structure (observed on both ethereum and hyperliquid):
    // { success: true, data: { pools: [ { address, volumeUSD: number, ... } ], ... } }
    // We prioritize data.pools for multi-chain compatibility.
    const raw = res?.data?.pools ?? res?.data ?? res?.volumes ?? res ?? [];
    const volData = Array.isArray(raw) ? raw : [];

    const volumes: CurveVolumeData[] = [];

    for (const v of volData) {
      const addr = (v.address || v.pool || v.pool_address || '').toLowerCase();
      // volumeUSD is the field used by Curve for 24h volume on hyperliquid and ethereum
      const vol = v.volumeUSD ?? v.volumeUsd ?? v.volume ?? v.volume_usd ?? v.usdVolume ?? (v as any)?.volumeUSD;
      if (addr) {
        volumes.push({
          address: addr,
          volumeUsd24h: vol != null ? Number(vol) : undefined,
          raw: v,
        });
      }
    }

    return volumes;
  } catch (err) {
    console.warn(`[Curve] Failed to fetch /getVolumes/${slug}:`, err);
    return [];
  }
}

/**
 * Fetch 24h volumes from official Curve endpoint.
 * 
 * @param chain - registry chain name. Defaults to Ethereum.
 */
export async function fetchCurveVolumes(chain: string = 'Ethereum'): Promise<CurveVolumeData[]> {
  const slug = CURVE_CHAIN_SLUGS[chain] || 'ethereum';
  return fetchCurveVolumesForSlug(slug);
}

/**
 * Match a pool by curvePoolAddress (exact).
 * Returns the pool data if found.
 * 
 * Note: Now works for any chain because dashboard fetches per-chain data and flattens.
 */
export function matchCurvePool(
  curvePools: CurvePoolData[],
  entry: PoolRegistryEntry
): CurvePoolData | null {
  if (!entry.curvePoolAddress || !curvePools.length) return null;

  const target = entry.curvePoolAddress.toLowerCase();
  const match = curvePools.find(p => p.address === target);
  return match ?? null;
}

/**
 * Match volume data by curvePoolAddress.
 */
export function matchCurveVolume(
  curveVolumes: CurveVolumeData[],
  entry: PoolRegistryEntry
): CurveVolumeData | null {
  if (!entry.curvePoolAddress || !curveVolumes.length) return null;

  const target = entry.curvePoolAddress.toLowerCase();
  return curveVolumes.find(v => v.address === target) ?? null;
}
