'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import type { Photo } from '@/lib/content';
import { setScrollLock } from './SmoothScroll';


export default function Gallery({ photos, cats }: { photos: Photo[]; cats: string[] }) {
  const [filter, setFilter] = useState('All');
  const [pos, setPos] = useState(0);
  const dlg = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const swipeX = useRef<number | null>(null);

  const list = photos.map((g, i) => ({ ...g, i })).filter((g) => filter === 'All' || g.cat === filter);
  const cur = list[pos];
  const step = (d: number) => setPos((p) => (p + d + list.length) % list.length);

  const openAt = (k: number, btn: HTMLButtonElement) => {
    opener.current = btn;
    setPos(k);
    dlg.current?.showModal();
    setScrollLock('lightbox');
  };

  useEffect(() => {
    const d = dlg.current!;
    const onClose = () => { setScrollLock(); opener.current?.focus(); };
    d.addEventListener('close', onClose);
    return () => d.removeEventListener('close', onClose);
  }, []);

  return (
    <>
      <div role="group" aria-label="Filter photos" className="flex flex-wrap gap-2">
        {['All', ...cats].map((f) => (
          <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)}
            className="pill rounded-full border border-evergreen/25 px-4 py-2 text-sm font-semibold text-evergreen hover:bg-evergreen/10">
            {f}
          </button>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">{`Showing ${list.length} ${filter === 'All' ? '' : filter.toLowerCase() + ' '}photos`}</p>

      <div className="masonry mt-12">
        {list.map((g, k) => (
          <figure key={g.i} className="panel-in" style={{ animationDelay: `${(k % 4) * 60}ms` }}>
            <button type="button" onClick={(e) => openAt(k, e.currentTarget)} className="zoom group relative block w-full overflow-hidden rounded-[1.25rem] shadow-soft">
              <Image src={g.src} alt={g.alt} width={g.w} height={g.h} sizes="(min-width:1200px) 24vw, (min-width:768px) 32vw, 48vw" className="block h-auto w-full" />
              <span aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-evergreen-night/80 to-transparent p-4 text-sm text-blush opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="caps text-[.7rem]">{g.cat}</span>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
              </span>
              <span className="sr-only">Open larger: {g.alt}</span>
            </button>
          </figure>
        ))}
      </div>

      <dialog ref={dlg} data-lenis-prevent className="lightbox on-dark" aria-label="Photo viewer"
        onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); step(-1); } if (e.key === 'ArrowRight') { e.preventDefault(); step(1); } }}
        onClick={(e) => { if (e.target === e.currentTarget || e.target === e.currentTarget.firstElementChild) dlg.current?.close(); }}
        onPointerDown={(e) => { swipeX.current = e.clientX; }}
        onPointerUp={(e) => { if (swipeX.current !== null && Math.abs(e.clientX - swipeX.current) > 50) step(e.clientX < swipeX.current ? 1 : -1); swipeX.current = null; }}>
        <div className="flex h-full w-full flex-col items-center justify-center p-4 sm:p-10">
          {cur && (
            <figure className="flex max-h-full w-full max-w-5xl flex-col items-center">
              <Image key={cur.i} src={cur.src} alt={cur.alt} width={cur.w} height={cur.h} sizes="90vw"
                className="panel-in max-h-[76dvh] w-auto rounded-2xl object-contain shadow-lift" />
              <figcaption className="mt-4 text-center text-blush/90">
                {cur.alt} <span className="ml-2 text-sm text-mint">{pos + 1} / {list.length}</span>
              </figcaption>
            </figure>
          )}
          <button type="button" autoFocus onClick={() => dlg.current?.close()} aria-label="Close photo viewer"
            className="absolute right-4 top-4 grid h-12 w-12 place-items-center rounded-full bg-blush/10 transition hover:bg-blush/20">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
          <button type="button" onClick={() => step(-1)} aria-label="Previous photo"
            className="absolute left-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-blush/10 transition hover:bg-blush/20 sm:left-6">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
          </button>
          <button type="button" onClick={() => step(1)} aria-label="Next photo"
            className="absolute right-3 top-1/2 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-blush/10 transition hover:bg-blush/20 sm:right-6">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </div>
      </dialog>
    </>
  );
}
