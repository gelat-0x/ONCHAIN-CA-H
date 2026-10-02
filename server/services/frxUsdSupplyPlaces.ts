import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import { FRXUSD_TOKEN_ETHEREUM } from '../../shared/data/frxUsdMintRoutes.ts';
import { POOL_REGISTRY } from '../../shared/data/poolRegistry.ts';
import type {
  DefiLlamaYieldPool,
  FrxUsdAdoption,
  FrxUsdAdoptionPlace,
  FrxUsdChainSupply,
  FrxUsdSupplyChainBlock,
  FrxUsdSupplyMap,
  FrxUsdSupplyPlace,
  FrxUsdSupplyUse,
  FrxUsdUseSlice,
} from '../../shared/types/index.ts';
import { fetchDefiLlamaYields } from './defillama.ts';
import { fetchFablesFrxUsdPools } from './fablesEusd.ts';
import { fetchGigaFrxUsdPools } from './gigaDex.ts';

const PLACES_TTL_MS = 120_000;
const MIN_PLACE_USD = 15_000;
const MIN_CHAIN_TILE = 100_000;
const HOME_CHAINS = new Set(['ethereum', 'fraxtal']);

const PEG_SYMBOLS = new Set(
  POOL_REGISTRY.filter((entry) => entry.venue !== 'fables').map((entry) =>
    entry.stablecoin.toLowerCase().replace(/[^a-z0-9]/g, ''),
  ),
);

const LENDING: Record<string, { name: string; logo: string }> = {
  fraxlend: { name: 'Fraxlend', logo: 'fraxlend' },
  'morpho-blue': { name: 'Morpho', logo: 'morpho' },
  morpho: { name: 'Morpho', logo: 'morpho' },
  'euler-v2': { name: 'Euler', logo: 'euler' },
  euler: { name: 'Euler', logo: 'euler' },
  'fluid-lending': { name: 'Fluid', logo: 'fluid' },
  fluid: { name: 'Fluid', logo: 'fluid' },
};

let cache: { ts: number; places: FrxUsdSupplyPlace[]; aave: { supplied: number; borrowed: number } | null } | null =
  null;

function chainKey(name: string): string {
  const n = name.toLowerCase().trim();
  if (n === 'binance' || n === 'bnb' || n === 'bnb chain') return 'bsc';
  if (n === 'hyperliquid' || n === 'hyperliquid l1') return 'hyperliquid';
  if (n === 'op mainnet' || n === 'op') return 'optimism';
  if (n === 'polygon pos' || n === 'matic') return 'polygon';
  if (n === 'avalanche c-chain' || n === 'avax') return 'avalanche';
  return n;
}

function frxUsdInPool(symbol: string, tvl: number): number {
  const parts = symbol.split(/[-_/]/).map((part) => part.trim()).filter(Boolean);
  const hits = parts.filter((part) => part.toLowerCase().replace(/[^a-z0-9]/g, '') === 'frxusd');
  if (!hits.length || tvl <= 0) return 0;
  if (parts.length <= 1) return tvl;
  return tvl * (hits.length / parts.length);
}

function prettyPart(part: string): string {
  if (/^frxusd$/i.test(part)) return 'frxUSD';
  if (/^sfrxusd$/i.test(part)) return 'sfrxUSD';
  const dated = part.match(/^([A-Za-z]+)(20\d{6})$/);
  if (dated) return `${dated[1]} ${dated[2].slice(0, 4)}`;
  if (/^20\d{6}$/.test(part)) return part.slice(0, 4);
  return part;
}

const FX_SIDES = new Set([
  'brz', 'krwq', 'audf', 'tgbp', 'zarp', 'idrx', 'eurs', 'eurc', 'euroc',
  'gbpt', 'xsgd', 'idrt', 'tryb', 'cadc', 'nzds', 'mxnb', 'xidr',
]);

const VENUE_NAME: Record<string, string> = {
  curve: 'Curve',
  uniswap: 'Uniswap',
  aerodrome: 'Aerodrome',
  fraxswap: 'Fraxswap',
  giga: 'Giga',
};

const USE_LABEL: Record<FrxUsdSupplyUse, string> = {
  pegkeeper: 'PegKeepers',
  lp: 'LP pools',
  fx: 'FX markets',
  rwa: 'Tokenized assets',
  lending: 'Lending',
  frax: 'Frax markets',
  held: 'Held',
};

