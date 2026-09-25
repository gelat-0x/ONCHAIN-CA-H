import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createApp } from './app.ts';
import { envPort } from './config/env.ts';
import { POOL_REGISTRY } from '../shared/data/poolRegistry.ts';
import { WATCHLIST_TOKENS } from '../shared/data/tokenCatalog.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const PORT = envPort(3001);
const app = createApp();

app.listen(PORT, () => {
  console.log(`[ONCHAIN CA$H] API → http://localhost:${PORT}`);
  console.log(`[ONCHAIN CA$H] ${POOL_REGISTRY.length} pools · ${WATCHLIST_TOKENS.length} tokens`);
  if (process.env.SHOW_TOPIC_EMAIL?.trim()) {
    console.log('[ONCHAIN CA$H] Show topic email delivery: configured');
  } else {
    console.warn('[ONCHAIN CA$H] Show topic email missing — set SHOW_TOPIC_EMAIL in .env');
  }
  console.log('[ONCHAIN CA$H] Integrate APIs → docs/API_INTEGRATION.md');
});
