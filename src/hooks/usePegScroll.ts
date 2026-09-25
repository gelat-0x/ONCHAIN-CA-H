import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hard section scroller for the PegKeeper page.
 *
 * Two frames: the hero (full viewport) and the pools list.
 * - locked: CSS scroll-snap (mandatory) forces rest only at the hero or the pools top.
 *   The user cannot stop between the two frames.
 * - free: snap is released so the pools list and everything below scrolls normally.
 *
 * Transitions:
 * - hero -> pools: wheel down / arrow down / cue click  (lands at pools top, then free)
 * - pools -> hero: scroll back up to the boundary       (re-locks, snaps to hero)
 */
export function usePegScroll(heroId: string, poolsId: string, enabled = true) {
  const [atTop, setAtTop] = useState(true);
  const lockedRef = useRef(true);
  const animatingRef = useRef(false);
  const goneBelowRef = useRef(false);

  const el = (id: string) => document.getElementById(id);
  const poolsTop = () => el(poolsId)?.offsetTop ?? Infinity;
  const canSnap = () =>
    enabled && typeof window !== 'undefined' &&
    window.matchMedia('(min-width: 900px)').matches;

  const setSnap = (on: boolean) => {
    lockedRef.current = on;
    document.documentElement.classList.toggle('peg-snap', on && canSnap());
  };

  const jumpToPools = useCallback(() => {
    if (!canSnap()) {
      el(poolsId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (animatingRef.current) return;
    animatingRef.current = true;
    setSnap(true);
    el(poolsId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Release to free scrolling once arrived so the list can be browsed.
    window.setTimeout(() => {
      setSnap(false);
      goneBelowRef.current = false;
      animatingRef.current = false;
    }, 720);
  }, [poolsId, enabled]);

  const jumpToHero = useCallback(() => {
    if (!canSnap()) {
      el(heroId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (animatingRef.current) return;
    animatingRef.current = true;
    setSnap(true);
    el(heroId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => {
      goneBelowRef.current = false;
      animatingRef.current = false;
    }, 720);
  }, [heroId, enabled]);

  useEffect(() => {
    if (!enabled) return;
    setSnap(true);
    const pt = () => poolsTop();

    const onWheel = (e: WheelEvent) => {
      if (!canSnap()) return;
      if (animatingRef.current) return;
      const y = window.scrollY;
      const top = pt();
      const atPools = y >= top - 24 && y <= top + 120;

      if (lockedRef.current) {
        // Hero -> pools: force a clean jump (CSS snap alone can stutter on trackpads).
        if (y < top - 24 && e.deltaY > 0) {
          e.preventDefault();
          jumpToPools();
          return;
        }
        // At pools top, scrolling further down -> release into free scroll.
        if (atPools && e.deltaY > 0) {
          setSnap(false);
          goneBelowRef.current = false;
          return;
        }
        // At pools top, scrolling up -> snap back to hero.
        if (atPools && e.deltaY < 0) {
          e.preventDefault();
          jumpToHero();
          return;
        }
      } else if (e.deltaY < 0 && y <= top + 2 && goneBelowRef.current) {
        // Free mode, scrolled back up to the boundary -> re-lock to hero.
        e.preventDefault();
        jumpToHero();
      }
    };

    const onScroll = () => {
      const y = window.scrollY;
      const top = pt();
      setAtTop(y < top - 24);
      if (animatingRef.current) return;
      if (!lockedRef.current) {
        if (y > top + 80) goneBelowRef.current = true;
        if (y <= top && goneBelowRef.current) jumpToHero();
      }
    };

    const onKey = (e: KeyboardEvent) => {
      if (!canSnap()) return;
      if (animatingRef.current) return;
      const y = window.scrollY;
      const top = pt();
      if (e.key === 'ArrowDown' || e.key === 'PageDown') {
        if (lockedRef.current && y < top - 24) { e.preventDefault(); jumpToPools(); }
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        if (!lockedRef.current && y <= top + 120) { e.preventDefault(); jumpToHero(); }
      }
    };

    const onResize = () => { if (!lockedRef.current) setSnap(false); };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', onResize);
      document.documentElement.classList.remove('peg-snap');
    };
  }, [enabled, heroId, poolsId, jumpToPools, jumpToHero]);

  return { jumpToPools, jumpToHero, atTop };
}