const USE_ORDER: FrxUsdSupplyUse[] = ['pegkeeper', 'lp', 'fx', 'rwa', 'lending', 'frax', 'held'];

const PAIR_VENUE: Record<string, string> = {
  'curve-dex': 'curve',
  'uniswap-v4': 'uniswap',
  'uniswap-v3': 'uniswap',
  uniswap: 'uniswap',
  'aerodrome-slipstream': 'aerodrome',
  'aerodrome-v1': 'aerodrome',
  aerodrome: 'aerodrome',
  fraxswap: 'fraxswap',
};

function pairVenue(project: string): string | undefined {
  if (PAIR_VENUE[project]) return PAIR_VENUE[project];
  if (project.startsWith('uniswap')) return 'uniswap';
  if (project.startsWith('aerodrome')) return 'aerodrome';
  return undefined;
}

function isPegkeeperSymbol(symbol: string): boolean {
  const parts = symbol
    .split(/[-_/]/)
    .map((part) => part.toLowerCase().replace(/[^a-z0-9]/g, ''))
    .filter(Boolean);
  if (!parts.includes('frxusd')) return false;
  return parts.some((part) => part !== 'frxusd' && PEG_SYMBOLS.has(part));
}

function sideKey(part: string): string {
  return part.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function useOfPair(symbol: string, venue: string, peg: boolean): FrxUsdSupplyUse {
  if (peg) return 'pegkeeper';
  const parts = symbol.split(/[-_/]/).map(sideKey).filter(Boolean);
  if (parts.some((part) => part.startsWith('fxb'))) return 'rwa';
  if (parts.some((part) => FX_SIDES.has(part))) return 'fx';
  if (venue === 'fraxswap') return 'frax';
  return 'lp';
}

function pairLabel(symbol: string): string {
  const parts = symbol
    .split(/[-_/]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map(prettyPart);
  const cleaned: string[] = [];
  for (const part of parts) {
    if (/^20\d{2}$/.test(part) && cleaned.length) cleaned[cleaned.length - 1] += ` ${part}`;
    else cleaned.push(part);
  }
  return cleaned.join(' / ');
}

async function fetchAaveFrxUsd(): Promise<{ supplied: number; borrowed: number } | null> {
  const query = `query { value: asset(request: { query: { token: { chainId: 1, address: "${FRXUSD_TOKEN_ETHEREUM}" } } }) { summary { totalSupplied { exchange { current { value } } } totalBorrowed { exchange { current { value } } } } } }`;
  try {
    const res = await fetch(API_ENDPOINTS.aaveGraphql, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ query }),
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as {
      data?: {
        value?: {
          summary?: {
            totalSupplied?: { exchange?: { current?: { value?: string } } };
            totalBorrowed?: { exchange?: { current?: { value?: string } } };
          };
        };
      };
    };
    const summary = json.data?.value?.summary;
    const supplied = Number(summary?.totalSupplied?.exchange?.current?.value);
    const borrowed = Number(summary?.totalBorrowed?.exchange?.current?.value);
    if (!Number.isFinite(supplied) || supplied <= 0) return null;
    return {
      supplied: Math.round(supplied),
      borrowed: Number.isFinite(borrowed) ? Math.round(Math.max(0, borrowed)) : 0,
    };
  } catch (error) {
    console.warn('[frxUsdSupplyPlaces] Aave supply failed:', error);
    return null;
  }
}

function placesFromPools(
  pools: DefiLlamaYieldPool[],
  aave: { supplied: number; borrowed: number } | null,
): FrxUsdSupplyPlace[] {
  const places: FrxUsdSupplyPlace[] = [];

  if (aave) {
    places.push({
      id: 'lending-ethereum-aave',
      chain: 'Ethereum',
      category: 'lending',
      name: 'Aave V4',
      usd: aave.supplied,
      borrowedUsd: aave.borrowed > 0 ? aave.borrowed : undefined,
      logo: 'aave',
      use: 'lending',
    });
  }

  const lending = new Map<string, FrxUsdSupplyPlace>();
  const pairs = new Map<string, FrxUsdSupplyPlace>();

  for (const pool of pools) {
    const project = (pool.project ?? '').toLowerCase();
    const chain = pool.chain ?? '';
    const symbol = pool.symbol ?? '';
    const tvl = Number(pool.tvlUsd) || 0;
    if (!chain || tvl < MIN_PLACE_USD) continue;
    if (project.startsWith('aave')) continue;

    const lend = LENDING[project];
    if (lend) {
      const share = frxUsdInPool(symbol, tvl);
      if (share < MIN_PLACE_USD) continue;
      const id = `lending-${chainKey(chain)}-${lend.logo}`;
      const prev = lending.get(id);
      if (prev) prev.usd += share;
      else {
        lending.set(id, {
          id,
          chain,
          category: 'lending',
          name: lend.name,
          usd: share,
          logo: lend.logo,
          use: lend.logo === 'fraxlend' ? 'frax' : 'lending',
        });
      }
      continue;
    }

    if (project !== 'curve-dex' && !pairVenue(project)) continue;
    const venue = pairVenue(project) ?? 'curve';
    const share = frxUsdInPool(symbol, tvl);
    if (share < MIN_PLACE_USD) continue;
    const label = pairLabel(symbol);
    const peg = venue === 'curve' && isPegkeeperSymbol(symbol);
    const venueName = VENUE_NAME[venue] ?? venue;
    const name = `${venueName} · ${label}`;
    const id = `pairs-${chainKey(chain)}-${venue}-${label.toLowerCase()}`;
    const prev = pairs.get(id);
    if (prev) prev.usd += share;
    else {
      pairs.set(id, {
        id,
        chain,
        category: 'pairs',
        name,
        usd: share,
        logo: venue,
        use: useOfPair(symbol, venue, peg),
        ...(peg ? { kind: 'pegkeeper' as const } : {}),
      });
    }
  }

  for (const place of lending.values()) {
    if (place.usd >= MIN_PLACE_USD) places.push({ ...place, usd: Math.round(place.usd) });
  }
  for (const place of pairs.values()) {
    if (place.usd >= MIN_PLACE_USD) places.push({ ...place, usd: Math.round(place.usd) });
  }
  return places;
}

async function loadPlaces(): Promise<FrxUsdSupplyPlace[]> {
  if (cache && Date.now() - cache.ts < PLACES_TTL_MS) return cache.places;
  const [pools, aave] = await Promise.all([
    fetchDefiLlamaYields().catch(() => [] as DefiLlamaYieldPool[]),
    fetchAaveFrxUsd(),
  ]);
  const places = placesFromPools(pools, aave ?? cache?.aave ?? null);
  cache = { ts: Date.now(), places, aave: aave ?? cache?.aave ?? null };
  return places;
}

function toPlace(place: FrxUsdSupplyPlace): FrxUsdAdoptionPlace {
  return { name: place.name, usd: Math.round(place.usd), logo: place.logo, chain: place.chain };
}

function bucketOf(chain: string, known: Set<string>): 'ethereum' | 'fraxtal' | 'fraxnet' | 'outside' {
  const key = chainKey(chain);
  if (key === 'ethereum') return 'ethereum';
  if (key === 'fraxtal') return 'fraxtal';
  if (known.has(key)) return 'fraxnet';
  return 'outside';
}

function buildAdoption(chainSupply: FrxUsdChainSupply[], places: FrxUsdSupplyPlace[]): FrxUsdAdoption {
  const known = new Set(chainSupply.map((row) => chainKey(row.chain)));
  const chainUsd = (key: string) =>
    chainSupply.find((row) => chainKey(row.chain) === key)?.circulating ?? 0;

  const lending = places.filter((place) => place.category === 'lending');
  const peg = places.filter((place) => place.kind === 'pegkeeper');

  const lendingDeposited = Math.round(lending.reduce((sum, place) => sum + place.usd, 0));
  const lendingBorrowed = Math.round(lending.reduce((sum, place) => sum + (place.borrowedUsd ?? 0), 0));
  const lendingSitting = Math.max(0, lendingDeposited - lendingBorrowed);

  const locks = { ethereum: 0, fraxtal: 0, fraxnet: 0 };
  for (const place of lending) {
    const bucket = bucketOf(place.chain, known);
    if (bucket === 'outside') continue;
    const sitting = place.borrowedUsd ? Math.max(0, place.usd - place.borrowedUsd) : place.usd;
    locks[bucket] += sitting;
  }
  let pegInside = 0;
  for (const place of peg) {
    const bucket = bucketOf(place.chain, known);
    if (bucket === 'outside') continue;
    locks[bucket] += place.usd;
    pegInside += place.usd;
  }

  const ethereumHeld = Math.max(0, chainUsd('ethereum') - locks.ethereum);
  const fraxtalHeld = Math.max(0, chainUsd('fraxtal') - locks.fraxtal);
  const fraxnetGross = chainSupply
    .filter((row) => !HOME_CHAINS.has(chainKey(row.chain)))
    .reduce((sum, row) => sum + row.circulating, 0);
  const fraxnetUsd = Math.max(0, Math.round(fraxnetGross - locks.fraxnet));

  const fraxnetPlaces = chainSupply
    .filter((row) => !HOME_CHAINS.has(chainKey(row.chain)) && row.circulating >= 50_000)
    .sort((a, b) => b.circulating - a.circulating)
    .slice(0, 4)
    .map((row) => ({
      name: row.chain,
      usd: row.circulating,
      logo: 'wallet',
      chain: row.chain,
    }));

  const picture = useSlices(chainSupply, places);

  return {
    circulating: picture.denom,
    uses: picture.uses,
    lendingDeposited,
    lendingBorrowed,
    lendingSitting: Math.round(lendingSitting),
    lendingPlaces: [...lending].sort((a, b) => b.usd - a.usd).slice(0, 4).map(toPlace),
    pegkeeperUsd: Math.round(pegInside),
    robinhoodUsd: picture.robinhoodUsd,
    pegkeeperPlaces: [...peg].sort((a, b) => b.usd - a.usd).slice(0, 5).map(toPlace),
    fraxnetUsd,
    fraxnetPlaces,
    coreUsd: Math.round(ethereumHeld + fraxtalHeld),
  };
}

function isRobinhood(chain: string): boolean {
  return chainKey(chain).includes('robinhood');
}

function shareOf(usd: number, total: number): number {
  if (total <= 0 || usd <= 0) return 0;
  return Math.round((usd / total) * 10_000) / 100;
}

function useSlices(chainSupply: FrxUsdChainSupply[], places: FrxUsdSupplyPlace[]): {
  uses: FrxUsdUseSlice[];
  robinhoodUsd: number;
  denom: number;
} {
  const known = new Set(chainSupply.map((row) => chainKey(row.chain)));
  const llama = chainSupply.reduce((sum, row) => sum + row.circulating, 0);
  const buckets = new Map<FrxUsdSupplyUse, number>();
  let robinhoodUsd = 0;
  let accounted = 0;

  for (const place of places) {
    if (place.category === 'wallets') continue;
    const rh = isRobinhood(place.chain);
    if (!rh && !known.has(chainKey(place.chain))) continue;
    const usd = sittingUsd(place);
    const use: FrxUsdSupplyUse =
      place.use ??
      (place.kind === 'pegkeeper' ? 'pegkeeper' : place.category === 'lending' ? 'lending' : 'lp');
    buckets.set(use, (buckets.get(use) ?? 0) + usd);
    accounted += usd;
    if (rh) robinhoodUsd += usd;
  }

  const denom = llama + robinhoodUsd;
  const held = Math.max(0, denom - accounted);
  if (held >= 1) buckets.set('held', (buckets.get('held') ?? 0) + held);

  const uses = USE_ORDER.map((id) => ({
    id,
    label: USE_LABEL[id],
    usd: Math.round(buckets.get(id) ?? 0),
  })).filter((slice) => slice.usd > 0);

  return { uses, robinhoodUsd: Math.round(robinhoodUsd), denom: Math.round(denom) };
}

function sittingUsd(place: FrxUsdSupplyPlace): number {
  if (place.category === 'lending' && place.borrowedUsd) {
    return Math.max(0, place.usd - place.borrowedUsd);
  }
  return place.usd;
}

function fillChain(
  row: { chain: string; circulating: number },
  raw: FrxUsdSupplyPlace[],
  sharePct: number,
): FrxUsdSupplyChainBlock {
  const key = chainKey(row.chain);
  const matched = raw.filter((place) => chainKey(place.chain) === key);
  const lending = matched.filter((place) => place.category === 'lending').sort((a, b) => b.usd - a.usd);
  const pairs = matched.filter((place) => place.category === 'pairs').sort((a, b) => b.usd - a.usd);
  const locked = [...lending, ...pairs].reduce((sum, place) => sum + sittingUsd(place), 0);
  const wallets = Math.max(0, Math.round(row.circulating - locked));
  const places = [...lending, ...pairs];
  if (wallets >= MIN_PLACE_USD || places.length === 0) {
    places.push({
      id: `wallets-${key}`,
      chain: row.chain,
      category: 'wallets',
      name: 'Held on this chain',
      usd: places.length === 0 ? row.circulating : wallets,
      logo: 'wallet',
      use: 'held',
    });
  }
  return { chain: row.chain, circulating: row.circulating, sharePct, places };
}

export async function buildFrxUsdSupplyMap(chainSupply: FrxUsdChainSupply[]): Promise<FrxUsdSupplyMap> {
  const ranked = [...chainSupply].filter((row) => row.circulating > 0).sort((a, b) => b.circulating - a.circulating);

  let raw: FrxUsdSupplyPlace[] = [];
  try {
    raw = await loadPlaces();
  } catch (error) {
    console.warn('[frxUsdSupplyPlaces] places failed:', error);
  }

  try {
    const fables = await fetchFablesFrxUsdPools();
    raw = [
      ...raw,
      ...fables.map((pool) => ({
        id: `fables-${pool.slug}`,
        chain: 'Robinhood Chain' as const,
        category: 'pairs' as const,
        name: `Fables · ${pool.otherSymbol} / frxUSD`,
        usd: Math.round(pool.frxUsdUsd),
        logo: 'fables',
        ...(pool.stable ? { kind: 'pegkeeper' as const, use: 'pegkeeper' as const } : { use: 'lp' as const }),
      })),
    ];
  } catch (error) {
    console.warn('[frxUsdSupplyPlaces] Fables pools failed:', error);
  }

  try {
    const giga = await fetchGigaFrxUsdPools();
    raw = [
      ...raw,
      ...giga.map((pool) => ({
        id: `giga-${pool.id}`,
        chain: 'Robinhood Chain',
        category: 'pairs' as const,
        name: `Giga · ${pool.otherSymbol} / frxUSD`,
        usd: pool.frxUsdUsd,
        logo: 'giga',
        use: 'rwa' as const,
      })),
    ];
  } catch (error) {
    console.warn('[frxUsdSupplyPlaces] Giga pools failed:', error);
  }

  const robinhoodPlaces = raw.filter((place) => isRobinhood(place.chain));
  const robinhoodUsd = robinhoodPlaces.reduce((sum, place) => sum + place.usd, 0);
  const llama = ranked.reduce((sum, row) => sum + row.circulating, 0);
  const denom = llama + robinhoodUsd;

  const head = ranked.filter((row) => row.circulating >= MIN_CHAIN_TILE);
  const tail = ranked.filter((row) => row.circulating < MIN_CHAIN_TILE);
  const chains: FrxUsdSupplyChainBlock[] = head.map((row) =>
    fillChain(row, raw, shareOf(row.circulating, denom)),
  );

  if (tail.length) {
    const named = tail.slice(0, 8);
    const rest = tail.slice(8);
    const places: FrxUsdSupplyPlace[] = named.map((item) => ({
      id: `wallets-${chainKey(item.chain)}`,
      chain: item.chain,
      category: 'wallets',
      name: item.chain,
      usd: item.circulating,
      logo: 'wallet',
      use: 'held',
    }));
    const restUsd = rest.reduce((sum, item) => sum + item.circulating, 0);
    if (restUsd >= MIN_PLACE_USD) {
      places.push({
        id: 'wallets-other-rest',
        chain: 'Other chains',
        category: 'wallets',
        name: `${rest.length} more chains`,
        usd: Math.round(restUsd),
        logo: 'wallet',
        use: 'held',
      });
    }
    const circulating = tail.reduce((sum, row) => sum + row.circulating, 0);
    chains.push({
      chain: 'Other chains',
      circulating,
      sharePct: shareOf(circulating, denom),
      places,
    });
  }

  if (robinhoodUsd >= 1_000) {
    chains.push({
      chain: 'Robinhood Chain',
      circulating: Math.round(robinhoodUsd),
      sharePct: shareOf(robinhoodUsd, denom),
      places: [...robinhoodPlaces].sort((a, b) => b.usd - a.usd),
    });
  }

  chains.sort((a, b) => b.circulating - a.circulating);
  return { chains, adoption: buildAdoption(ranked, raw) };
}
