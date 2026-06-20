# API Integration Guide

Step-by-step guide for plugging in live data sources. Designed so an LLM or developer can follow without guessing.

---

## Overview

```
External APIs          server/services/       server/builders/        Frontend
─────────────         ────────────────       ────────────────        ────────
CoinGecko      ──►    coingecko.ts    ──►    dashboard.ts     ──►    /api/dashboard ──► src/services/api.ts
DefiLlama      ──►    defillama.ts    ──►    charts.ts        ──►    /api/charts    ──► src/pages/*.tsx
Dune (stub)    ──►    dune.ts         ──►    (merge in builder)
```

**Rule:** Never fetch external APIs from `src/`. All live data goes through `server/`.

---

## 1. Pool Registry (static metadata)

**File:** `shared/data/poolRegistry.ts`

Add or edit pools in `POOL_REGISTRY`:

```ts
{
  id: 'crvusd',                    // unique slug — used in URLs & keys
  stablecoin: 'crvUSD',
  name: 'frxUSD / crvUSD',
  partner: 'Curve Finance',
  partnerInitials: 'CV',
  partnerColor: '#00ff88',
  description: '...',
  chain: 'Ethereum',
  since: '2024-12',
  dlSymbols: ['FRXUSD-CRVUSD'],  // DefiLlama symbol matching
  duneTvlFallback: 27_426_137,   // fallback when live API misses
  duneFrxUsdTvlFallback: 12_180_446,
  curveUrl: 'https://curve.fi',
}
```

After editing, restart the server. No frontend changes needed.

---

## 2. Token Watchlist (charts page)

**File:** `shared/data/tokenCatalog.ts`

Add tokens to `WATCHLIST_TOKENS` with a valid [CoinGecko ID](https://api.coingecko.com/api/v3/coins/list):

```ts
{
  id: 'aave',
  symbol: 'AAVE',
  name: 'Aave',
  coingeckoId: 'aave',           // ← from CoinGecko
  type: 'volatile',              // 'stablecoin' | 'volatile' | 'governance'
  color: '#b6509e',
  description: '...',
  pegTarget: 1,                  // only for stablecoins
}
```

---

## 3. API Endpoint URLs

**File:** `shared/constants/apiEndpoints.ts`

Central place for all external URLs. Change here when switching providers.

```ts
export const API_ENDPOINTS = {
  defiLlama: { yields: '...', stablecoins: '...' },
  coingecko: { base: '...', simplePrice: (ids) => '...' },
  dune: { base: '...', pegkeeperQueryId: 'YOUR_QUERY_ID' },
};
```

---

## 4. CoinGecko (prices & charts)

**File:** `server/services/coingecko.ts`

Already implemented:
- `fetchCoinGeckoPrices()` — batch simple/price
- `fetchTokenHistory(cgId, days)` — market_chart
- `PRICE_FALLBACKS` — offline defaults (edit when needed)

**Optional:** Add `COINGECKO_API_KEY` to `.env` and pass header in `server/lib/http.ts`.

---

## 5. DefiLlama (pool TVL / APY)

**File:** `server/services/defillama.ts`

Already implemented:
- `fetchDefiLlamaYields()` — Curve pool matching via `dlSymbols`
- `fetchDefiLlamaStablecoins()` — frxUSD price & chain distribution

Pool matching logic: `server/lib/poolMatch.ts` → `matchDefiLlamaPool()`

---

## 6. Dune Analytics

**Files:**
- `server/services/dune.ts` (stub)
- `shared/constants/apiEndpoints.ts` (query ID)
- `.env` (`DUNE_API_KEY`)

### Steps

1. Copy `.env.example` → `.env`
2. Add key from https://dune.com/settings/api
3. Set `pegkeeperQueryId` in `apiEndpoints.ts` from your dashboard query
4. Implement `fetchDunePegKeeperData()` in `dune.ts`
5. Merge results in `server/builders/dashboard.ts` (replace `duneTvlFallback` values)

Example fetch pattern:

```ts
const res = await fetch(
  `${API_ENDPOINTS.dune.base}/query/${queryId}/results`,
  { headers: { 'X-Dune-API-Key': apiKey } },
);
```

---

## 7. Add a New API Provider

1. Create `server/services/yourprovider.ts`
2. Add URL to `shared/constants/apiEndpoints.ts`
3. Call from `server/builders/dashboard.ts` or `charts.ts`
4. Extend types in `shared/types/index.ts` if needed
5. Document in this file

---

## 8. Add a New HTTP Endpoint

1. Create `server/routes/yourroute.ts`
2. Register in `server/app.ts`: `app.use('/api', yourRouter)`
3. Add fetch in `src/services/api.ts`
4. Consume in `src/pages/`

---

## 9. Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `PORT` | No | Server port (default 3001) |
| `DUNE_API_KEY` | For Dune | Live PegKeeper data |
| `COINGECKO_API_KEY` | No | Higher rate limits |

---

## 10. Caching

**File:** `shared/constants/cache.ts`

Default: 60 seconds. Change `CACHE_TTL_MS` to adjust.

Cache logic: `server/services/cache.ts`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Empty charts | Check CoinGecko rate limits; see `PRICE_FALLBACKS` |
| Wrong pool TVL | Verify `dlSymbols` match DefiLlama pool symbols |
| Backend not starting | Run `npm run typecheck:server` |
| Stale UI | Hard refresh; check port 5173 vs 5174 |
