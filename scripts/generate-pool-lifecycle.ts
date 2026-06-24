#!/usr/bin/env tsx
/**
 * generate-pool-lifecycle.ts
 *
 * PR A — Framework Only dry-run script.
 *
 * Purpose:
 * - Demonstrate the intended output shapes for PoolLifecycleSummary and BdProspectPool.
 * - Use only mocked/static sample data.
 * - Never writes generated files to the repo by default.
 *
 * Usage:
 *   npx tsx scripts/generate-pool-lifecycle.ts
 *
 * Optional (writes only to /tmp — never committed):
 *   npx tsx scripts/generate-pool-lifecycle.ts --write-temp
 *
 * This script does NOT:
 * - Use real Dune or Curve data
 * - Touch the pool registry
 * - Include unverified pools (e.g. usdifi)
 * - Include any sfrxUSD logic
 * - Write anything to the working tree unless --write-temp is used
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { PoolLifecycleSummary, BdProspectPool } from '../shared/types/poolLifecycle';
import { MOCK_POC_POOLS, mockComputeLifecycleScores } from './fixtures/mockPoolLifecycleData';

const WRITE_TEMP = process.argv.includes('--write-temp');

function buildMockLifecycleSummary(input: any, scores: any): PoolLifecycleSummary {
  const retention = input.currentTvlUsd / Math.max(input.peakTvlUsd, 1);
  const drawdown = Math.round((1 - retention) * 1000) / 10;

  return {
    poolId: input.poolId,
    poolAddress: null, // Will be populated from registry in real runs (not in this dry-run)
    stablecoin: input.poolName.split(' / ')[1] || 'UNKNOWN',
    partner: input.partner,
    poolType: 'verified-pegkeeper-style-pool',

    createdAt: null,
    firstLiquidityDate: null,
    firstMeaningfulTvlDate: null,
    firstMeaningfulVolumeDate: null,

    currentTvlUsd: input.currentTvlUsd,
    currentFrxUsdBalanceUsd: input.currentFrxUsdBalanceUsd,
    currentTrueVolume7dUsd: Math.round(input.currentTrueVolume30dUsd / 4),
    currentTrueVolume30dUsd: input.currentTrueVolume30dUsd,
    currentTransferProxyFlow30dUsd: null,

    peakTvlUsd: input.peakTvlUsd,
    peakTvlDate: null,
    peakVolumeUsd: null,
    peakVolumeDate: null,

    lifetimeTrueVolumeUsd: null,
    poolAgeDays: input.poolAgeDays,
    activeLiquidityDays: input.activeLiquidityDays,
    activeVolumeDays: Math.round(input.activeLiquidityDays * 0.9),

    daysAbove10kTvl: Math.round(input.activeLiquidityDays * 0.95),
    daysAbove100kTvl: input.currentTvlUsd > 100000 ? Math.round(input.activeLiquidityDays * 0.8) : 12,
    daysAbove1mTvl: input.currentTvlUsd > 1000000 ? Math.round(input.activeLiquidityDays * 0.6) : 0,

    drawdownFromPeakPct: drawdown,
    tvlRetentionPct: Math.round(retention * 1000) / 10,
    volumeTvlRatio30d: Math.round((input.currentTrueVolume30dUsd / Math.max(input.currentTvlUsd, 1)) * 100) / 100,

    averageApy30d: null,
    averageApy90d: null,
    maxObservedApy: null,

    classification: scores.classification as any,

    liquidityScore: scores.liquidityScore,
    activityScore: scores.activityScore,
    persistenceScore: scores.persistenceScore,
    frxUsdDepthScore: scores.frxUsdDepthScore,
    organicUsageScore: Math.round(scores.persistenceScore * 0.85),
    dataQualityScore: scores.dataQualityScore,

    decayRisk: scores.decayRisk,
    incentiveDependenceRisk: Math.round(scores.decayRisk * 0.7),

    overallCurrentRankScore: scores.overallCurrentRankScore,
    overallLifecycleRankScore: Math.round(scores.overallCurrentRankScore * 0.95),
    bdRelevanceScore: Math.round(scores.overallCurrentRankScore * 0.88),

    notes: ['Mock data for framework demonstration only (PR A)'],
    caveats: [
      'All values are illustrative.',
      'Real implementation will source from verified Dune + Curve API.',
      'Token composition verification step is required before production use.',
    ],
  };
}

function buildMockBdProspect(): BdProspectPool {
  const assumption = 7.5; // documented manual assumption for demo
  const eligible = 420000;

  const baseOpportunity = Math.round(eligible * (assumption / 100) * 0.5);

  return {
    prospectId: 'bold-usdc-demo',
    project: 'BOLD (Liquity v2 fork)',
    currentPoolName: 'BOLD / USDC',
    currentPoolAddress: '0x0000000000000000000000000000000000000000', // placeholder only
    chain: 'Ethereum',
    venue: 'curve',

    currentAssets: ['BOLD', 'USDC'],
    currentDollarLeg: 'USDC',
    proposedFraxLeg: 'frxUSD',

    currentTvlUsd: 1850000,
    currentDollarLegLiquidityUsd: eligible,
    currentVolume7dUsd: 3200000,
    currentVolume30dUsd: 12500000,

    incumbentDollarYieldApy: 0.5,
    fraxYieldSharingAssumptionApy: assumption,
    yieldSharingDeltaApy: assumption - 0.5,

    conservativeEligibleLiquidityUsd: Math.round(eligible * 0.25),
    baseEligibleLiquidityUsd: eligible,
    aggressiveEligibleLiquidityUsd: eligible,

    conservativeAnnualYieldSharingOpportunityUsd: Math.round(eligible * (assumption / 100) * 0.25),
    baseAnnualYieldSharingOpportunityUsd: baseOpportunity,
    aggressiveAnnualYieldSharingOpportunityUsd: Math.round(eligible * (assumption / 100)),

    liquidityCostOfCurrentStructureUsd: Math.round(eligible * ((assumption - 0.5) / 100)),
    estimatedAdditionalIncentivesNeededWithoutFrxUsdUsd: null,
    estimatedLpIncentiveCapacityUsd: baseOpportunity,

    currentLiquidityEfficiency: 1.8,
    projectedLiquidityEfficiencyWithFrxUsd: 2.4,

    liquidityMigrationDifficulty: 'medium',
    technicalFit: 'strong',
    lpMindsetFit: 'medium',
    bdFit: 'strong',

    suggestedMotion: 'propose-frxusd-incentive-test',
    confidence: 'medium',

    apyAssumptionNotes: `Using ${assumption}% Frax yield-sharing assumption (manual for framework demo). Manual assumptions limit confidence to 'medium'.`,

    caveats: [
      'Mock prospect for PR A demonstration only.',
      'Real BD numbers require verified liquidity data and documented APY source.',
    ],
    sources: ['Framework mock data (PR A)'],
  };
}

async function main() {
  console.log('=== Pool Lifecycle Framework Dry-Run (PR A — Framework Only) ===\n');
  console.log('Using mocked static data only. No real data sources.');
  console.log('No files will be written to the repository.\n');

  const summaries: PoolLifecycleSummary[] = MOCK_POC_POOLS.map(input => {
    const scores = mockComputeLifecycleScores(input);
    return buildMockLifecycleSummary(input, scores);
  });

  const bdProspect = buildMockBdProspect();

  // Demonstrate output shapes
  console.log('--- Lifecycle Summaries (5 verified POC pools) ---');
  summaries.forEach(s => {
    console.log(`\n${s.poolId} (${s.partner})`);
    console.log(`  Classification: ${s.classification}`);
    console.log(`  Current TVL: $${s.currentTvlUsd?.toLocaleString()}`);
    console.log(`  frxUSD Balance: $${s.currentFrxUsdBalanceUsd?.toLocaleString()}`);
    console.log(`  Overall Current Rank Score: ${s.overallCurrentRankScore}`);
    console.log(`  Decay Risk: ${s.decayRisk}`);
    console.log(`  Notes: ${s.notes[0]}`);
  });

  console.log('\n--- BD Prospect Example (frxUSD only, no sfrxUSD) ---');
  console.log(`Project: ${bdProspect.project}`);
  console.log(`Current: ${bdProspect.currentPoolName}`);
  console.log(`Base Annual Yield-Sharing Opportunity: $${bdProspect.baseAnnualYieldSharingOpportunityUsd?.toLocaleString()}`);
  console.log(`APY Assumption: ${bdProspect.apyAssumptionNotes}`);
  console.log(`Suggested Motion: ${bdProspect.suggestedMotion}`);
  console.log(`Confidence: ${bdProspect.confidence}`);

  console.log('\n=== Dry-run complete ===');
  console.log('This output demonstrates the intended data shapes for the framework.');
  console.log('Real implementation (PR B+) will populate from verified sources.');

  if (WRITE_TEMP) {
    const tmpDir = '/tmp/pool-lifecycle-dryrun';
    mkdirSync(tmpDir, { recursive: true });

    const outPath = join(tmpDir, 'mock-lifecycle-dryrun.json');
    writeFileSync(outPath, JSON.stringify({ summaries, bdProspect }, null, 2));

    console.log(`\n[INFO] Wrote sample output to ${outPath} (temporary location — not committed)`);
  } else {
    console.log('\n[INFO] No files written (use --write-temp to write to /tmp only).');
  }
}

main().catch(console.error);