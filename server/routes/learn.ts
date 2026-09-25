import { Router } from 'express';

export const learnRouter = Router();

learnRouter.get('/learn/frxusd-balance-sheet', async (_req, res) => {
  try {
    const response = await fetch('https://api.frax.finance/v2/frxusd/balance-sheet/latest', {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!response.ok) {
      return res.status(502).json({ error: 'upstream_failed', status: response.status });
    }
    const data = await response.json();
    return res.json(data);
  } catch (error) {
    console.error('[learn] balance-sheet failed:', error);
    return res.status(502).json({ error: 'fetch_failed' });
  }
});

/** Live frxUSD APR — same source as frax.com/frxUSD (`net.frax.com/api/stats/latest-apr`). */
learnRouter.get('/learn/frxusd-apr', async (_req, res) => {
  try {
    const response = await fetch('https://net.frax.com/api/stats/latest-apr', {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) {
      return res.status(502).json({ error: 'upstream_failed', status: response.status });
    }
    const data = (await response.json()) as { apr?: number; date?: string };
    const apr = typeof data?.apr === 'number' ? data.apr : Number.NaN;
    if (!Number.isFinite(apr)) {
      return res.status(502).json({ error: 'invalid_apr_payload' });
    }
    return res.json({ apr, date: data.date ?? null, source: 'net.frax.com/api/stats/latest-apr' });
  } catch (error) {
    console.error('[learn] apr failed:', error);
    return res.status(502).json({ error: 'fetch_failed' });
  }
});
