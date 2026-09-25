#!/usr/bin/env node
/**
 * Sync token logos into public/logos/token/ and src/assets/tokens/
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_PUBLIC = path.join(ROOT, 'public/logos/token');
const OUT_ASSETS = path.join(ROOT, 'src/assets/tokens');

const LOCAL_SOURCES = [
  {
    from: path.join(ROOT, 'public/logos/Tokens'),
    files: [
      'AZND.png', 'OUSD.png', 'USD3.png', 'USG.png', 'USP.png', ['USPc.png', 'USPC.png'],
      'avUSD.png', 'crvUSD.png', 'evaUSDT.png', 'frxUSD.png', 'msUSD.png', 'sDOLA.png',
      'sUSDat.png', 'tmvUSDC.png',
      ['sUSDs.png', 'sUSDS.png'],
    ],
  },
  { from: ROOT, files: ['alUSD.png'] },
  {
    from: '/Users/jannesburmeister/Downloads',
    files: [
      'dUSD.png', 'pmUSD.png',
      ['curve-dao-token-crv-logo-6.png', 'CRV.png'],
      ['aave-aave-logo.png', 'AAVE.png'],
      ['ethereum-eth-round-logo-icon-png-701751694969815akblwl2552.png', 'ETH.png'],
      ['solanaVerticalLogo.png', 'SOL.png'],
      ['fxn logo.png', 'FXN.png'],
    ],
  },
  { from: '/Users/jannesburmeister/Downloads/[PUBLIC] dUSD Logo', files: [['dUSD_Logo.png', 'dUSD.png']] },
  {
    from: '/Users/jannesburmeister/Downloads/Media Pack Logos 2',
    files: [['FRAX icon.png', 'FRAX.png'], ['Frax Shares icon.png', 'FXS.png']],
  },
  { from: '/Users/jannesburmeister/Downloads/Media Pack Logos', files: [['Frax Shares icon.png', 'FXS.png']] },
];

/** CoinGecko ids to try, in order */
const COINGECKO_IDS = {
  BTC: ['bitcoin'],
  ETH: ['ethereum'],
  SOL: ['solana'],
  CRV: ['curve-dao-token'],
  CVX: ['convex-finance'],
  FXS: ['frax-share'],
  FRAX: ['frax'],
  AAVE: ['aave'],
  FXN: ['f-x-protocol'],
  iUSD: ['infinifi-usd'],
  ebUSD: ['ebusd', 'ebisu-usd-stablecoin'],
  YUSD: ['aegis-yusd', 'yusd'],
  USDaf: ['usd-af', 'asymmetry-usd'],
  srRoyUSDC: ['royco'],
  sUSDS: ['susds', 'sky-usds'],
  VUSD: ['vetro-usd'],
  muBOND: ['mu-digital'],
  savUSD: ['avant-staked-usd', 'avant-usd'],
  fxUSD: ['f-x-protocol-usd', 'fx-protocol-fxusd'],
};

/** Ethereum mainnet contracts for /coins/ethereum/contract/{address} fallback */
const CONTRACTS = {
  iUSD: '0x48f9e38f3070ad8945dfeae3fa70987722e3d89c',
  USDaf: '0x00002063272b8932a160921235317c5d86772c1',
  YUSD: '0x0000000d097ad668952348f671eB99F2617848E8',
  ebUSD: '0x31d563e7d382CD934014BeC8C6C931751E6b3a9a',
  srRoyUSDC: '0x310a9Fd2906c6a3eE97289095b183f96309c56AE',
  sUSDS: '0xa3931d718177C0C7a0b426Cc70d198FBF3D38D71',
  VUSD: '0xCa83DDE9c22254f58e771bE5E157773212AcBAc3',
};

const REQUIRED = [
  'frxUSD',
  'crvUSD', 'msUSD', 'alUSD', 'pmUSD', 'USD3', 'USG', 'sDOLA', 'sUSDS', 'avUSD',
  'srRoyUSDC', 'evaUSDT', 'USPC', 'dUSD', 'tmvUSDC', 'OUSD', 'muBOND', 'AZND',
  'fxUSD', 'savUSD', 'sUSDat', 'USP', 'USDaf', 'YUSD', 'ebUSD', 'iUSD', 'VUSD',
  'BTC', 'ETH', 'SOL', 'CRV', 'CVX', 'FXS', 'FRAX', 'AAVE', 'FXN',
];

