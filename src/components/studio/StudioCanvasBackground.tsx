import { useEffect } from 'react';
import {
  STUDIO_BACKGROUNDS,
  studioBackgroundById,
} from '../../../shared/constants/studioBackgrounds';

let backgroundsWarmedUp = false;

/**
 * Decode every studio background once so rapid switching (including
 * light ↔ dark jumps) never paints an intermediate frame. The SVGs are a
 * few hundred bytes each, so this is effectively free.
 */
function warmUpBackgrounds() {
  if (backgroundsWarmedUp || typeof window === 'undefined') return;
  backgroundsWarmedUp = true;
  for (const bg of STUDIO_BACKGROUNDS) {
    const img = new Image();
    img.decoding = 'async';
    img.src = bg.src;
  }
}

interface StudioCanvasBackgroundProps {
  backgroundId: string;
}

export function StudioCanvasBackground({ backgroundId }: StudioCanvasBackgroundProps) {
  const bg = studioBackgroundById(backgroundId);

  useEffect(() => {
    warmUpBackgrounds();
  }, []);

  return (
    <>
      <img
        className="studio-canvas__bg-img"
        src={bg.src}
        alt=""
        crossOrigin="anonymous"
        draggable={false}
        decoding="sync"
        style={{ backgroundColor: bg.base }}
      />
      <div
        className={`studio-canvas__scrim studio-canvas__scrim--${bg.tone}`}
        aria-hidden
      />
      <div className="studio-canvas__noise" aria-hidden />
    </>
  );
}
