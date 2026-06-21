import { buildDashboardData } from '../server/builders/dashboard.ts';
import * as duneService from '../server/services/dune.ts';
import { POOL_REGISTRY } from '../shared/data/poolRegistry.ts';

async function main() {
  // Mock the Dune result with the user-provided sample
  const sampleRow = {
    pool_address: "0x13e12bb0e6a2f1a3d6901a59a9d585e89a6243e1",
    pool_name: "crvUSD/frxUSD",
    stablecoin: "crvUSD",
    total_tvl: 13616210.853630725,
    frxusd_balance: 3544773.957831137,
    volume_24h: 983143.7735808247,
    last_updated: "2026-06-20T12:00:00Z"
  };

  const mockDuneResult = {
    rows: [sampleRow],
    lastUpdated: new Date(),
    isStale: false,
    source: 'dune' as const
  };

  // Override the fetch function for this test
  const originalFetch = duneService.fetchDunePegKeeperData;
  (duneService as any).fetchDunePegKeeperData = async () => mockDuneResult;

  try {
    const data = await buildDashboardData();
    const crv = data.pools.find(p => p.id === 'crvusd');
    if (crv) {
      console.log('✅ crvusd in dashboard data');
      console.log('tvl:', crv.tvl);
      console.log('apr:', crv.apr);
      console.log('pegKeeperDebt:', crv.pegKeeperDebt);
      console.log('frxUsdBalanceUsd:', crv.frxUsdBalanceUsd);
      console.log('volume24h:', crv.volume24h);
      console.log('dataSource:', data.dataSource);
    } else {
      console.log('crvusd not found');
    }
  } finally {
    (duneService as any).fetchDunePegKeeperData = originalFetch;
  }
}

main().catch(console.error);