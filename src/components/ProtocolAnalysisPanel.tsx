import type { DefiLlamaProtocolAnalysis, ProtocolHeadlineMetric } from '../types';
import { DASHBOARD_DEFILLAMA_PROTOCOLS } from '../../shared/constants/defiLlamaProtocols';
import { formatUsdMetric } from '../lib/formatUsd';
import { ProtocolLineChart } from './charts/ProtocolLineChart';

function formatPct(n: number | null | undefined): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

function MetricCard({ metric }: { metric: ProtocolHeadlineMetric }) {
  const change = formatPct(metric.changePct);
  const showValue = metric.value != null;
  return (
    <div className="frax-metric cult-shadow">
      <span className="frax-metric__label">{metric.label}</span>
      {showValue && (
        <span className="frax-metric__value tabular-nums">{formatUsdMetric(metric.value!)}</span>
      )}
      {change && (
        <span
          className={`frax-metric__change tabular-nums ${
            (metric.changePct ?? 0) >= 0 ? 'frax-metric__change--up' : 'frax-metric__change--down'
          }`}
        >
          {change}
        </span>
      )}
    </div>
  );
}

interface ProtocolAnalysisPanelProps {
  analysis: DefiLlamaProtocolAnalysis;
}

export function ProtocolAnalysisPanel({ analysis }: ProtocolAnalysisPanelProps) {
  const config = DASHBOARD_DEFILLAMA_PROTOCOLS.find((p) => p.slug === analysis.slug);
  const accent = config?.chartColor ?? '#ffffff';
  const maxChainTvl = analysis.chainTvl[0]?.tvl ?? 1;

  const charts: { key: string; title: string; points: typeof analysis.series.tvl; color: string }[] =
    [
      { key: 'tvl', title: 'Total TVL', points: analysis.series.tvl, color: accent },
      { key: 'fees', title: 'Daily fees', points: analysis.series.fees, color: '#14b8a6' },
      { key: 'revenue', title: 'Daily revenue', points: analysis.series.revenue, color: '#f59e0b' },
    ];

  if (analysis.series.holdersRevenue?.length) {
    charts.push({
      key: 'holdersRevenue',
      title: 'Holders revenue',
      points: analysis.series.holdersRevenue,
      color: '#a78bfa',
    });
  }
  if (analysis.series.volume?.length) {
    charts.push({
      key: 'volume',
      title: 'DEX volume',
      points: analysis.series.volume,
      color: '#38bdf8',
    });
  }

  return (
    <section className="frax-analysis" aria-labelledby={`protocol-${analysis.slug}-title`}>
      <header className="frax-analysis__head">
        <div>
          <p className="section-eyebrow">DefiLlama · {analysis.source}</p>
          <h2 id={`protocol-${analysis.slug}-title`} className="frax-analysis__title">
            {analysis.name}
          </h2>
          <p className="frax-analysis__meta">
            {analysis.category}
            {analysis.chains.length > 0 && <> · {analysis.chains.length} chains</>}
          </p>
        </div>
        <a
          href={analysis.url}
          target="_blank"
          rel="noopener noreferrer"
          className="frax-analysis__link"
        >
          View on DefiLlama ↗
        </a>
      </header>

      {analysis.description && (
        <p className="frax-analysis__desc">
          {analysis.description.length > 280
            ? `${analysis.description.slice(0, 280)}…`
            : analysis.description}
        </p>
      )}

      <div className="frax-metrics-grid">
        {analysis.headlines.map((m) => (
          <MetricCard key={m.key} metric={m} />
        ))}
      </div>

      {analysis.chainTvl.length > 0 && (
        <div className="frax-chains cult-shadow">
          <div className="frax-chains__head">
            <h3 className="frax-chains__title">TVL by chain</h3>
            <span className="frax-chains__source">{analysis.source}</span>
          </div>
          <ul className="frax-chains__list">
            {analysis.chainTvl.slice(0, 8).map(({ chain, tvl }) => (
              <li key={chain} className="frax-chain-row">
                <div className="frax-chain-row__label">
                  <span>{chain}</span>
                  <span className="tabular-nums">{formatUsdMetric(tvl)}</span>
                </div>
                <div className="frax-chain-row__bar" aria-hidden="true">
                  <span
                    className="frax-chain-row__fill"
                    style={{ width: `${Math.max(4, (tvl / maxChainTvl) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="frax-series-grid">
        {charts.map((chart) => (
          <article key={chart.key} className="protocol-chart-card cult-shadow frax-series-card">
            <div className="section-head protocol-chart-card__head">
              <div>
                <p className="section-eyebrow">Historical</p>
                <h3 className="protocol-chart-card__title">{chart.title}</h3>
              </div>
              <span className="protocol-chart-card__source">{analysis.source}</span>
            </div>
            <ProtocolLineChart
              points={chart.points}
              label={chart.title}
              color={chart.color}
            />
          </article>
        ))}
      </div>
    </section>
  );
}

/** @deprecated Use ProtocolAnalysisPanel */
export const FraxProtocolAnalysisPanel = ProtocolAnalysisPanel;
