/**
 * Curve Finance API service (v1).
 *
 * PRIMARY live data source for frxUSD PegKeeper pools.
 *
 * Multi-chain support (HyperEVM via hyperliquid slug):
 * - fetchCurvePools(chain?) and fetchCurveVolumes(chain?) accept registry chain names.
 * - Matching remains address-based across flattened multi-chain results.
 *
 * Endpoints used:
 * - /getPools/all/{slug}
 * - /getVolumes/{slug}
 *
 * Matching is strictly by curvePoolAddress from poolRegistry.
 */

import { fetchJson } from '../lib/http.ts';
import { normalizeUsd } from '../lib/sanitize.ts';
import { POOL_REGISTRY, type PoolRegistryEntry } from '../../shared/data/poolRegistry.ts';

export interface CurvePoolData {
  address: string;
  tvlUsd?: number;
  apy?: number;
  /** Current frxUSD-side liquidity, valued with Curve's live coin USD price. */
  frxUsdBalanceUsd?: number;
  /** frxUSD-side liquidity as a percentage of the full Curve pool TVL. */
  frxUsdSharePct?: number;
  /**
   * Curve UI "Base APY" % (trading fees). From /getVolumes latestDailyApyPcent when available.
   */
  baseApy?: number;
  /**
   * Curve UI-style total APY % at max boost (Base APY + daily-compounded CRV max + extras).
   * Matches the bold Total APY on curve.finance pool pages.
   */
  totalApyMax?: number;
  /** Curve UI-style total APY % at min/unboosted gauge rewards. */
  totalApyMin?: number;
  /**
   * APR-equivalent of Curve Total APY (max boost), converting daily-compound APY → APR.
   * This is what PegKeeper cards should show as "Curve total APR".
   */
  totalAprMax?: number;
  /** APR-equivalent of Curve unboosted Total APY. */
  totalAprMin?: number;
  /**
   * Legacy: min-boost CRV+extras as daily-compounded APY points (not including base).
   * Prefer totalApyMin / totalAprMax for display.
   */
  incentivesApy?: number;
  // Raw for debugging
  raw?: any;
}

export interface CurveVolumeData {
  address: string;
  volumeUsd24h?: number;
  /** 24h base APY % — matches Curve pool page (from /getVolumes). */
  latestDailyApyPcent?: number;
  latestWeeklyApyPcent?: number;
  raw?: any;
}

const CURVE_API = 'https://api.curve.fi/v1';
const CURVE_PRICES_API = 'https://prices.curve.finance/v1';

/** Exact frxUSD token addresses used to identify the pool side safely. */
const FRXUSD_BY_CURVE_SLUG: Record<string, string> = {
  ethereum: '0xcacd6fd266af91b8aed52accc382b4e165586e29',
  hyperliquid: '0x80eede496655fb9047dd39d9f418d5483ed600df',
};

/** Registry.chain → Curve API blockchainId slug. */
const CURVE_CHAIN_SLUGS: Record<string, string> = {
  Ethereum: 'ethereum',
  HyperEVM: 'hyperliquid',
};

function curveSlugForChain(chain = 'Ethereum'): string {
  return CURVE_CHAIN_SLUGS[chain] ?? 'ethereum';
}

