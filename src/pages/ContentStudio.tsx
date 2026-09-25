import { useCallback, useEffect, useMemo, useRef, useState, type Ref } from 'react';
import type { PoolData } from '../types';
import { LiveTicker } from '../components/LiveTicker';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { PageGate } from '../components/PageGate';
import { AprPostCanvas } from '../components/studio/AprPostCanvas';
import { TopPoolsCanvas } from '../components/studio/TopPoolsCanvas';
import { ProtocolKpiCanvas } from '../components/studio/ProtocolKpiCanvas';
import { ChainTvlCanvas } from '../components/studio/ChainTvlCanvas';
import { TvlTrendCanvas } from '../components/studio/TvlTrendCanvas';
import { StudioBackdrop } from '../components/studio/StudioBackdrop';
import { StudioPairSlot } from '../components/studio/StudioPairSlot';
import { StudioProtocolPicker } from '../components/studio/StudioProtocolPicker';
import { StudioStylePanel } from '../components/studio/StudioStylePanel';
import { StudioDataBar } from '../components/studio/StudioDataBar';
import {
  POOL_METRIC_BY_VARIANT,
  STUDIO_SUB_GROUPS,
  STUDIO_TOP_TABS,
  isAprVariant,
  isPoolMetricVariant,
  isProtocolVariant,
  variantById,
  variantsForGroup,
  type StudioVariantId,
} from '../components/studio/studioRegistry';
import { DEFAULT_STUDIO_BACKGROUND_ID } from '../../shared/constants/studioBackgrounds';
import type { DashboardDefiLlamaSlug } from '../../shared/constants/defiLlamaProtocols';
import {
  downloadStudioImage,
  STUDIO_EXPORT_HEIGHT,
  STUDIO_EXPORT_WIDTH,
} from '../lib/studioExport';
import { buildStudioFilename } from '../lib/studioModel';
import { useStudioDashboard } from '../hooks/useStudioDashboard';
import { useStudioProtocolData, getProtocolAnalysis } from '../hooks/useStudioProtocolData';
import { DASHBOARD_DEFILLAMA_PROTOCOLS } from '../../shared/constants/defiLlamaProtocols';
import { studioDisplayApr } from '../lib/studioApr';

const DEFAULT_PROTOCOL: DashboardDefiLlamaSlug = 'frax-finance';

