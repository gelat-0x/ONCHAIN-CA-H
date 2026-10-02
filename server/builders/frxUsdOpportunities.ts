import { API_ENDPOINTS } from '../../shared/constants/apiEndpoints.ts';
import {
  FRXUSD_PLACES,
  fallbackOpportunityLive,
  hasFrxUsdSymbol,
  prettyFrxUsdPair,
} from '../../shared/data/frxUsdOpportunities.ts';
import type { DefiLlamaYieldPool, FrxUsdOppFeatured, FrxUsdOppLive, FrxUsdOppRow } from '../../shared/types/index.ts';
import { fetchDefiLlamaYields } from '../services/defillama.ts';
import { fetchFablesFrxUsdPools } from '../services/fablesEusd.ts';
import { fetchGigaFrxUsdPools } from '../services/gigaDex.ts';
import { fetchJson } from '../lib/http.ts';

const STAKE_DAO_CHAIN: Record<number, string> = {
  1: 'Ethereum',
  252: 'Fraxtal',
  146: 'Sonic',
};

interface StakeDaoHubVault {
  key?: string;
  name?: string;
  chainId?: number;
  coins?: Array<{ symbol?: string }>;
  tvl?: number;
  apr?: { current?: { total?: number } | number };
}

function isFrxUsdCoin(symbol?: string): boolean {
  return (symbol ?? '').toLowerCase().replace(/[^a-z0-9]/g, '') === 'frxusd';
}

function hubApr(vault: StakeDaoHubVault): number {
  const cur = vault.apr?.current;
  const n = typeof cur === 'number' ? cur : cur?.total;
  return okApy(n) ?? 0;
}

async function fetchStakeDaoFrxUsdPools(): Promise<FrxUsdOppRow[]> {
  const raw = await fetchJson<{ items?: StakeDaoHubVault[] }>(API_ENDPOINTS.stakeDao.curveVaults, {
    timeout: 12_000,
  });
  const items = raw?.items ?? [];
  return items
    .filter((v) => (v.coins ?? []).some((c) => isFrxUsdCoin(c.symbol)))
    .map((v, i) => {
      const key = v.key ?? `sd-${i}`;
      const chain = STAKE_DAO_CHAIN[v.chainId ?? 1] ?? `Chain ${v.chainId ?? 1}`;
      return {
        id: key,
        venue: 'stakedao',
        category: 'lp' as const,
        lane: 'boost' as const,
        name: v.name ?? 'frxUSD Curve LP',
        pair: prettyFrxUsdPair(v.name ?? 'frxUSD'),
        chain,
        chains: [chain],
        apy: hubApr(v),
        tvlUsd: Number.isFinite(v.tvl) ? v.tvl : undefined,
        href: v.key
          ? `https://www.stakedao.org/strategy?protocol=curve&vault=${encodeURIComponent(v.key)}`
          : 'https://www.stakedao.org/yield?tokenFilter=usd&search=frxUSD',
      };
    })
    .sort((a, b) => b.apy - a.apy);
}

const TTL_MS = 120_000;
let cache: { ts: number; data: FrxUsdOppLive } | null = null;

function okApy(n: unknown): number | undefined {
  const v = Number(n);
  return Number.isFinite(v) && v > 0 && v < 200 ? +v.toFixed(2) : undefined;
}

function listedPools(pools: DefiLlamaYieldPool[]) {
  return pools.filter((pool) => hasFrxUsdSymbol(pool.symbol ?? '') && (Number(pool.tvlUsd) || 0) >= 20_000);
}

const FX_SIDES = new Set(['krwq', 'zarp', 'brz', 'audf', 'tgbp', 'idrx', 'cadd', 'aznd', 'gbpt']);
const PEG_SIDES = new Set([
  'usdc', 'usdt', 'dai', 'crvusd', 'dusd', 'msusd', 'pmusd', 'alusd', 'susds', 'susde', 'usde',
  'gho', 'sgho', 'ousd', 'fxusd', 'usd3', 'usg', 'uspc', 'avusd', 'savusd', 'sdusd', 'susdat',
  'susdai', 'pyusd', 'usdf', 'usp', 'ebusd', 'vusd', 'yusd', 'usdaf', 'reusd', 'scrvusd', 'sdola',
  'srroyusdc', 'iusd', 'usdp', 'scusd', 'usds', 'usdg', 'trusd',
]);

