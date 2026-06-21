# ONCHAIN CA$H — PegKeeper Intelligence Hub

> **Skeleton template** for a crypto intelligence dashboard. Clone, plug in your APIs, ship.

Premium dashboard for frxUSD PegKeeper pools on Curve — live prices, charts, pool registry, cult-terminal UI.

---

## Quick Start

```bash
git clone <your-repo>
cd onchain-cash
npm install
cp .env.example .env          # optional: add DUNE_API_KEY
npm run dev:all               # API :3001 + UI :5173
```

Open **http://localhost:5173**

---

## Project Structure

```
onchain-cash/
├── shared/                   ← DATA & TYPES (client + server)
│   ├── types/                ← TypeScript interfaces (DashboardData, PoolData, …)
│   ├── data/
│   │   ├── poolRegistry.ts   ← ★ ADD/MODIFY POOLS HERE (27 PegKeeper partners)
│   │   └── tokenCatalog.ts   ← ★ ADD TOKENS FOR CHARTS (CoinGecko IDs)
│   └── constants/
│       ├── apiEndpoints.ts   ← ★ EXTERNAL API URLs
│       └── cache.ts          ← Cache TTL settings
│
├── server/config/env.ts      ← Environment variables (.env)
│   ├── index.ts              ← Entry point
│   ├── app.ts                ← Express setup
│   ├── routes/               ← HTTP endpoints (/api/dashboard, /api/charts)
│   ├── services/             ← ★ PLUG IN API CLIENTS HERE
│   │   ├── coingecko.ts      ← Token prices & history
│   │   ├── defillama.ts      ← Pool TVL / APY
│   │   └── dune.ts           ← ★ STUB: Dune Analytics (needs API key)
│   ├── builders/             ← Aggregate raw API → DashboardData / ChartsData
│   └── lib/                  ← HTTP fetch, pool matching helpers
│
├── src/                      ← FRONTEND (React + Vite)
│   ├── pages/                ← Route pages (Dashboard, Charts, PegKeeper, …)
│   ├── components/           ← UI components
│   ├── services/api.ts       ← Fetch /api/* (do not add API logic here)
│   ├── data/placeholders.ts  ← Offline fallback (auto-derived from registry)
│   └── assets/               ← Bundled images (background texture)
│
├── public/                   ← Static files (fonts, audio, favicon)
├── docs/                     ← Integration guides
│   ├── API_INTEGRATION.md    ← ★ START HERE to plug in APIs
│   └── ARCHITECTURE.md       ← Data flow diagram
└── AGENTS.md                 ← Instructions for LLM / AI assistants
```

---

## Where to Plug In Your Data

| What you want | File to edit |
|---------------|--------------|
| Add a PegKeeper pool | `shared/data/poolRegistry.ts` |
| Add a chart token | `shared/data/tokenCatalog.ts` |
| Change API URLs | `shared/constants/apiEndpoints.ts` |
| Add CoinGecko logic | `server/services/coingecko.ts` |
| Add DefiLlama logic | `server/services/defillama.ts` |
| Add Dune Analytics | `server/services/dune.ts` + `.env` |
| New API endpoint | `server/routes/` + `server/builders/` |
| New frontend page | `src/pages/` + `src/App.tsx` |

Full guide: **[docs/API_INTEGRATION.md](./docs/API_INTEGRATION.md)**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Status, pool count, token count |
| GET | `/api/dashboard` | Full dashboard payload (60s cache) |
| GET | `/api/charts?range=30` | Live token prices + history (`1\|7\|30\|90\|365`) |

---

## Routes (Frontend)

| Path | Page |
|------|------|
| `/` | Dashboard — hero, pools, stats |
| `/pegkeeper` | All 27 pool cards |
| `/charts` | Live token charts (CoinGecko) |
| `/show` | Show archive |
| `/alpha` | Alpha calls (paywall UI) |

---

## Token Model

| Token | Role |
|-------|------|
| **frxUSD** | Stablecoin — always equal to $1 |
| **FRAX** | Ecosystem token — **volatile**, not the stablecoin |
| AAVE, GHO, CRV, CVX, FXN | Partner ecosystem watchlist |

---

## Data Sources (default)

| Provider | Used for |
|----------|----------|
| [DefiLlama](https://defillama.com) | Pool TVL, APY, volume |
| [CoinGecko](https://coingecko.com/api) | Token prices, chart history |
| [Dune](https://dune.com/stablescarab/frax-frxusd-pegkeeper-pools) | Pool registry baseline (static fallbacks) |

---

## Scripts

```bash
npm run dev          # Frontend only (:5173)
npm run server       # Backend only (:3001)
npm run dev:all      # Both concurrently
npm run build        # Production build
npm run typecheck    # TypeScript (client + shared)
npm run typecheck:server
npm run lint
```

---

## For AI / LLM Assistants

Read **[AGENTS.md](./AGENTS.md)** before making changes.

---

## License

MIT — use as skeleton for your own project.
