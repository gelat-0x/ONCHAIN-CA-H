import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';

/** frxUSD on Robinhood Chain, from the GigaDEX token list. */
const FRXUSD = '0x00000000d61733e7a393a10a5b48c311abe8f1e5';

export interface GigaFrxPool {
  id: string;
  otherSymbol: string;
  /** frxUSD sitting in the pool, in dollars. */
  frxUsdUsd: number;
  tvlUsd: number;
  fees24hUsd: number;
}

interface GigaPoolRow {
  id: string;
  token0: string;
  token1: string;
  reserve0: string;
  reserve1: string;
  totalValueLockedUsd?: string | number;
  fees24hUsd?: string | number;
}

interface GigaTokenRow {
  address: string;
  symbol?: string;
  decimals?: number;
  priceUsd?: string | number | null;
}

async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T | null> {
  try {
    const res = await fetch(API_ENDPOINTS.gigaGraphql, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: T; errors?: unknown };
    if (json.errors || !json.data) return null;
    return json.data;
  } catch (error) {
    console.warn('[gigaDex] query failed:', error);
    return null;
  }
}

function amount(raw: string, decimals: number, price: number): number {
  const units = Number(raw);
  if (!Number.isFinite(units) || units <= 0) return 0;
  const scale = 10 ** (Number.isFinite(decimals) ? decimals : 18);
  const tokens = units / scale;
  const px = Number.isFinite(price) && price > 0 ? price : 1;
  return tokens * px;
}

/** frxUSD reserves in GigaDEX pools. DefiLlama does not index Robinhood Chain. */
export async function fetchGigaFrxUsdPools(): Promise<GigaFrxPool[]> {
  const poolsBody = await gql<{ Pool: GigaPoolRow[] }>(
    `query($addr: String!) {
      Pool(where: {_or: [{token0: {_eq: $addr}}, {token1: {_eq: $addr}}]}) {
        id token0 token1 reserve0 reserve1 totalValueLockedUsd fees24hUsd
      }
    }`,
    { addr: FRXUSD },
  );
  const pools = poolsBody?.Pool ?? [];
  if (!pools.length) return [];

  const ids = [...new Set(pools.flatMap((pool) => [pool.token0, pool.token1]))];
  const tokenBody = await gql<{ Token: GigaTokenRow[] }>(
    `query($ids: [String!]) { Token(where: {address: {_in: $ids}}) { address symbol decimals priceUsd } }`,
    { ids },
  );
  const tokens = new Map((tokenBody?.Token ?? []).map((token) => [token.address.toLowerCase(), token]));

  const out: GigaFrxPool[] = [];
  for (const pool of pools) {
    const frxIs0 = pool.token0.toLowerCase() === FRXUSD;
    const frx = tokens.get((frxIs0 ? pool.token0 : pool.token1).toLowerCase());
    const other = tokens.get((frxIs0 ? pool.token1 : pool.token0).toLowerCase());
    const price = Number(frx?.priceUsd);
    const frxUsdUsd = amount(frxIs0 ? pool.reserve0 : pool.reserve1, frx?.decimals ?? 18, price > 0 ? price : 1);
    if (frxUsdUsd < 1_000) continue;
    const fees = Number(pool.fees24hUsd);
    const tvl = Number(pool.totalValueLockedUsd);
    out.push({
      id: pool.id,
      otherSymbol: other?.symbol || 'Token',
      frxUsdUsd: Math.round(frxUsdUsd),
      tvlUsd: Number.isFinite(tvl) ? tvl : frxUsdUsd,
      fees24hUsd: Number.isFinite(fees) ? fees : 0,
    });
  }
  return out.sort((a, b) => b.frxUsdUsd - a.frxUsdUsd);
}
