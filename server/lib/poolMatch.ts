import type { DefiLlamaYieldPool } from '../../shared/types/index.ts';

export function normSymbol(s: string): string {
  return s.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Match a DefiLlama Curve pool to registry dlSymbols */
export function matchDefiLlamaPool(
  pools: DefiLlamaYieldPool[],
  symbols: string[],
): DefiLlamaYieldPool | undefined {
  return pools.find((p) => {
    if (p.project !== 'curve-dex') return false;
    const sym = normSymbol(p.symbol);
    return symbols.some((m) => {
      const n = normSymbol(m);
      return sym === n || sym.includes(n) || n.includes(sym);
    });
  });
}
