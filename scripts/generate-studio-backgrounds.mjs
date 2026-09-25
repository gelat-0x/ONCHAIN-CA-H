#!/usr/bin/env node
/**
 * Generates curated dark gradient SVG backgrounds for Content Studio exports.
 * Run: npm run generate:studio-bg  (or fetch:studio-bg falls back to this)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/backgrounds/studio');

const BACKGROUNDS = [
  {
    id: 'midnight-gradient',
    label: 'Midnight',
    overlay: 'dark-blue',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <radialGradient id="g" cx="20%" cy="10%" r="80%">
          <stop offset="0%" stop-color="#1a1f3a"/>
          <stop offset="55%" stop-color="#0c0e18"/>
          <stop offset="100%" stop-color="#050508"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <ellipse cx="950" cy="520" rx="420" ry="280" fill="#141830" opacity="0.45"/>
    </svg>`,
  },
  {
    id: 'deep-ocean',
    label: 'Deep Ocean',
    overlay: 'dark-blue',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0a1628"/>
          <stop offset="50%" stop-color="#061018"/>
          <stop offset="100%" stop-color="#020608"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <circle cx="200" cy="100" r="300" fill="#0d2840" opacity="0.35"/>
    </svg>`,
  },
  {
    id: 'charcoal-mesh',
    label: 'Charcoal',
    overlay: 'dark',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#0a0a0c"/>
      <rect x="0" y="0" width="1200" height="630" fill="url(#n)" opacity="0.08"/>
      <defs>
        <pattern id="n" width="40" height="40" patternUnits="userSpaceOnUse">
          <circle cx="20" cy="20" r="1" fill="#fff"/>
        </pattern>
      </defs>
      <radialGradient id="g" cx="70%" cy="30%" r="60%">
        <stop offset="0%" stop-color="#222" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <rect width="1200" height="630" fill="url(#g)"/>
    </svg>`,
  },
  {
    id: 'obsidian-wave',
    label: 'Obsidian',
    overlay: 'dark',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="g" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stop-color="#080810"/>
          <stop offset="100%" stop-color="#12121c"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <path d="M0,420 Q300,360 600,400 T1200,380 L1200,630 L0,630 Z" fill="#ffffff" opacity="0.03"/>
      <path d="M0,480 Q400,440 800,470 T1200,450 L1200,630 L0,630 Z" fill="#ffffff" opacity="0.02"/>
    </svg>`,
  },
  {
    id: 'violet-haze',
    label: 'Violet Haze',
    overlay: 'dark-blue',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <radialGradient id="g" cx="50%" cy="40%" r="70%">
          <stop offset="0%" stop-color="#2a1848"/>
          <stop offset="60%" stop-color="#100818"/>
          <stop offset="100%" stop-color="#060408"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
    </svg>`,
  },
  {
    id: 'ember-glow',
    label: 'Ember',
    overlay: 'warm',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <radialGradient id="g" cx="85%" cy="85%" r="65%">
          <stop offset="0%" stop-color="#3a1808"/>
          <stop offset="45%" stop-color="#120808"/>
          <stop offset="100%" stop-color="#060404"/>
        </radialGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <ellipse cx="1000" cy="550" rx="350" ry="200" fill="#ff6b35" opacity="0.08"/>
    </svg>`,
  },
  {
    id: 'steel-fog',
    label: 'Steel Fog',
    overlay: 'dark',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#141618"/>
          <stop offset="100%" stop-color="#08090a"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <rect y="200" width="1200" height="230" fill="#ffffff" opacity="0.025"/>
    </svg>`,
  },
  {
    id: 'cosmic-drift',
    label: 'Cosmic',
    overlay: 'dark-blue',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <rect width="1200" height="630" fill="#050510"/>
      <circle cx="150" cy="120" r="2" fill="#fff" opacity="0.4"/>
      <circle cx="400" cy="80" r="1.5" fill="#fff" opacity="0.3"/>
      <circle cx="900" cy="200" r="2" fill="#fff" opacity="0.35"/>
      <circle cx="1050" cy="90" r="1" fill="#fff" opacity="0.25"/>
      <radialGradient id="g" cx="30%" cy="70%" r="55%">
        <stop offset="0%" stop-color="#182040" stop-opacity="0.8"/>
        <stop offset="100%" stop-color="#000" stop-opacity="0"/>
      </radialGradient>
      <rect width="1200" height="630" fill="url(#g)"/>
    </svg>`,
  },
  {
    id: 'slate-pulse',
    label: 'Slate',
    overlay: 'dark',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#0e0e12"/>
          <stop offset="50%" stop-color="#16161c"/>
          <stop offset="100%" stop-color="#0a0a0e"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
    </svg>`,
  },
  {
    id: 'amber-dusk',
    label: 'Amber Dusk',
    overlay: 'warm',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>
        <linearGradient id="g" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#180c04"/>
          <stop offset="50%" stop-color="#0c0806"/>
          <stop offset="100%" stop-color="#101018"/>
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#g)"/>
      <ellipse cx="600" cy="630" rx="700" ry="200" fill="#f59e0b" opacity="0.06"/>
    </svg>`,
  },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const manifest = [];

  for (const bg of BACKGROUNDS) {
    const filename = `${bg.id}.svg`;
    await writeFile(join(OUT_DIR, filename), bg.svg.trim());
    manifest.push({ id: bg.id, label: bg.label, file: filename, overlay: bg.overlay });
    console.log(`Generated ${filename}`);
  }

  await writeFile(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ backgrounds: manifest, updatedAt: new Date().toISOString() }, null, 2),
  );

  console.log(`\nDone — ${manifest.length} backgrounds in public/backgrounds/studio/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
