'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';

/** The gray wall with the hanging logo. Auto-opens; click, tap, scroll or any key skips. Once per session. */
export function DoorIntro() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    const heroIn = () => root.classList.add('hero-in');
    if (!root.classList.contains('door-on')) { heroIn(); return; }
    let opened = false;
    const timers: number[] = [];
    const open = () => {
      if (opened) return;
      opened = true;
      try { sessionStorage.setItem('ce-door', '1'); } catch {}
      ref.current?.classList.add('open');
      timers.push(window.setTimeout(heroIn, 350), window.setTimeout(() => root.classList.remove('door-on'), 1400));
    };
    const evts = ['keydown', 'wheel', 'touchstart', 'pointerdown'] as const;
    evts.forEach((e) => addEventListener(e, open, { once: true, passive: true }));
    timers.push(window.setTimeout(open, 1200));
    return () => { timers.forEach(clearTimeout); evts.forEach((e) => removeEventListener(e, open)); };
  }, []);

  return (
    <div ref={ref} className="door" aria-hidden="true">
      <div className="door-half left" />
      <div className="door-half right" />
      <div className="door-sign">
        <svg width="2" height="64" className="absolute left-[calc(50%-34px)] top-0" aria-hidden="true"><path d="M1 0v64" stroke="#1E1A17" strokeWidth="2" /></svg>
        <svg width="2" height="64" className="absolute left-[calc(50%+32px)] top-0" aria-hidden="true"><path d="M1 0v64" stroke="#1E1A17" strokeWidth="2" /></svg>
        <div className="mt-[60px] rounded-full bg-ivory p-2 shadow-[0_18px_40px_-12px_rgb(0_0_0/.55)]">
          <Image src="/brand/logo-mark.png" alt="" width={168} height={168} priority className="h-36 w-36 rounded-full sm:h-44 sm:w-44" />
        </div>
      </div>
      <p className="door-hint caps text-xs">Step inside</p>
    </div>
  );
}

/** Slow parallax on the hero photo. Disabled for reduced-motion users. */
export function Parallax({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const el = ref.current!, hero = el.parentElement!;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const h = hero.offsetHeight, y = Math.min(scrollY, h);
        el.style.transform = `translate3d(0, ${y * 0.28}px, 0) scale(${1 + (y / h) * 0.06})`;
        ticking = false;
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  return <div ref={ref} className="hero-media">{children}</div>;
}

/** One observer for every .reveal / .vine element on the page. */
export function RevealObserver() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    document.querySelectorAll('.reveal, .vine').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}

export function CopyButton({ text }: { text: string }) {
  const [msg, setMsg] = useState('');
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setMsg('Copied!'); }
    catch { setMsg('Copy failed — select the text instead.'); }
    setTimeout(() => setMsg(''), 2500);
  };
  return (
    <>
      <button type="button" onClick={copy} className="ml-2 rounded-full border border-blush/30 px-2.5 py-0.5 text-xs transition hover:bg-blush/10">Copy</button>
      <span className="ml-1 text-xs text-mint" role="status">{msg}</span>
    </>
  );
}

/** Mobile action bar: stays out of the way on the hero (the info strip already has call/directions), slides in after. */
export function ShowAfterHero({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(scrollY > innerHeight * 0.6);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div inert={!shown} className={`${className} transition duration-500 ease-[var(--ease-garden)] ${shown ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {children}
    </div>
  );
}
