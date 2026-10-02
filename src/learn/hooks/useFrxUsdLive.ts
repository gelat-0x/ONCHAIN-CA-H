import { useEffect, useState, useCallback } from "react";

/**
 * Single source of truth for live frxUSD data.
 * Fetches the official Frax balance sheet (same one frax.com/frxusd uses)
 * and derives circulation, reserves, asset composition, and weighted APR.
 *
 * Endpoint: https://api.frax.finance/v2/frxusd/balance-sheet/latest
 */

const ENDPOINT = "/api/learn/frxusd-balance-sheet";

/**
 * Underlying fund yields (net 7-day SEC yield / fund APR), refreshed from
 * each issuer's official disclosure. Used to compute a weighted APR for
 * the frxUSD reserve. Cash-equivalent stables (USDC/USDB) earn 0 to the
 * holder, matching how frax.com publishes the headline frxUSD APR.
 * Sources:
 *   USTB  — superstate.co (Short Duration US Gov Securities Fund)
 *   BUIDL — securitize.io/buidl (BlackRock Inst. Digital Liquidity)
 *   WTGXX — wisdomtree.com (Government Money Market Digital Fund)
 */
const FUND_APR: Record<string, number> = {
  USTB: 4.13,
  USCC: 4.13,
  BUIDL: 4.18,
  WTGXX: 3.96,
  EREBOR_USD: 0,
  USDB: 0,
  USDC: 0,
  AUSD: 0,
};

export interface FrxAsset {
  ticker: string;
  value: number; // USD
  pct: number;   // 0-100
}

export interface FrxUsdLive {
  loading: boolean;
  error: string | null;
  circulation: number;     // total liabilities (frxUSD in circulation)
  reserves: number;        // total backing assets
  assets: FrxAsset[];      // aggregated by ticker, sorted desc
  apr: number | null;      // weighted yearly growth, %
  updatedAt: Date | null;
}

const EMPTY: FrxUsdLive = {
  loading: true,
  error: null,
  circulation: 0,
  reserves: 0,
  assets: [],
  apr: null,
  updatedAt: null,
};

export const useFrxUsdLive = (): FrxUsdLive & { refresh: () => void } => {
  const [state, setState] = useState<FrxUsdLive>(EMPTY);

  const fetchData = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(ENDPOINT);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      const circulation = Number(json.totalLiabilities) || 0;
      const reserves = Number(json.totalAssets) || 0;

      // Aggregate assets by tokenSymbol
      const byTicker = new Map<string, number>();
      for (const a of json.assets ?? []) {
        const sym = a.tokenSymbol;
        if (!sym || sym === "frxUSD") continue;
        byTicker.set(sym, (byTicker.get(sym) ?? 0) + Number(a.totalValueUsd || 0));
      }

      const total = Array.from(byTicker.values()).reduce((s, v) => s + v, 0) || 1;
      const assets: FrxAsset[] = Array.from(byTicker.entries())
        .map(([ticker, value]) => ({ ticker, value, pct: (value / total) * 100 }))
        .sort((a, b) => b.value - a.value);

      // Weighted APR — net of any non-yielding cash positions
      let weighted = 0;
      for (const a of assets) {
        const y = FUND_APR[a.ticker] ?? 0;
        weighted += (a.value / total) * y;
      }
      const apr = Math.round(weighted * 100) / 100;

      setState({
        loading: false,
        error: null,
        circulation,
        reserves,
        assets,
        apr,
        updatedAt: new Date(),
      });
    } catch (e: any) {
      setState((current) => ({
        ...current,
        loading: false,
        error: e?.message ?? "fetch failed",
        circulation: current.updatedAt ? current.circulation : 0,
        reserves: current.updatedAt ? current.reserves : 0,
        assets: current.updatedAt ? current.assets : [],
        apr: current.updatedAt ? current.apr : null,
      }));
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { ...state, refresh: fetchData };
};