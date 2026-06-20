import { POOL_REGISTRY, registryToPoolData } from '../shared/data/poolRegistry.ts';
import { findDuneRowForPool } from '../server/services/dune.ts';

// Simulate the exact Dune result from the live query
const mockDune = {
  rows: [{
    pool_address: '0x13e12bb0e6a2f1a3d6901a59a9d585e89a6243e1',
    pool_name: 'crvUSD/frxUSD',
    stablecoin: 'crvUSD',
    total_tvl: 13616210,
    frxusd_balance: 3544774,
    volume_24h: 935000,
    last_updated: new Date().toISOString()
  }],
  lastUpdated: new Date(),
  isStale: false,
  source: 'dune' as const
};

let duneAppliedCount = 0;
const poolsWithFrxUsdBalance: string[] = [];
const poolsWithPegKeeperDebt: string[] = [];

for (const entry of POOL_REGISTRY) {
  const duneRow = findDuneRowForPool(mockDune, entry);

  // Simulate what the builder does
  const base = registryToPoolData(entry, { tvl: 1000000, apr: 0 }, 1.0);

  if (duneRow && !mockDune.isStale) {
    const frxUsdBal = duneRow.frxusd_balance;
    if (frxUsdBal > 50) {
      (base as any).frxUsdBalanceUsd = Math.round(frxUsdBal);
      base.pegKeeperDebt = Math.round(frxUsdBal);  // still done for frontend compat
    }
  }

  // IMPORTANT: For validating Dune application, use ONLY frxUsdBalanceUsd
  if ((base as any).frxUsdBalanceUsd != null && (base as any).frxUsdBalanceUsd > 0) {
    duneAppliedCount++;
    poolsWithFrxUsdBalance.push(entry.id);
  }

  // Legacy pegKeeperDebt is present on ALL pools from registry
  if (base.pegKeeperDebt > 0) {
    poolsWithPegKeeperDebt.push(entry.id);
  }
}

console.log('=== Dune Application Validation (using ONLY frxUsdBalanceUsd) ===\n');
console.log(`Pools with frxUsdBalanceUsd set from Dune: ${duneAppliedCount}`);
console.log(`IDs: ${poolsWithFrxUsdBalance.join(', ')}`);

console.log(`\nPools with pegKeeperDebt > 0 (includes legacy registry fallbacks): ${poolsWithPegKeeperDebt.length}`);

if (duneAppliedCount === 1 && poolsWithFrxUsdBalance[0] === 'crvusd') {
  console.log('\n✅ PASS: Only crvusd has frxUsdBalanceUsd (Dune data applied)');
  console.log('   Other pools correctly have frxUsdBalanceUsd = undefined (or absent)');
} else {
  console.log('\n❌ FAIL');
  process.exit(1);
}
