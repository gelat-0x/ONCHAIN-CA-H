/**
 * Canonical frxUSD PegKeeper pool registry — 30 pools (September 2026)
 * Sources: Dune (stablescarab/frax-frxusd-pegkeeper-pools), Frax bi-weekly reports, Curve API
 * https://dune.com/stablescarab/frax-frxusd-pegkeeper-pools
 */
import type { PoolData } from '../types/index.ts';

export const MAX_POOL_USD = 100_000_000;

export interface PoolRegistryEntry {
  id: string;
  stablecoin: string;
  name: string;
  partner: string;
  partnerInitials: string;
  partnerColor: string;
  description: string;
  chain: string;
  since: string;
  dlSymbols: string[];
  duneTvlFallback: number;
  duneFrxUsdTvlFallback: number;
  curveUrl: string;
  /**
   * Curve pool contract address (0x...).
   * This is the PRIMARY identifier for:
   * - Curve API live data (preferred)
   * - Dune PegKeeper query matching (address-based)
   */
  curvePoolAddress?: string;
}

export const POOL_REGISTRY: PoolRegistryEntry[] = [
  {
    id: 'crvusd',
    stablecoin: 'crvUSD',
    name: 'frxUSD / crvUSD',
    partner: 'Curve Finance',
    partnerInitials: 'CV',
    partnerColor: '#00ff88',
    description:
      'Overcollateralized stablecoin from Curve, minted against crypto collateral via LLAMMA. A core frxUSD PegKeeper pair on Ethereum.',
    chain: 'Ethereum',
    since: '2024-12',
    dlSymbols: ['FRXUSD-CRVUSD', 'CRVUSD-FRXUSD'],
    duneTvlFallback: 11_020_989,
    duneFrxUsdTvlFallback: 2_902_752,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x13e12BB0E6A2f1A3d6901a59a9d585e89A6243e1',
  },
  {
    id: 'msusd',
    stablecoin: 'msUSD',
    name: 'frxUSD / msUSD',
    partner: 'Metronome',
    partnerInitials: 'MS',
    partnerColor: '#ef4444',
    description:
      'Synthetic USD from Metronome Synth, minted against deposited crypto collateral.',
    chain: 'Ethereum',
    since: '2025-04',
    dlSymbols: ['FRXUSD-MSUSD', 'MSUSD-FRXUSD'],
    duneTvlFallback: 11_006_657,
    duneFrxUsdTvlFallback: 4_768_029,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x9A9e2e70919c75D80aAaA1D483c46CdBb8ac4d1b',
  },
  {
    id: 'alusd',
    stablecoin: 'alUSD',
    name: 'frxUSD / alUSD',
    partner: 'Alchemix',
    partnerInitials: 'AL',
    partnerColor: '#5b8def',
    description:
      'Self-repaying stablecoin from Alchemix — collateral yield pays down debt automatically. frxUSD PegKeeper since March 2026.',
    chain: 'Ethereum',
    since: '2025-03',
    dlSymbols: ['FRXUSD-ALUSD', 'ALUSD-FRXUSD'],
    duneTvlFallback: 4_362_063,
    duneFrxUsdTvlFallback: 390_936,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x17F9682c9cd1a448b31C0428F1D0783eD13a9Fa3',
  },
  {
    id: 'pmusd',
    stablecoin: 'pmUSD',
    name: 'frxUSD / pmUSD',
    partner: 'RAAC',
    partnerInitials: 'RA',
    partnerColor: '#c9a227',
    description:
      'RWA-backed stablecoin from RAAC, collateralized by tokenized gold and precious metals.',
    chain: 'Ethereum',
    since: '2025-08',
    dlSymbols: ['FRXUSD-PMUSD', 'PMUSD-FRXUSD'],
    duneTvlFallback: 3_924_894,
    duneFrxUsdTvlFallback: 146_204,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0xBf5047039F2980C21eB5692c790BAd8A9533b900',
  },
  {
    id: 'usd3',
    stablecoin: 'USD3',
    name: 'frxUSD / USD3',
    partner: '3Jane',
    partnerInitials: 'JA',
    partnerColor: '#eab308',
    description:
      'Credit-backed yieldcoin from 3Jane, backed by uncollateralized loan lines with a variable peg tied to portfolio performance.',
    chain: 'Ethereum',
    since: '2026-06',
    dlSymbols: ['FRXUSD-USD3', 'USD3-FRXUSD'],
    duneTvlFallback: 2_812_369,
    duneFrxUsdTvlFallback: 1_617_617,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x7ba89bc658c07569cfa6d7947adaa80181a24568',
  },
  {
    id: 'usg',
    stablecoin: 'USG',
    name: 'frxUSD / USG',
    partner: 'Tangent',
    partnerInitials: 'TG',
    partnerColor: '#ffaa00',
    description:
      'CDP stablecoin from Tangent, minted against Curve LP tokens with Tangent gauge incentives.',
    chain: 'Ethereum',
    since: '2025-05',
    dlSymbols: ['FRXUSD-USG', 'USG-FRXUSD'],
    duneTvlFallback: 1_621_388,
    duneFrxUsdTvlFallback: 571_580,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0xEfc056790bb19702b2164ec6Ea6bA3AE01d81195',
  },
  {
    id: 'sdola',
    stablecoin: 'sDOLA',
    name: 'frxUSD / sDOLA',
    partner: 'Inverse Finance',
    partnerInitials: 'IN',
    partnerColor: '#34d399',
    description:
      "Yield-bearing DOLA from Inverse Finance — auto-compounds returns from the FiRM lending market.",
    chain: 'Ethereum',
    since: '2025-06',
    dlSymbols: ['FRXUSD-SDOLA', 'SDOLA-FRXUSD'],
    duneTvlFallback: 1_612_479,
    duneFrxUsdTvlFallback: 280_866,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x9D8AFD5Ce19A3b948049468188f1De13951A4383',
  },
  {
    id: 'susds',
    stablecoin: 'sUSDS',
    name: 'frxUSD / sUSDS',
    partner: 'Sky',
    partnerInitials: 'SK',
    partnerColor: '#1eaaee',
    description:
      'Yield-bearing savings token from Sky — earns the Sky Savings Rate on top of USDS.',
    chain: 'Ethereum',
    since: '2025-08',
    dlSymbols: ['FRXUSD-SUSDS', 'SUSDS-FRXUSD'],
    duneTvlFallback: 1_568_983,
    duneFrxUsdTvlFallback: 757_441,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x81a2612f6dea269a6dd1f6deab45c5424ee2c4b7',
  },
  {
    id: 'avusd',
    stablecoin: 'avUSD',
    name: 'frxUSD / avUSD',
    partner: 'Avant Protocol',
    partnerInitials: 'AV',
    partnerColor: '#00d4aa',
    description:
      'Stable-value token from Avant Protocol — yield from market-neutral on-chain strategies rather than plain USDC backing.',
    chain: 'Ethereum',
    since: '2025-11',
    dlSymbols: ['FRXUSD-AVUSD', 'AVUSD-FRXUSD'],
    duneTvlFallback: 917_058,
    duneFrxUsdTvlFallback: 379_331,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0xf76329c6dc10FdfbEe6CA520d0BF4d474E95E46E',
  },
  {
    id: 'srroyusdc',
    stablecoin: 'srRoyUSDC',
    name: 'frxUSD / srRoyUSDC',
    partner: 'Royco',
    partnerInitials: 'RY',
    partnerColor: '#e8d5b7',
    description:
      'Senior vault share from Royco — protected yield across curated tranches, paired with frxUSD on Curve.',
    chain: 'Ethereum',
    since: '2025-05',
    dlSymbols: ['FRXUSD-SRROYUSDC'],
    duneTvlFallback: 872_093,
    duneFrxUsdTvlFallback: 354_676,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x310a9Fd2906c6a3eE97289095b183f96309c56AE',
  },
  {
    id: 'evausdt',
    stablecoin: 'evaUSDT',
    name: 'frxUSD / evaUSDT',
    partner: 'Eva',
    partnerInitials: 'EV',
    partnerColor: '#00ff88',
    description: 'Yield-bearing token from Eva — earns from institutional credit lines funded via Wildcat markets.',
    chain: 'Ethereum',
    since: '2026-04',
    dlSymbols: ['FRXUSD-EVAUSDT', 'EVAUSDT-FRXUSD'],
    duneTvlFallback: 763_765,
    duneFrxUsdTvlFallback: 257_387,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x552827613fEA5EaDa3871f83b2d407d50CB04116',
  },
  {
    id: 'uspc',
    stablecoin: 'USPC',
    name: 'frxUSD / USPC',
    partner: 'Coinshift',
    partnerInitials: 'CS',
    partnerColor: '#dc2626',
    description: "Institutional yield stablecoin from Coinshift, backed by Coinshift's treasury management strategies.",
    chain: 'Ethereum',
    since: '2026-04',
    dlSymbols: ['FRXUSD-USPC', 'USPC-FRXUSD'],
    duneTvlFallback: 527_011,
    duneFrxUsdTvlFallback: 378_345,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x96BCA2cea58A8e08E7da5C9D68b8aCBb28419d1d',
  },
  {
    id: 'dusd',
    stablecoin: 'DUSD',
    name: 'frxUSD / DUSD',
    partner: 'Alto',
    partnerInitials: 'AT',
    partnerColor: '#009a49',
    description:
      "Alto's native stablecoin, minted and borrowed against collateral in isolated credit markets on Ethereum.",
    chain: 'Ethereum',
    since: '2025-09',
    dlSymbols: ['FRXUSD-DUSD', 'DUSD-FRXUSD'],
    duneTvlFallback: 501_020,
    duneFrxUsdTvlFallback: 223_381,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x104d6a1b97A6CEf88D905d7b865A378d90be932A',
  },
  {
    id: 'sdusd',
    stablecoin: 'sdUSD',
    name: 'frxUSD / sdUSD',
    partner: 'dTrinity',
    partnerInitials: 'DT',
    partnerColor: '#6366f1',
    description:
      "Staked dUSD from dTrinity — a yield-bearing ERC-4626 vault token backed by dUSD supplied to dLEND.",
    chain: 'Ethereum',
    since: '2026-09',
    dlSymbols: ['FRXUSD-SDUSD', 'SDUSD-FRXUSD'],
    duneTvlFallback: 0,
    duneFrxUsdTvlFallback: 0,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x5e9ce43c5b1e2872755977e0a57eac44c0c0f951',
  },
  {
    id: 'susde',
    stablecoin: 'sUSDe',
    name: 'frxUSD / sUSDe',
    partner: 'Ethena',
    partnerInitials: 'EN',
    partnerColor: '#e8e8e8',
    description:
      'Staked USDe from Ethena — a yield-bearing synthetic dollar, paired with frxUSD in a Curve PegKeeper pool.',
    chain: 'Ethereum',
    since: '2026-09',
    dlSymbols: ['FRXUSD-SUSDE', 'SUSDE-FRXUSD'],
    duneTvlFallback: 0,
    duneFrxUsdTvlFallback: 0,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x47Ab5f9D8C9C7D002a92320f23a696D348C56A7F',
  },
  {
    id: 'tmvusdc',
    stablecoin: 'tmvUSDC',
    name: 'frxUSD / tmvUSDC',
    partner: 'Term Finance',
    partnerInitials: 'TM',
    partnerColor: '#4ecdc4',
    description:
      'Meta-vault receipt token from Term Finance — represents curated USDC yields from fixed-rate lending auctions.',
    chain: 'Ethereum',
    since: '2025-06',
    dlSymbols: ['FRXUSD-TMVUSDC'],
    duneTvlFallback: 485_132,
    duneFrxUsdTvlFallback: 253_941,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x6dD7522c83ecd5d67F8eaF11A973219C6A9f7493',
  },
  {
    id: 'ousd',
    stablecoin: 'OUSD',
    name: 'frxUSD / OUSD',
    partner: 'Origin Protocol',
    partnerInitials: 'OR',
    partnerColor: '#7b68ee',
    description:
      'Yield-bearing stablecoin from Origin Protocol — automatically routes collateral across DeFi yield strategies.',
    chain: 'Ethereum',
    since: '2025-10',
    dlSymbols: ['FRXUSD-OUSD', 'OUSD-FRXUSD'],
    duneTvlFallback: 221_874,
    duneFrxUsdTvlFallback: 108_181,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x68d03Ed49800e92D7Aa8aB171424007e55Fd1F49',
  },
  {
    id: 'mubond',
    stablecoin: 'muBOND',
    name: 'frxUSD / muBOND',
    partner: 'Mu Digital',
    partnerInitials: 'MU',
    partnerColor: '#f472b6',
    description:
      'Junior first-loss tranche from Mu Digital — absorbs losses before other tranches in their credit stack.',
    chain: 'Ethereum',
    since: '2025-08',
    dlSymbols: ['FRXUSD-MUBOND'],
    duneTvlFallback: 200_212,
    duneFrxUsdTvlFallback: 43_524,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x01646F6fe0d75CEd6E514faB0Ea2F4ed5e1A5C9F',
  },
  {
    id: 'aznd',
    stablecoin: 'AZND',
    name: 'frxUSD / AZND',
    partner: 'Mu Digital',
    partnerInitials: 'AZ',
    partnerColor: '#22d3ee',
    description:
      'Synthetic dollar from Mu Digital, backed by tokenized Asian fixed-income RWAs. Separate from the junior muBOND tranche.',
    chain: 'Ethereum',
    since: '2025-05',
    dlSymbols: ['FRXUSD-AZND'],
    duneTvlFallback: 200_114,
    duneFrxUsdTvlFallback: 47_765,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x16a973F8e466F44e9eA67e7e2d3166bD460ea852',
  },
  {
    id: 'fxusd',
    stablecoin: 'fxUSD',
    name: 'frxUSD / fxUSD',
    partner: 'f(x) Protocol',
    partnerInitials: 'FX',
    partnerColor: '#60a5fa',
    description: 'Overcollateralized stablecoin from f(x) Protocol, backed by WBTC and stETH.',
    chain: 'Ethereum',
    since: '2025-04',
    dlSymbols: ['FRXUSD-FXUSD', 'FXUSD-FRXUSD'],
    duneTvlFallback: 193_801,
    duneFrxUsdTvlFallback: 103_378,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x851907CAC684797eee43669798D78004e269Cb5E',
  },
  {
    id: 'savusd',
    stablecoin: 'savUSD',
    name: 'frxUSD / savUSD',
    partner: 'Avant Protocol',
    partnerInitials: 'AV',
    partnerColor: '#00d4aa',
    description:
      'Savings layer on avUSD from Avant Protocol — deposit avUSD to earn the protocol savings rate.',
    chain: 'Ethereum',
    since: '2025-11',
    dlSymbols: ['FRXUSD-SAVUSD'],
    duneTvlFallback: 154_722,
    duneFrxUsdTvlFallback: 54_289,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x917213760aF19E938E1C5cf4c6c3a963f6F32152',
  },
  {
    id: 'susdat',
    stablecoin: 'sUSDat',
    name: 'frxUSD / sUSDat',
    partner: 'Saturn',
    partnerInitials: 'ST',
    partnerColor: '#a78bfa',
    description:
      "Yield-bearing stablecoin from Saturn — returns accrue from Saturn's on-chain yield stack.",
    chain: 'Ethereum',
    since: '2025-07',
    dlSymbols: ['FRXUSD-SUSDAT'],
    duneTvlFallback: 138_634,
    duneFrxUsdTvlFallback: 15_975,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0xcAF1969E9ba98C05113b75d8633A17196e2D02a5',
  },
  {
    id: 'usp',
    stablecoin: 'USP',
    name: 'frxUSD / USP',
    partner: 'PikuDAO',
    partnerInitials: 'PK',
    partnerColor: '#ff6b6b',
    description:
      'Yield-bearing stablecoin from PikuDAO — savings rate accrues directly to token holders.',
    chain: 'Ethereum',
    since: '2025-09',
    dlSymbols: ['FRXUSD-USP', 'USP-FRXUSD'],
    duneTvlFallback: 134_286,
    duneFrxUsdTvlFallback: 60_594,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0xd50492DE3541d75E61eDC34D1Aa79C7dC2d20da9',
  },
  {
    id: 'usdaf',
    stablecoin: 'USDaf',
    name: 'frxUSD / USDaf',
    partner: 'Asymmetry Finance',
    partnerInitials: 'AS',
    partnerColor: '#fbbf24',
    description:
      'Overcollateralized stablecoin from Asymmetry Finance on Liquity v2 — governance-minimized CDP design.',
    chain: 'Ethereum',
    since: '2025-05',
    dlSymbols: ['FRXUSD-USDAF'],
    duneTvlFallback: 56_927,
    duneFrxUsdTvlFallback: 11_088,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x20d4c49a873EaeFf76EfBD0cF19002F6E19EF52c',
  },
  {
    id: 'yusd',
    stablecoin: 'YUSD',
    name: 'frxUSD / YUSD',
    partner: 'Aegis',
    partnerInitials: 'AE',
    partnerColor: '#fb923c',
    description: 'Bitcoin-backed delta-neutral stablecoin from Aegis — hedged via perpetual futures.',
    chain: 'Ethereum',
    since: '2025-06',
    dlSymbols: ['FRXUSD-YUSD'],
    duneTvlFallback: 40_011,
    duneFrxUsdTvlFallback: 18_828,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x2Cc565dDe7C078A8E477763a34C40e52b13e6396',
  },
  {
    id: 'ebusd',
    stablecoin: 'ebUSD',
    name: 'frxUSD / ebUSD',
    partner: 'Ebisu Money',
    partnerInitials: 'EB',
    partnerColor: '#94a3b8',
    description: "Stablecoin from Ebisu Money — used as collateral and liquidity in Ebisu's stablecoin credit market.",
    chain: 'Ethereum',
    since: '2025-07',
    dlSymbols: ['FRXUSD-EBUSD'],
    duneTvlFallback: 17_773,
    duneFrxUsdTvlFallback: 6_263,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x31d563e7d382CD934014BeC8C6C931751E6b3a9a',
  },
  {
    id: 'iusd',
    stablecoin: 'iUSD',
    name: 'frxUSD / iUSD',
    partner: 'infiniFi',
    partnerInitials: 'IF',
    partnerColor: '#818cf8',
    description: 'Fractional-reserve stablecoin from infiniFi — tiered yield based on lock-up duration.',
    chain: 'Ethereum',
    since: '2025-10',
    dlSymbols: ['FRXUSD-IUSD', 'IUSD-FRXUSD'],
    duneTvlFallback: 13_932,
    duneFrxUsdTvlFallback: 7_017,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x3e823bd1015Ba1A12F2F8aFD631c822a1CBA0de7',
  },
  {
    id: 'vusd',
    stablecoin: 'VUSD',
    name: 'frxUSD / VUSD',
    partner: 'Vetro',
    partnerInitials: 'VT',
    partnerColor: '#8b5cf6',
    description:
      'Treasury-layer stablecoin from Vetro for institutional use — uses frxUSD PegKeeper liquidity on Curve.',
    chain: 'Ethereum',
    since: '2026-05',
    dlSymbols: ['FRXUSD-VUSD', 'VUSD-FRXUSD'],
    duneTvlFallback: 194_576,
    duneFrxUsdTvlFallback: 97_693,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0xde0576968c898bbe7bf13d79862f252c58443f96',
  },
  {
    id: 'trusd',
    stablecoin: 'trUSD',
    name: 'frxUSD / trUSD',
    partner: 'Tori Finance',
    partnerInitials: 'TF',
    partnerColor: '#38bdf8',
    description:
      'Tori Finance stablecoin backed by delta-neutral trading positions that hedge directional exposure.',
    chain: 'Ethereum',
    since: '2026-07',
    dlSymbols: ['FRXUSD-TRUSD', 'TRUSD-FRXUSD'],
    duneTvlFallback: 3_907_407,
    duneFrxUsdTvlFallback: 2_216_676,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0xd1D954BC94c843815EC7B8119f2de00AF27Fa6Ff',
  },
  {
    id: 'susdai',
    stablecoin: 'sUSDai',
    name: 'frxUSD / sUSDai',
    partner: 'USD.AI',
    partnerInitials: 'UA',
    partnerColor: '#8B7355',
    description:
      'sUSDai is a yield-bearing synthetic dollar backed by GPU-collateralized loans — the physical backbone of the AI economy.',
    chain: 'Ethereum',
    since: '2026-09',
    dlSymbols: ['FRXUSD-SUSDAI', 'SUSDAI-FRXUSD'],
    duneTvlFallback: 0,
    duneFrxUsdTvlFallback: 0,
    curveUrl: 'https://curve.fi',
    curvePoolAddress: '0x1Fce0B50C48A7Bf67022a82deC9C26e02683bF52',
  },
];