const FETCH_DELAY_MS = 6000;
const RETRY_429_MS = 65000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyToDirs(src, destName) {
  for (const outDir of [OUT_PUBLIC, OUT_ASSETS]) {
    ensureDir(outDir);
    fs.copyFileSync(src, path.join(outDir, destName));
  }
}

function copyLocal() {
  ensureDir(OUT_PUBLIC);
  ensureDir(OUT_ASSETS);
  for (const source of LOCAL_SOURCES) {
    if (!fs.existsSync(source.from)) {
      console.warn(`skip missing source: ${source.from}`);
      continue;
    }
    for (const entry of source.files) {
      const [srcName, destName] = Array.isArray(entry) ? entry : [entry, entry];
      const src = path.join(source.from, srcName);
      if (!fs.existsSync(src)) {
        console.warn(`  missing: ${src}`);
        continue;
      }
      copyToDirs(src, destName);
      console.log(`copied ${destName}`);
    }
  }
}

function applyFallbacks() {
  const pairs = [
    ['muBOND', 'AZND'],
    ['savUSD', 'avUSD'],
    ['fxUSD', 'FXN'],
  ];
  for (const [dest, src] of pairs) {
    for (const outDir of [OUT_PUBLIC, OUT_ASSETS]) {
      const destPath = path.join(outDir, `${dest}.png`);
      const srcPath = path.join(outDir, `${src}.png`);
      if (!fs.existsSync(destPath) && fs.existsSync(srcPath)) {
        fs.copyFileSync(srcPath, destPath);
        console.log(`fallback ${dest} <- ${src}`);
      }
    }
  }
}

async function fetchJson(url, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        if (attempt < retries) {
          console.warn(`rate limited, waiting ${RETRY_429_MS / 1000}s…`);
          await sleep(RETRY_429_MS);
          continue;
        }
        throw new Error('HTTP 429');
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      if (attempt >= retries) throw err;
      await sleep(3000);
    }
  }
}

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`image HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) throw new Error('image too small');
  return buf;
}

async function fetchFromCoinId(id) {
  const data = await fetchJson(
    `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`,
  );
  const url = data?.image?.large || data?.image?.small;
  if (!url) throw new Error('no image in response');
  return downloadImage(url);
}

async function fetchFromContract(address) {
  const data = await fetchJson(`https://api.coingecko.com/api/v3/coins/ethereum/contract/${address}`);
  const url = data?.image?.large || data?.image?.small;
  if (!url) throw new Error('no image in response');
  return downloadImage(url);
}

function saveSymbol(symbol, buf) {
  for (const outDir of [OUT_PUBLIC, OUT_ASSETS]) {
    fs.writeFileSync(path.join(outDir, `${symbol}.png`), buf);
  }
  console.log(`fetched ${symbol}.png`);
}

async function downloadMissing() {
  for (const symbol of REQUIRED) {
    const destAssets = path.join(OUT_ASSETS, `${symbol}.png`);
    if (fs.existsSync(destAssets)) continue;

    const ids = COINGECKO_IDS[symbol];
    let saved = false;

    if (ids) {
      for (const id of ids) {
        try {
          const buf = await fetchFromCoinId(id);
          saveSymbol(symbol, buf);
          saved = true;
          break;
        } catch (err) {
          console.warn(`  ${symbol} (${id}): ${err.message}`);
          await sleep(FETCH_DELAY_MS);
        }
      }
    }

    if (!saved && CONTRACTS[symbol]) {
      try {
        const buf = await fetchFromContract(CONTRACTS[symbol]);
        saveSymbol(symbol, buf);
        saved = true;
      } catch (err) {
        console.warn(`  ${symbol} (contract): ${err.message}`);
      }
    }

    if (!saved) {
      console.warn(`still missing ${symbol}`);
    }

    await sleep(FETCH_DELAY_MS);
  }
}

function report() {
  const have = fs.readdirSync(OUT_ASSETS).filter((f) => /\.(png|svg|webp|jpe?g)$/i.test(f));
  const missing = REQUIRED.filter((s) => !have.some((f) => f.startsWith(s + '.')));
  console.log(`\n${have.length} logo files in ${OUT_ASSETS}`);
  if (missing.length) {
    console.log('still missing:', missing.join(', '));
    console.log('\nTip: CoinGecko rate-limits free API (~10 req/min).');
    console.log('Wait 1–2 minutes and run: npm run sync:logos');
    console.log('Or drop PNGs manually into src/assets/tokens/{Symbol}.png');
  } else {
    console.log('all required logos present');
  }
}

copyLocal();
applyFallbacks();
report();
