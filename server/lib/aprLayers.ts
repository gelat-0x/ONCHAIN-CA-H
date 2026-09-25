import type { DefiLlamaYieldPool } from '../../shared/types/index.ts';
import {
  buildCurveUiYield,
  curveApyToAprDaily,
  parseCurveBaseApy,
  type CurvePoolData,
} from '../services/curve.ts';
import type { StakeDaoBoost } from '../services/stakedao.ts';

export interface AprLayers {
  baseApr: number;
  /** Curve UI Total APY at max boost (base + gauge extras) — matches curve.finance headline. */
  rewardsApy?: number;
  rewardsApr?: number;
  boostedApr?: number;
}

function okApr(n: unknown): number | undefined {
  const v = Number(n);
  if (!Number.isFinite(v) || v <= 0 || v > 500) return undefined;
  return +v.toFixed(2);
}

/**
 * Resolve the three yield layers for a PegKeeper pool:
 * 1. Base — swap/trading fees only (APR-equivalent of Curve Base APY)
 * 2. Curve total — APR-equivalent of Curve UI Total APY at max boost
 *    (Base APY + daily-compounded CRV max + extras, then APY→APR)
 * 3. Boosted — Stake DAO strategy APR (verified feed; already net of their fees)
 */
export function resolveAprLayers(input: {
  volumeApy?: number;
  curvePool?: CurvePoolData | null;
  dl?: DefiLlamaYieldPool;
  boost?: StakeDaoBoost;
}): AprLayers {
  const { volumeApy, curvePool, dl, boost } = input;
  const raw = curvePool?.raw as Record<string, unknown> | undefined;
  const dlBase = dl?.apyBase;
  const dlReward = dl?.apyReward;
  const dlCombined =
    dl?.apy ?? (dlBase != null && dlReward != null ? dlBase + dlReward : undefined);

  // Recompute UI yield with volume base APY (authoritative for Base APY on curve.finance).
  const ui = buildCurveUiYield(raw, volumeApy ?? curvePool?.baseApy);

  // --- Base (trading fees only) ---
  let baseApr =
    okApr(ui.baseApr) ??
    (volumeApy != null && volumeApy > 0 ? okApr(curveApyToAprDaily(volumeApy)) : undefined) ??
    okApr(boost?.tradingApr) ??
    (() => {
      const b = parseCurveBaseApy(raw);
      return b != null ? okApr(curveApyToAprDaily(b)) : undefined;
    })() ??
    (dlBase != null ? okApr(curveApyToAprDaily(dlBase)) : undefined);

  if (baseApr == null && ui.totalAprMax != null && ui.incentivesApy != null) {
    // Fallback: strip compounded gauge points if only a combined figure exists.
    const stripped = ui.totalApyMax != null ? ui.totalApyMax - ui.incentivesApy : undefined;
    if (stripped != null && stripped > 0) baseApr = okApr(curveApyToAprDaily(stripped));
  }

  if (baseApr == null && dlCombined != null && (dlReward == null || dlReward <= 0)) {
    baseApr = okApr(curveApyToAprDaily(dlCombined));
  }

  baseApr = baseApr ?? 0;

  // --- Curve total = APR equivalent of Curve UI Total APY (max boost, red number) ---
  let rewardsApr =
    okApr(ui.totalAprMax) ??
    okApr(curvePool?.totalAprMax) ??
    undefined;

  if (rewardsApr == null && ui.totalApyMax != null) {
    rewardsApr = okApr(curveApyToAprDaily(ui.totalApyMax));
  }

  if (rewardsApr == null && boost?.minApr != null) {
    rewardsApr = okApr(boost.minApr);
  } else if (rewardsApr == null && dlCombined != null && dlCombined > baseApr) {
    // DefiLlama yields are typically APY — convert for card APR label.
    rewardsApr = okApr(curveApyToAprDaily(dlCombined));
  } else if (rewardsApr == null && dlBase != null && dlReward != null && dlReward > 0) {
    rewardsApr = okApr(curveApyToAprDaily(dlBase + dlReward));
  }

  if (rewardsApr != null) {
    rewardsApr = Math.max(rewardsApr, baseApr);
    if (rewardsApr <= baseApr + 0.004) rewardsApr = undefined;
  }

  const rewardsApy =
    ui.totalApyMax != null && ui.totalApyMax > 0 ? okApr(ui.totalApyMax) : undefined;

  // --- Stake DAO boosted (do NOT cap Curve total by Stake DAO; SD is net of fees) ---
  let boostedApr =
    boost?.boostedApr != null && boost.boostedApr > 0 ? okApr(boost.boostedApr) : undefined;
  if (boostedApr != null) {
    boostedApr = Math.max(boostedApr, baseApr);
  }

  return {
    baseApr,
    rewardsApy,
    rewardsApr,
    boostedApr,
  };
}
