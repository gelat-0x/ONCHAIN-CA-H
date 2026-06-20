import { Router } from 'express';
import { buildDashboardData, buildDashboardFallback } from '../builders/dashboard.ts';
import { getDashboardCache, setDashboardCache, staleDashboard } from '../services/cache.ts';

export const dashboardRouter = Router();

dashboardRouter.get('/dashboard', async (_req, res) => {
  const cached = getDashboardCache();
  if (cached) return res.json({ ...cached, cached: true });

  try {
    const data = await buildDashboardData();
    setDashboardCache(data);
    res.json(data);
  } catch (e) {
    console.error('[dashboard]', e);
    const stale = staleDashboard();
    if (stale) return res.json({ ...stale, cached: true });
    res.status(200).json(buildDashboardFallback());
  }
});