export function ContentStudioPage() {
  const [variantId, setVariantId] = useState<StudioVariantId>('dual-apr');
  const [selection, setSelection] = useState<string[]>([]);
  const [protocolSlug, setProtocolSlug] = useState<DashboardDefiLlamaSlug>(DEFAULT_PROTOCOL);
  const [backgroundId, setBackgroundId] = useState(DEFAULT_STUDIO_BACKGROUND_ID);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [manualSave, setManualSave] = useState<{ url: string; filename: string } | null>(null);
  const manualSaveTimer = useRef<number | null>(null);

  const exportRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.5);

  const dashboard = useStudioDashboard(variantId, setSelection);
  const protocolData = useStudioProtocolData();
  const { pools, ticker, loading, refresh } = dashboard;

  const variant = variantById(variantId);
  const slots = variant.slotCount ?? 0;
  const poolMetric = POOL_METRIC_BY_VARIANT[variantId];

  const selectedPools = useMemo(
    () =>
      selection
        .map((id) => pools.find((p) => p.id === id))
        .filter((p): p is PoolData => Boolean(p)),
    [selection, pools],
  );

  const protocolAnalysis = getProtocolAnalysis(protocolData.protocols, protocolSlug);
  const protocolConfig = DASHBOARD_DEFILLAMA_PROTOCOLS.find((p) => p.slug === protocolSlug);

  const poolMetricReady = useMemo(() => {
    if (!poolMetric) return false;
    if (poolMetric === 'apr') return pools.some((p) => studioDisplayApr(p) > 0);
    if (poolMetric === 'tvl') return pools.some((p) => p.tvl > 0);
    return pools.some((p) => p.volume24h > 0);
  }, [pools, poolMetric]);

  const updateSlot = useCallback(
    (index: number, poolId: string) => {
      setSelection((prev) => {
        const next = [...prev];
        while (next.length < slots) next.push('');
        next[index] = poolId;
        return next.slice(0, slots);
      });
    },
    [slots],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const trendReady =
    variantId === 'tvl-trend' &&
    Boolean(protocolAnalysis) &&
    (protocolAnalysis?.series.tvl.filter(
      (p) => Number.isFinite(p.ts) && Number.isFinite(p.value) && p.value >= 0,
    ).length ?? 0) >= 2;

  const kpiReady =
    variantId === 'protocol-kpi' &&
    Boolean(protocolAnalysis?.headlines.some((m) => m.value != null));
  const chainReady =
    variantId === 'chain-tvl' &&
    Boolean(protocolAnalysis?.chainTvl.some((c) => Number.isFinite(c.tvl) && c.tvl > 0));

  const canExportApr = isAprVariant(variantId) && selectedPools.length === slots;
  const canExportPoolMetric = isPoolMetricVariant(variantId) && poolMetricReady && !loading;
  const canExportProtocol = (kpiReady || chainReady) && !protocolData.loading;
  const canExportTrend = trendReady && !protocolData.loading;

  const canExport = canExportApr || canExportPoolMetric || canExportProtocol || canExportTrend;
  const isLoading =
    isAprVariant(variantId) || isPoolMetricVariant(variantId) ? loading : protocolData.loading;

  const [booted, setBooted] = useState(false);
  useEffect(() => {
    if (booted) return;
    if (!loading) setBooted(true);
  }, [loading, booted]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    const el = previewWrapRef.current;
    if (!el) return;
    const measure = () => {
      const narrow = window.innerWidth <= 768;
      const styles = window.getComputedStyle(el);
      const padX =
        (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
      // Content-box width only. Safari often reports subpixels that over-scale
      // the transform and clip the bottom/right of the export preview.
      const contentW = Math.max(0, Math.floor(el.clientWidth - padX));
      const safety = narrow ? 8 : 2;
      const scale = Math.min(1, (contentW - safety) / STUDIO_EXPORT_WIDTH);
      const fallback = narrow ? 0.22 : 0.5;
      setPreviewScale(Number.isFinite(scale) && scale > 0 ? scale : fallback);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, [canExport, variantId]);

  const handleRefresh = () => {
    void refresh(true);
    void protocolData.refresh(true);
  };

  const manualSaveUrlRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (manualSaveTimer.current != null) window.clearTimeout(manualSaveTimer.current);
      if (manualSaveUrlRef.current) URL.revokeObjectURL(manualSaveUrlRef.current);
    };
  }, []);

  const handleDownload = async () => {
    if (!exportRef.current || !canExport) return;
    setExporting(true);
    setExportError(null);
    const filename = buildStudioFilename(
      variantId,
      isAprVariant(variantId) ? selectedPools : pools,
      protocolSlug,
    );
    try {
      const result = await downloadStudioImage(exportRef.current, filename);
      if (manualSaveTimer.current != null) window.clearTimeout(manualSaveTimer.current);
      if (manualSaveUrlRef.current && manualSaveUrlRef.current !== result.objectUrl) {
        URL.revokeObjectURL(manualSaveUrlRef.current);
      }
      manualSaveUrlRef.current = result.objectUrl;
      setManualSave({ url: result.objectUrl, filename });
      // Keep a fresh-gesture fallback for Chrome, which often swallows
      // programmatic downloads after the async html-to-image capture.
      manualSaveTimer.current = window.setTimeout(() => {
        if (manualSaveUrlRef.current) {
          URL.revokeObjectURL(manualSaveUrlRef.current);
          manualSaveUrlRef.current = null;
        }
        setManualSave(null);
        manualSaveTimer.current = null;
      }, 60_000);
    } catch {
      setExportError('Export failed, try again or refresh data.');
    } finally {
      setExporting(false);
    }
  };

  const renderCanvas = (ref?: Ref<HTMLDivElement>) => {
    if (isAprVariant(variantId) && canExportApr) {
      return <AprPostCanvas ref={ref} pools={selectedPools} backgroundId={backgroundId} />;
    }
    if (poolMetric && canExportPoolMetric) {
      return (
        <TopPoolsCanvas ref={ref} pools={pools} metric={poolMetric} backgroundId={backgroundId} />
      );
    }
    if (variantId === 'tvl-trend' && protocolAnalysis && trendReady) {
      return (
        <TvlTrendCanvas
          ref={ref}
          analysis={protocolAnalysis}
          accent={protocolConfig?.chartColor}
          backgroundId={backgroundId}
        />
      );
    }
    if (variantId === 'protocol-kpi' && protocolAnalysis && kpiReady) {
      return <ProtocolKpiCanvas ref={ref} analysis={protocolAnalysis} backgroundId={backgroundId} />;
    }
    if (variantId === 'chain-tvl' && protocolAnalysis && chainReady) {
      return (
        <ChainTvlCanvas
          ref={ref}
          analysis={protocolAnalysis}
          accent={protocolConfig?.chartColor}
          backgroundId={backgroundId}
        />
      );
    }
    return null;
  };

  const previewCanvas = renderCanvas();

  const emptyMessage = (() => {
    if (isAprVariant(variantId)) {
      return `Select ${slots} pool${slots > 1 ? 's' : ''} to preview.`;
    }
    if (isPoolMetricVariant(variantId)) {
      return loading ? 'Loading pool data…' : 'No pool data available.';
    }
    if (variantId === 'tvl-trend' && protocolAnalysis && !trendReady) {
      return 'No TVL history available for this protocol.';
    }
    if (variantId === 'protocol-kpi' && protocolAnalysis && !kpiReady) {
      return 'No reliable KPI data available for this protocol right now.';
    }
    if (variantId === 'chain-tvl' && protocolAnalysis && !chainReady) {
      return 'No chain TVL data available for this protocol right now.';
    }
    return protocolData.loading ? 'Loading protocol data…' : 'Select a protocol to preview.';
  })();

  if (!booted) {
    return <PageGate ready={false} message="Loading Studio…" />;
  }

  return (
    <>
      <LiveTicker items={ticker} />
      <Header />

      <div className="studio-page">
        <StudioBackdrop />

        <main className="page-pad content-studio">
          <header className="content-studio__hero">
            <div className="content-studio__intro">
              <h1 className="content-studio__title">content studio</h1>
            </div>
          </header>

          <div className="studio-controls-row">
            <nav className="studio-categories" aria-label="Studio surfaces">
              {STUDIO_TOP_TABS.map((tab) =>
                tab.soon ? (
                  <span
                    key={tab.id}
                    className="studio-categories__btn studio-categories__btn--soon"
                    aria-disabled="true"
                    title="Coming soon"
                  >
                    <span className="studio-categories__soon-label">{tab.label}</span>
                    <span className="studio-categories__soon-pill">Soon</span>
                  </span>
                ) : (
                  <button
                    key={tab.id}
                    type="button"
                    className="studio-categories__btn studio-categories__btn--active"
                    aria-pressed="true"
                  >
                    {tab.label}
                  </button>
                ),
              )}
            </nav>
            <StudioDataBar dashboard={dashboard} onRefresh={handleRefresh} />
          </div>

          <div className="studio-pegkeeper-groups" aria-label="Pegkeeper post types">
            {STUDIO_SUB_GROUPS.map((group) => {
              const groupVariants = variantsForGroup(group.id);
              return (
                <section
                  key={group.id}
                  className={`studio-subgroup ${group.shiny ? 'studio-subgroup--shiny' : ''}`}
                >
                  <p className="studio-subgroup__label">{group.label}</p>
                  <nav
                    className="studio-templates studio-templates--segmented"
                    aria-label={group.label}
                  >
                    {groupVariants.map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        className={`studio-templates__btn ${
                          variantId === v.id ? 'studio-templates__btn--active' : ''
                        }`}
                        onClick={() => setVariantId(v.id)}
                        aria-pressed={variantId === v.id}
                      >
                        {v.label}
                      </button>
                    ))}
                  </nav>
                </section>
              );
            })}
          </div>

          <div className="content-studio__workbench">
            <aside className="content-studio__config">
              {isAprVariant(variantId) && (
                <section className="studio-config-card">
                  {loading && !pools.length ? (
                    <p className="studio-config-card__loading" role="status">
                      Loading pools…
                    </p>
                  ) : (
                    <div className="studio-config-card__fields">
                      {Array.from({ length: slots }, (_, i) => (
                        <StudioPairSlot
                          key={`${variantId}-${i}`}
                          label={
                            slots === 1
                              ? 'frxUSD pegkeeper yields'
                              : `Pair ${i + 1}`
                          }
                          pools={pools}
                          value={selection[i] ?? ''}
                          onChange={(id) => updateSlot(i, id)}
                          excludeIds={selection.filter((_, j) => j !== i)}
                          disabled={loading}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {isProtocolVariant(variantId) && (
                <section className="studio-config-card">
                  <StudioProtocolPicker
                    value={protocolSlug}
                    onChange={setProtocolSlug}
                    disabled={protocolData.loading}
                  />
                </section>
              )}

              <section className="studio-config-card studio-config-card--style">
                <StudioStylePanel backgroundId={backgroundId} onBackgroundChange={setBackgroundId} />
              </section>
            </aside>

            <section className="studio-preview-area">
              <div ref={previewWrapRef} className="studio-preview__frame">
                {!previewCanvas ? (
                  <div className="studio-preview__empty">
                    <span className="studio-preview__empty-icon" aria-hidden>
                      ◫
                    </span>
                    <p>{emptyMessage}</p>
                  </div>
                ) : (
                  <div
                    className="studio-preview__scale"
                    style={{
                      width: Math.floor(STUDIO_EXPORT_WIDTH * previewScale),
                      height: Math.ceil(STUDIO_EXPORT_HEIGHT * previewScale),
                    }}
                  >
                    <div
                      className="studio-preview__scale-inner"
                      style={{
                        width: STUDIO_EXPORT_WIDTH,
                        height: STUDIO_EXPORT_HEIGHT,
                        transform: `scale(${previewScale})`,
                        transformOrigin: 'top left',
                      }}
                    >
                      {previewCanvas}
                    </div>
                  </div>
                )}
              </div>

              <div className="studio-preview__actions">
                <button
                  type="button"
                  className="btn-primary studio-preview__download"
                  disabled={!canExport || exporting || isLoading}
                  onClick={() => void handleDownload()}
                >
                  {exporting ? 'Exporting…' : 'Download PNG'}
                </button>
                {manualSave && (
                  <a
                    className="studio-preview__manual-save"
                    href={manualSave.url}
                    download={manualSave.filename}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tap here if download didn’t start
                  </a>
                )}
                {exportError && <p className="studio-preview__error">{exportError}</p>}
              </div>
            </section>
          </div>

          {canExport && (
            <div className="studio-export-host" aria-hidden>
              {renderCanvas(exportRef)}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </>
  );
}
