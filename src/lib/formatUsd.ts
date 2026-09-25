/** Max USD we ever display for PegKeeper pool values (guards against bad API data). */
const MAX_DISPLAY_USD = 500_000_000;

/** Compact, readable USD — never scientific notation, never 20-digit strings. */
export function formatUsd(n: number): string {
  if (!Number.isFinite(n) || n <= 0 || n > MAX_DISPLAY_USD) return '$—';
  return formatUsdCompact(n);
}

/**
 * Protocol-scale USD (TVL, fees, volume of Aave/Curve/Frax…) — same compact
 * formatting but WITHOUT the pool-level $500M sanity cap, which turned
 * legitimate billion-scale protocol metrics into "$—".
 */
export function formatUsdMetric(n: number): string {
  if (!Number.isFinite(n) || n < 0) return '$—';
  if (n === 0) return '$0';
  return formatUsdCompact(n);
}

function formatUsdCompact(n: number): string {
  if (n >= 1_000_000_000_000) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 10_000_000_000) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1_000_000_000) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 10_000_000) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1_000_000) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 10_000) return `$${Math.round(n / 1_000)}K`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${Math.round(n).toLocaleString()}`;
}
