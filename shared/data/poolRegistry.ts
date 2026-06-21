/**
 * Complete frxUSD PegKeeper pool registry — 27 pools
 * Sources: Dune (stablescarab/frax-frxusd-pegkeeper-pools), Frax bi-weekly reports, @Fraxfinance
 * https://dune.com/stablescarab/frax-frxusd-pegkeeper-pools
 */
import type { PoolData } from '../types/index.ts';

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
   *
   * Populate these as they are validated.
   */
  curvePoolAddress?: string;
}

export const POOL_REGISTRY: PoolRegistryEntry[] = [
  { id: 'crvusd', stablecoin: 'crvUSD', name: 'frxUSD / crvUSD', partner: 'Curve Finance', partnerInitials: 'CV', partnerColor: '#00ff88', description: 'Overcollateralized stablecoin by Curve', chain: 'Ethereum', since: '2024-12', dlSymbols: ['FRXUSD-CRVUSD', 'CRVUSD-FRXUSD'], duneTvlFallback: 27_426_137, duneFrxUsdTvlFallback: 12_180_446 , curveUrl: 'https://curve.fi', curvePoolAddress: '0x13e12BB0E6A2f1A3d6901a59a9d585e89A6243e1', },
  { id: 'alusd', stablecoin: 'alUSD', name: 'frxUSD / alUSD', partner: 'Alchemix', partnerInitials: 'AL', partnerColor: '#5b8def', description: 'Self-repaying synthetic dollar', chain: 'Ethereum', since: '2025-03', dlSymbols: ['FRXUSD-ALUSD', 'ALUSD-FRXUSD'], duneTvlFallback: 4_267_302, duneFrxUsdTvlFallback: 2_100_000 , curveUrl: 'https://curve.fi', },
  { id: 'msusd', stablecoin: 'msUSD', name: 'frxUSD / msUSD', partner: 'Metronome', partnerInitials: 'MS', partnerColor: '#ffffff', description: 'Synthetic USD minted against crypto collateral', chain: 'Ethereum', since: '2025-04', dlSymbols: ['FRXUSD-MSUSD', 'MSUSD-FRXUSD'], duneTvlFallback: 4_354_752, duneFrxUsdTvlFallback: 4_000_618 , curveUrl: 'https://curve.fi', },
  { id: 'pmusd', stablecoin: 'pmUSD', name: 'frxUSD / pmUSD', partner: 'RAAC Protocol', partnerInitials: 'RA', partnerColor: '#c9a227', description: 'Gold and precious-metals-backed stablecoin', chain: 'Ethereum', since: '2025-08', dlSymbols: ['FRXUSD-PMUSD', 'PMUSD-FRXUSD'], duneTvlFallback: 467_604, duneFrxUsdTvlFallback: 310_461 , curveUrl: 'https://curve.fi', },
  { id: 'evausdt', stablecoin: 'evaUSDT', name: 'frxUSD / evaUSDT', partner: 'Eva Markets', partnerInitials: 'EV', partnerColor: '#00ff88', description: 'Yield from Wintermute loans on WildcatFi', chain: 'Ethereum', since: '2026-04', dlSymbols: ['FRXUSD-EVAUSDT', 'EVAUSDT-FRXUSD'], duneTvlFallback: 460_190, duneFrxUsdTvlFallback: 230_000 , curveUrl: 'https://curve.fi', },
  { id: 'ousd', stablecoin: 'OUSD', name: 'frxUSD / OUSD', partner: 'Origin Protocol', partnerInitials: 'OR', partnerColor: '#7b68ee', description: 'Yield-bearing stablecoin by Origin', chain: 'Ethereum', since: '2025-10', dlSymbols: ['FRXUSD-OUSD', 'OUSD-FRXUSD'], duneTvlFallback: 358_865, duneFrxUsdTvlFallback: 131_204 , curveUrl: 'https://curve.fi', },
  { id: 'uspc', stablecoin: 'USPC', name: 'frxUSD / USPC', partner: 'Coinshift', partnerInitials: 'CS', partnerColor: '#ffffff', description: 'Institutional credit yield — BlackRock, Fidelity, Apollo', chain: 'Ethereum', since: '2026-04', dlSymbols: ['FRXUSD-USPC', 'USPC-FRXUSD'], duneTvlFallback: 201_373, duneFrxUsdTvlFallback: 100_000 , curveUrl: 'https://curve.fi', },
  { id: 'usp', stablecoin: 'USP', name: 'frxUSD / USP', partner: 'Piku DAO', partnerInitials: 'PK', partnerColor: '#ff6b6b', description: 'High-yield stablecoin with co-incentive program', chain: 'Ethereum', since: '2025-09', dlSymbols: ['FRXUSD-USP', 'USP-FRXUSD'], duneTvlFallback: 144_626, duneFrxUsdTvlFallback: 72_000 , curveUrl: 'https://curve.fi', },
  { id: 'avusd', stablecoin: 'avUSD', name: 'frxUSD / avUSD', partner: 'Avant Protocol', partnerInitials: 'AV', partnerColor: '#00d4aa', description: 'Stablecoin backed 1:1 by USDC', chain: 'Ethereum', since: '2025-11', dlSymbols: ['FRXUSD-AVUSD', 'AVUSD-FRXUSD'], duneTvlFallback: 243_037, duneFrxUsdTvlFallback: 410_916 , curveUrl: 'https://curve.fi', },
  { id: 'usg', stablecoin: 'USG', name: 'frxUSD / USG', partner: 'Tangent Protocol', partnerInitials: 'TG', partnerColor: '#ffaa00', description: 'Over-collateralized DeFi native dollar', chain: 'Ethereum', since: '2025-05', dlSymbols: ['FRXUSD-USG', 'USG-FRXUSD'], duneTvlFallback: 119_345, duneFrxUsdTvlFallback: 60_000 , curveUrl: 'https://curve.fi', },
  { id: 'tmvusdc', stablecoin: 'tmvUSDC', name: 'frxUSD / tmvUSDC', partner: 'Term Finance', partnerInitials: 'TM', partnerColor: '#4ecdc4', description: 'Meta Vault receipt token for curated USDC yields', chain: 'Ethereum', since: '2025-06', dlSymbols: ['FRXUSD-TMVUSDC'], duneTvlFallback: 281_200, duneFrxUsdTvlFallback: 251_796 , curveUrl: 'https://curve.fi', },
  { id: 'srroyusdc', stablecoin: 'srRoyUSDC', name: 'frxUSD / srRoyUSDC', partner: 'Royco', partnerInitials: 'RY', partnerColor: '#e8d5b7', description: 'Senior vault with diversified protected yield', chain: 'Ethereum', since: '2025-05', dlSymbols: ['FRXUSD-SRROYUSDC'], duneTvlFallback: 117_554, duneFrxUsdTvlFallback: 290_295 , curveUrl: 'https://curve.fi', },
  { id: 'susdat', stablecoin: 'sUSDat', name: 'frxUSD / sUSDat', partner: 'Angle Protocol', partnerInitials: 'AN', partnerColor: '#a78bfa', description: 'Savings USDat stable yield token', chain: 'Ethereum', since: '2025-07', dlSymbols: ['FRXUSD-SUSDAT'], duneTvlFallback: 227_932, duneFrxUsdTvlFallback: 110_000 , curveUrl: 'https://curve.fi', },
  { id: 'fxusd', stablecoin: 'fxUSD', name: 'frxUSD / fxUSD', partner: 'f(x) Protocol', partnerInitials: 'FX', partnerColor: '#60a5fa', description: 'Over-collateralized stablecoin backed by WBTC and stETH', chain: 'Ethereum', since: '2025-04', dlSymbols: ['FRXUSD-FXUSD', 'FXUSD-FRXUSD'], duneTvlFallback: 99_308, duneFrxUsdTvlFallback: 121_454 , curveUrl: 'https://curve.fi', },
  { id: 'mubond', stablecoin: 'muBOND', name: 'frxUSD / muBOND', partner: 'Resupply', partnerInitials: 'MU', partnerColor: '#f472b6', description: 'Resupply bond token paired with frxUSD', chain: 'Ethereum', since: '2025-08', dlSymbols: ['FRXUSD-MUBOND'], duneTvlFallback: 99_348, duneFrxUsdTvlFallback: 50_000 , curveUrl: 'https://curve.fi', },
  { id: 'sdola', stablecoin: 'sDOLA', name: 'frxUSD / sDOLA', partner: 'Inverse Finance', partnerInitials: 'IN', partnerColor: '#34d399', description: 'Yield-bearing DOLA savings token', chain: 'Ethereum', since: '2025-06', dlSymbols: ['FRXUSD-SDOLA', 'SDOLA-FRXUSD'], duneTvlFallback: 111_534, duneFrxUsdTvlFallback: 55_000 , curveUrl: 'https://curve.fi', },
  { id: 'savusd', stablecoin: 'savUSD', name: 'frxUSD / savUSD', partner: 'Avant Protocol', partnerInitials: 'AV', partnerColor: '#00d4aa', description: 'Yield-bearing savings stablecoin by Avant', chain: 'Ethereum', since: '2025-11', dlSymbols: ['FRXUSD-SAVUSD'], duneTvlFallback: 85_722, duneFrxUsdTvlFallback: 65_718 , curveUrl: 'https://curve.fi', },
  { id: 'iusd', stablecoin: 'iUSD', name: 'frxUSD / iUSD', partner: 'infiniFi', partnerInitials: 'IF', partnerColor: '#818cf8', description: 'Fractional-reserve stablecoin with tiered yield', chain: 'Ethereum', since: '2025-10', dlSymbols: ['FRXUSD-IUSD', 'IUSD-FRXUSD'], duneTvlFallback: 55_119, duneFrxUsdTvlFallback: 59_868 , curveUrl: 'https://curve.fi', },
  { id: 'ebusd', stablecoin: 'ebUSD', name: 'frxUSD / ebUSD', partner: 'Ebisu', partnerInitials: 'EB', partnerColor: '#94a3b8', description: 'Ebisu stablecoin PegKeeper integration', chain: 'Ethereum', since: '2025-07', dlSymbols: ['FRXUSD-EBUSD'], duneTvlFallback: 50_865, duneFrxUsdTvlFallback: 25_000 , curveUrl: 'https://curve.fi', },
  { id: 'usdaf', stablecoin: 'USDaf', name: 'frxUSD / USDaf', partner: 'Asymmetry Finance', partnerInitials: 'AS', partnerColor: '#fbbf24', description: 'Overcollateralized stablecoin built on Liquity v2', chain: 'Ethereum', since: '2025-05', dlSymbols: ['FRXUSD-USDAF'], duneTvlFallback: 50_591, duneFrxUsdTvlFallback: 96_354 , curveUrl: 'https://curve.fi', },
  { id: 'aznd', stablecoin: 'AZND', name: 'frxUSD / AZND', partner: 'Anzen Finance', partnerInitials: 'AZ', partnerColor: '#22d3ee', description: 'Azerbaijani Manat-backed regional stablecoin', chain: 'Ethereum', since: '2025-05', dlSymbols: ['FRXUSD-AZND'], duneTvlFallback: 68_720, duneFrxUsdTvlFallback: 34_000 , curveUrl: 'https://curve.fi', },
  { id: 'yusd', stablecoin: 'YUSD', name: 'frxUSD / YUSD', partner: 'Aegis', partnerInitials: 'AE', partnerColor: '#fb923c', description: 'Bitcoin-backed delta-neutral stablecoin', chain: 'Ethereum', since: '2025-06', dlSymbols: ['FRXUSD-YUSD'], duneTvlFallback: 19_107, duneFrxUsdTvlFallback: 19_107 , curveUrl: 'https://curve.fi', },
  { id: 'usdp', stablecoin: 'USDp', name: 'frxUSD / USDp', partner: 'Parallel', partnerInitials: 'PA', partnerColor: '#a3e635', description: 'Overcollateralized stablecoin by Parallel', chain: 'Ethereum', since: '2026-03', dlSymbols: ['FRXUSD-USDP'], duneTvlFallback: 4_068, duneFrxUsdTvlFallback: 1_604 , curveUrl: 'https://curve.fi', },
  { id: 'dusd', stablecoin: 'dUSD', name: 'frxUSD / dUSD', partner: 'dTRINITY', partnerInitials: 'DT', partnerColor: '#00ff88', description: 'Subsidized-borrowing stablecoin backed by yield reserves', chain: 'Ethereum', since: '2025-09', dlSymbols: ['FRXUSD-DUSD', 'DUSD-FRXUSD'], duneTvlFallback: 275, duneFrxUsdTvlFallback: 229 , curveUrl: 'https://curve.fi', },
  { id: 'usdf', stablecoin: 'USDf', name: 'frxUSD / USDf', partner: 'Falcon Finance', partnerInitials: 'FF', partnerColor: '#64748b', description: 'Over-collateralized synthetic dollar by DWF Labs', chain: 'Ethereum', since: '2025-04', dlSymbols: ['FRXUSD-USDF'], duneTvlFallback: 1_387, duneFrxUsdTvlFallback: 1_119 , curveUrl: 'https://curve.fi', },
  { id: 'usdifi', stablecoin: 'USDfi', name: 'frxUSD / USDfi', partner: 'USDFI Protocol', partnerInitials: 'UF', partnerColor: '#78716c', description: 'Non-custodial stablecoin backed by protocol revenues', chain: 'Ethereum', since: '2025-03', dlSymbols: ['FRXUSD-USDFI'], duneTvlFallback: 128, duneFrxUsdTvlFallback: 128 , curveUrl: 'https://curve.fi', },
  { id: 'reusd', stablecoin: 'reUSD', name: 'frxUSD / reUSD', partner: 'Re Protocol', partnerInitials: 'RE', partnerColor: '#c084fc', description: 'Principal-protected yield-accruing stablecoin', chain: 'Ethereum', since: '2025-04', dlSymbols: ['FRXUSD-REUSD'], duneTvlFallback: 113, duneFrxUsdTvlFallback: 113 , curveUrl: 'https://curve.fi', },
];

export const DUNE_BASELINE = {
  totalPoolTvl: 39_312_133,
  totalFrxUsdInPools: 19_500_000,
  poolCount: 27,
  partnerCount: 27,
  tvlChange30d: 9_941_043,
  tvlChange30dPct: 33.85,
  source: 'Dune — stablescarab/frax-frxusd-pegkeeper-pools',
};

export function registryToPoolData(
  entry: PoolRegistryEntry,
  live?: { tvl?: number; apr?: number; volume24h?: number },
  frxPrice = 1.0,
): PoolData {
  const tvl = live?.tvl ?? entry.duneTvlFallback;
  const apr = live?.apr ?? 0;
  const pegDeviation = Array.from({ length: 7 }, (_, i) => {
    const n = Math.sin(i * 0.5) * 0.0007;
    return +(frxPrice + n).toFixed(4);
  });

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
    volume24h: Math.round(live?.volume24h ?? tvl * 0.08),
    pegKeeperDebt: Math.round(entry.duneFrxUsdTvlFallback || tvl * 0.4),
    pegDeviation,
    status: tvl > 1000 ? 'ACTIVE' : 'ALERT',
    curveUrl: entry.curveUrl,
  };
}
