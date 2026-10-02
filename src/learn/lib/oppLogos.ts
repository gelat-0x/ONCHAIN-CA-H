const PROTOCOL = import.meta.glob('../assets/protocols/*.{png,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

const CHAINS = import.meta.glob('../assets/chains/*.{jpg,png,svg,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
}) as Record<string, string>;

function pick(map: Record<string, string>, key: string): string | undefined {
  const slug = key.toLowerCase();
  const ranked = Object.entries(map)
    .filter(([path]) => path.includes(`/${slug}.`) || path.endsWith(`/${slug}`))
    .sort(([a], [b]) => {
      const rank = (p: string) => (p.endsWith('.svg') ? 0 : p.endsWith('.png') ? 1 : 2);
      return rank(a) - rank(b);
    });
  return ranked[0]?.[1];
}

export function protocolLogo(id: string): string | undefined {
  return pick(PROTOCOL, id);
}

export function chainLogo(id: string): string | undefined {
  return pick(CHAINS, id);
}

export function chainLogoByName(name: string): string | undefined {
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace('zk-evm', 'zkevm');
  return (
    pick(CHAINS, slug) ??
    pick(CHAINS, slug.replace('polygon-zkevm', 'polygon-zkevm')) ??
    pick(CHAINS, slug.replace('x-layer', 'xlayer'))
  );
}
