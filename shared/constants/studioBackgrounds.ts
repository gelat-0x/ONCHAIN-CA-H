export type StudioBackgroundTone = 'dark' | 'light';

export interface StudioBackground {
  id: string;
  label: string;
  /** Path under /public, e.g. /backgrounds/studio/midnight.svg */
  src: string;
  /** Drives canvas typography — dark tone renders white text, light tone dark text. */
  tone: StudioBackgroundTone;
  /**
   * Solid fallback painted under the artwork. Matches the artwork's dominant
   * color so background switches never flash a mismatched frame while the
   * SVG decodes.
   */
  base: string;
}

/** Default export background. */
export const DEFAULT_STUDIO_BACKGROUND_ID = 'midnight-gradient';

/**
 * Curated set — one clear role per background. Near-duplicates (Pearl ≈ Sand,
 * Silver ≈ Porcelain/Arctic) were removed to keep the picker intentional.
 */
export const STUDIO_BACKGROUNDS: StudioBackground[] = [
  {
    id: 'midnight-gradient',
    label: 'Midnight',
    src: '/backgrounds/studio/midnight-gradient.svg',
    tone: 'dark',
    base: '#0b0d17',
  },
  {
    id: 'graphite',
    label: 'Graphite',
    src: '/backgrounds/studio/graphite.svg',
    tone: 'dark',
    base: '#101114',
  },
  {
    id: 'deep-ocean',
    label: 'Deep Ocean',
    src: '/backgrounds/studio/deep-ocean.svg',
    tone: 'dark',
    base: '#071523',
  },
  {
    id: 'aurora',
    label: 'Aurora',
    src: '/backgrounds/studio/aurora.svg',
    tone: 'dark',
    base: '#090b13',
  },
  {
    id: 'ember-glow',
    label: 'Ember',
    src: '/backgrounds/studio/ember-glow.svg',
    tone: 'dark',
    base: '#0c0807',
  },
  {
    id: 'porcelain',
    label: 'Porcelain',
    src: '/backgrounds/studio/porcelain.svg',
    tone: 'light',
    base: '#f5f6f8',
  },
  {
    id: 'arctic',
    label: 'Arctic',
    src: '/backgrounds/studio/arctic.svg',
    tone: 'light',
    base: '#edf3f9',
  },
  {
    id: 'sand',
    label: 'Sand',
    src: '/backgrounds/studio/sand.svg',
    tone: 'light',
    base: '#f5ecdd',
  },
];

export function studioBackgroundById(id: string): StudioBackground {
  return STUDIO_BACKGROUNDS.find((b) => b.id === id) ?? STUDIO_BACKGROUNDS[0];
}

export function studioBackgroundTone(id: string): StudioBackgroundTone {
  return studioBackgroundById(id).tone;
}

export function studioBackgroundBase(id: string): string {
  return studioBackgroundById(id).base;
}
