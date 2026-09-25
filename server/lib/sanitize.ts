/** Max plausible USD for a single PegKeeper pool metric. */
export const MAX_POOL_USD = 100_000_000;

/** Max plausible USD for aggregate dashboard totals. */
export const MAX_TOTAL_USD = 500_000_000;

/** Reject values that are clearly not USD (no auto-scaling). */
export function normalizeUsd(raw: unknown, max = MAX_POOL_USD): number | undefined {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0 || n > max) return undefined;
  return n;
}

/**
 * Dune/Curve sometimes return raw token integers (18 decimals).
 * Only scale when the input is huge and the scaled value is plausible.
 */
export function normalizeWeiUsd(raw: unknown, max = MAX_POOL_USD, fallback?: number): number | undefined {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  if (n <= max) return n;
  if (n >= 1e15) {
    const scaled = n / 1e18;
    const fb = fallback ?? max;
    if (scaled >= 50 && scaled <= max && scaled <= fb * 5) {
      return scaled;
    }
  }
  return undefined;
}

export function sanitizeUsd(raw: unknown, max = MAX_POOL_USD): number | undefined {
  return normalizeUsd(raw, max);
}
