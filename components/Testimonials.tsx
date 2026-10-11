'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';



const RM = '(prefers-reduced-motion: reduce)';
const subscribeRM = (cb: () => void) => { const m = matchMedia(RM); m.addEventListener('change', cb); return () => m.removeEventListener('change', cb); };

export default function Testimonials({ items }: { items: { quote: string; source: string }[] }) {
  const N = items.length;
  const [cur, setCur] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const go = (n: number) => setCur(((n % N) + N) % N);

  const reduce = useSyncExternalStore(subscribeRM, () => matchMedia(RM).matches, () => false);
  const running = !userPaused && !reduce && !hover && !focus;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setCur((c) => (c + 1) % N), 6000);
    return () => clearInterval(id);
  }, [running, N]);

  const arrow = 'grid h-12 w-12 place-items-center rounded-full border border-evergreen/25 text-evergreen transition hover:bg-evergreen hover:text-blush';

  return (
    <div className="reveal relative mt-12" role="region" aria-roledescription="carousel" aria-label="Guest reviews"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={() => setFocus(true)} onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocus(false); }}
      onKeyDown={(e) => { if (e.key === 'ArrowLeft') go(cur - 1); if (e.key === 'ArrowRight') go(cur + 1); }}>
      <div className="car-viewport overflow-hidden"
        onTouchStart={(e) => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={(e) => {
          if (!touch.current) return;
          const dx = e.changedTouches[0].clientX - touch.current.x, dy = e.changedTouches[0].clientY - touch.current.y;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) go(cur + (dx < 0 ? 1 : -1));
          touch.current = null;
        }}>
        <div className="car-track" style={{ transform: `translateX(-${cur * 100}%)` }} aria-live={running ? 'off' : 'polite'}>
          {items.map((t, i) => (
            <figure key={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${N}`} aria-hidden={i !== cur} className="px-2 sm:px-10">
              <svg className="mx-auto h-12 w-12 text-clay" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true"><path d="M20 12C11 14 6 20 6 28v8h14V24h-7c0-5 3-8 8-9zM42 12c-9 2-14 8-14 16v8h14V24h-7c0-5 3-8 8-9z" /></svg>
              <blockquote className="mt-6"><p className="display text-[clamp(1.6rem,4.4vw,2.7rem)] text-evergreen">{t.quote}</p></blockquote>
              <figcaption className="caps mt-6 text-xs text-ink/75">— {t.source}</figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="mt-10 flex items-center justify-center gap-4">
        <button type="button" onClick={() => go(cur - 1)} className={arrow} aria-label="Previous review">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
        <div className="flex items-center gap-1">
          {items.map((_, i) => (
            <button key={i} type="button" onClick={() => go(i)} aria-label={`Show review ${i + 1}`} aria-current={i === cur ? 'true' : undefined} className="grid h-11 w-8 place-items-center">
              <span aria-hidden="true" className="block h-2 rounded-full transition-all duration-500" style={{ width: i === cur ? 28 : 8, background: i === cur ? 'var(--color-clay)' : 'rgb(27 47 43 / .3)' }} />
            </button>
          ))}
        </div>
        <button type="button" onClick={() => go(cur + 1)} className={arrow} aria-label="Next review">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
        </button>
        {!reduce && (
          <button type="button" onClick={() => setUserPaused(!userPaused)} className="ml-2 grid h-12 w-12 place-items-center rounded-full text-evergreen transition hover:bg-evergreen/10"
            aria-label={userPaused ? 'Start automatic rotation' : 'Pause automatic rotation'}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              {userPaused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" />}
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
