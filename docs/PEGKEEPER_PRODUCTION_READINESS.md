# PegKeeper Data Production Readiness

## Current status

The PegKeeper data integration is live for the first validated pool only:

- Pool id: `crvusd`
- Pool name: `frxUSD / crvUSD`
- Curve pool address: `0x13e12bb0e6a2f1a3d6901a59a9d585e89a6243e1`
- Dune Query ID: `7767958`

No other PegKeeper pool should receive live Dune data until its Curve pool address is verified and a Dune sample row is validated.

## Required environment variables

Local development uses `.env`.

Production / deployment environments such as Vercel must configure these as environment variables:

```env
DUNE_API_KEY=<secret>
DUNE_PEGKEEPER_QUERY_ID=7767958
