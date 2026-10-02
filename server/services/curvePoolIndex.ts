import { curveChainSlug, curveDepositUrl } from '../../shared/data/poolRegistry.ts';

interface CurvePoolLite {
  slug: string;
  symbols: string[];
  usd: number;
  address: string;
}

const CHAINS = ['ethereum', 'fraxtal', 'polygon'];
const TTL_MS = 10 * 60_000;

let cache: { ts: number; pools: CurvePoolLite[] } | null = null;
let pending: Promise<CurvePoolLite[]> | null = null;

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function loadCurvePools(): Promise<CurvePoolLite[]> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.pools;
  if (pending) return pending;
  pending = fetchCurvePools().finally(() => {
    pending = null;
  });
  return pending;
}

async function fetchCurvePools(): Promise<CurvePoolLite[]> {
  const pools: CurvePoolLite[] = [];
  await Promise.all(
    CHAINS.map(async (slug) => {
      try {
        const res = await fetch(`https://api.curve.finance/api/getPools/all/${slug}`, {
          signal: AbortSignal.timeout(18_000),
          headers: { accept: 'application/json' },
        });
        if (!res.ok) return;
        const json = (await res.json()) as {
          data?: { poolData?: Array<{ address?: string; usdTotal?: number; coins?: Array<{ symbol?: string }> }> };
        };
        for (const pool of json.data?.poolData ?? []) {
          const symbols = (pool.coins ?? []).map((coin) => norm(coin.symbol ?? '')).filter(Boolean);
          if (!symbols.includes('frxusd') || !pool.address) continue;
          pools.push({
            slug,
            symbols,
            usd: Number(pool.usdTotal) || 0,
            address: pool.address,
          });
        }
      } catch (error) {
        console.warn(`[curvePoolIndex] ${slug} failed:`, error);
      }
    }),
  );
  if (pools.length) cache = { ts: Date.now(), pools };
  return pools;
}

function labelParts(label: string): string[] {
  return label
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((part) => part && part !== 'curve' && part !== 'frxusd');
}

/** Registry PegKeeper page, or the deepest Curve pool the public pool list can match. */
export async function resolveCurveDeposit(chain: string, label: string): Promise<string> {
  const known = curveDepositUrl(chain, label);
  if (!known.endsWith('/pools')) return known;
  const slug = curveChainSlug(chain);
  const parts = labelParts(label);
  const pools = await loadCurvePools();
  let best: CurvePoolLite | null = null;
  for (const pool of pools) {
    if (pool.slug !== slug || !pool.symbols.includes('frxusd')) continue;
    const others = pool.symbols.filter((symbol) => symbol !== 'frxusd');
    const matched = parts.some((part) =>
      others.some((symbol) => symbol === part || (/^\d{4}$/.test(part) && symbol.includes(part))),
    );
    if (!matched) continue;
    if (!best || pool.usd > best.usd) best = pool;
  }
  if (!best) return known;
  return `https://www.curve.finance/dex/${slug}/pools/${best.address}/deposit`;
}
