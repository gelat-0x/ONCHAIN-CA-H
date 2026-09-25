import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import { fetchJson } from '../lib/http.ts';
import { normSymbol } from '../lib/poolMatch.ts';
import { POOL_REGISTRY, type PoolRegistryEntry } from '../../shared/data/poolRegistry.ts';

/**
 * Stake DAO Curve strategies v2 — only the fields we care about.
 * Shape is defensive: the API may return an array, an object keyed by strategy
 * key, or `{ deployed / notDeployed / strategies: [...] }`. We normalize to a flat array.
 */
export interface StakeDaoCoin {
  symbol?: string;
  address?: string;
}
export interface StakeDaoAprDetail {
  apr?: number;
  apy?: number;
  netApr?: number;
  /** Real API shape (2026): { total, details: [...] } */
  total?: number;
  [k: string]: unknown;
}
export interface StakeDaoSidecarPool {
  id?: number;
  address?: string;
}
export interface StakeDaoStrategy {
  key?: string;
  name?: string;
  protocol?: string;
  chainId?: number;
  vault?: string;
  gaugeAddress?: string;
  lpToken?: StakeDaoCoin;
  coins?: StakeDaoCoin[];
  tradingApy?: number;
  underlyingApy?: number;
  minApr?: number;
  maxApr?: number;
  tvl?: number;
  apr?: {
    boost?: number;
    current?: StakeDaoAprDetail | number;
    projected?: StakeDaoAprDetail | number;
    onlyboost?: unknown;
  };
  onlyboost?: {
    active?: boolean;
    implementations?: Array<{ key?: string; address?: string }>;
    [k: string]: unknown;
  };
  sidecarPool?: StakeDaoSidecarPool;
}

function looksLikeStrategy(v: unknown): v is StakeDaoStrategy {
  return Boolean(
    v && typeof v === 'object' &&
    ('coins' in (v as object) || 'apr' in (v as object) || 'gaugeAddress' in (v as object)),
  );
}

function asArray(raw: unknown): StakeDaoStrategy[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return (raw as unknown[]).filter(looksLikeStrategy);
  if (typeof raw === 'object') {
    const obj = raw as Record<string, unknown>;
    // Real shape (2026): { global, deployed: Strategy[], notDeployed: Strategy[], fetched }
    const out: StakeDaoStrategy[] = [];
    for (const key of ['deployed', 'notDeployed', 'strategies', 'data']) {
      const v = obj[key];
      if (Array.isArray(v)) out.push(...(v as unknown[]).filter(looksLikeStrategy));
    }
    if (out.length) return out;
    // Last resort: any array value or strategy-shaped value.
    for (const v of Object.values(obj)) {
      if (Array.isArray(v)) out.push(...(v as unknown[]).filter(looksLikeStrategy));
      else if (looksLikeStrategy(v)) out.push(v);
    }
    return out;
  }
  return [];
}

let cache: { ts: number; data: StakeDaoStrategy[] } | null = null;
const TTL_MS = 120_000;

/**
 * Fetch Stake DAO Curve strategies on Ethereum (8s timeout — v2 payload ~880 KB).
 * Fresh cache for 2 min; on fetch failure the last good dataset is served
 * indefinitely (stale-while-error) so the boost layer never disappears.
 */
export async function fetchStakeDaoCurveStrategies(
  chainId = 1,
): Promise<StakeDaoStrategy[]> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.data;
  const raw = await fetchJson<unknown>(API_ENDPOINTS.stakeDao.curveStrategies(chainId), {
    timeout: 8_000,
  });
  const data = asArray(raw);
  if (data.length) {
    cache = { ts: Date.now(), data };
    return data;
  }
  // Fetch failed or empty response — keep serving the last good dataset.
  return cache?.data ?? [];
}

