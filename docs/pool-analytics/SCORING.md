# Scoring Formulas (Lifecycle + BD Prospects)

**Framework definitions for PR A. Implementation in later PRs.**

All scores are 0–100 unless noted. Component scores must remain visible — do not hide risks in a single number.

## Lifecycle Scoring (Existing frxUSD Pools)

### Component Scores

**Liquidity Score**
- Inputs: currentTvlUsd, currentFrxUsdBalanceUsd, daysAbove100kTvl, daysAbove1mTvl
- Use log scaling or percentiles to prevent giant pools from dominating.

**frxUSD Depth Score**
- Inputs: currentFrxUsdBalanceUsd, frxUSD share of pool, 30d/90d average frxUSD balance.

**Activity Score**
- Primary: trueSwapVolume30dUsd (if available)
- Fallback: activeVolumeDays, volumeTvlRatio30d (capped)
- transferProxyFlow30d only with explicit penalty if no true volume.

**Persistence Score**
- Inputs: poolAgeDays, activeLiquidityDays / poolAgeDays, daysAbove100kTvl / poolAgeDays, currentTvl / peakTvl, TVL stability over 90d.

**Organic Usage Score**
- Sustained volume without extreme reward spikes.
- Repeated activity across many days.
- Lower incentive dependence.

**Decay Risk** (higher = worse)
- drawdownFromPeakPct, days since last meaningful volume/TVL > 100k, current vs peak.

**Incentive Dependence Risk** (higher = worse)
- High APY spike followed by TVL collapse.
- Gauge existed but activity disappeared.
- Large peak with low current activity.

**Data Quality Score**
- Verified address + token addresses
- Historical daily TVL available
- True volume available
- APR/gauge status known

### Ranking Formulas

**overallCurrentRankScore** =
0.30 * liquidityScore +
0.25 * activityScore +
0.20 * frxUsdDepthScore +
0.15 * persistenceScore +
0.10 * dataQualityScore -
0.10 * decayRisk

**overallLifecycleRankScore** =
0.25 * persistenceScore +
0.20 * activityScore +
0.20 * organicUsageScore +
0.15 * liquidityScore +
0.10 * frxUsdDepthScore +
0.10 * dataQualityScore -
0.10 * incentiveDependenceRisk

**bdRelevanceScore** =
0.30 * frxUsdDepthScore +
0.25 * activityScore +
0.20 * liquidityScore +
0.15 * organicUsageScore +
0.10 * dataQualityScore -
0.10 * decayRisk

## BD Prospect Scoring (frxUSD-only)

**Yield-Sharing Opportunity Score**
- Based on yieldSharingDeltaApy, baseAnnualYieldSharingOpportunityUsd, size of replaceable dollar leg.

**LP Mindset Fit Score**
- Does frxUSD improve net economics while preserving stablecoin characteristics?
- Avoids wrapper complexity?
- Supports Curve-style liquidity incentives?

**Liquidity Migration Score**
- Current TVL/depth, replaceability of dollar leg, technical fit.

**Strategic Fit Score**
- Stablecoin project relevance, RWA adjacency, Curve/Frax ecosystem fit, partner quality.

**Distribution Opportunity Score**
- Potential frxUSD liquidity + volume, ecosystem visibility, market gap.

**BD Actionability Score**
- Known contacts, governance path, existing relationship, ease of test.

**Risk / Friction Score** (higher = worse)
- Incumbent USDC/USDT relationships, liquidity inertia, technical issues, low activity.

**bdProspectScore** =
0.25 * Yield-Sharing Opportunity Score +
0.20 * Distribution Opportunity Score +
0.15 * Strategic Fit Score +
0.15 * Liquidity Migration Score +
0.10 * LP Mindset Fit Score +
0.10 * BD Actionability Score +
0.05 * Data Quality Score -
0.10 * Risk / Friction Score

## APY Assumption Governance (BD Module)

- `fraxYieldSharingAssumptionApy` is **always explicit**.
- Must be either manual (documented) or official-source-backed.
- Every opportunity number **must print** the assumption used.
- Manual assumption → `confidence` cannot be "high".
- Scenarios always use the same documented APY value.

Example required output:
"Base-case annualized yield-sharing opportunity: $X (using 7.5% Frax yield-sharing assumption, 50% migration of dollar leg)."

## Classification Logic (Summary)

See DESIGN.md for full rules. Key categories: healthy, active, incentive-driven, fading, dormant, dead, new, unverified, not-applicable.

## Mock Scoring Example

See the dry-run output from `npm run generate:lifecycle` (or equivalent) for illustrative numbers only. All real scoring will use verified data sources.