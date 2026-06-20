import { Router } from 'express';
import type { ChartRange } from '../../shared/types/index.ts';
import { buildChartsData } from '../builders/charts.ts';
import { getChartsCache, setChartsCache, staleCharts } from '../services/cache.ts';

export const chartsRouter = Router();

chartsRouter.get('/charts', async (req, res) => {
  const range = (['1', '7', '30', '90', '365'].includes(String(req.query.range))
    ? String(req.query.range)
    : '30') as ChartRange;

  const cached = getChartsCache(range);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const data = await buildChartsData(range);
    setChartsCache(data, range);
    res.json(data);
  } catch (e) {
    console.error('[charts]', e);
    const stale = staleCharts();
    if (stale) return res.json({ ...stale, cached: true });
    res.status(500).json({ error: 'Failed to load chart data' });
  }
});
