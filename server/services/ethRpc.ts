const DEFAULT_ETH_RPC = 'https://ethereum.publicnode.com';

export async function ethRpc<T>(method: string, params: unknown[], rpcUrl = DEFAULT_ETH_RPC): Promise<T | null> {
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
): Promise<EthLog[]> {
  const out: EthLog[] = [];
  for (let start = fromBlock; start <= toBlock; start += chunkSize + 1) {
    const end = Math.min(start + chunkSize, toBlock);
    const batch = await ethGetLogs({ ...filter, fromBlock: start, toBlock: end }, rpcUrl);
    out.push(...batch);
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
  return Math.round(Number(shares) / 1e18);
}
