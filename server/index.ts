import "dotenv/config";
import { createApp } from './app.ts';
import { envPort } from './config/env.ts';
import { POOL_REGISTRY } from '../shared/data/poolRegistry.ts';
import { WATCHLIST_TOKENS } from '../shared/data/tokenCatalog.ts';

const PORT = envPort(3001);
const app = createApp();

app.listen(PORT, () => {
  console.log(`[ONCHAIN CA$H] API → http://localhost:${PORT}`);
  console.log(`[ONCHAIN CA$H] ${POOL_REGISTRY.length} pools · ${WATCHLIST_TOKENS.length} tokens`);
  console.log('[ONCHAIN CA$H] Integrate APIs → docs/API_INTEGRATION.md');
});
