import { useLayoutEffect, type RefObject } from 'react';

const DEFAULT_THRESHOLD = 40;

export interface WheelCaptureOptions {
  /** When set, wheel advances discretely via callback instead of raw scrollTop delta. */
  onWheelStep?: (dir: 1 | -1) => void;
  threshold?: number;
  enabled?: boolean;
}

/**
 * Captures wheel on `captureRef` and either forwards discrete steps or raw delta to `scrollRef`.
 * Uses { passive: false } so the page does not scroll while hovering the orbit box.
 */
export function useWheelCapture(
  captureRef: RefObject<HTMLElement | null>,
  scrollRef: RefObject<HTMLElement | null>,
  options: WheelCaptureOptions = {},
) {
  const { onWheelStep, threshold = DEFAULT_THRESHOLD, enabled = true } = options;

  useLayoutEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let accum = 0;

    const attach = () => {
      if (cancelled) return;
      const capture = captureRef.current;
      const scroller = scrollRef.current;
      if (!capture || !scroller) {
        requestAnimationFrame(attach);
        return;
      }

      const onWheel = (e: WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (onWheelStep) {
          accum += e.deltaY;
          if (Math.abs(accum) >= threshold) {
            const dir: 1 | -1 = accum > 0 ? 1 : -1;
            onWheelStep(dir);
            accum = 0;
          }
        } else {
          scroller.scrollTop += e.deltaY;
        }
      };

      capture.addEventListener('wheel', onWheel, { passive: false });
      cleanup = () => capture.removeEventListener('wheel', onWheel);
    };

    attach();
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [captureRef, scrollRef, onWheelStep, threshold, enabled]);
}
