import { Router } from 'express';
import { isChartRange } from '../../shared/constants/chartRanges.ts';
import { tokenById } from '../../shared/data/tokenCatalog.ts';
import {
  buildChartsWatchlist,
  buildTokenChartHistory,
} from '../builders/charts.ts';
import {
  clearChartsCache,
  getChartsCache,
  getHistoryCache,
  setChartsCache,
  setHistoryCache,
  staleCharts,
} from '../services/cache.ts';

export const chartsRouter = Router();

chartsRouter.get('/charts/watchlist', async (req, res) => {
  if (req.query.refresh === '1') clearChartsCache();
  const cached = getChartsCache('watchlist');
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const data = await buildChartsWatchlist();
    setChartsCache(data, 'watchlist');
    res.json(data);
  } catch (e) {
    console.error('[charts/watchlist]', e);
    const stale = staleCharts();
    if (stale) return res.json({ ...stale, cached: true });
    res.status(500).json({ error: 'Failed to load watchlist' });
  }
});

chartsRouter.get('/charts/history/:tokenId', async (req, res) => {
  const tokenId = String(req.params.tokenId ?? '');
  const rangeRaw = String(req.query.range ?? '30');
  const range = isChartRange(rangeRaw) ? rangeRaw : '30';
  const refresh = req.query.refresh === '1';

  if (!tokenById(tokenId)) {
    return res.status(404).json({ error: 'Unknown token' });
  }

  if (!refresh) {
    const cached = getHistoryCache(tokenId, range);
    if (cached) return res.json({ ...cached, cached: true });
  }

  try {
    const data = await buildTokenChartHistory(tokenId, range);
    if (!data) return res.status(404).json({ error: 'Token not found' });
    setHistoryCache(tokenId, range, data);
    res.json({ ...data, cached: false });
  } catch (e) {
    console.error('[charts/history]', e);
    res.status(500).json({ error: 'Failed to load chart history' });
  }
});

/** Legacy combined endpoint */
chartsRouter.get('/charts', async (req, res) => {
  const rangeRaw = String(req.query.range ?? '30');
  const range = isChartRange(rangeRaw) ? rangeRaw : '30';

  if (req.query.refresh === '1') clearChartsCache();

  const cached = getChartsCache(range);
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const { buildChartsData } = await import('../builders/charts.ts');
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
