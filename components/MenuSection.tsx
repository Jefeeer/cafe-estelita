'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import { MENU, type MenuItem } from '@/lib/content';

const peso = (n: number) => '₱' + n.toLocaleString('en-PH');
const cats = Object.keys(MENU);
const sig = Object.values(MENU).flat().find((i) => i.signature);

function Card({ it, i }: { it: MenuItem; i: number }) {
  return (
    <article className="lift group panel-in overflow-hidden rounded-[1.75rem] bg-ivory shadow-soft ring-1 ring-evergreen/5" style={{ animationDelay: `${i * 60}ms` }}>
      <div className="zoom relative aspect-[4/3] overflow-hidden">
        <Image src={it.img} alt={it.alt} fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 92vw" className="object-cover" />
        {it.tags?.includes('Bestseller') && (
          <span className="absolute left-3 top-3 rounded-full bg-clay px-3 py-1 text-xs font-semibold text-white shadow-soft">Bestseller</span>
        )}
      </div>
      <div className="p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="display text-xl text-evergreen">{it.name}</h3>
          <p className="flex-none text-lg font-semibold text-clay">{peso(it.price)}</p>
        </div>
        <p className="mt-2 text-[.95rem] leading-relaxed text-ink/80">{it.desc}</p>
        {!!it.tags?.length && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {it.tags.filter((t) => t !== 'Bestseller').map((t) => (
              <li key={t} className="rounded-full bg-fern/35 px-2.5 py-0.5 text-xs font-medium text-evergreen">{t}</li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}

export default function MenuSection() {
  const [sel, setSel] = useState(0);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);

  const onKey = (e: React.KeyboardEvent) => {
    const next = ({ ArrowRight: sel + 1, ArrowLeft: sel - 1, Home: 0, End: cats.length - 1 } as Record<string, number>)[e.key];
    if (next === undefined) return;
    e.preventDefault();
    const n = (next + cats.length) % cats.length;
    setSel(n);
    tabs.current[n]?.focus();
  };

  return (
    <>
      {sig && (
        <article className="reveal on-dark mt-14 grid overflow-hidden rounded-[2.25rem] bg-evergreen text-blush shadow-lift md:grid-cols-[1.15fr_1fr]">
          <div className="zoom relative min-h-[280px] overflow-hidden sm:min-h-[380px]">
            <Image src={sig.img} alt={sig.alt} fill sizes="(min-width:768px) 55vw, 100vw" className="object-cover" />
          </div>
          <div className="relative flex flex-col justify-center gap-5 overflow-hidden p-8 sm:p-12">
            <Image src="/brand/logo-mark.png" alt="" width={260} height={260} className="spin-slow pointer-events-none absolute -right-16 -top-16 h-56 w-56 opacity-10" />
            <p className="caps w-max rounded-full bg-blush px-3 py-1.5 text-[.7rem] text-clay">House signature</p>
            <h3 className="display text-4xl sm:text-5xl">{sig.name}</h3>
            <p className="text-lg leading-relaxed text-blush/90">{sig.desc}</p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <p className="display mr-2 text-4xl text-mint">{peso(sig.price)}</p>
              {sig.tags?.map((t) => <span key={t} className="rounded-full border border-blush/30 px-3 py-1 text-sm">{t}</span>)}
            </div>
          </div>
        </article>
      )}

      <div role="tablist" aria-label="Menu categories" onKeyDown={onKey}
        className="mt-16 flex flex-wrap gap-2 sm:w-max sm:rounded-full sm:border sm:border-evergreen/15 sm:bg-blush-deep/60 sm:p-1.5">
        {cats.map((c, i) => (
          <button key={c} ref={(el) => { tabs.current[i] = el; }} type="button" role="tab" id={`tab-${i}`}
            aria-controls="menuPanel" aria-selected={sel === i} tabIndex={sel === i ? 0 : -1} onClick={() => setSel(i)}
            className="pill whitespace-nowrap rounded-full border border-evergreen/20 px-5 py-2.5 text-sm font-semibold text-evergreen hover:bg-evergreen/10 sm:border-transparent">
            {c}
          </button>
        ))}
      </div>
      <div id="menuPanel" role="tabpanel" aria-labelledby={`tab-${sel}`} tabIndex={0} className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {MENU[cats[sel]].map((it, i) => <Card key={cats[sel] + it.name} it={it} i={i} />)}
      </div>
    </>
  );
}