/** Parse Curve's raw `coins[].poolBalance` using exact frxUSD address matching. */
export function parseCurveFrxUsdComposition(
  raw: Record<string, unknown>,
  slug: string,
  tvlUsd?: number,
): { frxUsdBalanceUsd?: number; frxUsdSharePct?: number } {
  const target = FRXUSD_BY_CURVE_SLUG[slug];
  if (!target || !Array.isArray(raw.coins)) return {};

  const coin = raw.coins.find((candidate) => {
    if (!candidate || typeof candidate !== 'object') return false;
    const address = String((candidate as Record<string, unknown>).address ?? '').toLowerCase();
    return address === target;
  }) as Record<string, unknown> | undefined;

  if (!coin) return {};
  const decimals = Number(coin.decimals);
  const rawBalance = Number(coin.poolBalance);
  const usdPrice = Number(coin.usdPrice);
  if (
    !Number.isInteger(decimals) ||
    decimals < 0 ||
    decimals > 36 ||
    !Number.isFinite(rawBalance) ||
    rawBalance < 0 ||
    !Number.isFinite(usdPrice) ||
    usdPrice <= 0
  ) {
    return {};
  }

  const balanceUsd = (rawBalance / 10 ** decimals) * usdPrice;
  if (!Number.isFinite(balanceUsd) || balanceUsd < 0 || balanceUsd > 100_000_000) return {};

  const frxUsdBalanceUsd = Math.round(balanceUsd);
  const share = tvlUsd && tvlUsd > 0 ? (balanceUsd / tvlUsd) * 100 : undefined;
  const frxUsdSharePct =
    share != null && Number.isFinite(share) && share >= 0 && share <= 100.5
      ? +Math.min(100, share).toFixed(2)
      : undefined;

  return {
    frxUsdBalanceUsd,
    ...(frxUsdSharePct != null ? { frxUsdSharePct } : {}),
  };
}

/**
 * Curve percent already in human units (e.g. latestDailyApyPcent=0.96, gaugeCrvApy=17.3).
 * Do NOT treat sub-1 values as fractions — fee APYs are often below 1%.
 */
function normalizePercentPoints(v: unknown): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0 || n > 500) return undefined;
  return n;
}

/**
 * Curve/Prices fields that are true fractions (e.g. base_daily_apr=0.00956 → 0.956%).
 * Values already > 1 are treated as percent points.
 */
function normalizeFractionAsPercent(v: unknown): number | undefined {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  const pct = n <= 1 ? n * 100 : n;
  if (pct > 500) return undefined;
  return pct;
}

/**
 * Curve UI compounds gauge CRV "APR" into APY with daily compounding:
 * APY = (1 + APR/365)^365 - 1
 * Empirically matches curve.finance CRV rows (e.g. 17.29% → ~18.87% APY).
 */
export function curveAprToApyDaily(aprPct: number): number {
  if (!Number.isFinite(aprPct) || aprPct <= 0) return 0;
  if (aprPct > 500) return aprPct;
  const r = aprPct / 100;
  return ((1 + r / 365) ** 365 - 1) * 100;
}

/** Inverse of daily-compound APY → simple APR (site cards label APR, Curve UI shows APY). */
export function curveApyToAprDaily(apyPct: number): number {
  if (!Number.isFinite(apyPct) || apyPct <= 0) return 0;
  if (apyPct > 500) return apyPct;
  const r = apyPct / 100;
  return ((1 + r) ** (1 / 365) - 1) * 365 * 100;
}

function roundPct(n: number): number {
  return +n.toFixed(2);
}

/** Parse CRV gauge APR range + extra reward APYs from a raw Curve pool/gauge payload. */
export function parseCurveGaugeAprParts(raw: Record<string, unknown> | undefined): {
  crvMinApr?: number;
  crvMaxApr?: number;
  extrasApy?: number;
} {
  if (!raw || typeof raw !== 'object') return {};

  let crvMinApr: number | undefined;
  let crvMaxApr: number | undefined;
  const gauge = raw.gaugeCrvApy;
  if (Array.isArray(gauge)) {
    crvMinApr = normalizePercentPoints(gauge[0]);
    crvMaxApr =
      gauge.length >= 2 ? normalizePercentPoints(gauge[gauge.length - 1]) : crvMinApr;
  } else if (gauge && typeof gauge === 'object') {
    const g = gauge as Record<string, unknown>;
    crvMinApr = normalizePercentPoints(g.min ?? g.total);
    crvMaxApr = normalizePercentPoints(g.max ?? g.min ?? g.total);
  } else {
    crvMinApr = normalizePercentPoints(gauge);
    crvMaxApr = crvMinApr;
  }

  let extrasApy = 0;
  const rewards = raw.gaugeRewardsApy ?? raw.gaugeRewards;
  if (Array.isArray(rewards)) {
    for (const r of rewards) {
      const apy = normalizePercentPoints(
        r && typeof r === 'object' ? (r as Record<string, unknown>).apy : r,
      );
      if (apy != null) extrasApy += apy;
    }
  } else if (rewards != null && typeof rewards !== 'object') {
    extrasApy += normalizePercentPoints(rewards) ?? 0;
  }

  return {
    ...(crvMinApr != null ? { crvMinApr } : {}),
    ...(crvMaxApr != null ? { crvMaxApr } : {}),
    ...(extrasApy > 0 ? { extrasApy: roundPct(extrasApy) } : {}),
  };
}

