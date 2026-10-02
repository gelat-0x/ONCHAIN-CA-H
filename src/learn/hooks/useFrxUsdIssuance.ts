import { useCallback, useEffect, useState } from 'react';
import type { FrxUsdMintRedeemData } from '../../types';

const ENDPOINT = '/api/learn/frxusd-issuance';
const TIMEOUT_MS = 45_000;
const POLL_MS = 12_000;

export function useFrxUsdIssuance() {
  const [data, setData] = useState<FrxUsdMintRedeemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(ENDPOINT, { signal: ctrl.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as FrxUsdMintRedeemData;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'fetch_failed');
    } finally {
      window.clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
    const id = window.setInterval(() => void load(true), POLL_MS);
    return () => window.clearInterval(id);
  }, [load]);

  return { data, loading, error, refresh: load };
}
