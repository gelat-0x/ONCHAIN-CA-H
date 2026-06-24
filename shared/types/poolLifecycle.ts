/**
 * Pool Lifecycle Analytics & BD Prospect Types
 *
 * Framework-only types for PR A.
 * These define the data model for:
 * - Existing direct frxUSD Curve pool lifecycle analysis
 * - BD prospect yield-sharing opportunity analysis (frxUSD only)
 *
 * IMPORTANT:
 * - All types are read-only / framework definitions at this stage.
 * - No sfrxUSD logic is included in BD prospect types.
 * - usdifi and other unverified pools must not be used in real scoring until verified.
 */

export type PoolType =
  | 'direct-frxusd-curve-pool'
  | 'verified-pegkeeper-style-pool'
  | 'sfrxusd-exposure-pool'
  | 'non-frxusd-pool'
  | 'unverified'
  | 'deprecated-or-obsolete';

export type VolumeSource =
  | 'curve-api'
  | 'verified-dune-swap-events'
  | 'transfer-proxy'
  | 'unavailable';

export type AprSource =
  | 'curve-api-current'
  | 'curve-api-historical'
  | 'gauge-data'
  | 'manual'
  | 'unavailable';

export type DataQuality = 'high' | 'medium' | 'low' | 'unusable';

export type Classification =
  | 'healthy'
  | 'active'
  | 'incentive-driven'
  | 'fading'
  | 'dormant'
  | 'dead'
  | 'new'
  | 'unverified'
  | 'not-applicable';

export type LiquidityMigrationDifficulty = 'low' | 'medium' | 'high' | 'unknown';
export type TechnicalFit = 'strong' | 'medium' | 'weak' | 'not-applicable';
export type LpMindsetFit = 'strong' | 'medium' | 'weak' | 'unknown';
export type BdFit = 'strong' | 'medium' | 'weak' | 'ignore';
export type SuggestedMotion =
  | 'propose-frxusd-pair'
  | 'propose-frxusd-incentive-test'
  | 'propose-curve-gauge-or-vote-alignment'
  | 'propose-liquidity-cost-analysis'
  | 'monitor-only'
  | 'ignore';
export type Confidence = 'high' | 'medium' | 'low';

export interface PoolLifecycleDailySnapshot {
  date: string; // YYYY-MM-DD
  poolId: string;
  poolName: string;
  chain: string;
  poolAddress: string;
  stablecoin: string;
  poolType: PoolType;

  tvlUsd: number | null;
  frxUsdBalanceUsd: number | null;
  pairedAssetBalanceUsd: number | null;
  poolImbalancePct: number | null;

  trueSwapVolumeUsd: number | null;
  transferProxyFlowUsd: number | null;
  volumeSource: VolumeSource;

  baseApy: number | null;
  rewardsApy: number | null;
  totalApy: number | null;
  aprSource: AprSource;

  gaugeAddress: string | null;
  hasGauge: boolean | null;

  dataQuality: DataQuality;
}

export interface PoolLifecycleSummary {
  poolId: string;
  poolAddress: string | null;
  stablecoin: string;
  partner: string;
  poolType: PoolType;

  createdAt: string | null;
  firstLiquidityDate: string | null;
  firstMeaningfulTvlDate: string | null;
  firstMeaningfulVolumeDate: string | null;

  currentTvlUsd: number | null;
  currentFrxUsdBalanceUsd: number | null;
  currentTrueVolume7dUsd: number | null;
  currentTrueVolume30dUsd: number | null;
  currentTransferProxyFlow30dUsd: number | null;

  peakTvlUsd: number | null;
  peakTvlDate: string | null;
  peakVolumeUsd: number | null;
  peakVolumeDate: string | null;

  lifetimeTrueVolumeUsd: number | null;
  poolAgeDays: number | null;
  activeLiquidityDays: number;
  activeVolumeDays: number;

  daysAbove10kTvl: number;
  daysAbove100kTvl: number;
  daysAbove1mTvl: number;

  drawdownFromPeakPct: number | null;
  tvlRetentionPct: number | null;
  volumeTvlRatio30d: number | null;

  averageApy30d: number | null;
  averageApy90d: number | null;
  maxObservedApy: number | null;

  classification: Classification;

  liquidityScore: number;
  activityScore: number;
  persistenceScore: number;
  frxUsdDepthScore: number;
  organicUsageScore: number;
  dataQualityScore: number;

  decayRisk: number;
  incentiveDependenceRisk: number;

  overallCurrentRankScore: number;
  overallLifecycleRankScore: number;
  bdRelevanceScore: number;

  notes: string[];
  caveats: string[];
}

export interface BdProspectPool {
  prospectId: string;
  project: string;
  currentPoolName: string;
  currentPoolAddress: string;
  chain: string;
  venue: 'curve' | 'balancer' | 'uniswap' | 'fluid' | 'other';

  currentAssets: string[];
  currentDollarLeg: 'USDC' | 'USDT' | 'DAI' | 'crvUSD' | 'other';
  proposedFraxLeg: 'frxUSD';

  currentTvlUsd: number | null;
  currentDollarLegLiquidityUsd: number | null;
  currentVolume7dUsd: number | null;
  currentVolume30dUsd: number | null;

  // APY assumptions must be explicitly documented (manual or official)
  incumbentDollarYieldApy: number | null;
  fraxYieldSharingAssumptionApy: number | null; // MUST be documented
  yieldSharingDeltaApy: number | null;

  conservativeEligibleLiquidityUsd: number | null;
  baseEligibleLiquidityUsd: number | null;
  aggressiveEligibleLiquidityUsd: number | null;

  conservativeAnnualYieldSharingOpportunityUsd: number | null;
  baseAnnualYieldSharingOpportunityUsd: number | null;
  aggressiveAnnualYieldSharingOpportunityUsd: number | null;

  liquidityCostOfCurrentStructureUsd: number | null;
  estimatedAdditionalIncentivesNeededWithoutFrxUsdUsd: number | null;
  estimatedLpIncentiveCapacityUsd: number | null;

  currentLiquidityEfficiency: number | null;
  projectedLiquidityEfficiencyWithFrxUsd: number | null;

  liquidityMigrationDifficulty: LiquidityMigrationDifficulty;
  technicalFit: TechnicalFit;
  lpMindsetFit: LpMindsetFit;
  bdFit: BdFit;

  suggestedMotion: SuggestedMotion;
  confidence: Confidence;

  // Every opportunity number must reference the exact APY assumption used
  apyAssumptionNotes: string;

  caveats: string[];
  sources: string[];
}

// Helper for mock data in dry-run scripts (framework only)
export interface MockPoolSummaryInput {
  poolId: string;
  poolName: string;
  partner: string;
  currentTvlUsd: number;
  currentFrxUsdBalanceUsd: number;
  peakTvlUsd: number;
  currentTrueVolume30dUsd: number;
  poolAgeDays: number;
  activeLiquidityDays: number;
}