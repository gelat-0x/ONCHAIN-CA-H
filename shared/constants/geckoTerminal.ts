import type { ChartRangeId } from './chartRanges.ts';

export type GeckoTerminalKind = 'pool' | 'token';

export interface GeckoTerminalEmbed {
  network: string;
  kind: GeckoTerminalKind;
  address: string;
  title: string;
  /** iframe title attribute */
  iframeTitle?: string;
}

/** Shared embed flags — matches FXS/FRAX GeckoTerminal widget. */
export const GECKO_TERMINAL_EMBED_FLAGS = {
  locale: 'de',
  embed: '1',
  info: '0',
  swaps: '0',
  grayscale: '1',
  light_chart: '0',
  chart_type: 'price',
} as const;

/** GeckoTerminal `resolution` query param per UI range pill. */
export const GECKO_TERMINAL_RESOLUTION: Record<ChartRangeId, string> = {
  '5m': '1m',
  '1': '15m',
  '7': '1h',
  '30': '4h',
  max: '1d',
};

/** Canonical FXS / FRAX pool embed (GeckoTerminal). */
export const FXS_FRAX_POOL_ADDRESS = '0x03b59bd1c8b9f6c265ba0c3421923b93f15036fa';

export const GECKO_TERMINAL_EMBEDS: Record<string, GeckoTerminalEmbed> = {
  frxusd: {
    network: 'eth',
    kind: 'pool',
    address: '0x13e12BB0E6A2f1A3d6901a59a9d585e89A6243e1',
    title: 'frxUSD / crvUSD',
  },
  frax: {
    network: 'eth',
    kind: 'pool',
    address: FXS_FRAX_POOL_ADDRESS,
    title: 'FXS / FRAX',
    iframeTitle: 'FXS / FRAX einbetten',
  },
  btc: {
    network: 'eth',
    kind: 'token',
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    title: 'WBTC',
  },
  eth: {
    network: 'eth',
    kind: 'token',
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    title: 'WETH',
  },
  sol: {
    network: 'solana',
    kind: 'token',
    address: 'So11111111111111111111111111111111111111112',
    title: 'SOL',
  },
  crv: {
    network: 'eth',
    kind: 'token',
    address: '0xD533a9420d8803b595A05A5Dc53d6E4f53D0EC1b',
    title: 'CRV',
  },
  cvx: {
    network: 'eth',
    kind: 'token',
    address: '0x4e3FBD56CD56c3e72c1403e865b545675b83a4c4',
    title: 'CVX',
  },
  aave: {
    network: 'eth',
    kind: 'token',
    address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    title: 'AAVE',
  },
  fxn: {
    network: 'eth',
    kind: 'token',
    address: '0x665875A55c66F4408f8d2b2CdB14E8F8Eb89f7C1',
    title: 'FXN',
  },
};

export function geckoTerminalEmbedForToken(tokenId: string): GeckoTerminalEmbed | undefined {
  return GECKO_TERMINAL_EMBEDS[tokenId];
}

export function buildGeckoTerminalEmbedUrl(
  embed: GeckoTerminalEmbed,
  range: ChartRangeId,
): string {
  const resolution = GECKO_TERMINAL_RESOLUTION[range];
  const segment = embed.kind === 'pool' ? 'pools' : 'tokens';
  const path = `${embed.network}/${segment}/${embed.address}`;
  const { locale, ...flags } = GECKO_TERMINAL_EMBED_FLAGS;

  const params = new URLSearchParams({
    ...flags,
    resolution,
  });

  return `https://www.geckoterminal.com/${locale}/${path}?${params.toString()}`;
}

/** Exact default URL for FXS/FRAX at 1m (matches provided embed snippet). */
export function fxsFraxDefaultEmbedUrl(): string {
  return buildGeckoTerminalEmbedUrl(GECKO_TERMINAL_EMBEDS.frax!, '5m');
}

export function geckoTerminalPageUrl(embed: GeckoTerminalEmbed): string {
  const segment = embed.kind === 'pool' ? 'pools' : 'tokens';
  return `https://www.geckoterminal.com/${GECKO_TERMINAL_EMBED_FLAGS.locale}/${embed.network}/${segment}/${embed.address}`;
}