/**
 * Build Curve UI yield breakdown for a pool.
 * - Base APY: volumes latestDailyApyPcent (matches Base APY on the pool page)
 * - CRV rows: API gaugeCrvApy is APR → daily-compound to APY
 * - Total APY: base + CRV APY + extra reward APYs (matches Total APY on the pool page)
 * - Card APR: convert those APYs back to APR (no autocompound in the label)
 */
export function buildCurveUiYield(
  raw: Record<string, unknown> | undefined,
  volumeBaseApy?: number,
): {
  baseApy?: number;
  totalApyMin?: number;
  totalApyMax?: number;
  baseApr?: number;
  totalAprMin?: number;
  totalAprMax?: number;
  /** Min-boost CRV+extras APY points only (legacy incentives field). */
  incentivesApy?: number;
} {
  const baseApy =
    normalizePercentPoints(volumeBaseApy) ??
    parseCurveBaseApy(raw) ??
    undefined;

  const { crvMinApr, crvMaxApr, extrasApy = 0 } = parseCurveGaugeAprParts(raw);
  const crvMinApy = crvMinApr != null ? curveAprToApyDaily(crvMinApr) : 0;
  const crvMaxApy = crvMaxApr != null ? curveAprToApyDaily(crvMaxApr) : crvMinApy;
  const base = baseApy ?? 0;

  const totalApyMin =
    base > 0 || crvMinApy > 0 || extrasApy > 0
      ? roundPct(base + crvMinApy + extrasApy)
      : undefined;
  const totalApyMax =
    base > 0 || crvMaxApy > 0 || extrasApy > 0
      ? roundPct(base + crvMaxApy + extrasApy)
      : undefined;

  const incentivesApy =
    crvMinApy + extrasApy > 0 ? roundPct(crvMinApy + extrasApy) : undefined;

  return {
    ...(baseApy != null ? { baseApy: roundPct(baseApy) } : {}),
    ...(totalApyMin != null && totalApyMin > 0 ? { totalApyMin } : {}),
    ...(totalApyMax != null && totalApyMax > 0 ? { totalApyMax } : {}),
    ...(baseApy != null && baseApy > 0
      ? { baseApr: roundPct(curveApyToAprDaily(baseApy)) }
      : {}),
    ...(totalApyMin != null && totalApyMin > 0
      ? { totalAprMin: roundPct(curveApyToAprDaily(totalApyMin)) }
      : {}),
    ...(totalApyMax != null && totalApyMax > 0
      ? { totalAprMax: roundPct(curveApyToAprDaily(totalApyMax)) }
      : {}),
    ...(incentivesApy != null ? { incentivesApy } : {}),
  };
}

