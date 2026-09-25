import { useEffect, useState } from 'react';
import type { ProtocolChartsData } from '../../types';
import { fetchProtocolCharts } from '../../services/api';
import { ProtocolLineChart } from './ProtocolLineChart';
import { LoadingScreen } from '../LoadingScreen';

export function PegKeeperVolumeChart() {
  const [data, setData] = useState<ProtocolChartsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchProtocolCharts(true).then((d) => {
      if (!alive) return;
      setData(d);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (loading && !data) {
    return (
      <section className="section protocol-chart-block">
        <LoadingScreen inline message="Loading family trend…" />
      </section>
    );
  }

  const family = data?.familyTvl;
  const hasData = family && family.points.length >= 2;

  return (
    <section className="section protocol-chart-block" id="pegkeeper-trend">
      <div className="protocol-chart-card cult-shadow">
        <div className="section-head protocol-chart-card__head">
          <div>
            <p className="section-eyebrow">Family activity</p>
            <h2 className="section-title">PegKeeper family TVL, 30d</h2>
          </div>
          <span className="protocol-chart-card__source">
            {family?.source ?? 'DefiLlama'}
          </span>
        </div>

        {hasData ? (
          <ProtocolLineChart points={family!.points} label={family!.label} color="#ffffff" height={300} />
        ) : (
          <div className="protocol-chart__empty">
            Live history unavailable right now, aggregated pool charts refresh on the next pass.
          </div>
        )}
      </div>
    </section>
  );
}
