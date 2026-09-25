#!/usr/bin/env node
/** Generate branded SVG placeholders for tokens without PNG yet. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/assets/tokens');

const PLACEHOLDERS = [
  { symbol: 'iUSD', color: '#818cf8', label: 'iUSD', size: 11 },
  { symbol: 'USDaf', color: '#fbbf24', label: 'USDaf', size: 10 },
  { symbol: 'YUSD', color: '#fb923c', label: 'YUSD', size: 11 },
  { symbol: 'ebUSD', color: '#94a3b8', label: 'ebUSD', size: 10 },
  { symbol: 'srRoyUSDC', color: '#e8d5b7', label: 'srRoy', size: 9, text: '#1a1a1a' },
  { symbol: 'muBOND', color: '#f472b6', label: 'muBOND', size: 8 },
  { symbol: 'savUSD', color: '#00d4aa', label: 'savUSD', size: 9 },
  { symbol: 'fxUSD', color: '#60a5fa', label: 'fxUSD', size: 10 },
  { symbol: 'sUSDS', color: '#1eaaee', label: 'sUSDS', size: 10 },
  { symbol: 'VUSD', color: '#8b5cf6', label: 'VUSD', size: 11 },
];

function svg({ color, label, size, text = '#ffffff' }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${label}">
  <circle cx="32" cy="32" r="32" fill="${color}"/>
  <text x="32" y="36" text-anchor="middle" font-family="system-ui,-apple-system,BlinkMacSystemFont,sans-serif" font-size="${size}" font-weight="700" fill="${text}">${label}</text>
</svg>`;
}

fs.mkdirSync(OUT, { recursive: true });

for (const item of PLACEHOLDERS) {
  const pngPath = path.join(OUT, `${item.symbol}.png`);
  const svgPath = path.join(OUT, `${item.symbol}.svg`);
  if (fs.existsSync(pngPath)) {
    if (fs.existsSync(svgPath)) fs.unlinkSync(svgPath);
    continue;
  }
  fs.writeFileSync(svgPath, svg(item));
  console.log(`placeholder ${item.symbol}.svg`);
}