/** Parse best available APY from Curve pool list/detail payload. */
export function parseCurveApy(p: Record<string, unknown>): number | undefined {
  const pickPct = (v: unknown): number | undefined => normalizePercentPoints(v);

  // Prefer daily/weekly base APY (aligned with Curve UI) over legacy `apy`.
  // *Pcent / gauge fields are already percent points (0.96 means 0.96%).
  const direct =
    pickPct(p.latestDailyApyPcent) ??
    pickPct(p.latestDailyApy) ??
    pickPct(p.latestWeeklyApyPcent) ??
    pickPct(p.latestWeeklyApy) ??
    pickPct(p.totalApy) ??
    pickPct(p.baseDailyApy) ??
    pickPct(p.apy) ??
    pickPct(p.boostedApy) ??
    pickPct(p.gaugeApy);

  if (direct != null && direct >= 0) return direct;

  const base = pickPct(p.baseApy);
  const reward =
    pickPct(p.rewardsApy) ??
    pickPct(p.crvApy) ??
    pickPct(p.extraRewardsApy) ??
    (Array.isArray(p.gaugeCrvApy)
      ? pickPct((p.gaugeCrvApy as unknown[])[0])
      : pickPct((p.gaugeCrvApy as Record<string, unknown> | undefined)?.total));

  if (base != null && base >= 0) return base + Math.max(reward ?? 0, 0);

  return reward != null && reward >= 0 ? reward : undefined;
}

/** Headline pool APY: trading fees + gauge token rewards (e.g. WFRAX on HyperEVM). */
export function parseCurveHeadlineApy(p: Record<string, unknown>): number | undefined {
  const direct = parseCurveApy(p);
  if (direct != null && direct > 0) return direct;

  const base = parseCurveBaseApy(p) ?? 0;
  const gauge = parseCurveGaugeApy(p);
  if (gauge != null && gauge > 0) {
    const total = base + gauge;
    return total > 0 ? +total.toFixed(2) : undefined;
  }
  return undefined;
}

/** Parse trading-fee / base APY only (excludes CRV gauge incentives). */
export function parseCurveBaseApy(raw: Record<string, unknown> | undefined): number | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const pick = (v: unknown): number | undefined => normalizePercentPoints(v);
  return (
    pick(raw.latestDailyApyPcent) ??
    pick(raw.latestDailyApy) ??
    pick(raw.baseDailyApy) ??
    pick(raw.baseApy) ??
    undefined
  );
}

/**
 * CRV gauge incentives as daily-compounded APY points at min boost (excluding base fees).
 * `gaugeCrvApy` from Curve API is APR; Curve UI shows the compounded APY.
 */
export function parseCurveGaugeApy(raw: Record<string, unknown> | undefined): number | undefined {
  const { incentivesApy } = buildCurveUiYield(raw);
  return incentivesApy;
}

/** Max-boost Curve total APR (APY→APR), aligned with Curve UI Total APY then de-compounded. */
export function parseCurveMaxBoostApr(
  raw: Record<string, unknown> | undefined,
  baseApy = 0,
): number | undefined {
  const y = buildCurveUiYield(raw, baseApy > 0 ? baseApy : undefined);
  return y.totalAprMax;
}

/** Base APY from /getVolumes row — primary source for PegKeeper pool cards. */
export function parseCurveVolumeApy(vol?: CurveVolumeData | null): number | undefined {
  if (!vol) return undefined;
  const daily = vol.latestDailyApyPcent;
  const weekly = vol.latestWeeklyApyPcent;

  const pick = (n: number): number | undefined => {
    if (!Number.isFinite(n) || n < 0 || n > 500) return undefined;
    return +n.toFixed(2);
  };

  if (daily != null && Number.isFinite(daily) && daily > 0) return pick(daily);
  if (weekly != null && Number.isFinite(weekly) && weekly > 0) return pick(weekly);
  return undefined;
}

/**
 * Fetch all pools from Curve's unified endpoint for a chain slug.
 */
