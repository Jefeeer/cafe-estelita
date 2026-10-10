'use client';

import { useEffect } from 'react';
import Lenis from 'lenis';

/** Buttery inertia scrolling + eased anchor jumps. Off for reduced-motion users. */
/** Pause page scrolling while an overlay is open (Lenis watches this attribute). */
export function setScrollLock(v?: string) {
  const d = document.documentElement.dataset;
  if (v) d.lock = v; else delete d.lock;
}

export default function SmoothScroll() {
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09,
      anchors: { offset: -68, duration: 1.4 }, // offset clears the fixed header
    });
    // overlays (mobile menu, lightbox) opt out with data-lenis-prevent; pause page scroll while they're open
    const sync = () => (document.documentElement.dataset.lock ? lenis.stop() : lenis.start());
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-lock'] });
    return () => { mo.disconnect(); lenis.destroy(); };
  }, []);
  return null;
}
