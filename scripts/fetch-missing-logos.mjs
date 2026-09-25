#!/usr/bin/env node
/**
 * Download missing token logos from Trust Wallet assets + DefiLlama icons.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../public/logos/token');

const TRUSTWALLET = {
  BTC: 'blockchains/bitcoin/info/logo.png',
  ETH: 'blockchains/ethereum/info/logo.png',
  SOL: 'blockchains/solana/info/logo.png',
  CRV: 'blockchains/ethereum/assets/0xD533a949740bb3306d119CC777fa900bA034cd52/logo.png',
  CVX: 'blockchains/ethereum/assets/0x4e3FBD56CD56c3e72c1403e103b45Db9da631B67/logo.png',
  FRAX: 'blockchains/ethereum/assets/0x853d955aCEf822Db058eb8505911ED77F175b99e/logo.png',
  FXS: 'blockchains/ethereum/assets/0x343873376507896919e237771A644cE0Ea98409e/logo.png',
  AAVE: 'blockchains/ethereum/assets/0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9/logo.png',
  crvUSD: 'blockchains/ethereum/assets/0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E/logo.png',
  alUSD: 'blockchains/ethereum/assets/0xCB8FA3aef9dB141BFC1e829a573e45fFc979572F/logo.png',
  OUSD: 'blockchains/ethereum/assets/0x2A8e1E676Ec238d9A992cB479D88166873793B7a/logo.png',
  fxUSD: 'blockchains/ethereum/assets/0x085780639CC2cAdfE788911e7527683bEc4B8D1D/logo.png',
  dUSD: 'blockchains/ethereum/assets/0x5C064D9064141be0d2d4884a7208A606E1486041/logo.png',
};

const LLAMA = {
  iUSD: 'infinifi',
  reUSD: 're-protocol',
  ebUSD: 'ebisu-finance',
  YUSD: 'aegis',
  USDaf: 'asymmetry-finance',
  USDf: 'falcon-finance',
  USDfi: 'usdfi',
  USDp: 'parallel',
  USDP: 'parallel',
  muBOND: 'mu-digital',
  savUSD: 'avant-protocol',
  srRoyUSDC: 'royco',
  pmUSD: 'raac',
  USPC: 'coinshift',
  USP: 'piku',
  USG: 'tangent',
  tmvUSDC: 'term-finance',
  sDOLA: 'inverse-finance',
  sUSDat: 'saturn',
  evaUSDT: 'eva',
  USD3: '3jane',
  AZND: 'mu-digital',
  avUSD: 'avant-protocol',
  msUSD: 'metronome',
  frxUSD: 'frax',
  FXN: 'fx-protocol',
};

const REQUIRED = [
  'frxUSD', 'AZND', 'OUSD', 'USD3', 'USDP', 'USDaf', 'USDf', 'USDfi', 'USDp', 'USG', 'USP', 'USPC',
  'YUSD', 'alUSD', 'avUSD', 'crvUSD', 'dUSD', 'ebUSD', 'evaUSDT', 'fxUSD', 'iUSD', 'msUSD',
  'muBOND', 'pmUSD', 'reUSD', 'sDOLA', 'sUSDat', 'savUSD', 'srRoyUSDC', 'tmvUSDC',
  'BTC', 'ETH', 'SOL', 'CRV', 'CVX', 'FXS', 'FRAX', 'AAVE', 'FXN',
];

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 200) throw new Error('file too small');
  fs.writeFileSync(dest, buf);
}

async function fetchMissing() {
  fs.mkdirSync(OUT, { recursive: true });
  for (const symbol of REQUIRED) {
    const dest = path.join(OUT, `${symbol}.png`);
    if (fs.existsSync(dest)) continue;

    const tw = TRUSTWALLET[symbol];
    if (tw) {
      try {
        await download(`https://raw.githubusercontent.com/trustwallet/assets/master/${tw}`, dest);
        console.log(`trustwallet ${symbol}`);
        continue;
      } catch (e) {
        console.warn(`trustwallet ${symbol}: ${e.message}`);
      }
    }

    const llama = LLAMA[symbol];
    if (llama) {
      for (const url of [
        `https://icons.llama.fi/${llama}.png`,
        `https://icons.llama.fi/${llama}.jpg`,
      ]) {
        try {
          await download(url, dest);
          console.log(`llama ${symbol} (${llama})`);
          break;
        } catch {
          /* try next */
        }
      }
      if (fs.existsSync(dest)) continue;
    }

    console.warn(`still missing ${symbol}`);
  }
}

await fetchMissing();
const have = fs.readdirSync(OUT).filter((f) => f.endsWith('.png'));
const missing = REQUIRED.filter((s) => !have.includes(`${s}.png`));
console.log(`\n${have.length} png logos`);
if (missing.length) console.log('missing:', missing.join(', '));
else console.log('complete');
