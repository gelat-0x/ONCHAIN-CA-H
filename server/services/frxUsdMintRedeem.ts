import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import { FRXUSD_MINT_ROUTES, FRXUSD_TOKEN_ETHEREUM } from '../../shared/data/frxUsdMintRoutes.ts';
import type {
  ChartPoint,
  FrxUsdChainSupply,
  FrxUsdMintRedeemData,
  FrxUsdMintRedeemDay,
  FrxUsdMintRedeemEvent,
  FrxUsdRouteVolume,
  FrxUsdWindowPeak,
} from '../../shared/types/index.ts';
import { fetchJson } from '../lib/http.ts';
import { fetchDefiLlamaStablecoins, findFrxUsdAsset } from './defillama.ts';
import { buildFrxUsdSupplyMap } from './frxUsdSupplyPlaces.ts';
import {
  ethBlockNumber,
  ethBlockTimestamps,
  ethGetLogsChunked,
  frxUsdFromShares,
  hexToBigInt,
} from './ethRpc.ts';
import { fetchFrxUsdStablecoinId, fetchFrxUsdSupplyHistory } from './protocolCharts.ts';

const DOCS_URL = 'https://docs.frax.com/frxusd/mint-and-redeem-overview';

const TOPIC_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ZERO_TOPIC = '0x0000000000000000000000000000000000000000000000000000000000000000';
const ETHERSCAN_TX = 'https://etherscan.io/tx/';
const ISSUANCE_CHAIN = 'Ethereum';

const BLOCKS_PER_DAY = 7_200;
const MS_PER_DAY = 86_400_000;
const LOG_LOOKBACK_DAYS = 7;
const TOKEN_LOG_CHUNK = 4_000;
const BLOCK_TS_CONCURRENCY = 6;

let cache: { ts: number; data: FrxUsdMintRedeemData | null } | null = null;
const CACHE_MS = 12_000;
let lastOnChain: { ts: number; events: FrxUsdMintRedeemEvent[] } | null = null;

function dayStart(ts: number): number {
  return Math.floor(ts / MS_PER_DAY) * MS_PER_DAY;
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Derive daily mint/redeem from circulating-supply deltas (DefiLlama). */
function dailyFromSupply(points: ChartPoint[]): FrxUsdMintRedeemDay[] {
  if (points.length < 2) return [];
  const sorted = [...points].sort((a, b) => a.ts - b.ts);
  const out: FrxUsdMintRedeemDay[] = [];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1]!;
    const cur = sorted[i]!;
    const delta = cur.value - prev.value;
    out.push({
      ts: dayStart(cur.ts),
      mint: delta > 0 ? delta : 0,
      redeem: delta < 0 ? -delta : 0,
      net: delta,
      supply: cur.value,
    });
  }
  return out;
}

function allTimeFromDaily(days: FrxUsdMintRedeemDay[]): {
  mintAll: number;
  redeemAll: number;
  netAll: number;
} {
  let mintAll = 0;
  let redeemAll = 0;
  for (const d of days) {
    mintAll += d.mint;
    redeemAll += d.redeem;
  }
  mintAll = roundCents(mintAll);
  redeemAll = roundCents(redeemAll);
  return { mintAll, redeemAll, netAll: roundCents(mintAll - redeemAll) };
}

const BALANCE_SHEET_URL = 'https://api.frax.finance/v2/frxusd/balance-sheet/latest';

const SHEET_CHAIN: Record<string, string> = {
  ethereum: 'Ethereum',
  fraxtal: 'Fraxtal',
  abstract: 'Abstract',
  aptos: 'Aptos',
  arbitrum: 'Arbitrum',
  avalanche: 'Avalanche',
  base: 'Base',
  blast: 'Blast',
  berachain: 'Berachain',
  bsc: 'BSC',
  hyperliquid: 'Hyperliquid',
  ink: 'Ink',
  linea: 'Linea',
  katana: 'Katana',
  mode: 'Mode',
  monad: 'Monad',
  movement: 'Movement',
  optimism: 'OP Mainnet',
  plume: 'Plume',
  polygon: 'Polygon',
  polygon_zkevm: 'Polygon zkEVM',
  scroll: 'Scroll',
  stable: 'Stable',
  sei: 'Sei',
  solana: 'Solana',
  somnia: 'Somnia',
  sonic: 'Sonic',
  tempo: 'Tempo',
  unichain: 'Unichain',
  worldchain: 'World Chain',
  xlayer: 'X Layer',
  zksync: 'zkSync',
};

