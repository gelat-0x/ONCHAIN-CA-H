export type StudioTopTabId = 'pegkeeper' | 'metrics-soon';

export type StudioSubGroup = 'apr-posts' | 'pool-metrics';

export type StudioVariantId =
  | 'single-apr'
  | 'dual-apr'
  | 'triple-apr'
  | 'top5-apr'
  | 'top5-tvl'
  | 'top5-volume'
  | 'tvl-trend'
  | 'protocol-kpi'
  | 'chain-tvl';

/** @deprecated Use StudioVariantId */
export type StudioTemplateId = 'single-apr' | 'dual-apr' | 'triple-apr';

/** @deprecated Prefer StudioTopTabId — kept for older imports */
export type StudioCategory = 'apr-posts' | 'protocol-metrics' | 'pegkeeper';

export interface StudioTopTab {
  id: StudioTopTabId;
  label: string;
  /** Blurred / non-interactive coming-soon tab */
  soon?: boolean;
}

export interface StudioSubGroupDef {
  id: StudioSubGroup;
  label: string;
  /** Highlighted “shiny” treatment for Metrics under Pegkeeper */
  shiny?: boolean;
}

export interface StudioVariant {
  id: StudioVariantId;
  /** Active product surface — Pegkeeper owns live templates today */
  surface: 'pegkeeper';
  group: StudioSubGroup | 'protocol-soon';
  label: string;
  shortLabel: string;
  slotCount?: number;
  exportPrefix: string;
}

export const STUDIO_TOP_TABS: StudioTopTab[] = [
  { id: 'pegkeeper', label: 'Pegkeeper' },
  { id: 'metrics-soon', label: 'Metrics', soon: true },
];

export const STUDIO_SUB_GROUPS: StudioSubGroupDef[] = [
  { id: 'apr-posts', label: 'APR Posts' },
  { id: 'pool-metrics', label: 'Metrics', shiny: true },
];

/** @deprecated Use STUDIO_TOP_TABS */
export const STUDIO_CATEGORIES = [
  { id: 'apr-posts' as StudioCategory, label: 'Pegkeeper' },
  { id: 'protocol-metrics' as StudioCategory, label: 'Metrics' },
];

export const STUDIO_VARIANTS: StudioVariant[] = [
  {
    id: 'single-apr',
    surface: 'pegkeeper',
    group: 'apr-posts',
    label: 'Single',
    shortLabel: 'Single Pool Comparison',
    slotCount: 1,
    exportPrefix: 'apr-single',
  },
  {
    id: 'dual-apr',
    surface: 'pegkeeper',
    group: 'apr-posts',
    label: 'Dual',
    shortLabel: 'Dual Pool Comparison',
    slotCount: 2,
    exportPrefix: 'apr-dual',
  },
  {
    id: 'triple-apr',
    surface: 'pegkeeper',
    group: 'apr-posts',
    label: 'Triple',
    shortLabel: 'Triple Pool Comparison',
    slotCount: 3,
    exportPrefix: 'apr-triple',
  },
  {
    id: 'top5-apr',
    surface: 'pegkeeper',
    group: 'pool-metrics',
    label: 'Top 5 APR',
    shortLabel: 'Top 5 APR',
    exportPrefix: 'top5-apr',
  },
  {
    id: 'top5-tvl',
    surface: 'pegkeeper',
    group: 'pool-metrics',
    label: 'Top 5 TVL',
    shortLabel: 'Top 5 TVL',
    exportPrefix: 'top5-tvl',
  },
  {
    id: 'top5-volume',
    surface: 'pegkeeper',
    group: 'pool-metrics',
    label: 'Volume 24h',
    shortLabel: 'Volume 24h',
    exportPrefix: 'top5-volume',
  },
  {
    id: 'tvl-trend',
    surface: 'pegkeeper',
    group: 'protocol-soon',
    label: 'TVL Trend',
    shortLabel: 'TVL Trend',
    exportPrefix: 'tvl-trend',
  },
  {
    id: 'protocol-kpi',
    surface: 'pegkeeper',
    group: 'protocol-soon',
    label: 'KPI',
    shortLabel: 'KPI Overview',
    exportPrefix: 'protocol-kpi',
  },
  {
    id: 'chain-tvl',
    surface: 'pegkeeper',
    group: 'protocol-soon',
    label: 'Chain TVL',
    shortLabel: 'Chain TVL',
    exportPrefix: 'chain-tvl',
  },
];

/** Pool-ranking metric variants (share the Top-pools canvas). */
export type StudioPoolMetric = 'apr' | 'tvl' | 'volume';

export const POOL_METRIC_BY_VARIANT: Partial<Record<StudioVariantId, StudioPoolMetric>> = {
  'top5-apr': 'apr',
  'top5-tvl': 'tvl',
  'top5-volume': 'volume',
};

export function isPoolMetricVariant(id: StudioVariantId): boolean {
  return id in POOL_METRIC_BY_VARIANT;
}

/** Variants driven by DefiLlama protocol analyses (need the protocol picker). */
export function isProtocolVariant(id: StudioVariantId): boolean {
  return id === 'protocol-kpi' || id === 'chain-tvl' || id === 'tvl-trend';
}

export function isAprVariant(id: StudioVariantId): boolean {
  return id === 'single-apr' || id === 'dual-apr' || id === 'triple-apr';
}

export function variantsForGroup(group: StudioSubGroup): StudioVariant[] {
  return STUDIO_VARIANTS.filter((v) => v.group === group);
}

/** @deprecated Use variantsForGroup */
export function variantsForCategory(category: StudioCategory): StudioVariant[] {
  if (category === 'protocol-metrics') {
    return STUDIO_VARIANTS.filter((v) => v.group === 'protocol-soon');
  }
  return STUDIO_VARIANTS.filter((v) => v.group === 'apr-posts' || v.group === 'pool-metrics');
}

/** @deprecated Use STUDIO_VARIANTS filtered by apr-posts */
export const STUDIO_TEMPLATES = STUDIO_VARIANTS.filter((v) => v.group === 'apr-posts').map(
  (v) => ({
    id: v.id as StudioTemplateId,
    label: v.label,
    shortLabel: v.shortLabel,
    description: '',
    slots: v.slotCount ?? 1,
  }),
);

export function variantById(id: StudioVariantId): StudioVariant {
  return STUDIO_VARIANTS.find((v) => v.id === id) ?? STUDIO_VARIANTS[1];
}

/** @deprecated Use variantById */
export function templateById(id: StudioTemplateId) {
  const v = variantById(id);
  return {
    id: v.id as StudioTemplateId,
    label: v.label,
    shortLabel: v.shortLabel,
    description: '',
    slots: v.slotCount ?? 1,
  };
}
