import { useEffect, useState } from "react";

/** Proxied live APR from frax.com (`net.frax.com/api/stats/latest-apr`). */
const ENDPOINT = "/api/learn/frxusd-apr";
const FALLBACK = 3.4;
const TIMEOUT_MS = 8000;

export const useHeroApr = (): { apr: number; isFallback: boolean; loading: boolean } => {
  const [apr, setApr] = useState<number>(FALLBACK);
  const [isFallback, setIsFallback] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);

    fetch(ENDPOINT, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => {
        if (cancelled) return;
        const v = typeof data?.apr === "number" ? data.apr : Number(data?.apr);
        if (Number.isFinite(v) && v > 0) {
          setApr(v);
          setIsFallback(false);
        }
      })
      .catch(() => {
        /* keep fallback */
      })
      .finally(() => {
        clearTimeout(timer);
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
      ctrl.abort();
    };
  }, []);

  return { apr, isFallback, loading };
};
