# AGENTS.md — Instructions for AI Assistants

When working on this repository, follow these rules.

## Project Purpose

ONCHAIN CA$H is a **skeleton template** for a crypto intelligence dashboard. It tracks frxUSD PegKeeper pools and live token prices. Another developer will clone it and plug in their own APIs.

## Critical Rules

1. **Never fetch external APIs from `src/`** — only from `server/services/`
2. **Static data lives in `shared/data/`** — not in components or server routes
3. **Types live in `shared/types/`** — re-exported via `src/types/` for frontend imports
4. **frxUSD is the stablecoin; FRAX is volatile ecosystem token** — do not treat FRAX as pegged to $1
5. **Minimize scope** — this is a template; avoid over-engineering

## Where to Make Changes

| Task | Location |
|------|----------|
| Add pool | `shared/data/poolRegistry.ts` |
| Add chart token | `shared/data/tokenCatalog.ts` |
| Change API URL | `shared/constants/apiEndpoints.ts` |
| Add API provider | `server/services/newprovider.ts` |
| Wire API into responses | `server/builders/dashboard.ts` or `charts.ts` |
| New endpoint | `server/routes/` + register in `server/app.ts` |
| Frontend fetch | `src/services/api.ts` |
| New page | `src/pages/` + route in `src/App.tsx` |
| Styles | `src/index.css` (design tokens in `:root`) |
| Fonts | `public/fonts/` + `src/fonts.css` |

## File Map

```
shared/     → shared between client & server (types, registry, constants)
server/     → Express API only
src/        → React frontend only
public/     → static assets (audio, fonts)
docs/       → human + LLM documentation
```

## Do Not

- Put API keys in source code — use `.env`
- Duplicate pool data in placeholders (derive from registry)
- Import React in `shared/` or `server/`
- Add tests unless explicitly requested
- Commit `.env` or `node_modules/`

## Before Finishing

```bash
npm run typecheck
npm run typecheck:server
npm run build
```

## Read First

- `docs/API_INTEGRATION.md` — how to plug in data
- `docs/ARCHITECTURE.md` — data flow
- `shared/data/poolRegistry.ts` — pool schema
- `shared/data/tokenCatalog.ts` — token schema
