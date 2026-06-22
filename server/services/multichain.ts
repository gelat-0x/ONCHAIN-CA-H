/**
 * Multi-chain services for PegKeeper data (incremental support).
 *
 * Currently focused on:
 * - Direct RPC balanceOf calls for frxUSD on non-Ethereum chains (e.g. HyperEVM).
 * - This provides accurate `frxUsdBalanceUsd` when Dune (Ethereum-only) cannot be used.
 *
 * Design notes:
 * - Lightweight: uses public RPCs + JSON-RPC eth_call.
 * - Graceful fallback to 0 or duneFallback if RPC fails.
 * - Token addresses and RPC endpoints are centralized here for easy extension.
 * - For Curve pools, the raw Curve response already contains per-coin "poolBalance"
 *   which could be used as alternative (no extra RPC), but direct balanceOf is
 *   the explicit preferred lightweight method per task.
 */



// Known frxUSD token addresses per chain (from Curve data + on-chain verification)
export const FRXUSD_TOKEN: Record<string, string> = {
  'Ethereum': '0xCAcd6fd266aF91b8AeD52aCCc382b4e165586E29',
  'HyperEVM': '0x80Eede496655FB9047dd39d9f418d5483ED600df',
};

// Public RPC endpoints (can be overridden via env in future)
const RPC_URLS: Record<string, string> = {
  'Ethereum': 'https://eth.llamarpc.com',
  'HyperEVM': 'https://rpc.hyperliquid.xyz/evm',
};

/**
 * Perform a low-level ERC20 balanceOf via JSON-RPC eth_call.
 * Returns balance as number (assumes 18 decimals and ~1 USD for frxUSD).
 */
export async function fetchTokenBalanceUsd(
  chain: string,
  tokenAddress: string,
  holderAddress: string
): Promise<number> {
  const rpcUrl = RPC_URLS[chain];
  if (!rpcUrl) {
    console.warn(`[Multichain] No RPC configured for chain: ${chain}`);
    return 0;
  }

  // balanceOf(address) selector + padded holder address (no 0x)
  const data = '0x70a08231' + holderAddress.toLowerCase().replace('0x', '').padStart(64, '0');

  const payload = {
    jsonrpc: '2.0',
    method: 'eth_call',
    params: [
      {
        to: tokenAddress,
        data,
      },
      'latest',
    ],
    id: 1,
  };

  try {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.warn(`[Multichain] RPC ${chain} returned ${res.status}`);
      return 0;
    }

    const json = await res.json() as any;
    const hex = json?.result;
    if (!hex || hex === '0x') return 0;

    // Convert hex to decimal, divide by 10^18
    const balance = BigInt(hex);
    const decimals = 18;
    const divisor = BigInt(10 ** decimals);
    const usdValue = Number(balance) / Number(divisor);

    return Math.round(usdValue);
  } catch (err) {
    console.warn(`[Multichain] RPC balanceOf failed for ${chain} ${holderAddress}:`, err);
    return 0;
  }
}

/**
 * Get frxUSD balance for a PegKeeper pool on the given chain.
 * Uses the pool address as the "holder".
 */
export async function fetchFrxUsdBalanceForPool(
  chain: string | undefined,
  poolAddress: string | undefined
): Promise<number> {
  if (!chain || !poolAddress) return 0;

  const token = FRXUSD_TOKEN[chain];
  if (!token) {
    // No known token for this chain yet — fall back to 0 (will use dune fallback in builder)
    return 0;
  }

  return fetchTokenBalanceUsd(chain, token, poolAddress);
}
