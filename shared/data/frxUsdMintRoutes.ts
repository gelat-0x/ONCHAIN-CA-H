/** frxUSD mint/redeem routes from https://docs.frax.com/frxusd/mint-and-redeem-routes */

export interface FrxUsdMintRoute {
  id: string;
  asset: string;
  issuer: string;
  assetAddress: string;
  custodianAddress: string;
  kind: 'ethereum' | 'cross-chain';
}

export const FRXUSD_TOKEN_ETHEREUM = '0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29';

export const FRXUSD_MINT_ROUTES: FrxUsdMintRoute[] = [
  {
    id: 'usdc',
    asset: 'USDC',
    issuer: 'Circle',
    assetAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    custodianAddress: '0x4F95C5bA0C7c69FB2f9340E190cCeE890B3bd87c',
    kind: 'ethereum',
  },
  {
    id: 'ustb',
    asset: 'USTB',
    issuer: 'Superstate',
    assetAddress: '0x43415eb6ff9db7e26a15b704e7a3edce97d31c4e',
    custodianAddress: '0x5fbAa3A3B489199338fbD85F7E3D444dc0504F33',
    kind: 'ethereum',
  },
  {
    id: 'buidl',
    asset: 'BUIDL',
    issuer: 'BlackRock',
    assetAddress: '0x7712c34205737192402172409a8f7ccef8aa2aec',
    custodianAddress: '0xe827abf9f462ac4f147753d86bc5f91e186e4e9c',
    kind: 'ethereum',
  },
  {
    id: 'wtgxx',
    asset: 'WTGXX',
    issuer: 'WisdomTree',
    assetAddress: '0x1fecf3d9d4fee7f2c02917a66028a48c6706c179',
    custodianAddress: '0x860Cc723935FC9A15fF8b1A94237a711DFeF7857',
    kind: 'ethereum',
  },
  {
    id: 'usdb',
    asset: 'USDB',
    issuer: 'Bridge.xyz',
    assetAddress: '0xeac4269c9a01190b1400c4dc728864e61895fdf3',
    custodianAddress: '0xFE2Ea8dE262d956e852F12DE108fda57171a0a29',
    kind: 'ethereum',
  },
];

export const FRAXNET_FACTORY = '0xA3D62f83C433e2A56Af392E08a705A52DEd63696';

/** Chains that can receive minted frxUSD via FraxNet (docs). */
export const FRAXNET_MINT_CHAINS = [
  'Ethereum', 'Abstract', 'Arbitrum', 'Aurora', 'Avalanche', 'Base', 'Berachain', 'BSC',
  'Ink', 'Katana', 'Linea', 'Mode', 'Monad', 'Optimism', 'Plume', 'Polygon', 'Polygon zkEVM',
  'Scroll', 'Sei', 'Sonic', 'Stable', 'Unichain', 'XLayer', 'zkSync',
];