const KNOWN: Record<string, string> = {
  frxusd: 'frxUSD',
  crvusd: 'crvUSD',
  crv: 'CRV',
  msusd: 'msUSD',
  pmusd: 'pmUSD',
  sdusd: 'sdUSD',
  fxusd: 'fxUSD',
  susds: 'sUSDS',
  susde: 'sUSDe',
  usde: 'USDe',
  alusd: 'alUSD',
  dusd: 'DUSD',
  usdc: 'USDC',
  usdt: 'USDT',
  dai: 'DAI',
  pyusd: 'PYUSD',
  ousd: 'OUSD',
  krwq: 'KRWQ',
  zarp: 'ZARP',
  brz: 'BRZ',
  audf: 'AUDF',
  tgbp: 'tGBP',
  idrx: 'IDRX',
  cadd: 'CADD',
  iq: 'IQ',
};

function sidesOf(symbol: string): string[] {
  return symbol.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
}

function hasSfrx(symbol: string): boolean {
  return sidesOf(symbol).some((side) => side === 'sfrxusd' || side.startsWith('sfrx'));
}

function pairLabel(symbol: string): string {
  const prepared = symbol.replace(/fxb[-_]?(\d{4})\d*/gi, 'FXB $1');
  if (/[-_/]/.test(prepared)) {
    return prepared
      .split(/[-_/]+/)
      .filter(Boolean)
      .map((bit) => labelBit(bit))
      .join(' / ');
  }
  const found: string[] = [];
  let rest = prepared.toLowerCase();
  const keys = Object.keys(KNOWN).sort((a, b) => b.length - a.length);
  while (rest) {
    const hit = keys.find((key) => rest.startsWith(key));
    if (!hit) {
      found.push(rest.toUpperCase());
      break;
    }
    found.push(KNOWN[hit] ?? hit.toUpperCase());
    rest = rest.slice(hit.length);
  }
  return found.join(' / ');
}

function labelBit(bit: string): string {
  const key = bit.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (key === 'av') return 'avUSD';
  if (key.startsWith('fxb')) return bit.replace(/fxb/i, 'FXB ').replace(/\s+/g, ' ').trim();
  return KNOWN[key] ?? bit.toUpperCase();
}

function otherSide(symbol: string): string {
  const label = pairLabel(symbol);
  const bits = label.split(' / ').filter((bit) => bit.toLowerCase() !== 'frxusd');
  return bits[0] ?? label;
}

function sanePool(pool: DefiLlamaYieldPool, minTvl: number, maxApy: number): boolean {
  if (!hasFrxUsdSymbol(pool.symbol ?? '')) return false;
  if (hasSfrx(pool.symbol ?? '')) return false;
  const tvl = Number(pool.tvlUsd) || 0;
  const apy = okApy(pool.apy);
  return tvl >= minTvl && apy != null && apy <= maxApy;
}

function byTvl(a: DefiLlamaYieldPool, b: DefiLlamaYieldPool): number {
  return (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0);
}

function marketRow(
  pool: DefiLlamaYieldPool,
  extra: Pick<FrxUsdOppRow, 'id' | 'venue' | 'door' | 'group' | 'name' | 'happens' | 'youDo' | 'href' | 'category' | 'lane'>,
): FrxUsdOppRow {
  const chain = pool.chain ?? 'Ethereum';
  const pair = pairLabel(pool.symbol);
  return {
    ...extra,
    pair,
    chain,
    chains: [chain],
    apy: okApy(pool.apy) ?? 0,
    tvlUsd: pool.tvlUsd,
  };
}

