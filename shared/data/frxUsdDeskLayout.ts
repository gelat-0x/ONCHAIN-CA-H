/** Polar seats for the issuance desk map. Angle 0 = east, -90 = north. */

export interface FrxUsdDeskSeat {
  key: string;
  label: string;
  angle: number;
}

export const FRXUSD_DESK_SEATS: FrxUsdDeskSeat[] = [
  { key: 'ethereum', label: 'Ethereum', angle: -90 },
  { key: 'fraxtal', label: 'Fraxtal', angle: -58 },
  { key: 'base', label: 'Base', angle: -26 },
  { key: 'arbitrum', label: 'Arbitrum', angle: 6 },
  { key: 'optimism', label: 'Optimism', angle: 38 },
  { key: 'polygon', label: 'Polygon', angle: 70 },
  { key: 'avalanche', label: 'Avalanche', angle: 102 },
  { key: 'bsc', label: 'BNB', angle: 134 },
  { key: 'sonic', label: 'Sonic', angle: 166 },
  { key: 'ink', label: 'Ink', angle: 198 },
  { key: 'unichain', label: 'Unichain', angle: 230 },
  { key: 'berachain', label: 'Berachain', angle: 262 },
  { key: 'linea', label: 'Linea', angle: 294 },
  { key: 'scroll', label: 'Scroll', angle: 326 },
];

export const FRXUSD_DESK_KEY_ALIASES: Record<string, string> = {
  eth: 'ethereum',
  mainnet: 'ethereum',
  'arbitrum one': 'arbitrum',
  'op mainnet': 'optimism',
  op: 'optimism',
  matic: 'polygon',
  'polygon zkevm': 'polygon',
  binance: 'bsc',
  'bnb chain': 'bsc',
  bnb: 'bsc',
  avax: 'avalanche',
  frax: 'fraxtal',
};
