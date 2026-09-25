import { Router } from 'express';
import { buildProtocolCharts } from '../builders/protocolCharts.ts';

export const protocolChartsRouter = Router();

let cache: { data: Awaited<ReturnType<typeof buildProtocolCharts>>; ts: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

protocolChartsRouter.get('/charts/protocol', async (req, res) => {
  const force = req.query.refresh === '1';
  if (!force && cache && Date.now() - cache.ts < CACHE_MS) {
    return res.json({ ...cache.data, cached: true });
  }

  try {
    const data = await buildProtocolCharts();
    cache = { data, ts: Date.now() };
    res.json(data);
  } catch (e) {
    console.error('[charts/protocol]', e);
    if (cache) return res.json({ ...cache.data, cached: true });
    res.status(500).json({
      familyTvl: { label: 'PegKeeper family TVL', source: 'DefiLlama', points: [] },
      frxUsdSupply: { label: 'frxUSD circulating supply', source: 'DefiLlama', points: [] },
      protocolAnalyses: [],
      frxUsdMintRedeem: null,
      lastUpdated: new Date().toISOString(),
      cached: false,
      dataSource: 'error',
    });
  }
});