/** Official circulation by chain. Ethereum is net of the Fraxtal bridge lock. */
function chainSupplyFromBalanceSheet(
  liabilities: { description?: string; totalValueUsd?: number }[],
): FrxUsdChainSupply[] {
  let ethGross = 0;
  let ethBridge = 0;
  const map = new Map<string, number>();
  for (const row of liabilities) {
    const usd = Number(row.totalValueUsd) || 0;
    const desc = row.description ?? '';
    if (/fraxtal l1 bridge/i.test(desc)) {
      ethBridge += usd;
      continue;
    }
    const match = desc.match(/total supply of frxusd on ([a-z0-9_]+)/i);
    if (!match) continue;
    const id = match[1].toLowerCase();
    if (id === 'ethereum') {
      ethGross += usd;
      continue;
    }
    const label = SHEET_CHAIN[id] ?? id;
    map.set(label, (map.get(label) ?? 0) + usd);
  }
  const ethNet = ethGross + ethBridge;
  if (ethNet > 1_000) map.set('Ethereum', ethNet);
  const rows = [...map.entries()]
    .map(([chain, circulating]) => ({ chain, circulating: Math.round(circulating) }))
    .filter((row) => row.circulating > 0)
    .sort((a, b) => b.circulating - a.circulating);
  const total = rows.reduce((sum, row) => sum + row.circulating, 0) || 1;
  return rows.map((row) => ({
    ...row,
    sharePct: Math.round((row.circulating / total) * 10_000) / 100,
  }));
}

