import {
  studioBackgroundTone,
  type StudioBackgroundTone,
} from '../../shared/constants/studioBackgrounds';

export type { StudioBackgroundTone };

/** Canvas modifier class for the selected background tone. */
export function studioToneClass(backgroundId: string): string {
  return studioBackgroundTone(backgroundId) === 'light' ? 'studio-canvas--light' : '';
}

function hexLuminance(color: string): number | null {
  const hex = color.trim().replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Keep pool accent colors legible on the selected tone — near-white accents
 * (msUSD, USPC) turn ink-dark on light backgrounds, near-black accents turn
 * white on dark backgrounds.
 */
export function studioAccentForTone(color: string, tone: StudioBackgroundTone): string {
  const lum = hexLuminance(color);
  if (lum == null) return color;
  if (tone === 'light' && lum > 0.6) return '#16181d';
  if (tone === 'dark' && lum < 0.2) return '#f4f5f7';
  return color;
}
