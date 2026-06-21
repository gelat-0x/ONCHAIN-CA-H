/**
 * Curve Finance API service (v1).
 *
 * PRIMARY live data source for frxUSD PegKeeper pools.
 *
 * Endpoints used:
 * - /getPools/all/ethereum   (preferred - covers all registries)
 * - /getVolumes/ethereum     (official volume data)
 *
 * Matching is strictly by curvePoolAddress from poolRegistry.
 */

import { fetchJson } from '../lib/http.ts';
import type { PoolRegistryEntry } from '../../shared/data/poolRegistry.ts';

export interface CurvePoolData {
  address: string;
  tvlUsd?: number;
  apy?: number;
  // Raw for debugging
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
 * Fetch all pools from Curve's unified endpoint.
 * This is preferred over individual registries because PegKeeper pools
 * may live in different factories/registries.
 */
export async function fetchCurvePools(): Promise<CurvePoolData[]> {
  try {
    const url = `${CURVE_API}/getPools/all/ethereum`;
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
    console.warn('[Curve] Failed to fetch /getPools/all/ethereum:', err);
    return [];
  }
}

/**
 * Fetch 24h volumes from official Curve endpoint.
 */
export async function fetchCurveVolumes(): Promise<CurveVolumeData[]> {
  try {
    const url = `${CURVE_API}/getVolumes/ethereum`;
    const res = await fetchJson<any>(url, { timeout: 20_000 });

    // Volumes are often under data or directly an array
    const volData = res?.data ?? res?.volumes ?? res ?? [];

    const volumes: CurveVolumeData[] = [];

    // Curve volumes can be an object keyed by address or an array
    if (Array.isArray(volData)) {
      for (const v of volData) {
        const addr = (v.address || v.pool || v.pool_address || '').toLowerCase();
        const vol = v.volumeUSD ?? v.volumeUsd ?? v.volume ?? v.volume_usd ?? v.usdVolume;
        if (addr) {
          volumes.push({
            address: addr,
            volumeUsd24h: vol ? Number(vol) : undefined,
            raw: v,
          });
        }
      }
    } else if (typeof volData === 'object') {
      for (const [addr, v] of Object.entries(volData)) {
        const vol = (v as any)?.volumeUSD ?? (v as any)?.volumeUsd ?? (v as any)?.volume;
        volumes.push({
          address: addr.toLowerCase(),
          volumeUsd24h: vol ? Number(vol) : undefined,
          raw: v,
        });
      }
    }

    return volumes;
  } catch (err) {
    console.warn('[Curve] Failed to fetch /getVolumes/ethereum:', err);
    return [];
  }
}

/**
 * Match a pool by curvePoolAddress (exact).
 * Returns the pool data if found.
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

