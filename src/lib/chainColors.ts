/**
 * Chain brand colors aligned with DefiLlama chart / icon conventions.
 * Keys are lowercase; lookup normalizes spacing, hyphens, and common aliases.
 */

const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  eth: '#627EEA',
  mainnet: '#627EEA',
  arbitrum: '#28A0F0',
  'arbitrum one': '#28A0F0',
  'arbitrum nova': '#E84142',
  optimism: '#FF0420',
  op: '#FF0420',
  'op mainnet': '#FF0420',
  base: '#0052FF',
  polygon: '#8247E5',
  matic: '#8247E5',
  'polygon zkevm': '#8247E5',
  bsc: '#F0B90B',
  binance: '#F0B90B',
  'bnb chain': '#F0B90B',
  bnb: '#F0B90B',
  avalanche: '#E84142',
  avax: '#E84142',
  fantom: '#1969FF',
  ftm: '#1969FF',
  solana: '#9945FF',
  sol: '#9945FF',
  gnosis: '#04795B',
  xdai: '#04795B',
  celo: '#35D07F',
  moonbeam: '#53CBC9',
  moonriver: '#F2B705',
  zksync: '#8C8DFC',
  'zksync era': '#8C8DFC',
  era: '#8C8DFC',
  linea: '#61DFFF',
  scroll: '#FFEEDA',
  blast: '#FCFC03',
  mantle: '#000000',
  mode: '#DFFE00',
  fraxtal: '#000000',
  frax: '#000000',
  sonic: '#FE9A2D',
  hyperliquid: '#97FCE4',
  'hyperliquid l1': '#97FCE4',
  tron: '#FF0013',
  bitcoin: '#F7931A',
  btc: '#F7931A',
  sui: '#4DA2FF',
  aptos: '#2DD8A9',
  near: '#00C08B',
  cosmos: '#2E3148',
  osmosis: '#5E12A0',
  stellar: '#14B6E7',
  ink: '#7132F5',
  unichain: '#FF007A',
  berachain: '#D4A574',
  sei: '#9B1C1C',
  cronos: '#002D74',
  kava: '#FF564F',
  metis: '#00DACC',
  manta: '#29CCB9',
  taiko: '#E81899',
  worldchain: '#000000',
  'world chain': '#000000',
  bob: '#F7931A',
  swellchain: '#2F6FED',
  abstract: '#00E0A4',
  plume: '#A855F7',
  katana: '#E11D48',
  plasma: '#22D3EE',
  ronin: '#1273EA',
  hedera: '#8259EF',
  filecoin: '#0090FF',
  rootstock: '#F7931A',
  rsk: '#F7931A',
  starknet: '#EC796B',
  other: '#64748B',
};

/** Fallback palette when a chain has no brand mapping (never all-white). */
const FALLBACK_PALETTE = [
  '#38bdf8',
  '#a78bfa',
  '#34d399',
  '#fbbf24',
  '#f472b6',
  '#fb923c',
  '#2dd4bf',
  '#c084fc',
  '#94a3b8',
  '#f87171',
];

export function normalizeChainKey(chain: string): string {
  return chain
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ');
}

/** Brand color for a chain name (DefiLlama-style). */
export function chainBrandColor(chain: string, fallbackIndex = 0): string {
  const key = normalizeChainKey(chain);
  if (!key) return FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length];
  if (key === 'other' || key === 'others') return CHAIN_COLORS.other;

  const direct = CHAIN_COLORS[key];
  if (direct) return direct;

  // Partial match for names like "OP Mainnet", "Arbitrum One"
  for (const [name, color] of Object.entries(CHAIN_COLORS)) {
    if (key.includes(name) || name.includes(key)) return color;
  }

  return FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length];
}

export function chainColorsFor(chains: string[]): string[] {
  return chains.map((c, i) => chainBrandColor(c, i));
}
