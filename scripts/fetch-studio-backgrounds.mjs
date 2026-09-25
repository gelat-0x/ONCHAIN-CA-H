#!/usr/bin/env node
/**
 * Downloads curated dark/abstract studio export backgrounds (Unsplash, free license).
 * Run: npm run fetch:studio-bg
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, '../public/backgrounds/studio');

/** 1200×630 crop — dark abstract / gradient aesthetic */
const BACKGROUNDS = [
  {
    id: 'midnight-gradient',
    label: 'Midnight',
    overlay: 'dark-blue',
    url: 'https://images.unsplash.com/photo-1614850523459-c2f4c699c52e?w=1200&h=630&fit=crop&q=85',
  },
  {
    id: 'deep-ocean',
    label: 'Deep Ocean',
    overlay: 'dark-blue',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=630&fit=crop&q=85',
  },
  {
    id: 'charcoal-mesh',
    label: 'Charcoal',
    overlay: 'dark',
    url: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?w=1200&h=630&fit=crop&q=85',
  },
  {
    id: 'obsidian-wave',
    label: 'Obsidian',
    overlay: 'dark',
    url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=630&fit=crop&q=85',
  },
  {
    id: 'violet-haze',
    label: 'Violet Haze',
    overlay: 'dark-blue',
    url: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=630&fit=crop&q=85',
  },
  {
    id: 'ember-glow',
    label: 'Ember',
    overlay: 'warm',
    url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&h=630&fit=crop&q=85',
  },
  {
    id: 'steel-fog',
    label: 'Steel Fog',
    overlay: 'dark',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd657f7?w=1200&h=630&fit=crop&q=85',
  },
  {
    id: 'cosmic-drift',
    label: 'Cosmic',
    overlay: 'dark-blue',
    url: 'https://images.unsplash.com/photo-1614850523296-d3c0acbaba06?w=1200&h=630&fit=crop&q=85',
  },
  {
    id: 'slate-pulse',
    label: 'Slate',
    overlay: 'dark',
    url: 'https://images.unsplash.com/photo-1550684843-f647f3123364?w=1200&h=630&fit=crop&q=85',
  },
  {
    id: 'amber-dusk',
    label: 'Amber Dusk',
    overlay: 'warm',
    url: 'https://images.unsplash.com/photo-1557683311-eac922347aa1?w=1200&h=630&fit=crop&q=85',
  },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  const manifest = [];

  for (const bg of BACKGROUNDS) {
    const filename = `${bg.id}.webp`;
    const outPath = join(OUT_DIR, filename);
    process.stdout.write(`Fetching ${bg.id}… `);

    try {
      const res = await fetch(bg.url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(outPath, buf);
      manifest.push({
        id: bg.id,
        label: bg.label,
        file: filename,
        overlay: bg.overlay,
      });
      console.log('ok');
    } catch (err) {
      console.log(`failed (${err instanceof Error ? err.message : err})`);
    }
  }

  await writeFile(
    join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ backgrounds: manifest, updatedAt: new Date().toISOString() }, null, 2),
  );

  console.log(`\nDone — ${manifest.length}/${BACKGROUNDS.length} backgrounds in public/backgrounds/studio/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
