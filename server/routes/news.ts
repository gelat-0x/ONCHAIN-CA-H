import { Router } from 'express';
import { fetchNews } from '../services/news.ts';

export const newsRouter = Router();

newsRouter.get('/news', async (req, res) => {
  try {
    const refresh = req.query.refresh === '1';
    const data = await fetchNews(refresh);
    res.json(data);
  } catch (e) {
    console.error('[news route]', e);
    res.status(500).json({
      items: [],
      sources: [],
      lastUpdated: new Date().toISOString(),
      cached: false,
    });
  }
});
