import type { DefiLlamaYieldPool } from '../../shared/types/index.ts';
import { POOL_REGISTRY, type PoolRegistryEntry } from '../../shared/data/poolRegistry.ts';

export function normSymbol(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function sharedStablecoin(entry: PoolRegistryEntry): boolean {
  const stable = normSymbol(entry.stablecoin);
  return POOL_REGISTRY.filter((e) => normSymbol(e.stablecoin) === stable).length > 1;
}

/** Pick APR: Curve /getVolumes daily APY first, then pool list, then DefiLlama (no address only). */
export function pickCurvePoolApr(
  volumeApy?: number,
  listApy?: number,
  dlApy?: number,
): number | undefined {
  // 0 is treated as "no signal" so rewards/gauge APY can surface as a fallback.
  const ok = (n?: number) => n != null && Number.isFinite(n) && n > 0 && n <= 500;
  if (ok(volumeApy)) return +volumeApy!.toFixed(2);
  if (ok(listApy)) return +listApy!.toFixed(2);
  if (ok(dlApy)) return +dlApy!.toFixed(2);
  return undefined;
}

/** @deprecated Use pickCurvePoolApr — kept for callers passing only list + DL. */
export function pickPoolApr(curveApy?: number, dlApy?: number): number | undefined {
  return pickCurvePoolApr(undefined, curveApy, dlApy);
}

/** Best APY from a DefiLlama Curve pool row. */
export function parseDefiLlamaApy(pool?: DefiLlamaYieldPool): number | undefined {
  if (!pool) return undefined;
  const base = pool.apyBase ?? 0;
  const reward = pool.apyReward ?? 0;
  const combined = base + reward;
  const candidates = [pool.apy, combined > 0 ? combined : undefined];
  for (const c of candidates) {
    const n = Number(c);
    if (Number.isFinite(n) && n > 0 && n <= 500) return +n.toFixed(2);
  }
  return undefined;
}

/** Match a DefiLlama Curve pool to registry dlSymbols */
export function matchDefiLlamaPool(
  pools: DefiLlamaYieldPool[],
  symbols: string[],
): DefiLlamaYieldPool | undefined {
  const exact = pools.find((p) => {
    if (p.project !== 'curve-dex') return false;
    const sym = normSymbol(p.symbol);
    return symbols.some((m) => normSymbol(m) === sym);
  });
  if (exact) return exact;

  const normalized = symbols.map(normSymbol);
  return pools.find((p) => {
    if (p.project !== 'curve-dex') return false;
    const sym = normSymbol(p.symbol);
    return normalized.some((m) => sym.includes(m) || m.includes(sym));
  });
}

/** Flexible match when dlSymbols miss (stablecoin name in pool symbol). */
export function matchDefiLlamaPoolForEntry(
  pools: DefiLlamaYieldPool[],
  entry: PoolRegistryEntry,
): DefiLlamaYieldPool | undefined {
  const byAddress = matchDefiLlamaByAddress(pools, entry.curvePoolAddress);
  if (byAddress) return byAddress;
  if (sharedStablecoin(entry)) return undefined;

  const bySymbols = matchDefiLlamaPool(pools, entry.dlSymbols);
  if (bySymbols) return bySymbols;

  const stable = normSymbol(entry.stablecoin);
  const alt = normSymbol(entry.name.split('/')[1]?.trim() ?? '');

  return pools.find((p) => {
    if (p.project !== 'curve-dex') return false;
    const sym = normSymbol(p.symbol);
    if (!sym.includes('FRXUSD')) return false;
    return sym.includes(stable) || (alt.length > 2 && sym.includes(alt));
  });
}

/** Match DefiLlama pool row by Curve pool contract address embedded in pool id. */
export function matchDefiLlamaByAddress(
  pools: DefiLlamaYieldPool[],
  address?: string,
): DefiLlamaYieldPool | undefined {
  if (!address) return undefined;
  const target = address.toLowerCase().replace(/^0x/, '');
  return pools.find((p) => {
    if (p.project !== 'curve-dex') return false;
    const pid = (p.pool ?? '').toLowerCase();
    return pid.includes(target);
  });
}

/** True when a DefiLlama row is a Stake DAO strategy vault (not raw Curve). */
export function isStakeDaoYieldProject(project?: string): boolean {
  const p = (project ?? '').toLowerCase().replace(/[\s_-]/g, '');
  return p === 'stakedao' || p.includes('stakedao');
}

/**
 * Match a PegKeeper pool to its Stake DAO vault row on DefiLlama yields.
 * Used when stakedao.org/api has no strategy row but the vault is live on-chain.
 */
export function matchDefiLlamaStakeDaoPool(
  pools: DefiLlamaYieldPool[],
  entry: PoolRegistryEntry,
): DefiLlamaYieldPool | undefined {
  if (entry.curvePoolAddress) {
    const target = entry.curvePoolAddress.toLowerCase().replace(/^0x/, '');
    const byAddr = pools.find((p) => {
      if (!isStakeDaoYieldProject(p.project)) return false;
      const pid = (p.pool ?? '').toLowerCase();
      return pid.includes(target);
    });
    if (byAddr) return byAddr;
  }

  if (sharedStablecoin(entry)) return undefined;

  const stable = normSymbol(entry.stablecoin);
  const alt = normSymbol(entry.name.split('/')[1]?.trim() ?? '');

  const byStable = pools.find((p) => {
    if (!isStakeDaoYieldProject(p.project)) return false;
    const sym = normSymbol(p.symbol);
    if (!sym.includes('FRXUSD')) return false;
    return sym.includes(stable) || (alt.length > 2 && sym.includes(alt));
  });
  if (byStable) return byStable;

  for (const dlSym of entry.dlSymbols) {
    const target = normSymbol(dlSym);
    const hit = pools.find(
      (p) => isStakeDaoYieldProject(p.project) && normSymbol(p.symbol) === target,
    );
    if (hit) return hit;
  }

  return undefined;
}