async function fetchOfficialChainSupply(): Promise<FrxUsdChainSupply[] | null> {
  try {
    const res = await fetch(BALANCE_SHEET_URL, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { liabilities?: { description?: string; totalValueUsd?: number }[] };
    const rows = chainSupplyFromBalanceSheet(json.liabilities ?? []);
    return rows.length ? rows : null;
  } catch (error) {
    console.warn('[frxUsdMintRedeem] balance sheet chains failed:', error);
    return null;
  }
}

function chainSupplyFromDefiLlama(
  chainCirculating?: Record<string, { current?: { peggedUSD?: number } }>,
): FrxUsdChainSupply[] {
  if (!chainCirculating) return [];
  const rows = Object.entries(chainCirculating)
    .map(([chain, v]) => ({
      chain,
      circulating: Math.round(Number(v.current?.peggedUSD) || 0),
    }))
    .filter((r) => r.circulating > 0)
    .sort((a, b) => b.circulating - a.circulating);

  const total = rows.reduce((s, r) => s + r.circulating, 0) || 1;
  return rows.map((r) => ({
    ...r,
    sharePct: Math.round((r.circulating / total) * 1000) / 10,
  }));
}

type RouteEvent = FrxUsdMintRedeemEvent;

function explorerUrl(txHash: string): string {
  return `${ETHERSCAN_TX}${txHash}`;
}

function withTxMeta(
  event: Omit<RouteEvent, 'chain' | 'explorerUrl'>,
): RouteEvent {
  return {
    ...event,
    chain: ISSUANCE_CHAIN,
    explorerUrl: explorerUrl(event.txHash),
  };
}

function parseSupplyRows(
  rows: { peggedUSD?: number; date?: string; timestamp?: number; totalCirculating?: { peggedUSD?: number }; circulating?: { peggedUSD?: number } }[],
): ChartPoint[] {
  return rows
    .map((r, i) => {
      const value = Math.round(
        Number(r.peggedUSD ?? r.totalCirculating?.peggedUSD ?? r.circulating?.peggedUSD) || 0,
      );
      const ts = r.timestamp
        ? r.timestamp * 1000
        : r.date
          ? new Date(r.date).getTime()
          : Date.now() - (rows.length - 1 - i) * MS_PER_DAY;
      return { ts, value };
    })
    .filter((p) => p.ts > 0 && p.value >= 0)
    .sort((a, b) => a.ts - b.ts);
}

async function fetchSupplyHistoryDirect(assetId: string): Promise<ChartPoint[]> {
  const chartRows = await fetchJson<{ date: number; totalCirculating?: { peggedUSD?: number } }[]>(
    API_ENDPOINTS.defiLlama.stablecoinChart(assetId),
    { timeout: 15_000 },
  );
  if (chartRows?.length) {
    return chartRows
      .map((r) => ({
        ts: r.date * 1000,
        value: Math.round(Number(r.totalCirculating?.peggedUSD) || 0),
      }))
      .filter((p) => p.ts > 0 && p.value >= 0)
      .sort((a, b) => a.ts - b.ts);
  }

  const res = await fetchJson<{
    historicalCirculating?: Parameters<typeof parseSupplyRows>[0];
  }>(API_ENDPOINTS.defiLlama.stablecoinDetail(assetId), {
    timeout: 15_000,
  });
  return parseSupplyRows(res?.historicalCirculating ?? []);
}

/** frxUSD ERC20 mint (from zero) and burn (to zero) — protocol-wide issuance. */
async function fetchTokenMintBurn(
  fromBlock: number,
  toBlock: number,
  txRoutes: Map<string, { routeId: string; asset: string; type: 'mint' | 'redeem' }>,
): Promise<RouteEvent[]> {
  const token = FRXUSD_TOKEN_ETHEREUM.toLowerCase();
  const [mints, burns] = await Promise.all([
    ethGetLogsChunked(
      { address: token, topics: [TOPIC_TRANSFER, ZERO_TOPIC] },
      fromBlock,
      toBlock,
      TOKEN_LOG_CHUNK,
    ),
    ethGetLogsChunked(
      { address: token, topics: [TOPIC_TRANSFER, null, ZERO_TOPIC] },
      fromBlock,
      toBlock,
      TOKEN_LOG_CHUNK,
    ),
  ]);

  type Pending = {
    log: (typeof mints)[number];
    type: 'mint' | 'redeem';
    amount: number;
    block: number;
    key: string;
  };

  const pending: Pending[] = [];
  const seen = new Set<string>();

  const classify = (log: (typeof mints)[number], kind: 'mint' | 'redeem') => {
    const amount = frxUsdFromShares(hexToBigInt(log.data));
    if (amount <= 0) return;
    const topics = log.topics.map((t) => t.toLowerCase());
    const fromZero = topics[1] === ZERO_TOPIC;
    const toZero = topics[2] === ZERO_TOPIC;
    // Classify by topics — some RPCs ignore null topics and return the same logs for both filters.
    const type: 'mint' | 'redeem' = fromZero ? 'mint' : toZero ? 'redeem' : kind;
    if (!fromZero && !toZero) return;
    const txHash = log.transactionHash.toLowerCase();
    const logIndex = log.logIndex ? Number.parseInt(log.logIndex, 16) : seen.size;
    const key = `${txHash}-${logIndex}`;
    if (seen.has(key)) return;
    seen.add(key);
    const block = Number.parseInt(log.blockNumber, 16);
    pending.push({ log, type, amount, block, key });
  };

  for (const log of mints) classify(log, 'mint');
  for (const log of burns) classify(log, 'redeem');

  const blockTs = await ethBlockTimestamps(
    pending.map((p) => p.block),
    BLOCK_TS_CONCURRENCY,
  );

  const events: RouteEvent[] = [];
  for (const p of pending) {
    const ts = blockTs.get(p.block);
    if (ts == null) continue;
    const txHash = p.log.transactionHash.toLowerCase();
    const route = txRoutes.get(txHash);
    events.push(
      withTxMeta({
        id: p.key,
        ts,
        type: p.type,
        routeId: route?.routeId ?? 'other',
        asset: route?.asset ?? 'frxUSD',
        amountUsd: p.amount,
        txHash: p.log.transactionHash,
      }),
    );
  }

  return events.sort((a, b) => b.ts - a.ts);
}

function windowSum(events: RouteEvent[], type: 'mint' | 'redeem', since: number): number {
  const sum = events.filter((e) => e.type === type && e.ts >= since).reduce((s, e) => s + e.amountUsd, 0);
  return roundCents(sum);
}

function windowPeak(events: RouteEvent[], type: 'mint' | 'redeem', since: number): number {
  let max = 0;
  for (const event of events) {
    if (event.type === type && event.ts >= since && event.amountUsd > max) max = event.amountUsd;
  }
  return roundCents(max);
}

function dayPeak(days: FrxUsdMintRedeemDay[], field: 'mint' | 'redeem', since?: number): number {
  let max = 0;
  for (const day of days) {
    if (since != null && day.ts < since) continue;
    if (day[field] > max) max = day[field];
  }
  return roundCents(max);
}

/**
 * Public Ethereum RPCs only keep a short archive, so a 7-day log sum collapses
 * into the last day. Earlier days use DefiLlama's net supply change, and the
 * rolling day stays on gross mint and burn logs.
 */
function hybrid7d(
  daily: FrxUsdMintRedeemDay[],
  mint24h: number,
  redeem24h: number,
  now: number,
): { mint: number; redeem: number } {
  const startToday = dayStart(now);
  const since = now - 7 * MS_PER_DAY;
  let mint = mint24h;
  let redeem = redeem24h;
  for (const day of daily) {
    if (day.ts >= since && day.ts < startToday) {
      mint += day.mint;
      redeem += day.redeem;
    }
  }
  return { mint: roundCents(mint), redeem: roundCents(redeem) };
}

function peakWindow(
  printMint: number,
  printRedeem: number,
  dayMint: number,
  dayRedeem: number,
): FrxUsdWindowPeak {
  const mintFromDay = dayMint > printMint;
  const redeemFromDay = dayRedeem > printRedeem;
  return {
    mint: mintFromDay ? dayMint : printMint,
    redeem: redeemFromDay ? dayRedeem : printRedeem,
    mintBasis: mintFromDay ? 'day' : 'print',
    redeemBasis: redeemFromDay ? 'day' : 'print',
  };
}

function routeVolumes(events: RouteEvent[], now: number): FrxUsdRouteVolume[] {
  const since24h = now - MS_PER_DAY;
  const since7d = now - 7 * MS_PER_DAY;
  const since30d = now - 30 * MS_PER_DAY;

  const tokenRow: FrxUsdRouteVolume = {
    id: 'frxusd',
    asset: 'frxUSD',
    issuer: 'Frax',
    custodianAddress: FRXUSD_TOKEN_ETHEREUM,
    mint24h: windowSum(events, 'mint', since24h),
    redeem24h: windowSum(events, 'redeem', since24h),
    mint7d: windowSum(events, 'mint', since7d),
    redeem7d: windowSum(events, 'redeem', since7d),
    mint30d: windowSum(events, 'mint', since30d),
    redeem30d: windowSum(events, 'redeem', since30d),
  };

  const tagged = FRXUSD_MINT_ROUTES.map((route) => {
    const routeEvents = events.filter((e) => e.routeId === route.id);
    return {
      id: route.id,
      asset: route.asset,
      issuer: route.issuer,
      custodianAddress: route.custodianAddress,
      mint24h: windowSum(routeEvents, 'mint', since24h),
      redeem24h: windowSum(routeEvents, 'redeem', since24h),
      mint7d: windowSum(routeEvents, 'mint', since7d),
      redeem7d: windowSum(routeEvents, 'redeem', since7d),
      mint30d: windowSum(routeEvents, 'mint', since30d),
      redeem30d: windowSum(routeEvents, 'redeem', since30d),
    };
  }).filter((row) => row.mint24h + row.redeem24h + row.mint7d + row.redeem7d > 0);

  return [tokenRow, ...tagged];
}

export async function fetchFrxUsdMintRedeemOverview(): Promise<FrxUsdMintRedeemData | null> {
  if (cache && Date.now() - cache.ts < CACHE_MS) return cache.data;

  const now = Date.now();
  const [assets, frxId, latestBlock, officialChains] = await Promise.all([
    fetchDefiLlamaStablecoins(),
    fetchFrxUsdStablecoinId(),
    ethBlockNumber(),
    fetchOfficialChainSupply(),
  ]);

  const frxAsset = findFrxUsdAsset(assets);
  const llamaSupply = chainSupplyFromDefiLlama(frxAsset?.chainCirculating);
  const chainSupply = officialChains ?? llamaSupply;
  const circulating = chainSupply.reduce((sum, row) => sum + row.circulating, 0)
    || Math.round(Number(frxAsset?.circulating?.peggedUSD) || 0);

  const fromBlock = latestBlock ? Math.max(0, latestBlock - BLOCKS_PER_DAY * LOG_LOOKBACK_DAYS) : 0;
  const [supplyPoints, tokenEvents] = await Promise.all([
    frxId ? fetchSupplyHistoryDirect(frxId) : fetchFrxUsdSupplyHistory(frxId),
    latestBlock
      ? fetchTokenMintBurn(fromBlock, latestBlock, new Map()).catch((err) => {
          console.warn('[frxUsdMintRedeem] token logs failed:', err);
          return [] as RouteEvent[];
        })
      : Promise.resolve([] as RouteEvent[]),
  ]);
  const dailyFull = dailyFromSupply(supplyPoints);
  const { mintAll, redeemAll, netAll } = allTimeFromDaily(dailyFull);
  const daily = dailyFull.slice(-120);

  let activityEvents = tokenEvents;
  if (activityEvents.length || lastOnChain) {
    const since = now - 8 * MS_PER_DAY;
    const merged = new Map<string, RouteEvent>();
    for (const event of lastOnChain?.events ?? []) {
      if (event.ts >= since) merged.set(event.id, event);
    }
    for (const event of activityEvents) merged.set(event.id, event);
    activityEvents = [...merged.values()].sort((a, b) => b.ts - a.ts);
    if (activityEvents.length) lastOnChain = { ts: Date.now(), events: activityEvents };
  }

  const hasTokenSignal = activityEvents.length > 0;
  const routes = routeVolumes(activityEvents, now);
  const mint24h = windowSum(activityEvents, 'mint', now - MS_PER_DAY);
  const redeem24h = windowSum(activityEvents, 'redeem', now - MS_PER_DAY);
  const week = hybrid7d(dailyFull, mint24h, redeem24h, now);
  const mint7d = week.mint;
  const redeem7d = week.redeem;
  const since7d = now - 7 * MS_PER_DAY;
  const peaks = {
    h24: peakWindow(
      windowPeak(activityEvents, 'mint', now - MS_PER_DAY),
      windowPeak(activityEvents, 'redeem', now - MS_PER_DAY),
      0,
      0,
    ),
    d7: peakWindow(
      windowPeak(activityEvents, 'mint', since7d),
      windowPeak(activityEvents, 'redeem', since7d),
      dayPeak(dailyFull, 'mint', since7d),
      dayPeak(dailyFull, 'redeem', since7d),
    ),
    all: peakWindow(0, 0, dayPeak(dailyFull, 'mint'), dayPeak(dailyFull, 'redeem')),
  };
  const recentEvents = [...new Map(activityEvents.map((e) => [e.id, e])).values()]
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 80);

  if (!circulating && !daily.length && !hasTokenSignal) {
    cache = { ts: Date.now(), data: null };
    return null;
  }

  const data: FrxUsdMintRedeemData = {
    circulating,
    mint24h,
    redeem24h,
    net24h: roundCents(mint24h - redeem24h),
    mint7d,
    redeem7d,
    net7d: roundCents(mint7d - redeem7d),
    mintAll,
    redeemAll,
    netAll,
    peaks,
    routes,
    chainSupply,
    supplyMap: await buildFrxUsdSupplyMap(chainSupply).catch((error) => {
      console.warn('[frxUsdMintRedeem] supply map failed:', error);
      return undefined;
    }),
    daily,
    recentEvents,
    source: hasTokenSignal
      ? 'frxUSD ERC-20 mint/burn logs on Ethereum + DefiLlama chain supply'
      : 'DefiLlama stablecoins (circulation only — prints still warming)',
    docsUrl: DOCS_URL,
  };

  cache = { ts: Date.now(), data };
  return data;
}
