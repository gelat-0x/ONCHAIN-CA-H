import { Router } from 'express';
import { fetchXTimeline } from '../services/xTimeline.ts';

export const xRouter = Router();

xRouter.get('/x/timeline/:account', async (req, res) => {
  try {
    const account = String(req.params.account ?? '').trim();
    if (!account) {
      res.status(400).json({
        posts: [],
        account: '',
        lastUpdated: new Date().toISOString(),
        cached: false,
        error: 'empty',
      });
      return;
    }
    const refresh = req.query.refresh === '1';
    const data = await fetchXTimeline(account, refresh);
    res.json(data);
  } catch (e) {
    console.error('[x route]', e);
    res.status(500).json({
      posts: [],
      account: String(req.params.account ?? ''),
      lastUpdated: new Date().toISOString(),
      cached: false,
      error: 'fetch_failed',
    });
  }
});
