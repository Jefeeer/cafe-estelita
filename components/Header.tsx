'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { SITE } from '@/lib/content';
import OpenStatus from './OpenStatus';
import { setScrollLock } from './SmoothScroll';

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#menu', label: 'Menu' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#visit', label: 'Visit' },
];

export const PinIcon = ({ className = 'h-4 w-4' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z" /><circle cx="12" cy="9.5" r="2.5" />
  </svg>
);

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState('');
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(scrollY > 40);
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    const spy = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive('#' + e.target.id)),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    LINKS.forEach((l) => { const el = document.querySelector(l.href); if (el) spy.observe(el); });
    const mq = matchMedia('(min-width: 768px)');
    const onMq = (e: MediaQueryListEvent) => e.matches && setOpen(false);
    mq.addEventListener('change', onMq);
    return () => { removeEventListener('scroll', onScroll); spy.disconnect(); mq.removeEventListener('change', onMq); };
  }, []);

  useEffect(() => {
    const main = document.getElementById('main');
    if (main) main.inert = open;
    document.body.style.overflow = open ? 'hidden' : '';
    setScrollLock(open ? 'menu' : undefined);
    if (open) firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && open) { setOpen(false); toggleRef.current?.focus(); } };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <header className={`site-header fixed inset-x-0 top-0 z-50 ${scrolled ? 'is-scrolled' : ''} ${open ? 'menu-open' : ''}`}>
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <a href="#top" className="group flex min-w-0 items-center gap-3" aria-label="Casa Estelita Garden Cafe — back to top">
            <Image src="/brand/logo-mark.png" alt="" width={44} height={44} priority
              className="h-10 w-10 flex-none rounded-full shadow-[0_0_0_2px_rgb(249_236_228/.6)] transition-transform duration-700 group-hover:rotate-[20deg] sm:h-11 sm:w-11" />
            <span className="caps truncate text-[.95rem] leading-none sm:text-base" style={{ letterSpacing: '.22em' }}>Casa Estelita</span>
          </a>

          <nav aria-label="Primary" className="hidden md:block">
            <ul className="flex items-center gap-6 text-[.95rem] font-medium">
              {LINKS.map((l) => (
                <li key={l.href}><a className="nav-link" href={l.href} aria-current={active === l.href ? 'true' : undefined}>{l.label}</a></li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-none items-center gap-3">
            <OpenStatus variant="short" className="hidden items-center gap-2 text-sm lg:flex" />
            <a href={SITE.directions} target="_blank" rel="noopener"
              className="hidden items-center gap-2 rounded-full bg-clay px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-evergreen sm:inline-flex"
              style={{ textShadow: 'none' }}>
              <PinIcon /> Get Directions<span className="sr-only"> (opens Google Maps)</span>
            </a>
            <button ref={toggleRef} type="button" onClick={() => setOpen(!open)}
              className="-mr-2 grid h-11 w-11 place-items-center rounded-full md:hidden" aria-expanded={open} aria-controls="mobileMenu">
              <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
              <span className="burger" aria-hidden="true"><span /><span /><span /></span>
            </button>
          </div>
        </div>
      </header>

      <div id="mobileMenu" data-lenis-prevent className={`mobile-menu on-dark fixed inset-0 z-40 overflow-y-auto bg-evergreen-night text-blush md:hidden ${open ? 'is-open' : ''}`}>
        <Image src="/brand/logo-mark.png" alt="" width={420} height={420}
          className="spin-slow pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 opacity-[.08]" />
        <nav aria-label="Mobile" className="relative flex min-h-full flex-col px-6 pb-10 pt-28" onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}>
          <p className="caps mb-6 text-xs text-moss">{SITE.tagline}</p>
          <ul className="border-t border-blush/10">
            {LINKS.map((l, i) => (
              <li key={l.href}><a ref={i === 0 ? firstLinkRef : undefined} tabIndex={open ? 0 : -1} className="big display flex items-center justify-between border-b border-blush/10 py-4 text-[1.85rem] leading-none" href={l.href}>{l.label}<span className="text-base text-moss" aria-hidden="true">→</span></a></li>
            ))}
          </ul>
          <div className="mt-auto space-y-4 pt-12">
            <OpenStatus className="flex items-center gap-2 text-sm" />
            <a href={SITE.directions} target="_blank" rel="noopener" tabIndex={open ? 0 : -1} className="flex w-full items-center justify-center gap-2 rounded-full bg-blush px-6 py-4 font-semibold text-evergreen">
              <PinIcon /> Get Directions<span className="sr-only"> (opens Google Maps)</span>
            </a>
            <a href={SITE.phoneHref} tabIndex={open ? 0 : -1} className="flex w-full items-center justify-center rounded-full border border-blush/40 px-6 py-4 font-semibold">Call {SITE.phone}</a>
          </div>
        </nav>
      </div>
    </>
  );
}