export const DUNE_BASELINE = {
  totalPoolTvl: 41_000_000,
  totalFrxUsdInPools: 17_200_000,
  poolCount: 27,
  partnerCount: 27,
  tvlChange30d: 9_941_043,
  tvlChange30dPct: 33.85,
  source: 'Dune — stablescarab/frax-frxusd-pegkeeper-pools',
};

/** Use live TVL only when plausible USD; otherwise registry/Dune fallback. */
export function resolvePoolTvl(entry: PoolRegistryEntry, liveTvl?: number): number {
  const n = Number(liveTvl);
  if (Number.isFinite(n) && n > 0 && n <= MAX_POOL_USD) return Math.round(n);
  return entry.duneTvlFallback;
}

/** One current snapshot when no real historical series is available. */
export function generateTvlHistory(currentTvl: number, _poolId?: string): number[] {
  const v = Math.max(0, Math.round(currentTvl));
  return [v];
}

export function registryToPoolData(
  entry: PoolRegistryEntry,
  live?: { tvl?: number; apr?: number; volume24h?: number; frxUsdBalance?: number },
  _frxPrice = 1.0,
): PoolData {
  const tvl = resolvePoolTvl(entry, live?.tvl);
  const apr =
    live?.apr != null && Number.isFinite(live.apr) && live.apr >= 0.01 && live.apr <= 500
      ? +live.apr.toFixed(2)
      : live?.apr != null && Number.isFinite(live.apr) && live.apr >= 0.005 && live.apr < 0.01
        ? 0.01
        : 0;
  const liveFrxUsdBalance =
    live?.frxUsdBalance != null &&
    Number.isFinite(live.frxUsdBalance) &&
    live.frxUsdBalance >= 0 &&
    live.frxUsdBalance <= MAX_POOL_USD
      ? Math.round(live.frxUsdBalance)
      : undefined;
  const volumeRaw = live?.volume24h;
  const volume24h =
    volumeRaw != null && Number.isFinite(volumeRaw) && volumeRaw >= 0 && volumeRaw <= MAX_POOL_USD
      ? Math.round(volumeRaw)
      : 0;

  return {
    id: entry.id,
    name: entry.name,
    stablecoin: entry.stablecoin,
    partner: entry.partner,
    partnerInitials: entry.partnerInitials,
    partnerColor: entry.partnerColor,
    description: entry.description,
    chain: entry.chain,
    since: entry.since,
    tvl: Math.round(tvl),
    apr: +apr.toFixed(1),
    volume24h,
    // Retained for backward compatibility only; the UI must use frxUsdBalanceUsd.
    pegKeeperDebt: liveFrxUsdBalance ?? 0,
    ...(liveFrxUsdBalance != null ? { frxUsdBalanceUsd: liveFrxUsdBalance } : {}),
    pegDeviation: [],
    tvlHistory7d: generateTvlHistory(Math.round(tvl)),
    status: tvl > 1000 ? 'ACTIVE' : 'ALERT',
    curveUrl: entry.curveUrl,
  };
}
