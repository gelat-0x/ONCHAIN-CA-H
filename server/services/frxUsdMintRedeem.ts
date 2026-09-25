import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import { FRXUSD_MINT_ROUTES, FRXUSD_TOKEN_ETHEREUM } from '../../shared/data/frxUsdMintRoutes.ts';
import type {
  ChartPoint,
  FrxUsdChainSupply,
  FrxUsdMintRedeemData,
  FrxUsdMintRedeemDay,
  FrxUsdMintRedeemEvent,
  FrxUsdRouteVolume,
} from '../../shared/types/index.ts';
import { fetchJson } from '../lib/http.ts';
import { fetchDefiLlamaStablecoins, findFrxUsdAsset } from './defillama.ts';
import {
  decodeTwoUint256,
  ethBlockNumber,
  ethGetLogsChunked,
  frxUsdFromShares,
  hexToBigInt,
} from './ethRpc.ts';
import { fetchFrxUsdStablecoinId, fetchFrxUsdSupplyHistory } from './protocolCharts.ts';

const DOCS_URL = 'https://docs.frax.com/frxusd/mint-and-redeem-overview';

/** ERC-4626 Deposit / Withdraw + ERC20 Transfer. */
const TOPIC_DEPOSIT = '0xdcbc1c05240f31ff3ad067ef1ee2e6fad0b8ad9c646c26edae76b616f4fa53e7';
const TOPIC_WITHDRAW = '0xfbde797d201c681b91056529119e0b92907fe15b832e1c4937793f5600a3d67';
const TOPIC_TRANSFER = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const ZERO_TOPIC = '0x0000000000000000000000000000000000000000000000000000000000000000';

const BLOCKS_PER_DAY = 7_200;
const MS_PER_DAY = 86_400_000;
const LOG_LOOKBACK_DAYS = 14;

let cache: { ts: number; data: FrxUsdMintRedeemData | null } | null = null;
const CACHE_MS = 5 * 60 * 1000;

