import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { healthRouter } from './routes/health.ts';
import { dashboardRouter } from './routes/dashboard.ts';
import { chartsRouter } from './routes/charts.ts';
import { protocolChartsRouter } from './routes/protocolCharts.ts';
import { newsRouter } from './routes/news.ts';
import { xRouter } from './routes/x.ts';

import { learnRouter } from './routes/learn.ts';
import { showRouter } from './routes/show.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.use('/api', healthRouter);
  app.use('/api', dashboardRouter);
  app.use('/api', chartsRouter);
  app.use('/api', protocolChartsRouter);
  app.use('/api', newsRouter);
  app.use('/api', xRouter);
  app.use('/api', showRouter);
  app.use('/api', learnRouter);

  // On Vercel, the Vite `dist/` is served as static CDN assets; Express only handles /api.
  const serveStatic =
    process.env.NODE_ENV === 'production' && process.env.VERCEL !== '1';

  if (serveStatic) {
    const distPath = path.join(__dirname, '..', 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}
