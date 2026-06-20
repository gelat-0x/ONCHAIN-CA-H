import { Router } from 'express';
import { POOL_REGISTRY } from '../../shared/data/poolRegistry.ts';
import { WATCHLIST_TOKENS } from '../../shared/data/tokenCatalog.ts';

export const healthRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({
    ok: true,
    pools: POOL_REGISTRY.length,
    tokens: WATCHLIST_TOKENS.length,
    time: new Date().toISOString(),
  });
});
