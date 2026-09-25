import { useMemo, useRef, useState } from 'react';
import type { PoolData } from '../types';
import { formatUsd } from '../lib/formatUsd';
import { formatSinceDate } from '../lib/formatSince';
import { formatPoolApr } from '../lib/poolChartColor';
import { pegKeeperDisplayApr } from '../lib/pegKeeperApr';
import { HubBackdrop } from './HubBackdrop';
import { HubShareRing } from './HubShareRing';
import { TokenLogo } from './TokenLogo';
import { OrbitWheel } from './OrbitWheel';
import { PegKeeperFeedModal } from './PegKeeperFeedModal';

interface FrxUsdHubProps {
  pools: PoolData[];
  selectedId?: string;
  onSelect?: (pool: PoolData) => void;
  onViewPools?: () => void;
  frxUsdPrice?: number;
}

export function FrxUsdHub({ pools, selectedId, onSelect, onViewPools }: FrxUsdHubProps) {
  const [feedOpen, setFeedOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const totalTvl = useMemo(() => pools.reduce((s, p) => s + p.tvl, 0), [pools]);
  const totalFrxUsd = useMemo(
    () => pools.reduce((s, p) => s + (p.frxUsdBalanceUsd ?? 0), 0),
    [pools],
  );

  const selected = pools.find((p) => p.id === selectedId) ?? pools[0] ?? null;
  const selectedShare = selected?.frxUsdSharePct ?? 0;
  const selectedApr = selected ? pegKeeperDisplayApr(selected) : 0;
  const selectedSym = selected
    ? (selected.stablecoin ?? selected.name.split('/')[1]?.trim() ?? selected.id)
    : '';

  return (
    <div className="frx-hub">
      <div className="frx-hub__head">
        <div>
          <div className="frx-hub__eyebrow">frxUSD PegKeeper family</div>
          <h3 className="frx-hub__title">Partner orbit</h3>
        </div>
        <div className="frx-hub__head-stats">
          <div className="frx-hub__head-meta">
            <span><strong>{pools.length}</strong> pools</span>
            <span><strong>{formatUsd(totalTvl)}</strong> TVL</span>
            <span><strong>{formatUsd(totalFrxUsd)}</strong> frxUSD in pools</span>
          </div>
        </div>
      </div>

      <div ref={stageRef} className="frx-hub__stage">
        <HubBackdrop />
        <OrbitWheel
          pools={pools}
          selectedId={selectedId}
          onSelect={onSelect}
          mode="arc"
          className="frx-hub__wheel"
          captureRef={stageRef}
        />
      </div>

      {selected && (
        <article className="frx-hub__detail">
          <div className="frx-hub__detail-main">
            <div className="frx-hub__detail-metrics">
              <div className="frx-hub__metric">
                <span className="metric-label">TVL</span>
                <span className="metric-value tabular-nums">{formatUsd(selected.tvl)}</span>
              </div>
              <div className="frx-hub__metric">
                <span className="metric-label">VOL</span>
                <span className="metric-value tabular-nums">{formatUsd(selected.volume24h)}</span>
              </div>
              <div className="frx-hub__metric">
                <span className="metric-label">APR</span>
                <span className="metric-value tabular-nums">
                  {selectedApr > 0 ? formatPoolApr(selectedApr) : '—'}
                </span>
              </div>
              <div className="frx-hub__metric">
                <span className="metric-label">SINCE</span>
                <span className="metric-value tabular-nums">{formatSinceDate(selected.since)}</span>
              </div>
            </div>

            <div className="frx-hub__detail-aside">
              <div className="frx-hub__detail-share">
                <HubShareRing percent={selectedShare} accent={selected.partnerColor} />
                <div className="frx-hub__detail-share-text">
                  <span className="frx-hub__detail-share-pct tabular-nums">
                    {selectedShare > 0 ? `${selectedShare.toFixed(1)}%` : '—'}
                  </span>
                  <span className="frx-hub__detail-share-label">frxUSD share of pool</span>
                </div>
              </div>
              <button
                type="button"
                className="frx-hub__detail-identity"
                onClick={() => setFeedOpen(true)}
                aria-label={`Read all PegKeepers, currently ${selectedSym}`}
              >
                <TokenLogo
                  symbol={selectedSym}
                  poolId={selected.id}
                  fallbackInitials={selected.partnerInitials}
                  fallbackColor={selected.partnerColor}
                  size="sm"
                  className="frx-hub__detail-identity-logo"
                />
                <div className="frx-hub__detail-info">
                  <span className="frx-hub__detail-token">{selectedSym}</span>
                  <span className="frx-hub__detail-partner">{selected.partner}</span>
                  <p className="frx-hub__detail-desc">{selected.description}</p>
                </div>
              </button>
            </div>
          </div>

          {onViewPools && (
            <div className="frx-hub__detail-actions frx-hub__detail-actions--single">
              <button type="button" className="btn-primary btn-ghost-sm" onClick={onViewPools}>
                View pools
              </button>
            </div>
          )}
        </article>
      )}

      {feedOpen && (
        <PegKeeperFeedModal
          pools={pools}
          selectedId={selectedId}
          onSelect={onSelect}
          onClose={() => setFeedOpen(false)}
        />
      )}
    </div>
  );
}
