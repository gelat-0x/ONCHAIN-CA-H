import type { PoolData } from '../types';

/** Chart line colors aligned with bundled token logos (not generic partnerColor). */
const POOL_CHART_COLORS: Record<string, string> = {
  crvusd: '#ff6b35',
  msusd: '#ef4444',
  alusd: '#5b8def',
  pmusd: '#c9a227',
  usd3: '#2563eb',
  usg: '#00e5a0',
  sdola: '#fbbf24',
  susds: '#1eaaee',
  avusd: '#7c5cff',
  srroyusdc: '#d4a574',
  evausdt: '#00d4aa',
  uspc: '#dc2626',
  dusd: '#009a49',
  sdusd: '#6366f1',
  susde: '#d4d4d8',
  tmvusdc: '#4ecdc4',
  ousd: '#7b68ee',
  mubond: '#f472b6',
  aznd: '#22d3ee',
  fxusd: '#3b82f6',
  savusd: '#9945ff',
  susdat: '#22c55e',
  usp: '#06b6d4',
  usdaf: '#eab308',
  yusd: '#fb923c',
  ebusd: '#64748b',
  iusd: '#4ade80',
  vusd: '#8b5cf6',
  trusd: '#38bdf8',
  susdai: '#8B7355',
};

export function poolChartColor(pool: PoolData): string {
  return POOL_CHART_COLORS[pool.id] ?? pool.partnerColor ?? '#ffffff';
}

export function formatPoolApr(apr: number): string {
  if (!Number.isFinite(apr) || apr <= 0) return '—';
  if (apr < 0.05) return '<0.1%';
  if (apr < 10) return `${apr.toFixed(2)}%`;
  return `${apr.toFixed(1)}%`;
}
