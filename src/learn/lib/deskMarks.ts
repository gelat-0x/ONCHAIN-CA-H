import { normalizeChainKey } from '../../lib/chainColors';

const CHAIN_FILES: Record<string, string> = {
  ethereum: 'ethereum',
  eth: 'ethereum',
  mainnet: 'ethereum',
  fraxtal: 'fraxtal',
  frax: 'fraxtal',
  base: 'base',
  arbitrum: 'arbitrum',
  'arbitrum one': 'arbitrum',
  optimism: 'optimism',
  'op mainnet': 'optimism',
  op: 'optimism',
  polygon: 'polygon',
  matic: 'polygon',
  avalanche: 'avalanche',
  avax: 'avalanche',
  bsc: 'bsc',
  bnb: 'bsc',
  'bnb chain': 'bsc',
  sonic: 'sonic',
  solana: 'solana',
  sol: 'solana',
  ink: 'ink',
  unichain: 'unichain',
  berachain: 'berachain',
  linea: 'linea',
  scroll: 'scroll',
  abstract: 'abstract',
  mode: 'mode',
  plume: 'plume',
  katana: 'katana',
  sei: 'sei',
  stable: 'stable',
  zksync: 'zksync',
  'zksync era': 'zksync',
  'polygon zkevm': 'polygon',
  aurora: 'aurora',
  monad: 'monad',
  xlayer: 'xlayer',
  hyperliquid: 'hyperliquid',
  'hyperliquid l1': 'hyperliquid',
  robinhood: 'robinhood',
  'robinhood chain': 'robinhood',
};

export function chainLogoSrc(chain: string): string {
  const key = normalizeChainKey(chain);
  const file = CHAIN_FILES[key] ?? key.replace(/\s+/g, '');
  if (file === 'ethereum') return '/learn/images/chains/ethereum.svg';
  return `/learn/images/chains/${file}.png`;
}

const ASSET_FILES: Record<string, string> = {
  frxusd: '/learn/images/assets/frxusd.png',
  usdc: '/learn/images/assets/usdc.png',
  ustb: '/learn/images/assets/ustb.png',
  buidl: '/learn/images/assets/buidl.webp',
  wtgxx: '/learn/images/assets/wtgxx.png',
  usdb: '/learn/images/assets/usdb.png',
  ausd: '/learn/images/assets/ausd.png',
  erebor_usd: '/learn/images/assets/erebor.jpg',
  erebor: '/learn/images/assets/erebor.jpg',
};

export const PLATE_LOGOS = new Set(['fraxlend', 'usdb']);

export function assetLogoSrc(asset: string): string | undefined {
  return ASSET_FILES[asset.trim().toLowerCase()];
}

export function explorerTxUrl(event: { explorerUrl?: string; txHash: string }): string {
  if (event.explorerUrl) return event.explorerUrl;
  const hash = event.txHash.startsWith('0x') ? event.txHash : `0x${event.txHash}`;
  return `https://etherscan.io/tx/${hash}`;
}

export function shortTx(hash: string): string {
  const h = hash.startsWith('0x') ? hash : `0x${hash}`;
  if (h.length < 12) return h;
  return `${h.slice(0, 6)}…${h.slice(-4)}`;
}

export function formatPrintUsd(n: number): string {
  if (!Number.isFinite(n)) return '$—';
  if (n >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(n >= 10_000_000 ? 1 : 2)}M`;
  }
  return `$${n.toLocaleString('en-US', {
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
