import { forwardRef, useMemo } from 'react';
import type { ChartPoint, DefiLlamaProtocolAnalysis } from '../../types';
import { formatUsdMetric } from '../../lib/formatUsd';
import { studioAccentForTone } from '../../lib/studioTone';
import { studioBackgroundTone } from '../../../shared/constants/studioBackgrounds';
import { StudioCanvasShell } from './StudioCanvasShell';

interface TvlTrendCanvasProps {
  analysis: DefiLlamaProtocolAnalysis;
  accent?: string;
  backgroundId: string;
}

const CHART_W = 1104;
const CHART_H = 260;
const WINDOW_DAYS = 90;

interface TrendModel {
  points: ChartPoint[];
  current: number;
  changePct: number | null;
  linePath: string;
  areaPath: string;
  firstLabel: string;
  lastLabel: string;
}

function shortDate(ts: number): string {
  return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Deterministic path building — clamps every value so a bad point can never break the SVG. */
function buildTrendModel(series: ChartPoint[]): TrendModel | null {
  const clean = series
    .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.value) && p.value >= 0)
    .sort((a, b) => a.ts - b.ts);
  const points = clean.slice(-WINDOW_DAYS);
  if (points.length < 2) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || max || 1;
  const pad = span * 0.12;
  const lo = Math.max(0, min - pad);
  const hi = max + pad;

  const x = (i: number) => (i / (points.length - 1)) * CHART_W;
  const y = (v: number) => CHART_H - ((v - lo) / (hi - lo)) * CHART_H;

  const linePath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`)
    .join(' ');
  const areaPath = `${linePath} L${CHART_W},${CHART_H} L0,${CHART_H} Z`;

  const current = points[points.length - 1].value;
  // A "30d" change needs 30 days of history — otherwise show no change
  // rather than a misleading shorter-window comparison.
  const baselineIdx = points.length - 31;
  const baseline = baselineIdx >= 0 ? points[baselineIdx].value : null;
  const changePct =
    baseline != null && baseline > 0 ? ((current - baseline) / baseline) * 100 : null;

  return {
    points,
    current,
    changePct,
    linePath,
    areaPath,
    firstLabel: shortDate(points[0].ts),
    lastLabel: shortDate(points[points.length - 1].ts),
  };
}

export const TvlTrendCanvas = forwardRef<HTMLDivElement, TvlTrendCanvasProps>(
  function TvlTrendCanvas({ analysis, accent = '#ffffff', backgroundId }, ref) {
    const tone = studioBackgroundTone(backgroundId);
    const tonedAccent = studioAccentForTone(accent, tone);
    const model = useMemo(() => buildTrendModel(analysis.series.tvl), [analysis.series.tvl]);

    if (!model) return null;

    const change = model.changePct;
    const changeLabel =
      change == null ? null : `${change > 0 ? '+' : ''}${change.toFixed(1)}% · 30d`;

    return (
      <StudioCanvasShell
        ref={ref}
        backgroundId={backgroundId}
        topicMain={`${analysis.name} TVL`}
        topicSub={`${WINDOW_DAYS}-day trend`}
        className="studio-canvas--tvl-trend"
      >
        <div className="tvl-trend-canvas">
          <div className="tvl-trend-canvas__head">
            <div>
              <span className="tvl-trend-canvas__label">Total value locked</span>
              <span className="tvl-trend-canvas__value tabular-nums">
                {formatUsdMetric(model.current)}
              </span>
            </div>
            {changeLabel && (
              <span
                className={`tvl-trend-canvas__change tabular-nums ${
                  (change ?? 0) >= 0
                    ? 'tvl-trend-canvas__change--up'
                    : 'tvl-trend-canvas__change--down'
                }`}
              >
                {changeLabel}
              </span>
            )}
          </div>

          <div className="tvl-trend-canvas__chart">
            <svg
              viewBox={`0 0 ${CHART_W} ${CHART_H}`}
              width="100%"
              height={CHART_H}
              preserveAspectRatio="none"
              aria-hidden
            >
              <defs>
                <linearGradient id="tvl-trend-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={tonedAccent} stopOpacity="0.22" />
                  <stop offset="100%" stopColor={tonedAccent} stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={model.areaPath} fill="url(#tvl-trend-fill)" />
              <path
                d={model.linePath}
                fill="none"
                stroke={tonedAccent}
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
            <div className="tvl-trend-canvas__axis">
              <span>{model.firstLabel}</span>
              <span>{model.lastLabel}</span>
            </div>
          </div>
        </div>
      </StudioCanvasShell>
    );
  },
);
