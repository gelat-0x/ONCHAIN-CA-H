const DEFAULT_ETH_RPC = 'https://ethereum.publicnode.com';

export function ethRpcUrl(): string {
  return process.env.ETH_RPC_URL || process.env.ETH_RPC || DEFAULT_ETH_RPC;
}

export async function ethRpc<T>(method: string, params: unknown[], rpcUrl = ethRpcUrl()): Promise<T | null> {
  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { result?: T; error?: unknown };
    if (json.error) {
      console.warn(`[ethRpc] ${method} error:`, json.error);
      return null;
    }
    return json.result ?? null;
  } catch (err) {
    console.warn(`[ethRpc] ${method} failed:`, err);
    return null;
  }
}

export async function ethBlockNumber(rpcUrl?: string): Promise<number | null> {
  const hex = await ethRpc<string>('eth_blockNumber', [], rpcUrl);
  if (!hex) return null;
  return Number.parseInt(hex, 16);
}

type EthLog = {
  address: string;
  topics: string[];
  data: string;
  blockNumber: string;
  transactionHash: string;
  logIndex?: string;
  timeStamp?: string;
};

export async function ethGetLogs(
  filter: { address: string; topics?: (string | string[] | null)[]; fromBlock: number; toBlock: number },
  rpcUrl?: string,
): Promise<EthLog[]> {
  const params = [{
    address: filter.address,
    topics: filter.topics,
    fromBlock: `0x${filter.fromBlock.toString(16)}`,
    toBlock: `0x${filter.toBlock.toString(16)}`,
  }];
  const logs = await ethRpc<EthLog[]>('eth_getLogs', params, rpcUrl);
  return logs ?? [];
}

/** Fetch logs in chunks to respect RPC block-range limits. */
export async function ethGetLogsChunked(
  filter: Omit<Parameters<typeof ethGetLogs>[0], 'fromBlock' | 'toBlock'>,
  fromBlock: number,
  toBlock: number,
  chunkSize = 4_000,
  rpcUrl?: string,
  concurrency = 3,
): Promise<EthLog[]> {
  const ranges: { fromBlock: number; toBlock: number }[] = [];
  for (let start = fromBlock; start <= toBlock; start += chunkSize + 1) {
    ranges.push({ fromBlock: start, toBlock: Math.min(start + chunkSize, toBlock) });
  }

  const out: EthLog[] = [];
  for (let i = 0; i < ranges.length; i += concurrency) {
    const slice = ranges.slice(i, i + concurrency);
    const batches = await Promise.all(
      slice.map((range) => ethGetLogs({ ...filter, ...range }, rpcUrl)),
    );
    for (const batch of batches) out.push(...batch);
  }
  return out;
}

export function hexToBigInt(hex: string): bigint {
  if (!hex || hex === '0x') return 0n;
  return BigInt(hex);
}

/** Decode two uint256 values from log data (assets + shares). */
export function decodeTwoUint256(data: string): { a: bigint; b: bigint } {
  const clean = data.replace(/^0x/, '');
  if (clean.length < 128) return { a: 0n, b: 0n };
  return {
    a: BigInt(`0x${clean.slice(0, 64)}`),
    b: BigInt(`0x${clean.slice(64, 128)}`),
  };
}

export function frxUsdFromShares(shares: bigint): number {
  const decimals = 10n ** 18n;
  const cents = (shares * 100n + decimals / 2n) / decimals;
  return Number(cents) / 100;
}

const blockTsCache = new Map<number, number>();

export async function ethBlockTimestamp(block: number, rpcUrl?: string): Promise<number | null> {
  const cached = blockTsCache.get(block);
  if (cached) return cached;
  const raw = await ethRpc<{ timestamp?: string }>('eth_getBlockByNumber', [`0x${block.toString(16)}`, false], rpcUrl);
  const ts = raw?.timestamp ? Number.parseInt(raw.timestamp, 16) * 1000 : null;
  if (ts && Number.isFinite(ts)) {
    blockTsCache.set(block, ts);
    return ts;
  }
  return null;
}

/** Resolve block timestamps with bounded concurrency (uses ethBlockTimestamp cache). */
export async function ethBlockTimestamps(
  blocks: number[],
  concurrency = 6,
  rpcUrl?: string,
): Promise<Map<number, number>> {
  const unique = [...new Set(blocks)].filter((b) => Number.isFinite(b) && b >= 0);
  const out = new Map<number, number>();
  for (let i = 0; i < unique.length; i += concurrency) {
    const slice = unique.slice(i, i + concurrency);
    const results = await Promise.all(slice.map((block) => ethBlockTimestamp(block, rpcUrl)));
    for (let j = 0; j < slice.length; j++) {
      const ts = results[j];
      if (ts != null) out.set(slice[j]!, ts);
    }
  }
  return out;
}
