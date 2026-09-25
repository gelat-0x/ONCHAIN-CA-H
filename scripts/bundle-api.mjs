import { build } from 'esbuild';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

await build({
  entryPoints: [path.join(projectRoot, 'server/vercel-entry.ts')],
  outfile: path.join(projectRoot, 'api/index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node20',
  logLevel: 'info',
  plugins: [
    {
      name: 'externalize-npm',
      setup(buildApi) {
        buildApi.onResolve({ filter: /^[^./]/ }, (args) => {
          if (args.path.startsWith('node:')) return { path: args.path, external: true };
          return { path: args.path, external: true };
        });
      },
    },
  ],
  banner: {
    js: "import { createRequire as __createRequire } from 'module'; const require = __createRequire(import.meta.url);",
  },
});

console.log('[bundle-api] wrote api/index.js');
