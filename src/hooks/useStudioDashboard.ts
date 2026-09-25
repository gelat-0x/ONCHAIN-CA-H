import { useCallback, useEffect, useRef, useState } from 'react';
import type { DashboardData, PoolData, TickerItem } from '../types';
import { fetchDashboardData } from '../services/api';
import { PLACEHOLDER_DASHBOARD } from '../data/placeholders';
import {
  variantById,
  type StudioVariantId,
  isAprVariant,
} from '../components/studio/studioRegistry';

const DEFAULT_DUAL: [string, string] = ['msusd', 'crvusd'];

export function defaultStudioSelection(variantId: StudioVariantId, pools: PoolData[]): string[] {
  const sorted = [...pools].sort((a, b) => b.tvl - a.tvl);
  const top = sorted.map((p) => p.id);
  const slots = variantById(variantId).slotCount ?? 0;

  if (!isAprVariant(variantId) || slots === 0) return [];

  if (variantId === 'dual-apr') {
    const a = top.includes(DEFAULT_DUAL[0]) ? DEFAULT_DUAL[0] : top[0] ?? '';
    const b = top.includes(DEFAULT_DUAL[1])
      ? DEFAULT_DUAL[1]
      : top.find((id) => id !== a) ?? '';
    return [a, b].slice(0, slots);
  }

  return top.slice(0, slots);
}

function normalizeSelection(
  variantId: StudioVariantId,
  pools: PoolData[],
  prev: string[],
): string[] {
  const slots = variantById(variantId).slotCount ?? 0;
  if (!isAprVariant(variantId) || slots === 0) return [];
  const valid = prev.filter((id) => pools.some((p) => p.id === id));
  if (valid.length === slots) return valid;
  return defaultStudioSelection(variantId, pools);
}

export interface StudioDashboardState {
  pools: PoolData[];
  ticker: TickerItem[];
  frxUsdPrice?: number;
  cached: boolean;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: (force?: boolean) => Promise<void>;
}

export function useStudioDashboard(
  variantId: StudioVariantId,
  setSelection: React.Dispatch<React.SetStateAction<string[]>>,
) {
  const [pools, setPools] = useState<PoolData[]>([]);
  const [ticker, setTicker] = useState<TickerItem[]>(PLACEHOLDER_DASHBOARD.ticker);
  const [frxUsdPrice, setFrxUsdPrice] = useState<number | undefined>();
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const variantRef = useRef(variantId);

  const applyDashboard = useCallback(
    (data: DashboardData) => {
      setPools(data.pools);
      setTicker(data.ticker?.length ? data.ticker : PLACEHOLDER_DASHBOARD.ticker);
      setFrxUsdPrice(data.frxUsdPrice);
      setCached(Boolean(data.cached));
      setLastUpdated(new Date());
      setError(null);

      if (!isAprVariant(variantId)) return;

      setSelection((prev) => {
        if (variantRef.current !== variantId) {
          return defaultStudioSelection(variantId, data.pools);
        }
        return normalizeSelection(variantId, data.pools, prev);
      });
    },
    [variantId, setSelection],
  );

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardData(force);
      applyDashboard(data);
      if (!data.pools.length) {
        setError('No pools returned — check the backend on port 3001.');
      }
    } catch {
      setError('Could not load pool data. Run npm run dev:all and refresh.');
    } finally {
      setLoading(false);
    }
  }, [applyDashboard]);

  useEffect(() => {
    // Prefer shared client cache from App prefetch for a clean first paint.
    void refresh(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount fetch only
  }, []);

  useEffect(() => {
    if (variantRef.current === variantId) return;
    variantRef.current = variantId;
    if (!pools.length || !isAprVariant(variantId)) return;
    setSelection(defaultStudioSelection(variantId, pools));
  }, [variantId, pools, setSelection]);

  return {
    pools,
    ticker,
    frxUsdPrice,
    cached,
    loading,
    error,
    lastUpdated,
    refresh,
  } satisfies StudioDashboardState;
}

/** Valid peg for display on export cards. */
export function studioPegPrice(raw?: number): number | undefined {
  if (raw == null || !Number.isFinite(raw) || raw <= 0) return undefined;
  if (raw < 0.5 || raw > 1.5) return undefined;
  return raw;
}