function classifyMarkets(pools: DefiLlamaYieldPool[]): FrxUsdOppRow[] {
  const rows: FrxUsdOppRow[] = [];

  const lendBare = (project: string) =>
    pools.filter((pool) => {
      if ((pool.project ?? '').toLowerCase() !== project) return false;
      const sides = sidesOf(pool.symbol);
      return sides.length > 0 && sides.every((side) => side === 'frxusd');
    });

  for (const pool of lendBare('aave-v4').filter((pool) => sanePool(pool, 100_000, 20)).sort(byTvl).slice(0, 1)) {
    rows.push(
      marketRow(pool, {
        id: `aave-${pool.pool}`,
        venue: 'aave',
        category: 'vault',
        door: 'lend',
        group: 'Aave',
        name: 'Aave V4',
        happens: 'Borrowers pay interest to use the frxUSD you supplied.',
        youDo: 'Deposit frxUSD on Aave. You can withdraw when the market has liquidity.',
        href: 'https://pro.aave.com/explore/token/FRXUSD?chain=1',
      }),
    );
  }

  const fraxSeen = new Set<string>();
  for (const pool of lendBare('fraxlend')
    .filter((pool) => sanePool(pool, 80_000, 20))
    .filter((pool) => (okApy(pool.apy) ?? 0) >= 1)
    .sort(byTvl)) {
    const chain = pool.chain ?? 'Ethereum';
    if (fraxSeen.has(chain) || fraxSeen.size >= 2) continue;
    fraxSeen.add(chain);
    rows.push(
      marketRow(pool, {
        id: `fraxlend-${pool.pool}`,
        venue: 'fraxlend',
        category: 'vault',
        door: 'lend',
        group: 'Fraxlend',
        name: `Fraxlend · ${chain}`,
        happens: 'Borrowers pay you to use your frxUSD. The rate moves with how much of the pool is borrowed.',
        youDo: `Deposit frxUSD into the ${chain} Fraxlend market.`,
        href: 'https://frax.com/lend',
      }),
    );
  }

  for (const pool of lendBare('resupply').filter((pool) => sanePool(pool, 50_000, 20)).sort(byTvl).slice(0, 1)) {
    rows.push(
      marketRow(pool, {
        id: `resupply-${pool.pool}`,
        venue: 'resupply',
        category: 'vault',
        door: 'lend',
        group: 'Resupply',
        name: 'Resupply',
        happens: 'Borrowers pay interest on the frxUSD you lend in this market.',
        youDo: 'Deposit frxUSD into Resupply.',
        href: 'https://resupply.fi',
      }),
    );
  }

  for (const pool of pools
    .filter((pool) => (pool.project ?? '').toLowerCase() === 'morpho-blue')
    .filter((pool) => sidesOf(pool.symbol).includes('sdfrxusdv2'))
    .filter((pool) => sanePool(pool, 100_000, 20))
    .sort(byTvl)
    .slice(0, 1)) {
    rows.push(
      marketRow(pool, {
        id: `morpho-${pool.pool}`,
        venue: 'morpho',
        category: 'vault',
        door: 'vault',
        group: 'Morpho',
        name: 'Stake DAO frxUSD vault',
        happens: 'The vault lends your frxUSD for you and sends the interest back.',
        youDo: 'Deposit frxUSD. You do not pick a borrower or manage the market.',
        href: 'https://app.morpho.org/ethereum/vault/0xCE13e39534082FCF8f13F6D84e6D95414D14271e/stake-dao-frxusd-v2',
      }),
    );
  }

  for (const pool of pools
    .filter((pool) => (pool.project ?? '').toLowerCase() === 'morpho-blue')
    .filter((pool) => sidesOf(pool.symbol).includes('re7frxusd'))
    .filter((pool) => sanePool(pool, 200_000, 40))
    .sort(byTvl)
    .slice(0, 1)) {
    rows.push(
      marketRow(pool, {
        id: `morpho-re7-${pool.pool}`,
        venue: 'morpho',
        category: 'vault',
        door: 'vault',
        group: 'Morpho',
        name: 'RE7 frxUSD vault',
        happens: 'RE7 runs this Morpho vault. It lends the frxUSD you deposit, and the rate is that vault’s live supply rate.',
        youDo: 'Deposit frxUSD into the RE7 vault. Read the vault page before you do.',
        href: 'https://app.morpho.org/ethereum/earn',
      }),
    );
  }

  const morphoTaken = new Set(rows.map((row) => row.id));
  for (const pool of pools
    .filter((pool) => (pool.project ?? '').toLowerCase() === 'morpho-blue')
    .filter((pool) => (pool.symbol ?? '').toLowerCase().includes('frxusd'))
    .filter((pool) => !sidesOf(pool.symbol).some((side) => side.includes('feather')))
    .filter((pool) => sanePool(pool, 80_000, 40))
    .sort(byTvl)) {
    const id = `morpho-${pool.pool}`;
    const re7 = `morpho-re7-${pool.pool}`;
    if (morphoTaken.has(id) || morphoTaken.has(re7) || rows.some((row) => row.id === id || row.id === re7)) continue;
    if (rows.filter((row) => row.door === 'vault' && row.venue === 'morpho').length >= 6) break;
    rows.push(
      marketRow(pool, {
        id,
        venue: 'morpho',
        category: 'vault',
        door: 'vault',
        group: 'Morpho',
        name: pairLabel(pool.symbol ?? 'frxUSD'),
        happens: 'This Morpho vault lends the frxUSD you deposit. The rate is the vault’s live supply rate.',
        youDo: 'Open the vault on Morpho and deposit frxUSD. Read the vault page before you do.',
        href: 'https://app.morpho.org/ethereum/earn',
      }),
    );
  }

  const peg = pools
    .filter((pool) => (pool.project ?? '').toLowerCase() === 'curve-dex')
    .filter((pool) => ['ethereum', 'fraxtal'].includes((pool.chain ?? '').toLowerCase()))
    .filter((pool) => {
      const others = sidesOf(pool.symbol).filter((side) => side !== 'frxusd');
      return others.length > 0 && others.every((side) => PEG_SIDES.has(side));
    })
    .filter((pool) => sanePool(pool, 150_000, 25))
    .sort(byTvl)
    .slice(0, 12);
  for (const pool of peg) {
    const other = otherSide(pool.symbol);
    const chain = pool.chain ?? 'Ethereum';
    rows.push(
      marketRow(pool, {
        id: `curve-${pool.pool}`,
        venue: 'curve',
        category: 'lp',
        lane: 'pegkeeper',
        door: 'peg',
        group: chain.toLowerCase() === 'fraxtal' ? 'Curve PegKeeper · Fraxtal' : 'Curve PegKeeper',
        name: `${other} / frxUSD`,
        happens: `People trade ${other} and frxUSD. Both are meant to stay near one dollar, and you earn the swap fees.`,
        youDo: `Add ${other} and frxUSD on Curve (${chain}).`,
        href: 'https://www.curve.finance',
      }),
    );
  }

  const uni = pools
    .filter((pool) => (pool.project ?? '').toLowerCase().startsWith('uniswap'))
    .filter((pool) => sidesOf(pool.symbol).includes('usdc'))
    .filter((pool) => (Number(pool.tvlUsd) || 0) >= 50_000)
    .sort(byTvl)[0];
  if (uni) {
    const base = okApy(uni.apyBase);
    const headline = okApy(uni.apy);
    const apy = base != null && (headline == null || headline > 25) ? base : headline != null && headline <= 25 ? headline : 0;
    const chain = uni.chain ?? 'Ethereum';
    rows.push({
      id: `uni-${uni.pool}`,
      venue: 'uniswap',
      category: 'lp',
      lane: 'amm',
      door: 'peg',
      group: 'Uniswap',
      name: 'USDC / frxUSD',
      pair: 'USDC / frxUSD',
      chain,
      chains: [chain],
      apy,
      tvlUsd: uni.tvlUsd,
      happens: 'USDC and frxUSD trade on Uniswap. You earn fees inside the price range you set. This pool is not a Curve PegKeeper.',
      youDo: 'Add USDC and frxUSD on Uniswap. Check the fee on the pool before you add.',
      href: 'https://app.uniswap.org',
    });
  }

  const fx = pools
    .filter((pool) => {
      const project = (pool.project ?? '').toLowerCase();
      return project === 'curve-dex' || project.startsWith('aerodrome');
    })
    .filter((pool) => sidesOf(pool.symbol).some((side) => FX_SIDES.has(side)))
    .filter((pool) => sanePool(pool, 40_000, 35))
    .sort(byTvl);
  for (const pool of fx) {
    const project = (pool.project ?? '').toLowerCase();
    const curve = project === 'curve-dex';
    const other = otherSide(pool.symbol);
    const chain = pool.chain ?? (curve ? 'Polygon' : 'Base');
    rows.push(
      marketRow(pool, {
        id: `${curve ? 'fx' : 'aero'}-${pool.pool}`,
        venue: curve ? 'curve' : 'aerodrome',
        category: 'lp',
        lane: 'fx',
        door: 'fx',
        group: curve ? 'Curve' : 'Aerodrome',
        name: `${other} / frxUSD`,
        happens: `People trade ${other} against frxUSD. You earn the swap fees on that currency pair.`,
        youDo: `Add ${other} and frxUSD on ${curve ? 'Curve' : 'Aerodrome'} (${chain}).`,
        href: curve ? 'https://www.curve.finance' : 'https://aerodrome.finance',
      }),
    );
  }

  const otherCurve = pools
    .filter((pool) => (pool.project ?? '').toLowerCase() === 'curve-dex')
    .filter((pool) => {
      const sides = sidesOf(pool.symbol);
      return sides.some((side) => side.startsWith('fxb') || side === 'iq');
    })
    .filter((pool) => sanePool(pool, 100_000, 45))
    .sort(byTvl)
    .slice(0, 5);
  for (const pool of otherCurve) {
    const other = otherSide(pool.symbol);
    const bond = sidesOf(pool.symbol).some((side) => side.startsWith('fxb'));
    rows.push(
      marketRow(pool, {
        id: `curve-other-${pool.pool}`,
        venue: 'curve',
        category: 'lp',
        lane: 'amm',
        door: 'fx',
        group: bond ? 'Curve · Frax bonds' : 'Curve · other',
        name: `${other} / frxUSD`,
        happens: bond
          ? `${other} is a Frax bond, not a foreign currency. Traders swap it against frxUSD and you earn the fees.`
          : `Traders swap ${other} against frxUSD on Curve. This is not a dollar PegKeeper and not an FX pair.`,
        youDo: `Add ${other} and frxUSD on Curve (${pool.chain ?? 'Fraxtal'}).`,
        href: 'https://www.curve.finance',
      }),
    );
  }

  const boostProjects: Array<{ project: string; venue: string; group: string; extra: string; href: string }> = [
    {
      project: 'stake-dao-yield',
      venue: 'stakedao',
      group: 'Stake DAO',
      extra: 'The rate includes extra CRV on top of the Curve swap fees.',
      href: 'https://www.stakedao.org/yield?tokenFilter=usd&search=frxUSD',
    },
    {
      project: 'convex-finance',
      venue: 'convex',
      group: 'Convex',
      extra: 'The rate includes extra CRV and CVX on top of the Curve swap fees.',
      href: 'https://www.convexfinance.com',
    },
  ];
  for (const spec of boostProjects) {
    const list = pools
      .filter((pool) => (pool.project ?? '').toLowerCase() === spec.project)
      .filter((pool) => sanePool(pool, 250_000, 30))
      .sort(byTvl)
      .slice(0, 6);
    for (const pool of list) {
      const pair = pairLabel(pool.symbol);
      rows.push(
        marketRow(pool, {
          id: `${spec.venue}-${pool.pool}`,
          venue: spec.venue,
          category: 'lp',
          lane: 'boost',
          door: 'boost',
          group: spec.group,
          name: pair,
          happens: `This is the ${pair} Curve LP, staked. ${spec.extra}`,
          youDo: 'Stake the LP token you already hold. You are not creating a new pair.',
          href: spec.href,
        }),
      );
    }
  }

  const compound: Array<{ project: string; venue: string; name: string; href: string }> = [
    { project: 'beefy', venue: 'beefy', name: 'Beefy', href: 'https://app.beefy.com' },
    { project: 'yearn-finance', venue: 'yearn', name: 'Yearn', href: 'https://yearn.fi' },
  ];
  for (const spec of compound) {
    for (const pool of pools
      .filter((pool) => (pool.project ?? '').toLowerCase() === spec.project)
      .filter((pool) => sanePool(pool, 80_000, 30))
      .sort(byTvl)
      .slice(0, 3)) {
      const pair = pairLabel(pool.symbol);
      rows.push(
        marketRow(pool, {
          id: `${spec.venue}-${pool.pool}`,
          venue: spec.venue,
          category: 'lp',
          lane: 'compound',
          door: 'boost',
          group: `${spec.name} · auto-compound`,
          name: pair,
          happens: `${spec.name} holds the ${pair} Curve LP and compounds the rewards back into it.`,
          youDo: `Deposit the ${pair} LP token. You do not claim and restake yourself.`,
          href: spec.href,
        }),
      );
    }
  }

  rows.push(
    {
      id: 'concrete',
      venue: 'concrete',
      category: 'vault',
      door: 'vault',
      group: 'Concrete',
      name: 'frxUSD+ vault',
      pair: 'frxUSD',
      chain: 'Ethereum',
      chains: ['Ethereum'],
      apy: 0,
      happens: 'Concrete deploys the frxUSD you deposit. The rate on their page is the one that counts.',
      youDo: 'Deposit frxUSD into the frxUSD+ vault. Check the live rate there before you do.',
      href: 'https://app.concrete.xyz/vault/frax/frxusd',
    },
    {
      id: 'etherfi',
      venue: 'etherfi',
      category: 'vault',
      door: 'vault',
      group: 'ether.fi',
      name: 'ether.fi Cash',
      pair: 'frxUSD',
      chain: 'Optimism',
      chains: ['Optimism'],
      apy: 0,
      happens: 'ether.fi holds the frxUSD you stake inside Cash. Membership rewards sit on top of the yield they quote.',
      youDo: 'Deposit frxUSD through ether.fi Cash and read the rate on their page.',
      href: 'https://www.ether.fi/app/cash/earn',
    },
    {
      id: 'gearbox-midas',
      venue: 'gearbox',
      category: 'lp',
      door: 'loop',
      group: 'Gearbox · Midas',
      name: 'mF-ONE and mGLOBAL',
      pair: 'Borrow frxUSD',
      chain: 'Ethereum',
      chains: ['Ethereum'],
      apy: 0,
      happens:
        'A loop posts something that already earns, then borrows frxUSD against it. The point is the gap: that yield is meant to run ahead of the borrow rate. Gearbox does this with Midas mF-ONE and mGLOBAL. The same idea shows up on Resupply and other lending markets. If the yield falls or the borrow rate rises, the gap can go against you.',
      youDo: 'Open the venue, post the earning asset, and borrow frxUSD. Read both rates before you do. One redemption window unwinds a Gearbox account.',
      href: 'https://app.gearbox.fi',
    },
    {
      id: 'borrow-aave',
      venue: 'aave',
      category: 'vault',
      door: 'borrow',
      group: 'Aave',
      name: 'Borrow on Aave',
      pair: 'Borrow frxUSD',
      chain: 'Ethereum',
      chains: ['Ethereum'],
      apy: 0,
      happens: 'You post collateral and borrow frxUSD. You pay the borrow rate for as long as the loan is open.',
      youDo: 'Open Aave, post collateral, and borrow frxUSD. The live borrow rate is on Aave.',
      href: 'https://pro.aave.com/explore/token/FRXUSD?chain=1',
    },
    {
      id: 'borrow-fraxlend',
      venue: 'fraxlend',
      category: 'vault',
      door: 'borrow',
      group: 'Fraxlend',
      name: 'Borrow on Fraxlend',
      pair: 'Borrow frxUSD',
      chain: 'Ethereum',
      chains: ['Ethereum', 'Fraxtal'],
      apy: 0,
      happens: 'Fraxlend lends frxUSD against collateral. Borrowers pay the rate that moves with utilization.',
      youDo: 'Open a Fraxlend pair, post collateral, and borrow frxUSD.',
      href: 'https://frax.com/lend',
    },
    {
      id: 'borrow-resupply',
      venue: 'resupply',
      category: 'vault',
      door: 'borrow',
      group: 'Resupply',
      name: 'Borrow on Resupply',
      pair: 'Borrow frxUSD',
      chain: 'Ethereum',
      chains: ['Ethereum'],
      apy: 0,
      happens: 'Resupply is a place to borrow frxUSD, and a common base for a loop when the collateral yield beats the borrow rate.',
      youDo: 'Open Resupply, post collateral, and borrow frxUSD. Check both rates before you loop.',
      href: 'https://resupply.fi',
    },
    {
      id: 'midas-mfone',
      venue: 'midas',
      category: 'vault',
      door: 'rwa',
      group: 'Midas',
      name: 'mF-ONE',
      pair: 'mF-ONE',
      chain: 'Ethereum',
      chains: ['Ethereum'],
      apy: 0,
      happens: 'mF-ONE is a tokenized fund from Midas. You hold the token itself. It is not a frxUSD pool.',
      youDo: 'Open Midas and read the fund before you buy mF-ONE.',
      href: 'https://midas.app',
    },
    {
      id: 'midas-mglobal',
      venue: 'midas',
      category: 'vault',
      door: 'rwa',
      group: 'Midas',
      name: 'mGLOBAL',
      pair: 'mGLOBAL',
      chain: 'Ethereum',
      chains: ['Ethereum'],
      apy: 0,
      happens: 'mGLOBAL is a tokenized fund from Midas. You hold the token itself.',
      youDo: 'Open Midas and read the fund before you buy mGLOBAL.',
      href: 'https://midas.app',
    },
    {
      id: 'gearbox-rwa',
      venue: 'gearbox',
      category: 'vault',
      door: 'rwa',
      group: 'Gearbox',
      name: 'Midas on Gearbox',
      pair: 'mF-ONE / mGLOBAL',
      chain: 'Ethereum',
      chains: ['Ethereum'],
      apy: 0,
      happens: 'Gearbox credit accounts hold Midas mF-ONE and mGLOBAL. That is where those tokenized assets sit when they back a frxUSD borrow.',
      youDo: 'Open Gearbox to see the Midas tokens in a credit account.',
      href: 'https://app.gearbox.fi',
    },
  );

  return rows;
}

