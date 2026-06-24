/**
 * Mock data for dry-run / framework demonstration only.
 * All numbers are illustrative and not real analytics.
 *
 * Used exclusively by scripts/generate-pool-lifecycle.ts in PR A.
 * Real data will come from verified Dune + Curve sources in later PRs.
 */

import type { MockPoolSummaryInput } from '../../shared/types/poolLifecycle';

export const MOCK_POC_POOLS: MockPoolSummaryInput[] = [
  {
    poolId: 'crvusd',
    poolName: 'frxUSD / crvUSD',
    partner: 'Curve Finance',
    currentTvlUsd: 27426137,
    currentFrxUsdBalanceUsd: 12180446,
    peakTvlUsd: 32000000,
    currentTrueVolume30dUsd: 185000000,
    poolAgeDays: 180,
    activeLiquidityDays: 175,
  },
  {
    poolId: 'usd3',
    poolName: 'frxUSD / USD3',
    partner: '3Jane',
    currentTvlUsd: 1550000,
    currentFrxUsdBalanceUsd: 775000,
    peakTvlUsd: 1800000,
    currentTrueVolume30dUsd: 4200000,
    poolAgeDays: 25,
    activeLiquidityDays: 24,
  },
  {
    poolId: 'pmusd',
    poolName: 'frxUSD / pmUSD',
    partner: 'RAAC Protocol',
    currentTvlUsd: 467604,
    currentFrxUsdBalanceUsd: 310461,
    peakTvlUsd: 520000,
    currentTrueVolume30dUsd: 980000,
    poolAgeDays: 90,
    activeLiquidityDays: 82,
  },
  {
    poolId: 'yusd',
    poolName: 'frxUSD / YUSD',
    partner: 'Aegis',
    currentTvlUsd: 19107,
    currentFrxUsdBalanceUsd: 19107,
    peakTvlUsd: 25000,
    currentTrueVolume30dUsd: 45000,
    poolAgeDays: 110,
    activeLiquidityDays: 65,
  },
  {
    poolId: 'dusd',
    poolName: 'frxUSD / dUSD',
    partner: 'dTRINITY',
    currentTvlUsd: 275,
    currentFrxUsdBalanceUsd: 229,
    peakTvlUsd: 1200,
    currentTrueVolume30dUsd: 3200,
    poolAgeDays: 280,
    activeLiquidityDays: 48,
  },
];

// Simple mock scoring function for dry-run demonstration only
export function mockComputeLifecycleScores(input: MockPoolSummaryInput) {
  const tvlRatio = Math.min(input.currentTvlUsd / Math.max(input.peakTvlUsd, 1), 1);
  const activityRatio = input.activeLiquidityDays / Math.max(input.poolAgeDays, 1);

  const liquidityScore = Math.min(100, Math.round(Math.log10(input.currentTvlUsd + 1) * 12));
  const persistenceScore = Math.round(activityRatio * 70 + tvlRatio * 30);
  const activityScore = Math.min(100, Math.round(Math.log10(input.currentTrueVolume30dUsd + 1) * 9));
  const frxUsdDepthScore = Math.min(100, Math.round((input.currentFrxUsdBalanceUsd / Math.max(input.currentTvlUsd, 1)) * 100));
  const dataQualityScore = 85; // mocked as "medium-high" for framework demo

  const decayRisk = Math.round((1 - tvlRatio) * 70 + (1 - activityRatio) * 30);

  const overallCurrent = Math.round(
    0.30 * liquidityScore +
    0.25 * activityScore +
    0.20 * frxUsdDepthScore +
    0.15 * persistenceScore +
    0.10 * dataQualityScore -
    0.10 * decayRisk
  );

  return {
    liquidityScore: Math.max(0, Math.min(100, liquidityScore)),
    activityScore: Math.max(0, Math.min(100, activityScore)),
    persistenceScore: Math.max(0, Math.min(100, persistenceScore)),
    frxUsdDepthScore: Math.max(0, Math.min(100, frxUsdDepthScore)),
    dataQualityScore,
    decayRisk: Math.max(0, Math.min(100, decayRisk)),
    overallCurrentRankScore: Math.max(0, Math.min(100, overallCurrent)),
    classification: input.currentTvlUsd > 1000000 ? 'healthy' :
                   input.currentTvlUsd > 100000 ? 'active' : 'dormant',
  };
}