function dayStart(ts: number): number {
  return Math.floor(ts / MS_PER_DAY) * MS_PER_DAY;
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

function blockToTs(block: number, latestBlock: number, now: number): number {
  return now - (latestBlock - block) * 12_000;
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

async function fetchCustodianEvents(
  fromBlock: number,
  toBlock: number,
  latestBlock: number,
): Promise<{ events: RouteEvent[]; txRoutes: Map<string, { routeId: string; asset: string; type: 'mint' | 'redeem' }> }> {
  const now = Date.now();
  const events: RouteEvent[] = [];
  const txRoutes = new Map<string, { routeId: string; asset: string; type: 'mint' | 'redeem' }>();

  await Promise.all(
    FRXUSD_MINT_ROUTES.map(async (route) => {
      const addr = route.custodianAddress.toLowerCase();

      const [deposits, withdraws] = await Promise.all([
        ethGetLogsChunked({ address: addr, topics: [TOPIC_DEPOSIT] }, fromBlock, toBlock, 3_000),
        ethGetLogsChunked({ address: addr, topics: [TOPIC_WITHDRAW] }, fromBlock, toBlock, 3_000),
      ]);

      for (const log of deposits) {
        const { b: shares } = decodeTwoUint256(log.data);
        const amount = frxUsdFromShares(shares);
        if (amount <= 0) continue;
        const block = Number.parseInt(log.blockNumber, 16);
        const txHash = log.transactionHash.toLowerCase();
        txRoutes.set(txHash, { routeId: route.id, asset: route.asset, type: 'mint' });
        events.push({
          id: `${txHash}-mint-${route.id}`,
          ts: blockToTs(block, latestBlock, now),
          type: 'mint',
          routeId: route.id,
          asset: route.asset,
          amountUsd: amount,
          txHash: log.transactionHash,
        });
      }

      for (const log of withdraws) {
        const { b: shares } = decodeTwoUint256(log.data);
        const amount = frxUsdFromShares(shares);
        if (amount <= 0) continue;
        const block = Number.parseInt(log.blockNumber, 16);
        const txHash = log.transactionHash.toLowerCase();
        txRoutes.set(txHash, { routeId: route.id, asset: route.asset, type: 'redeem' });
        events.push({
          id: `${txHash}-redeem-${route.id}`,
          ts: blockToTs(block, latestBlock, now),
          type: 'redeem',
          routeId: route.id,
          asset: route.asset,
          amountUsd: amount,
          txHash: log.transactionHash,
        });
      }
    }),
  );

  return { events: events.sort((a, b) => b.ts - a.ts), txRoutes };
}

/** frxUSD ERC20 mint (from zero) and burn (to zero) — protocol-wide issuance. */
async function fetchTokenMintBurn(
  fromBlock: number,
  toBlock: number,
  latestBlock: number,
  txRoutes: Map<string, { routeId: string; asset: string; type: 'mint' | 'redeem' }>,
): Promise<RouteEvent[]> {
  const now = Date.now();
  const token = FRXUSD_TOKEN_ETHEREUM.toLowerCase();
  const [mints, burns] = await Promise.all([
    ethGetLogsChunked(
      { address: token, topics: [TOPIC_TRANSFER, ZERO_TOPIC] },
      fromBlock,
      toBlock,
      3_000,
    ),
    ethGetLogsChunked(
      { address: token, topics: [TOPIC_TRANSFER, null, ZERO_TOPIC] },
      fromBlock,
      toBlock,
      3_000,
    ),
  ]);

  const events: RouteEvent[] = [];

  for (const log of mints) {
    const amount = frxUsdFromShares(hexToBigInt(log.data));
    if (amount <= 0) continue;
    const block = Number.parseInt(log.blockNumber, 16);
    const txHash = log.transactionHash.toLowerCase();
    const route = txRoutes.get(txHash);
    events.push({
      id: `${txHash}-tmint`,
      ts: blockToTs(block, latestBlock, now),
      type: 'mint',
      routeId: route?.routeId ?? 'other',
      asset: route?.asset ?? 'frxUSD',
      amountUsd: amount,
      txHash: log.transactionHash,
    });
  }

  for (const log of burns) {
    const amount = frxUsdFromShares(hexToBigInt(log.data));
    if (amount <= 0) continue;
    const block = Number.parseInt(log.blockNumber, 16);
    const txHash = log.transactionHash.toLowerCase();
    const route = txRoutes.get(txHash);
    events.push({
      id: `${txHash}-tburn`,
      ts: blockToTs(block, latestBlock, now),
      type: 'redeem',
      routeId: route?.routeId ?? 'other',
      asset: route?.asset ?? 'frxUSD',
      amountUsd: amount,
      txHash: log.transactionHash,
    });
  }

  return events.sort((a, b) => b.ts - a.ts);
}

function routeVolumes(events: RouteEvent[], now: number): FrxUsdRouteVolume[] {
  const since24h = now - MS_PER_DAY;
  const since7d = now - 7 * MS_PER_DAY;
  const since30d = now - 30 * MS_PER_DAY;

  return FRXUSD_MINT_ROUTES.map((route) => {
    const routeEvents = events.filter((e) => e.routeId === route.id);
    const mint = (since: number) =>
      routeEvents.filter((e) => e.type === 'mint' && e.ts >= since).reduce((s, e) => s + e.amountUsd, 0);
    const redeem = (since: number) =>
      routeEvents.filter((e) => e.type === 'redeem' && e.ts >= since).reduce((s, e) => s + e.amountUsd, 0);

    return {
      id: route.id,
      asset: route.asset,
      issuer: route.issuer,
      custodianAddress: route.custodianAddress,
      mint24h: mint(since24h),
      redeem24h: redeem(since24h),
      mint7d: mint(since7d),
      redeem7d: redeem(since7d),
      mint30d: mint(since30d),
      redeem30d: redeem(since30d),
    };
  });
}

export async function fetchFrxUsdMintRedeemOverview(): Promise<FrxUsdMintRedeemData | null> {
  if (cache && Date.now() - cache.ts < CACHE_MS) return cache.data;

  const now = Date.now();
  const [assets, frxId, latestBlock] = await Promise.all([
    fetchDefiLlamaStablecoins(),
    fetchFrxUsdStablecoinId(),
    ethBlockNumber(),
  ]);

  const frxAsset = findFrxUsdAsset(assets);
  const circulating = Math.round(Number(frxAsset?.circulating?.peggedUSD) || 0);
  const chainSupply = chainSupplyFromDefiLlama(frxAsset?.chainCirculating);

  const supplyPoints = frxId
    ? await fetchSupplyHistoryDirect(frxId)
    : await fetchFrxUsdSupplyHistory(frxId);
  const daily = dailyFromSupply(supplyPoints).slice(-120);

  let routeEvents: RouteEvent[] = [];
  let tokenEvents: RouteEvent[] = [];
  if (latestBlock) {
    const fromBlock = Math.max(0, latestBlock - BLOCKS_PER_DAY * LOG_LOOKBACK_DAYS);
    try {
      const { events: custodianEvents, txRoutes } = await fetchCustodianEvents(
        fromBlock,
        latestBlock,
        latestBlock,
      );
      routeEvents = custodianEvents;
      tokenEvents = await fetchTokenMintBurn(fromBlock, latestBlock, latestBlock, txRoutes);
    } catch (err) {
      console.warn('[frxUsdMintRedeem] on-chain fetch failed:', err);
    }
  }

  const hasCustodianSignal = routeEvents.length > 0;
  const activityEvents = hasCustodianSignal ? routeEvents : tokenEvents;
  const routes = routeVolumes(hasCustodianSignal ? routeEvents : tokenEvents, now);

  let mint24h = activityEvents.filter((e) => e.type === 'mint' && e.ts >= now - MS_PER_DAY).reduce((s, e) => s + e.amountUsd, 0);
  let redeem24h = activityEvents.filter((e) => e.type === 'redeem' && e.ts >= now - MS_PER_DAY).reduce((s, e) => s + e.amountUsd, 0);
  let mint7d = activityEvents.filter((e) => e.type === 'mint' && e.ts >= now - 7 * MS_PER_DAY).reduce((s, e) => s + e.amountUsd, 0);
  let redeem7d = activityEvents.filter((e) => e.type === 'redeem' && e.ts >= now - 7 * MS_PER_DAY).reduce((s, e) => s + e.amountUsd, 0);

  const hasOnChainSignal = activityEvents.length > 0;

  if (!hasOnChainSignal && daily.length) {
    const last = daily.at(-1);
    if (last) {
      mint24h = last.mint;
      redeem24h = last.redeem;
    }
    mint7d = daily.slice(-7).reduce((s, d) => s + d.mint, 0);
    redeem7d = daily.slice(-7).reduce((s, d) => s + d.redeem, 0);
  }

  const recentEvents = activityEvents.slice(0, 20);

  if (!circulating && !daily.length && !hasOnChainSignal) {
    cache = { ts: Date.now(), data: null };
    return null;
  }

  const data: FrxUsdMintRedeemData = {
    circulating,
    mint24h,
    redeem24h,
    net24h: mint24h - redeem24h,
    mint7d,
    redeem7d,
    net7d: mint7d - redeem7d,
    routes,
    chainSupply,
    daily,
    recentEvents,
    source: hasCustodianSignal
      ? 'Ethereum custodian contracts + DefiLlama stablecoins'
      : hasOnChainSignal
        ? 'frxUSD token mint/burn logs + DefiLlama stablecoins'
        : 'DefiLlama stablecoins (supply deltas)',
    docsUrl: DOCS_URL,
  };

  cache = { ts: Date.now(), data };
  return data;
}
