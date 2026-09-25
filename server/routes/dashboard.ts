import { Router } from 'express';
import { buildDashboardData, buildDashboardFallback } from '../builders/dashboard.ts';
import { getDashboardCache, setDashboardCache, staleDashboard, clearDashboardCache } from '../services/cache.ts';

import { sanitizeDashboardData } from '../../shared/lib/sanitizeMetrics.ts';
import { POOL_REGISTRY } from '../../shared/data/poolRegistry.ts';

export const dashboardRouter = Router();

let dashboardBuild: Promise<Awaited<ReturnType<typeof buildDashboardData>>> | null = null;

function sendDashboard(res: import('express').Response, data: Awaited<ReturnType<typeof buildDashboardData>>) {
  res.json(sanitizeDashboardData(data, POOL_REGISTRY));
}

dashboardRouter.get('/dashboard', async (req, res) => {
  const forceRefresh = req.query.refresh === '1';
  if (forceRefresh) clearDashboardCache();

  const cached = getDashboardCache();
  if (cached && !forceRefresh) return sendDashboard(res, { ...cached, cached: true });

  try {
    if (!dashboardBuild) {
      dashboardBuild = buildDashboardData().finally(() => {
        dashboardBuild = null;
      });
    }
    const data = await dashboardBuild;
    setDashboardCache(data);
    sendDashboard(res, { ...data, cached: false });
  } catch (e) {
    console.error('[dashboard]', e);
    const stale = staleDashboard();
    if (stale) return sendDashboard(res, { ...stale, cached: true });
    sendDashboard(res, buildDashboardFallback());
  }
});