function tvlWeightedApy(pools: DefiLlamaYieldPool[]): number {
  const set = pools.filter((p) => (p.tvlUsd ?? 0) >= 50_000 && (p.apy ?? 0) < 80);
  let tv = 0;
  let acc = 0;
  for (const p of set) {
    const tvl = p.tvlUsd ?? 0;
    const apy = p.apy ?? 0;
    tv += tvl;
    acc += tvl * apy;
  }
  if (tv <= 0) return fallbackOpportunityLive().averageApy;
  return +(acc / tv).toFixed(1);
}

export async function buildFrxUsdOpportunities(): Promise<FrxUsdOppLive> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache.data;

  try {
    const [raw, hubPools] = await Promise.all([fetchDefiLlamaYields(), fetchStakeDaoFrxUsdPools()]);
    const pools = listedPools(raw);
    if (!pools.length) return cache?.data ?? fallbackOpportunityLive();

    const rows = classifyMarkets(pools);
    try {
      const fables = await fetchFablesFrxUsdPools();
      for (const pool of fables) {
        const apr = pool.swapFeeApr > 0 && pool.swapFeeApr < 40 ? +pool.swapFeeApr.toFixed(2) : 0;
        const pair = `${pool.otherSymbol} / frxUSD`;
        rows.push({
          id: `fables-${pool.slug}`,
          venue: 'fables',
          category: 'lp',
          ...(pool.stable ? { lane: 'pegkeeper' as const } : {}),
          door: pool.stable ? 'peg' : 'fx',
          group: 'Fables · Robinhood Chain',
          name: pair,
          pair,
          chain: 'Robinhood Chain',
          chains: ['Robinhood Chain'],
          apy: apr,
          tvlUsd: pool.frxUsdUsd,
          happens: pool.stable
            ? `${pool.otherName} and frxUSD trade on Fables, a Uniswap v4 pool on Robinhood Chain. Both are dollars. You earn the swap fees.`
            : `${pool.otherName} and frxUSD trade on Fables, a Uniswap v4 pool on Robinhood Chain. You earn the swap fees.`,
          youDo:
            pool.slug === 'eusd'
              ? `Add ${pool.otherSymbol} and frxUSD on Fables. The rate is swap fees. A separate Merkl reward is paid on top and is not in this number.`
              : `Add ${pool.otherSymbol} and frxUSD on Fables. The rate is swap fees.`,
          href: pool.href,
        });
      }
    } catch (error) {
      console.warn('[frxusd-opportunities] fables', error);
    }
    try {
      const giga = await fetchGigaFrxUsdPools();
      for (const pool of giga) {
        const apr =
          pool.tvlUsd > 0 && pool.fees24hUsd > 0
            ? +((pool.fees24hUsd / pool.tvlUsd) * 365 * 100).toFixed(2)
            : 0;
        rows.push({
          id: `giga-${pool.id}`,
          venue: 'giga',
          category: 'lp',
          door: 'rwa',
          group: 'GigaDEX · Robinhood Chain',
          name: `${pool.otherSymbol} / frxUSD`,
          pair: `${pool.otherSymbol} / frxUSD`,
          chain: 'Robinhood Chain',
          chains: ['Robinhood Chain'],
          apy: apr > 0 && apr < 80 ? apr : 0,
          tvlUsd: pool.frxUsdUsd,
          happens: `${pool.otherSymbol} is a tokenized asset on Robinhood Chain. This GigaDEX pool pairs it with frxUSD, and you earn swap fees when people trade.`,
          youDo: `Add ${pool.otherSymbol} and frxUSD on GigaDEX. The live fee is on GigaDEX.`,
          href: 'https://www.gigadex.fi',
        });
      }
    } catch (error) {
      console.warn('[frxusd-opportunities] giga', error);
    }
    const featured: FrxUsdOppFeatured[] = rows
      .filter((row) => row.apy > 0 && (row.tvlUsd ?? 0) >= 150_000)
      .slice()
      .sort((a, b) => (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0))
      .slice(0, 4)
      .map((row) => ({
        id: row.id,
        venue: row.venue,
        name: row.name,
        pair: row.pair,
        chain: row.chain,
        chains: row.chains,
        apy: row.apy,
        note: row.happens ?? row.pair,
        href: row.href,
        internal: row.internal,
      }));

    const llamaStake = pools
      .filter((p) => (p.project ?? '').toLowerCase().includes('stake-dao'))
      .sort((a, b) => (b.apy ?? 0) - (a.apy ?? 0))
      .map((p, i) => {
        const chain = p.chain ?? 'Ethereum';
        return {
          id: `sd-${p.pool ?? i}`,
          venue: 'stakedao',
          category: 'lp' as const,
          lane: 'boost' as const,
          name: prettyFrxUsdPair(p.symbol),
          pair: prettyFrxUsdPair(p.symbol),
          chain,
          chains: [chain],
          apy: okApy(p.apy) ?? 0,
          tvlUsd: p.tvlUsd,
          href: 'https://www.stakedao.org/yield?tokenFilter=usd&search=frxUSD',
        };
      })
      .filter((p) => p.apy > 0);

    const stakePools = hubPools.length ? hubPools : llamaStake;

    const shown = rows.filter((row) => row.apy > 0);
    const data: FrxUsdOppLive = {
      liveCount: rows.length,
      averageApy: tvlWeightedApy(
        shown.map((row) => ({ pool: row.id, symbol: row.pair, tvlUsd: row.tvlUsd, apy: row.apy })),
      ),
      ecosystems: FRXUSD_PLACES.length,
      featured,
      rows,
      stakeDao: {
        count: stakePools.length,
        pools: stakePools,
      },
      updatedAt: new Date().toISOString(),
    };

    cache = { ts: Date.now(), data };
    return data;
  } catch (error) {
    console.error('[frxusd-opportunities]', error);
    return cache?.data ?? fallbackOpportunityLive();
  }
}
