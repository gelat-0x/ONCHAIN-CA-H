import type { PoolData } from '../types';

export type PoolTagKind = 'top-gainer' | 'largest' | 'new';

export interface PoolTag {
  kind: PoolTagKind;
  label: string;
}

const MIN_TVL_FOR_GAINER = 250_000;
const NEW_DAYS = 60;

function sinceAgeDays(since?: string): number | null {
  if (!since) return null;
  const t = Date.parse(since.length === 7 ? `${since}-01` : since);
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / 86_400_000;
}

/**
 * Satisfying labels for PegKeeper cards.
 * - Top gainer: exactly one pool with live 7d TVL history, TVL ≥ $250k, highest positive change
 * - Largest: highest TVL pool
 * - New: pool listed within the last 60 days
 */
export function assignPoolTags(pools: PoolData[]): Map<string, PoolTag[]> {
  const map = new Map<string, PoolTag[]>();
  const push = (id: string, tag: PoolTag) => {
    const list = map.get(id) ?? [];
    list.push(tag);
    map.set(id, list);
  };

  if (pools.length === 0) return map;

  let largest: PoolData | null = null;
  for (const p of pools) {
    if (!largest || p.tvl > largest.tvl) largest = p;
  }
  if (largest && largest.tvl > 0) {
    push(largest.id, { kind: 'largest', label: 'Largest' });
  }

  let topGainer: PoolData | null = null;
  let topChange = 0;
  for (const p of pools) {
    if (!p.tvlHistoryLive) continue;
    if (p.tvl < MIN_TVL_FOR_GAINER) continue;
    const change = p.tvlChange7dPct;
    if (change == null || !Number.isFinite(change) || change <= 0) continue;
    if (change > topChange) {
      topChange = change;
      topGainer = p;
    }
  }
  if (topGainer) {
    const pct = topChange >= 10 ? topChange.toFixed(0) : topChange.toFixed(1);
    push(topGainer.id, {
      kind: 'top-gainer',
      label: `Top gainer · +${pct}% TVL 7d`,
    });
  }

  for (const p of pools) {
    const age = sinceAgeDays(p.since);
    if (age != null && age >= 0 && age <= NEW_DAYS) {
      push(p.id, { kind: 'new', label: 'New' });
    }
  }

  return map;
}

/** Single family-level headline for the analytics strip. */
export function topGainerHeadline(pools: PoolData[]): string | null {
  const tags = assignPoolTags(pools);
  for (const p of pools) {
    const list = tags.get(p.id);
    const gainer = list?.find((t) => t.kind === 'top-gainer');
    if (gainer) {
      return `7d top gainer: ${p.name} · ${gainer.label.replace('Top gainer · ', '')}`;
    }
  }
  return null;
}