async function fetchCurvePoolsForSlug(slug: string): Promise<CurvePoolData[]> {
  try {
    const url = `${CURVE_API}/getPools/all/${slug}`;
    const res = await fetchJson<any>(url, { timeout: 20_000 });

    const poolData = res?.data?.poolData ?? res?.poolData ?? [];

    return (poolData as any[]).map((p: any) => {
      const address = (p.address || p.pool_address || '').toLowerCase();
      const tvl = p.usdTotal ?? p.tvlUsd ?? p.tvl ?? p.usd_total ?? p.totalUsd;
      const tvlUsd = normalizeUsd(tvl);
      const yieldUi = buildCurveUiYield(p);
      const incentivesApy = yieldUi.incentivesApy;
      const apy = yieldUi.totalApyMax ?? parseCurveHeadlineApy(p);
      const composition = parseCurveFrxUsdComposition(p, slug, tvlUsd);

      return {
        address,
        tvlUsd,
        apy,
        baseApy: yieldUi.baseApy,
        totalApyMax: yieldUi.totalApyMax,
        totalApyMin: yieldUi.totalApyMin,
        totalAprMax: yieldUi.totalAprMax,
        totalAprMin: yieldUi.totalAprMin,
        incentivesApy,
        ...composition,
        raw: p,
      };
    }).filter(p => p.address);
  } catch (err) {
    console.warn(`[Curve] Failed to fetch /getPools/all/${slug}:`, err);
    return [];
  }
}

/**
 * Fetch all pools from Curve's unified endpoint.
 * @param chain - registry chain name (defaults to Ethereum).
 */
export async function fetchCurvePools(chain = 'Ethereum'): Promise<CurvePoolData[]> {
  return fetchCurvePoolsForSlug(curveSlugForChain(chain));
}

/**
 * Fetch 24h volumes from official Curve endpoint.
 */
function pushCurveVolumeRow(volumes: CurveVolumeData[], v: Record<string, unknown>): void {
  const addr = String(v.address ?? v.pool ?? v.pool_address ?? '').toLowerCase();
  if (!addr.startsWith('0x')) return;
  const vol = v.volumeUSD ?? v.volumeUsd ?? v.volume ?? v.volume_usd ?? v.usdVolume;
  const daily = Number(v.latestDailyApyPcent ?? v.latestDailyApy);
  const weekly = Number(v.latestWeeklyApyPcent ?? v.latestWeeklyApy);
  volumes.push({
    address: addr,
    volumeUsd24h: normalizeUsd(vol),
    latestDailyApyPcent: Number.isFinite(daily) ? daily : undefined,
    latestWeeklyApyPcent: Number.isFinite(weekly) ? weekly : undefined,
    raw: v,
  });
}

