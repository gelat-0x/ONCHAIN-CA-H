/** Unified DefiLlama source label for UI. */
export const DEFILLAMA_SOURCE = 'DefiLlama';

/** Protocols shown on the Dashboard protocol tab (DefiLlama slugs). */
export const DASHBOARD_DEFILLAMA_PROTOCOLS = [
  {
    slug: 'frax-finance',
    label: 'Frax Finance',
    chartColor: '#ffffff',
    dex: false,
  },
  {
    slug: 'aave',
    label: 'Aave',
    chartColor: '#b6509e',
    dex: false,
  },
  {
    slug: 'curve-dex',
    label: 'Curve Finance',
    chartColor: '#ff6b35',
    dex: true,
  },
] as const;

export type DashboardDefiLlamaSlug = (typeof DASHBOARD_DEFILLAMA_PROTOCOLS)[number]['slug'];

export const FRAX_FINANCE_SLUG = 'frax-finance' as const;

export function defiLlamaProtocolUrl(slug: string): string {
  return `https://defillama.com/protocol/${slug}`;
}
