import { useEffect, useState } from 'react';
import type { ProtocolChartsData } from '../types';
import { fetchProtocolCharts } from '../services/api';
import { ProtocolLineChart } from './charts/ProtocolLineChart';
import { ProtocolAnalysisPanel } from './ProtocolAnalysisPanel';
import { FrxUsdMintRedeemPanel } from './FrxUsdMintRedeemPanel';
import { LoadingScreen } from './LoadingScreen';
import { DEFILLAMA_SOURCE } from '../../shared/constants/defiLlamaProtocols';

export function ProtocolChartsPanel() {
  const [data, setData] = useState<ProtocolChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = (silent = false, refresh = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    fetchProtocolCharts(refresh).then((d) => {
      if (d) setData(d);
      setLoading(false);
      setRefreshing(false);
    });
  };

  useEffect(() => {
    load(false, true);
    const id = setInterval(() => load(true, true), 5 * 60_000);
    return () => clearInterval(id);
  }, []);

  if (loading && !data) {
    return <LoadingScreen inline message="Loading DefiLlama protocol data…" />;
  }

  const family = data?.familyTvl;
  const supply = data?.frxUsdSupply;
  const analyses = data?.protocolAnalyses ?? [];
  const mintRedeem = data?.frxUsdMintRedeem;

  return (
    <div className="protocol-charts-stack">
      <div className="protocol-dashboard-intro">
        <p className="protocol-dashboard-intro__text">
          Protocol metrics sourced from <strong>{DEFILLAMA_SOURCE}</strong>, TVL, fees, revenue
          {analyses.some((a) => a.series.volume?.length) ? ', DEX volume' : ''}
          , and chain breakdowns for Frax, Aave, and Curve.
        </p>
      </div>

      {mintRedeem && <FrxUsdMintRedeemPanel data={mintRedeem} />}

      {analyses.length > 0 ? (
        analyses.map((analysis) => (
          <ProtocolAnalysisPanel key={analysis.slug} analysis={analysis} />
        ))
      ) : (
        <div className="protocol-chart-card cult-shadow frax-analysis--empty">
          <p className="protocol-chart__empty">
            Protocol metrics unavailable, check DefiLlama connectivity and refresh.
          </p>
        </div>
      )}

      <div className="protocol-charts-grid">
        <article className="protocol-chart-card cult-shadow">
          <div className="section-head protocol-chart-card__head">
            <div>
              <p className="section-eyebrow">PegKeeper family</p>
              <h3 className="protocol-chart-card__title">Family TVL trend</h3>
            </div>
            <span className="protocol-chart-card__source">{DEFILLAMA_SOURCE}</span>
          </div>
          <ProtocolLineChart points={family?.points ?? []} label={family?.label ?? 'Family TVL'} color="#ffffff" />
        </article>

        <article className="protocol-chart-card cult-shadow">
          <div className="section-head protocol-chart-card__head">
            <div>
              <p className="section-eyebrow">frxUSD</p>
              <h3 className="protocol-chart-card__title">Circulating supply</h3>
            </div>
            <span className="protocol-chart-card__source">{DEFILLAMA_SOURCE}</span>
          </div>
          <ProtocolLineChart points={supply?.points ?? []} label={supply?.label ?? 'frxUSD supply'} color="#14b8a6" />
        </article>
      </div>

      {refreshing && <span className="charts-refresh-hint">Refreshing DefiLlama data…</span>}
    </div>
  );
}
