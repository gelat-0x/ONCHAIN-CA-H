import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

/** The same quiet mesh used behind Use your frxUSD, drawn once for the page below the hero. */
export function MeshGrid() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let raf = 0;
    let hidden = document.hidden;
    let w = 0;
    let h = 0;
    const step = 72;
    const seg = 16;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const warp = (x: number, y: number, t: number): [number, number] => {
      const dx = Math.sin(y * 0.011 + t * 0.45) * 8 + Math.sin((x + y) * 0.005 - t * 0.28) * 5;
      const dy = Math.cos(x * 0.01 - t * 0.4) * 8 + Math.sin((x - y) * 0.006 + t * 0.32) * 5;
      return [x + dx, y + dy];
    };

    const draw = (now: number) => {
      const t = reduceMotion ? 0 : now / 1000;
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      for (let x = -step; x <= w + step; x += step) {
        ctx.beginPath();
        for (let y = -step, first = true; y <= h + step; y += seg, first = false) {
          const [px, py] = warp(x, y, t);
          if (first) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      for (let y = -step; y <= h + step; y += step) {
        ctx.beginPath();
        for (let x = -step, first = true; x <= w + step; x += seg, first = false) {
          const [px, py] = warp(x, y, t);
          if (first) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
      if (!reduceMotion && !hidden) raf = window.requestAnimationFrame(draw);
    };

    const onVisibility = () => {
      hidden = document.hidden;
      if (!hidden && !reduceMotion) {
        window.cancelAnimationFrame(raf);
        raf = window.requestAnimationFrame(draw);
      }
    };

    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', onVisibility);
    resize();
    raf = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduceMotion]);

  return <canvas ref={ref} className="explore-mesh" aria-hidden />;
}