/** Pull a numeric APR out of an AprDetail (handles number or object shapes). */
function numApr(detail: StakeDaoAprDetail | number | undefined): number | undefined {
  if (detail == null) return undefined;
  if (typeof detail === 'number') return Number.isFinite(detail) ? detail : undefined;
  const cands = [detail.total, detail.apr, detail.apy, detail.netApr];
  for (const c of cands) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

/** Median maxApr/minApr across StakeDAO OnlyBoost strategies (curve/1.json). */
export const ONLYBOOST_MAX_RATIO = 2.5;

/** Estimate max OnlyBoost APR from Curve base + gauge incentives when no strategy row exists. */
export function estimateStakeDaoAprFromCurve(
  baseApr: number,
  rewardsApr?: number,
  ratio = ONLYBOOST_MAX_RATIO,
): number | undefined {
  if (rewardsApr == null || rewardsApr <= baseApr + 0.004) return undefined;
  const est = baseApr + (rewardsApr - baseApr) * ratio;
  if (!Number.isFinite(est) || est <= 0 || est > 500) return undefined;
  return +est.toFixed(2);
}

/** Per-pool Stake DAO yield search — full pair so the UI lands on the right vault. */
export function buildStakeDaoPairSearchUrl(entry: PoolRegistryEntry): string {
  const pair = `frxUSD ${entry.stablecoin}`;
  return `https://www.stakedao.org/yield?tokenFilter=usd&search=${encodeURIComponent(pair)}`;
}

/** @deprecated Prefer buildStakeDaoPairSearchUrl — stablecoin-only search is too generic. */
export function buildStakeDaoYieldSearchUrl(stablecoin: string): string {
  return `https://www.stakedao.org/yield?tokenFilter=usd&search=${encodeURIComponent(`frxUSD ${stablecoin}`)}`;
}

export function isStakeDaoStrategyUrl(url?: string): boolean {
  return Boolean(url && url.includes('/strategy?') && url.includes('vault='));
}

export function buildConvexStakeUrl(poolId: number, chain = 'ethereum'): string | undefined {
  if (!Number.isFinite(poolId) || poolId <= 0) return undefined;
  return `https://curve.convexfinance.com/stake/${chain}/${Math.round(poolId)}`;
}

export interface StakeDaoBoost {
  /** Max-boost APR available to LP stakers via Stake DAO (upper bound). */
  boostedApr: number;
  /** Realized/projected staked APR (boost applied at current stake). */
  stakedApr?: number;
  /** Trading-fee APY (base layer) as reported by Stake DAO. */
  tradingApr?: number;
  /** Curve gauge APR at min boost (base + incentives without boosting). */
  minApr?: number;
  /** Stake DAO "OnlyBoost" is available for this pool. */
  onlyBoost: boolean;
  tvl?: number;
  /** Headline APR for PegKeeper cards — realized Strategy APR. */
  displayApr?: number;
  /** Max APR ceiling for explore modal. */
  maxApr?: number;
  /** e.g. https://www.stakedao.org/strategy?protocol=curve&vault=1-0x… */
  strategyUrl?: string;
  /** Convex pool id from sidecarPool (Only Boost Convex leg). */
  convexPoolId?: number;
  /** Convex stake URL — venue only. */
  convexUrl?: string;
}

function sharedStablecoin(entry: PoolRegistryEntry): boolean {
  const stable = normSymbol(entry.stablecoin);
  return POOL_REGISTRY.filter((e) => normSymbol(e.stablecoin) === stable).length > 1;
}

/**
 * Match a PegKeeper registry entry to a Stake DAO Curve strategy.
 * Address first — two pools can share a stablecoin symbol (Alto DUSD vs dTrinity sdUSD).
 * Coin/name matching is exact-token only and skipped when the symbol is shared.
 */
export function matchStakeDaoStrategy(
  strats: StakeDaoStrategy[],
  entry: PoolRegistryEntry,
): StakeDaoStrategy | undefined {
  if (entry.curvePoolAddress) {
    const target = entry.curvePoolAddress.toLowerCase();
    const naked = target.replace(/^0x/, '');
    const byOnChain = strats.find((s) => {
      const gauge = s.gaugeAddress?.toLowerCase() ?? '';
      const lp = s.lpToken?.address?.toLowerCase() ?? '';
      const vault = typeof s.vault === 'string' ? s.vault.toLowerCase() : '';
      const key = (s.key ?? '').toLowerCase();
      return (
        gauge === target ||
        lp === target ||
        vault.includes(naked) ||
        vault.endsWith(naked) ||
        key.includes(naked)
      );
    });
    if (byOnChain) return byOnChain;
  }

  if (sharedStablecoin(entry)) return undefined;

  const stable = normSymbol(entry.stablecoin);

  const byCoins = strats.find((s) => {
    const coins = (s.coins ?? []).map((c) => normSymbol(c.symbol ?? ''));
    return coins.includes('FRXUSD') && coins.includes(stable);
  });
  if (byCoins) return byCoins;

  // Fallback: name tokens ("frxUSD/USDf" → ["FRXUSD","USDF"]) must match exactly.
  return strats.find((s) => {
    const tokens = (s.name ?? '').split(/[/+\-–—·, ]+/).map(normSymbol).filter(Boolean);
    return tokens.includes('FRXUSD') && tokens.includes(stable);
  });
}

/** Build the Stake DAO strategy page URL for a matched strategy. */
export function buildStakeDaoStrategyUrl(strategy: StakeDaoStrategy): string | undefined {
  const chainId = strategy.chainId ?? 1;
  const protocol = (strategy.protocol ?? 'curve').toLowerCase();

  let vaultParam: string | undefined;
  if (strategy.key && /^\d+-0x/i.test(strategy.key)) {
    vaultParam = strategy.key;
  } else if (strategy.vault) {
    vaultParam = strategy.vault.includes('-')
      ? strategy.vault
      : `${chainId}-${strategy.vault}`;
  } else if (strategy.gaugeAddress) {
    vaultParam = `${chainId}-${strategy.gaugeAddress}`;
  }

  if (!vaultParam) return undefined;
  return `https://www.stakedao.org/strategy?protocol=${encodeURIComponent(protocol)}&vault=${encodeURIComponent(vaultParam)}`;
}

/** Resolve boosted APR for an entry from Stake DAO strategies. */
export function resolveStakeDaoBoost(
  strats: StakeDaoStrategy[],
  entry: PoolRegistryEntry,
): StakeDaoBoost | undefined {
  const s = matchStakeDaoStrategy(strats, entry);
  if (!s) return undefined;

  const max = Number(s.maxApr);
  const projected = numApr(s.apr?.projected);
  const current = numApr(s.apr?.current);

  const okApr = (n: unknown): number | undefined => {
    const v = Number(n);
    return Number.isFinite(v) && v > 0 && v <= 1000 ? +v.toFixed(2) : undefined;
  };

  // OnlyBoost is active when the strategy exposes onlyboost.active / apr.onlyboost.
  const onlyBoost =
    s.apr?.onlyboost != null ||
    (typeof s.onlyboost === 'object' && s.onlyboost !== null
      ? (s.onlyboost.active ?? true) === true
      : s.onlyboost === true);

  // Headline = realized Strategy APR (current.total). maxApr is the ceiling.
  const displayApr = current ?? projected ?? okApr(max);
  const maxApr = okApr(max) ?? projected ?? current;
  const stakedVal = projected ?? current;
  const minVal = okApr(s.minApr);

  if (displayApr == null && !onlyBoost && minVal == null) {
    return undefined;
  }

  const sidecarId = Number(s.sidecarPool?.id);
  const convexPoolId =
    Number.isFinite(sidecarId) && sidecarId > 0 ? Math.round(sidecarId) : undefined;
  const convexUrl = convexPoolId != null ? buildConvexStakeUrl(convexPoolId) : undefined;

  return {
    boostedApr: maxApr ?? displayApr ?? 0,
    stakedApr: stakedVal != null ? +stakedVal.toFixed(2) : undefined,
    displayApr: displayApr != null ? +displayApr.toFixed(2) : undefined,
    maxApr: maxApr != null ? +maxApr.toFixed(2) : undefined,
    tradingApr: okApr(s.tradingApy),
    minApr: minVal,
    onlyBoost: Boolean(onlyBoost),
    tvl: Number.isFinite(s.tvl) ? s.tvl : undefined,
    strategyUrl: buildStakeDaoStrategyUrl(s),
    ...(convexPoolId != null ? { convexPoolId } : {}),
    ...(convexUrl ? { convexUrl } : {}),
  };
}
