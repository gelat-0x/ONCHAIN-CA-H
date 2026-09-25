import { useCallback, useEffect, useState } from 'react';
import type { DefiLlamaProtocolAnalysis } from '../types';
import { fetchProtocolCharts } from '../services/api';
import {
  DASHBOARD_DEFILLAMA_PROTOCOLS,
  type DashboardDefiLlamaSlug,
} from '../../shared/constants/defiLlamaProtocols';

export interface StudioProtocolState {
  protocols: Record<string, DefiLlamaProtocolAnalysis>;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refresh: (force?: boolean) => Promise<void>;
  protocolList: typeof DASHBOARD_DEFILLAMA_PROTOCOLS;
}

export function useStudioProtocolData(): StudioProtocolState {
  const [protocols, setProtocols] = useState<Record<string, DefiLlamaProtocolAnalysis>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchProtocolCharts(force);
      if (!data?.protocolAnalyses?.length) {
        setError('No protocol data returned — check the backend on port 3001.');
        return;
      }
      const map: Record<string, DefiLlamaProtocolAnalysis> = {};
      for (const p of data.protocolAnalyses) {
        map[p.slug] = p;
      }
      setProtocols(map);
      setLastUpdated(new Date());
    } catch {
      setError('Could not load protocol data. Run npm run dev:all and refresh.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount fetch only
  }, []);

  return {
    protocols,
    loading,
    error,
    lastUpdated,
    refresh,
    protocolList: DASHBOARD_DEFILLAMA_PROTOCOLS,
  };
}

export function getProtocolAnalysis(
  protocols: Record<string, DefiLlamaProtocolAnalysis>,
  slug: DashboardDefiLlamaSlug,
): DefiLlamaProtocolAnalysis | undefined {
  return protocols[slug];
}
