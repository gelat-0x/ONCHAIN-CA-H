import { forwardRef, useMemo } from 'react';
import type { DefiLlamaProtocolAnalysis } from '../../types';
import { formatUsdMetric } from '../../lib/formatUsd';
import { chainBrandColor } from '../../lib/chainColors';
import { studioAccentForTone } from '../../lib/studioTone';
import { studioBackgroundTone } from '../../../shared/constants/studioBackgrounds';
import { StudioCanvasShell } from './StudioCanvasShell';

interface ChainTvlCanvasProps {
  analysis: DefiLlamaProtocolAnalysis;
  accent?: string;
  backgroundId: string;
}

export const ChainTvlCanvas = forwardRef<HTMLDivElement, ChainTvlCanvasProps>(
  function ChainTvlCanvas({ analysis, accent = '#ffffff', backgroundId }, ref) {
    const tone = studioBackgroundTone(backgroundId);
    const chainColor = (chain: string, i: number) =>
      studioAccentForTone(chainBrandColor(chain, i), tone);
    const chains = useMemo(() => {
      const total = analysis.chainTvl.reduce((s, c) => s + c.tvl, 0);
      return analysis.chainTvl.slice(0, 7).map((c) => ({
        ...c,
        pct: total > 0 ? (c.tvl / total) * 100 : 0,
      }));
    }, [analysis.chainTvl]);

    const totalTvl = useMemo(
      () => analysis.chainTvl.reduce((s, c) => s + c.tvl, 0),
      [analysis.chainTvl],
    );

    return (
      <StudioCanvasShell
        ref={ref}
        backgroundId={backgroundId}
        topicMain={`${analysis.name} TVL`}
        topicSub="Share by chain"
        badges={
          <span
            className="studio-canvas__badge"
            style={{ borderColor: `${studioAccentForTone(accent, tone)}44` }}
          >
            {formatUsdMetric(totalTvl)} total
          </span>
        }
        className="studio-canvas--chain-tvl"
      >
        <ul className="chain-tvl-canvas__list">
          {chains.map((chain, i) => (
            <li key={chain.chain} className="chain-tvl-canvas__row">
              <span className="chain-tvl-canvas__rank tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className="chain-tvl-canvas__meta">
                <div className="chain-tvl-canvas__label-row">
                  <span className="chain-tvl-canvas__chain">{chain.chain}</span>
                  <span className="chain-tvl-canvas__value tabular-nums">
                    {formatUsdMetric(chain.tvl)}
                  </span>
                </div>
                <div className="chain-tvl-canvas__bar" aria-hidden>
                  <span
                    className="chain-tvl-canvas__fill"
                    style={{
                      width: `${Math.max(4, chain.pct)}%`,
                      background: chainColor(chain.chain, i),
                    }}
                  />
                </div>
              </div>
              <span
                className="chain-tvl-canvas__pct tabular-nums"
                style={{ color: chainColor(chain.chain, i) }}
              >
                {chain.pct.toFixed(1)}%
              </span>
            </li>
          ))}
        </ul>
      </StudioCanvasShell>
    );
  },
);
