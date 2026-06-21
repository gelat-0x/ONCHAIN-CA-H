import { fetchCurvePools, fetchCurveVolumes, matchCurvePool, matchCurveVolume } from '../server/services/curve.ts';
import { POOL_REGISTRY } from '../shared/data/poolRegistry.ts';

async function main() {
  console.log("=== Testing crvusd pool ===\n");

  const [curvePools, curveVolumes] = await Promise.all([
    fetchCurvePools(),
    fetchCurveVolumes(),
  ]);

  const crvusdEntry = POOL_REGISTRY.find(p => p.id === 'crvusd');
  if (!crvusdEntry) {
    console.log("ERROR: crvusd entry not found");
    return;
  }

  console.log("Registry entry for crvusd:");
  console.log("  curvePoolAddress:", crvusdEntry.curvePoolAddress);

  const poolMatch = matchCurvePool(curvePools, crvusdEntry);
  console.log("\nCurve pool match:", !!poolMatch);
  if (poolMatch) {
    console.log("  tvlUsd:", poolMatch.tvlUsd);
    console.log("  apy:", poolMatch.apy);
  }

  const volMatch = matchCurveVolume(curveVolumes, crvusdEntry);
  console.log("\nCurve volume match:", !!volMatch);
  if (volMatch) {
    console.log("  volumeUsd24h:", volMatch.volumeUsd24h);
  }

  // Also print debug sample for this address
  console.log("\n--- Running debugCurveSample for this pool ---");
  // We can call it directly if exported, or just log
  const debugPool = curvePools.find(p => p.address === crvusdEntry.curvePoolAddress?.toLowerCase());
  const debugVol = curveVolumes.find(v => v.address === crvusdEntry.curvePoolAddress?.toLowerCase());
  console.log("Direct debug pool found:", !!debugPool);
  if (debugPool) console.dir({tvlUsd: debugPool.tvlUsd, apy: debugPool.apy}, {depth: 1});
  console.log("Direct debug volume found:", !!debugVol);
  if (debugVol) console.dir({volumeUsd24h: debugVol.volumeUsd24h}, {depth: 1});
}

main().catch(console.error);
