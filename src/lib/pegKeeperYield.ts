/**
 * Illustrative Treasury yield helpers for PegKeeper education UI.
 *
 * Not a live oracle — the worked example uses a fixed sample rate so partners
 * can picture how shared T-bill yield compounds over different horizons.
 */

/** Sample annual T-bill-style rate used in the on-page example (3.5%). */
export const EXAMPLE_RATE = 0.035;

/** Sample starting principal for the cycling example. */
export const EXAMPLE_PRINCIPAL = 100_000;

export const EXAMPLE_HORIZONS = [
  { key: '3m', label: 'After 3 months', years: 0.25 },
  { key: '1y', label: 'After 1 year', years: 1 },
  { key: '5y', label: 'After 5 years', years: 5 },
] as const;

/**
 * @deprecated Prefer EXAMPLE_RATE for new UI. Kept for any remaining call sites.
 * Source note: Frax "The Superior PegKeeper" ~3.4% worked example.
 */
export const TREASURY_YIELD_RATE = 0.034;

/** Horizons shown in older projection bars. */
export const PROJECTION_YEARS = [1, 3, 5] as const;

/**
 * Simple non-compounding yield over a horizon (matches how the source examples are stated).
 */
export function projectYield(frxUsdLiquidity: number, years: number, rate = TREASURY_YIELD_RATE): number {
  if (!Number.isFinite(frxUsdLiquidity) || frxUsdLiquidity <= 0) return 0;
  if (!Number.isFinite(years) || years <= 0) return 0;
  return frxUsdLiquidity * rate * years;
}

/** Example-box projection at the fixed sample rate. */
export function projectExampleYield(
  principal = EXAMPLE_PRINCIPAL,
  rate = EXAMPLE_RATE,
  years = 1,
): number {
  return projectYield(principal, years, rate);
}

/** Compact USD for the cycling example result. */
export function formatExampleYield(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return '$0';
  if (value >= 1_000_000) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1_000) {
    const k = value / 1e3;
    return `$${k >= 100 ? Math.round(k) : k.toFixed(k >= 10 ? 1 : 2)}K`;
  }
  return `$${Math.round(value).toLocaleString('en-US')}`;
}
