/**
 * Token logos bundled via Vite — source files live in `src/assets/tokens/`.
 * Drop PNG/SVG/WebP files named after the token symbol (e.g. `crvUSD.png`, `CVX.png`).
 * Never hotlink remote images at runtime.
 */
import { POOL_REGISTRY } from '@shared/data/poolRegistry.ts';
import { WATCHLIST_TOKENS } from '@shared/data/tokenCatalog.ts';

const LOGO_MODULES = import.meta.glob('../assets/tokens/*.{png,svg,webp,jpg,jpeg}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

export const TOKEN_LOGO_EXTENSIONS = ['png', 'webp', 'svg', 'jpg', 'jpeg'] as const;

export const PEGKEEPER_STABLECOIN_SYMBOLS = [
  ...new Set(POOL_REGISTRY.map((entry) => entry.stablecoin)),
] as const;

export const ALL_KNOWN_TOKEN_SYMBOLS = [
  'frxUSD',
  ...PEGKEEPER_STABLECOIN_SYMBOLS,
  ...WATCHLIST_TOKENS.map((t) => t.symbol),
] as const;

export function tokenLogoSlug(symbol: string): string {
  return symbol.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

const EXT_RANK: Record<string, number> = { png: 0, webp: 1, jpg: 2, jpeg: 2, svg: 3 };

function fileExtRank(filePath: string): number {
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  return EXT_RANK[ext] ?? 9;
}

type LogoMap = Map<string, string>;

function registerLogo(map: LogoMap, key: string, url: string, { overwrite = true } = {}) {
  const k = key.trim();
  if (!k) return;
  if (!overwrite && map.has(k)) return;
  map.set(k, url);
}

/** Resolve bundled file URL by exact filename base (case-sensitive first, then lowercase). */
function fileUrlForBase(map: LogoMap, base: string): string | undefined {
  return map.get(base) ?? map.get(base.toLowerCase());
}

/**
 * Explicit symbol → filename overrides for partner tokens whose asset name
 * may differ slightly, or that need a stable alias. Never map partners to frxUSD.
 * Keys are matched case-insensitively via {@link resolveAliasAsset}.
 *
 * Critical: sUSDat ≠ sUSDS (different tokens — never alias across them).
 */
const SYMBOL_ASSET_ALIASES: Record<string, string> = {
  // Watchlist / ecosystem
  fxs: 'FRAX',
  // Partner stables — canonical asset basenames in src/assets/tokens/
  usdaf: 'USDaf',
  yusd: 'YUSD',
  fxusd: 'fxUSD',
  ebusd: 'ebUSD',
  vusd: 'VUSD',
  trusd: 'trUSD',
  susdat: 'sUSDat',
  // Sky sUSDS (public/ folder historically used sUSDs casing)
  susds: 'sUSDS',
  susde: 'sUSDe',
  susdai: 'sUSDai',
  usdf: 'USDf',
  usdfi: 'USDfi',
  reusd: 'reUSD',
  usd3: 'USD3',
  uspc: 'USPC',
};

function resolveAliasAsset(symbol: string): string | undefined {
  const raw = symbol.trim();
  if (!raw) return undefined;
  return SYMBOL_ASSET_ALIASES[raw.toLowerCase()] ?? SYMBOL_ASSET_ALIASES[tokenLogoSlug(raw)];
}

/** Pool ids whose stablecoin symbol collides on case-insensitive filesystems — logo by id only. */
const POOL_ID_ONLY_LOGO_IDS = new Set(['dusd', 'sdusd']);

function buildLogoMap(): LogoMap {
  const files: LogoMap = new Map();
  const resolved: LogoMap = new Map();

  const entries = Object.entries(LOGO_MODULES).sort(
    (a, b) => fileExtRank(a[0]) - fileExtRank(b[0]),
  );

  // Prefer PNG/WebP over SVG: entries sorted by quality rank; first write wins.
  for (const [filePath, url] of entries) {
    const filename = filePath.split('/').pop() ?? '';
    const base = filename.replace(/\.[^.]+$/, '');
    registerLogo(files, base, url, { overwrite: false });
    registerLogo(files, base.toLowerCase(), url, { overwrite: false });
    registerLogo(resolved, base, url, { overwrite: false });
    registerLogo(resolved, base.toLowerCase(), url, { overwrite: false });
  }

  // Watchlist / ticker — prefer logoAsset / logoSymbol, never fuzzy frxUSD fallback
  for (const t of WATCHLIST_TOKENS) {
    const asset = t.logoAsset ?? t.logoSymbol ?? t.symbol;
    const url = fileUrlForBase(files, asset);
    if (url) {
      registerLogo(resolved, t.symbol, url);
      registerLogo(resolved, t.symbol.toLowerCase(), url);
    }
  }

  // PegKeeper pool files — register pool id first so shared symbols (two dUSDs)
  // do not steal each other's artwork. Symbol mapping only when the file is
  // named after the stablecoin itself.
  for (const entry of POOL_REGISTRY) {
    const byId = fileUrlForBase(files, entry.id);
    if (byId) {
      registerLogo(resolved, entry.id, byId);
      registerLogo(resolved, entry.id.toLowerCase(), byId);
    }
    const bySymbol = fileUrlForBase(files, entry.stablecoin);
    if (bySymbol && !POOL_ID_ONLY_LOGO_IDS.has(entry.id)) {
      registerLogo(resolved, entry.stablecoin, bySymbol);
      registerLogo(resolved, entry.stablecoin.toLowerCase(), bySymbol);
    }
  }

  // Explicit aliases (FXS→FRAX, sUSDs→sUSDS, documented partner keys)
  for (const [symbolKey, asset] of Object.entries(SYMBOL_ASSET_ALIASES)) {
    const url = fileUrlForBase(files, asset);
    if (url) {
      registerLogo(resolved, symbolKey, url);
      registerLogo(resolved, asset, url);
      registerLogo(resolved, asset.toLowerCase(), url);
    }
  }

  // Hard guarantees: distinct tokens must not share URLs after build
  const susdat = fileUrlForBase(files, 'sUSDat');
  const susds = fileUrlForBase(files, 'sUSDS');
  if (susdat) {
    registerLogo(resolved, 'sUSDat', susdat);
    registerLogo(resolved, 'susdat', susdat);
  }
  if (susds) {
    registerLogo(resolved, 'sUSDS', susds);
    registerLogo(resolved, 'sUSDs', susds);
    registerLogo(resolved, 'susds', susds);
  }

  return resolved;
}

const LOGO_MAP = buildLogoMap();

/** Resolve a bundled logo URL for a symbol (undefined = use initials fallback). */
export function resolveTokenLogoUrl(symbol: string, poolId?: string): string | undefined {
  const sym = symbol.trim();
  if (!sym) return undefined;

  const alias = resolveAliasAsset(sym);
  const keys: string[] = [];
  // Pool id first: Alto dUSD and dTrinity dUSD share a symbol.
  if (poolId) {
    const id = poolId.trim();
    if (id) {
      keys.push(id, id.toLowerCase(), tokenLogoSlug(id));
      const idAlias = resolveAliasAsset(id);
      if (idAlias) keys.push(idAlias, idAlias.toLowerCase());
    }
  }
  if (alias) keys.push(alias, alias.toLowerCase());
  keys.push(sym, sym.toLowerCase(), tokenLogoSlug(sym));

  const seen = new Set<string>();
  for (const key of keys) {
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const url = LOGO_MAP.get(key);
    if (url) return url;
  }
  return undefined;
}

/** @deprecated use resolveTokenLogoUrl */
export function tokenLogoCandidates(symbol: string, poolId?: string): string[] {
  const url = resolveTokenLogoUrl(symbol, poolId);
  return url ? [url] : [];
}

/** @deprecated */
export function tokenLogoUrl(symbol: string, poolId?: string): string | undefined {
  return resolveTokenLogoUrl(symbol, poolId);
}

export const AVAILABLE_TOKEN_LOGO_KEYS = [...LOGO_MAP.keys()].sort();