async function fetchCurveVolumesForSlug(slug: string): Promise<CurveVolumeData[]> {
  try {
    const url = `${CURVE_API}/getVolumes/${slug}`;
    const res = await fetchJson<any>(url, { timeout: 20_000 });

    const volumes: CurveVolumeData[] = [];
    const data = res?.data;

    const poolRows = data?.pools;
    if (Array.isArray(poolRows)) {
      for (const v of poolRows) {
        if (v && typeof v === 'object') pushCurveVolumeRow(volumes, v as Record<string, unknown>);
      }
      return volumes;
    }

    const volData = data ?? res?.volumes ?? res ?? [];

    if (Array.isArray(volData)) {
      for (const v of volData) {
        if (v && typeof v === 'object') pushCurveVolumeRow(volumes, v as Record<string, unknown>);
      }
    } else if (typeof volData === 'object' && volData) {
      for (const [addr, v] of Object.entries(volData)) {
        if (addr === 'pools') continue;
        if (v && typeof v === 'object') {
          pushCurveVolumeRow(volumes, { address: addr, ...(v as Record<string, unknown>) });
        }
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
 * @param chain - registry chain name (defaults to Ethereum).
 */
export async function fetchCurveVolumes(chain = 'Ethereum'): Promise<CurveVolumeData[]> {
  return fetchCurveVolumesForSlug(curveSlugForChain(chain));
}

/**
 * Match a pool by curvePoolAddress (exact), then by pool coin symbols.
 */
export function matchCurvePool(
  curvePools: CurvePoolData[],
  entry: PoolRegistryEntry
): CurvePoolData | null {
  if (!curvePools.length) return null;

  if (entry.curvePoolAddress) {
    const target = entry.curvePoolAddress.toLowerCase();
    const byAddr = curvePools.find((p) => p.address === target);
    if (byAddr) return byAddr;
    const stable = entry.stablecoin.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const shared = POOL_REGISTRY.filter(
      (e) => e.stablecoin.toUpperCase().replace(/[^A-Z0-9]/g, '') === stable,
    ).length > 1;
    if (shared) return null;
  }

  const stableNorm = entry.stablecoin.toLowerCase().replace(/[^a-z0-9]/g, '');
  const byCoins = curvePools.find((p) => {
    const raw = (p.raw ?? {}) as Record<string, unknown>;
    const symbols: string[] = [];
    const coins = raw.coins;
    if (Array.isArray(coins)) {
      for (const c of coins) {
        if (typeof c === 'string') symbols.push(c);
        else if (c && typeof c === 'object') {
          const coin = c as Record<string, unknown>;
          if (typeof coin.symbol === 'string') symbols.push(coin.symbol);
          if (typeof coin.name === 'string') symbols.push(coin.name);
        }
      }
    }
    const normalized = symbols.map((s) => s.toLowerCase().replace(/[^a-z0-9]/g, ''));
    const hasFrx = normalized.some((s) => s.includes('frxusd'));
    const hasStable = normalized.some((s) => s === stableNorm || s.includes(stableNorm));
    return hasFrx && hasStable;
  });

  return byCoins ?? null;
}

/** Fetch base APY from Curve Prices API (fallback for pools missing from /getVolumes). */
export async function fetchCurvePricesPoolApy(
  address: string,
  chain?: string,
): Promise<number | undefined> {
  if (!address) return undefined;
  const slug = curveSlugForChain(chain);
  try {
    const url = `${CURVE_PRICES_API}/pools/${slug}/${address.toLowerCase()}`;
    const res = await fetchJson<Record<string, unknown>>(url, { timeout: 12_000 });
    if (!res) return undefined;
    const daily = normalizeFractionAsPercent(res.base_daily_apr);
    if (daily != null && daily >= 0) return daily;
    const weekly = normalizeFractionAsPercent(res.base_weekly_apr);
    if (weekly != null && weekly >= 0) return weekly;
    return undefined;
  } catch {
    return undefined;
  }
}

/** Fetch a single pool APY (Prices API, then legacy pool detail). */
export async function fetchCurvePoolApy(
  address: string,
  chain?: string,
): Promise<number | undefined> {
  const fromPrices = await fetchCurvePricesPoolApy(address, chain);
  if (fromPrices != null) return fromPrices;

  const detail = await fetchCurvePoolDetail(address, chain);
  return detail?.apy;
}

export interface CurvePoolDetail {
  address: string;
  tvlUsd?: number;
  apy?: number;
}

/** Fetch full pool row from Curve detail endpoint (TVL + APY). */
export async function fetchCurvePoolDetail(
  address: string,
  chain?: string,
): Promise<CurvePoolDetail | undefined> {
  if (!address) return undefined;
  const slug = curveSlugForChain(chain);
  try {
    const url = `${CURVE_API}/getPool/${slug}/${address.toLowerCase()}`;
    const res = await fetchJson<Record<string, unknown>>(url, { timeout: 12_000 });
    const data = res?.data;
    const row =
      (data as Record<string, unknown> | undefined)?.poolData ??
      (Array.isArray(data) ? (data[0] as Record<string, unknown>) : (data as Record<string, unknown>)) ??
      (res as Record<string, unknown>);
    if (!row || typeof row !== 'object') return undefined;
    const pool = row as Record<string, unknown>;
    const addr = String(pool.address ?? pool.pool_address ?? address).toLowerCase();
    const tvl = pool.usdTotal ?? pool.tvlUsd ?? pool.tvl ?? pool.usd_total;
    return {
      address: addr,
      tvlUsd: normalizeUsd(tvl),
      apy: parseCurveApy(pool),
    };
  } catch {
    return undefined;
  }
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

