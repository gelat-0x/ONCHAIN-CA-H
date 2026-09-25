import { toBlob, toPng } from 'html-to-image';

export const STUDIO_EXPORT_WIDTH = 1200;
export const STUDIO_EXPORT_HEIGHT = 630;

export type StudioPersistResult = {
  /** Object URL for a manual save fallback (revoke after ~60s). */
  objectUrl: string;
  method: 'share' | 'download';
};

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { cache: 'force-cache' });
    if (!res.ok) return null;
    return await blobToDataUrl(await res.blob());
  } catch {
    return null;
  }
}

/**
 * Inline every <img> as a data URL before capture.
 *
 * html-to-image re-fetches image sources while cloning the node; lazy-loaded
 * or not-yet-cached sources (token logos, background art) can silently drop
 * out of the exported PNG. Embedding them as data URLs first makes the
 * capture deterministic.
 */
async function inlineImages(node: HTMLElement): Promise<void> {
  const images = [...node.querySelectorAll('img')];
  await Promise.all(
    images.map(async (img) => {
      const src = img.currentSrc || img.src;
      if (!src || src.startsWith('data:')) return;
      const dataUrl = await fetchAsDataUrl(src);
      if (!dataUrl) return;
      img.srcset = '';
      img.loading = 'eager';
      img.src = dataUrl;
      try {
        await img.decode();
      } catch {
        // decode() may reject for already-complete images — safe to ignore
      }
    }),
  );
}

async function waitForImages(node: HTMLElement): Promise<void> {
  const images = node.querySelectorAll('img');
  await Promise.all(
    [...images].map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        }),
    ),
  );
}

/**
 * Neutralize styles that html-to-image commonly mis-rasterizes on circular logos
 * (hard offset shadows, overflow+radius plates → light polygonal shards).
 */
function sanitizeStudioExportStyles(node: HTMLElement): void {
  const coins = node.querySelectorAll<HTMLElement>(
    '.apr-canvas__coin, .top-pools-canvas__logos .token-logo, .studio-canvas__badge-logo',
  );
  for (const el of coins) {
    el.style.setProperty('box-shadow', 'none', 'important');
    el.style.setProperty('filter', 'none', 'important');
    el.style.setProperty('background', 'transparent', 'important');
    el.style.setProperty('background-color', 'transparent', 'important');
    el.style.setProperty('border', 'none', 'important');
    el.style.setProperty('overflow', 'visible', 'important');
  }
  const imgs = node.querySelectorAll<HTMLElement>(
    '.apr-canvas__coin img, .top-pools-canvas__logos img, .studio-canvas__badge-logo img',
  );
  for (const img of imgs) {
    img.style.setProperty('box-shadow', 'none', 'important');
    img.style.setProperty('filter', 'none', 'important');
    img.style.setProperty('background', 'transparent', 'important');
  }
}

function isWebKit(): boolean {
  const ua = navigator.userAgent;
  return /AppleWebKit/.test(ua) && !/Chrome|Chromium|Edg\/|CriOS/.test(ua);
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mime = /data:([^;]+)/.exec(header)?.[1] ?? 'image/png';
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function prefersShareFirst(): boolean {
  const ua = navigator.userAgent;
  // Chrome (Android + iOS CriOS) often drops <a download> after async capture.
  // Safari keeps the direct download path — it already honors the attribute.
  return /CriOS/.test(ua) || (/Android/.test(ua) && /Chrome\//.test(ua));
}

/**
 * Persist a PNG across Safari / Chrome / iOS / Android.
 *
 * Chrome often ignores `<a download>` after async work (user-activation lost)
 * and also blocks `data:` downloads. Prefer share sheet on mobile Chromium,
 * then blob-URL download. Always returns an object URL for a manual tap fallback.
 */
export async function persistStudioPng(
  blob: Blob,
  filename: string,
): Promise<StudioPersistResult> {
  const objectUrl = URL.createObjectURL(blob);
  const file = new File([blob], filename, { type: 'image/png' });

  if (prefersShareFirst() && typeof navigator.share === 'function') {
    const canShareFiles =
      typeof navigator.canShare !== 'function' || navigator.canShare({ files: [file] });
    if (canShareFiles) {
      try {
        await navigator.share({ files: [file], title: filename });
        return { objectUrl, method: 'share' };
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return { objectUrl, method: 'share' };
        }
      }
    }
  }

  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.rel = 'noopener';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();

  return { objectUrl, method: 'download' };
}

export async function downloadStudioImage(
  node: HTMLElement,
  filename: string,
): Promise<StudioPersistResult> {
  // 1) Fonts must be resolved before capture, or text renders in a fallback face.
  try {
    await document.fonts.ready;
  } catch {
    // font loading API unavailable — proceed
  }

  // 2) Make every image source deterministic + strip buggy coin styles.
  await inlineImages(node);
  await waitForImages(node);
  sanitizeStudioExportStyles(node);

  const backgroundColor =
    node.style.backgroundColor ||
    window.getComputedStyle(node).backgroundColor ||
    '#0b0c12';

  const options = {
    pixelRatio: 2,
    width: STUDIO_EXPORT_WIDTH,
    height: STUDIO_EXPORT_HEIGHT,
    canvasWidth: STUDIO_EXPORT_WIDTH * 2,
    canvasHeight: STUDIO_EXPORT_HEIGHT * 2,
    backgroundColor,
    cacheBust: true,
    style: {
      transform: 'none',
      transformOrigin: 'top left',
      margin: '0',
      inset: 'auto',
      left: '0',
      top: '0',
      clip: 'auto',
      clipPath: 'none',
    },
  };

  // 3) WebKit (Safari) has a known race where the first capture drops images
  //    that were not yet in its render cache. Warm-up passes make the final
  //    capture reliable; Chromium gets one warm-up pass for the same reason.
  const warmUpPasses = isWebKit() ? 2 : 1;
  for (let i = 0; i < warmUpPasses; i++) {
    try {
      await toPng(node, options);
    } catch {
      // warm-up failures are non-fatal — the final pass decides
    }
  }

  let blob: Blob | null = null;
  try {
    blob = await toBlob(node, options);
  } catch {
    blob = null;
  }
  if (!blob) {
    const dataUrl = await toPng(node, options);
    blob = dataUrlToBlob(dataUrl);
  }

  return persistStudioPng(blob, filename);
}
