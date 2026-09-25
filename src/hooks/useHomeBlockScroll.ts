import { useEffect, useRef, useState } from 'react';

interface Section { id: string; label: string; snap: boolean }

function sectionEls(sections: Section[]): HTMLElement[] {
  return sections
    .map((s) => document.getElementById(s.id))
    .filter((el): el is HTMLElement => Boolean(el));
}

/** Index of the section currently dominating the viewport. */
function activeFromScroll(els: HTMLElement[]): number {
  const mid = window.innerHeight * 0.42;
  let idx = 0;
  for (let i = 0; i < els.length; i++) {
    if (els[i].getBoundingClientRect().top <= mid) idx = i;
    else break;
  }
  return idx;
}

/**
 * Locked block-by-block scrolling for the homepage.
 * CSS scroll-snap (mandatory + always) owns the gesture; we only track active
 * section for the rail and handle keyboard jumps.
 */
export function useHomeBlockScroll(sections: Section[], ready = true) {
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);
  const ticking = useRef(false);
  activeRef.current = active;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('home-snap');
    // Avoid leftover scroll position fighting the first snap band
    if (ready) window.scrollTo({ top: 0, behavior: 'auto' });
    return () => root.classList.remove('home-snap');
  }, [ready]);

  useEffect(() => {
    if (!ready) return;

    const els = sectionEls(sections);
    if (!els.length) return;

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        ticking.current = false;
        const idx = activeFromScroll(els);
        if (idx !== activeRef.current) setActive(idx);
      });
    };

    const jump = (dir: 1 | -1) => {
      const elsNow = sectionEls(sections);
      if (!elsNow.length) return;
      const cur = activeFromScroll(elsNow);
      const idx = Math.min(Math.max(cur + dir, 0), elsNow.length - 1);
      elsNow[idx]?.scrollIntoView({ behavior: 'auto', block: 'start' });
      setActive(idx);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        if (e.key === ' ' && (e.target as HTMLElement | null)?.closest?.('input, textarea, button, a')) {
          return;
        }
        e.preventDefault();
        jump(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        jump(-1);
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
    };
  }, [ready, sections]);

  const jumpTo = (idx: number) => {
    const el = document.getElementById(sections[idx]?.id ?? '');
    el?.scrollIntoView({ behavior: 'auto', block: 'start' });
    setActive(idx);
  };

  return { active, jumpTo };
}
