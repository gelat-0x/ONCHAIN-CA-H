import { forwardRef } from 'react';
import type { DefiLlamaProtocolAnalysis } from '../../types';
import { formatUsdMetric } from '../../lib/formatUsd';
import { StudioCanvasShell } from './StudioCanvasShell';

interface ProtocolKpiCanvasProps {
  analysis: DefiLlamaProtocolAnalysis;
  backgroundId: string;
}

function formatPct(n: number | null | undefined): string | null {
  if (n == null || !Number.isFinite(n)) return null;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(1)}%`;
}

export const ProtocolKpiCanvas = forwardRef<HTMLDivElement, ProtocolKpiCanvasProps>(
  function ProtocolKpiCanvas({ analysis, backgroundId }, ref) {
    // Only rows with a real value — a label with just a change % is not a KPI.
    const headlines = analysis.headlines.filter((m) => m.value != null).slice(0, 5);

    return (
      <StudioCanvasShell
        ref={ref}
        backgroundId={backgroundId}
        topicMain={analysis.name}
        topicSub={analysis.category}
        className="studio-canvas--kpi"
      >
        <div className="protocol-kpi-canvas">
          <ul className="protocol-kpi-canvas__list">
            {headlines.map((metric, i) => {
              const change = formatPct(metric.changePct);
              return (
                <li
                  key={metric.key}
                  className={`protocol-kpi-canvas__row ${i % 2 === 1 ? 'protocol-kpi-canvas__row--alt' : ''}`}
                >
                  <span className="protocol-kpi-canvas__label">{metric.label}</span>
                  <div className="protocol-kpi-canvas__values">
                    {metric.value != null && (
                      <span className="protocol-kpi-canvas__value tabular-nums">
                        {formatUsdMetric(metric.value)}
                      </span>
                    )}
                    {change && (
                      <span
                        className={`protocol-kpi-canvas__change tabular-nums ${
                          (metric.changePct ?? 0) >= 0
                            ? 'protocol-kpi-canvas__change--up'
                            : 'protocol-kpi-canvas__change--down'
                        }`}
                      >
                        {change}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </StudioCanvasShell>
    );
  },
);
