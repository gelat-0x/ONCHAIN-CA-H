# frxUSD Curve Pool Lifecycle Analytics + BD Prospect Yield-Sharing Opportunity

**Framework Design (PR A — Framework Only)**

This document defines the architecture for two separate analytics modules:

1. **Existing frxUSD pools** — Lifecycle analysis of verified direct frxUSD Curve pools.
2. **BD prospects** — Counterfactual yield-sharing opportunity for external pools currently using non-frxUSD dollar legs (USDC, USDT, etc.).

**Strict separation of concerns**:
- Do not mix existing pool lifecycle scoring with BD prospect scoring.
- frxUSD only in BD module. No sfrxUSD.
- No pool may be scored as "direct frxUSD" without explicit address-based token composition verification.

## Core Principles

- Use exact on-chain addresses for everything.
- True swap volume ≠ transfer activity.
- Historical APR is optional and must be sourced reliably (never fabricated).
- All opportunity numbers in BD must explicitly state the yield-sharing APY assumption used.
- Generated artifacts are not committed by default.

## Registry Audit Rules (Phase A0)

- `curvePoolAddress` presence is necessary but not sufficient.
- Every pool must have its token composition validated by address before classification as `direct-frxusd-curve-pool`.
- Pools without verified `curvePoolAddress` are `unverified`.
- sfrxUSD-containing pools are `sfrxusd-exposure-pool` and excluded from direct frxUSD lifecycle.

## Data Model

See `shared/types/poolLifecycle.ts` for canonical TypeScript definitions:
- `PoolLifecycleDailySnapshot`
- `PoolLifecycleSummary`
- `BdProspectPool`

## Data Sources (Layered)

**Static**: `shared/data/poolRegistry.ts` (metadata only, no scoring).

**Historical Balances**: Dune `tokens_ethereum.transfers` using exact contract address matching (no symbol fallback). Daily cumulative net flows with date filling.

**Volume**:
1. Curve API true volume (preferred)
2. Verified Dune swap events (after validation)
3. Transfer proxy flow (explicitly labeled, lower weight)

**APR**:
- Current: Curve API
- Historical: only reliable sources or null

## Validation Gates (Critical)

- Dune schema validation must pass on crvUSD + USD3 before expanding queries (see PR B plan).
- Token composition verification required for all pools with `curvePoolAddress`.

## POC Pools for Initial Lifecycle Work (verified only)

- crvusd
- usd3
- pmusd
- yusd
- dusd

`usdifi` and other unverified pools are explicitly excluded until full verification (address + paired token + positive frxusd_balance).

## BD Prospect Rules

- Only model frxUSD as proposed leg.
- `fraxYieldSharingAssumptionApy` must be documented (manual or official).
- Print the assumption with every opportunity calculation.
- Manual APY assumption → confidence cannot be "high".
- Use conservative/base/aggressive migration scenarios (25%/50%/100% of dollar leg).
- Language: "estimated yield-sharing opportunity" / "estimated liquidity cost".

## Generated Files Policy

See `GENERATED_OUTPUTS.md`.

## Implementation Phases

See `docs/pool-analytics/DESIGN.md` (this file) and the main plan in previous review.

**PR A (current)**: Framework only — types + dry-run script skeleton + docs. No real data, no Dune production, no frontend, no registry changes.

Subsequent PRs will be gated on review and explicit approval.

## Key Files (Framework)

- `shared/types/poolLifecycle.ts`
- `scripts/generate-pool-lifecycle.ts` (dry-run / mock only)
- `docs/pool-analytics/DESIGN.md`
- `docs/pool-analytics/SCORING.md`
- `docs/pool-analytics/GENERATED_OUTPUTS.md`

## Restrictions for PR A

- Mock data only in script.
- No writes to repo (temp locations only if any).
- No pool addresses added or changed.
- No frontend modifications.
- No Dune production query changes or execution.