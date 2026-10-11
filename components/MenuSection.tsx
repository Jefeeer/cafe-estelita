'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import type { MenuItem } from '@/lib/content';
import type { Deal } from '@/lib/supabase';

const peso = (n: number) => '₱' + n.toLocaleString('en-PH');
const until = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric' });

function DealCard({ d, i }: { d: Deal; i: number }) {
  const save = d.original_price && d.original_price > d.price ? d.original_price - d.price : 0;
  return (
    <article className="reveal lift grid overflow-hidden rounded-[1.75rem] bg-ivory shadow-soft ring-1 ring-evergreen/5 sm:grid-cols-[0.9fr_1.1fr]" style={{ ['--rd' as string]: `${i * 0.1}s` }}>
      <div className="zoom relative min-h-[200px] overflow-hidden bg-blush-deep">
        {d.image_url
          ? <Image src={d.image_url} alt="" fill sizes="(min-width:1024px) 22vw, (min-width:640px) 40vw, 92vw" className="object-cover" />
          : <Image src="/brand/logo-mark.png" alt="" width={120} height={120} className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-70" />}
        {d.badge && <span className="absolute left-3 top-3 rounded-full bg-clay px-3 py-1 text-xs font-semibold text-white shadow-soft">{d.badge}</span>}
      </div>
      {/* perforated edge, like a coupon */}
      <div className="relative flex flex-col gap-3 border-t-2 border-dashed border-evergreen/15 p-6 sm:border-l-2 sm:border-t-0">
        <h4 className="display text-2xl text-evergreen">{d.title}</h4>
        {d.description && <p className="leading-relaxed text-ink/80">{d.description}</p>}
        {!!d.includes.length && (
          <ul className="space-y-1 text-[.95rem] text-ink/85">
            {d.includes.map((x) => (
              <li key={x} className="flex gap-2"><svg className="mt-1 h-4 w-4 flex-none text-moss" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>{x}</li>
            ))}
          </ul>
        )}
        <div className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 pt-2">
          <p className="display text-3xl text-clay">{peso(d.price)}</p>
          {save > 0 && <><p className="text-ink/60 line-through"><span className="sr-only">Regular price </span>{peso(d.original_price!)}</p>
            <p className="rounded-full bg-fern/35 px-2.5 py-0.5 text-xs font-semibold text-evergreen">Save {peso(save)}</p></>}
        </div>
        {d.ends_on && <p className="text-sm text-ink/70">Available until {until(d.ends_on)}</p>}
      </div>
    </article>
  );
}

function Card({ it, i }: { it: MenuItem; i: number }) {
  return (
    <article className="lift group panel-in overflow-hidden rounded-[1.75rem] bg-ivory shadow-soft ring-1 ring-evergreen/5" style={{ animationDelay: `${i * 60}ms` }}>
      <div className="zoom relative aspect-[4/3] overflow-hidden">
        {it.img
          ? <Image src={it.img} alt={it.alt} fill sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 92vw" className="object-cover" />
          : <div className="absolute inset-0 grid place-items-center bg-blush-deep"><Image src="/brand/logo-mark.png" alt="" width={96} height={96} className="h-20 w-20 rounded-full opacity-70" /></div>}
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

export default function MenuSection({ menu, deals }: { menu: Record<string, MenuItem[]>; deals: Deal[] }) {
  const cats = Object.keys(menu);
  const sig = Object.values(menu).flat().find((i) => i.signature);
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
      {!!deals.length && (
        <section aria-labelledby="dealsTitle" className="mt-14">
          <h3 id="dealsTitle" className="reveal display text-[clamp(1.6rem,3.5vw,2.2rem)] text-evergreen">Deals &amp; bundles <span className="text-clay">this season</span></h3>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {deals.map((d, i) => <DealCard key={d.id} d={d} i={i} />)}
          </div>
        </section>
      )}

      {sig && (
        <article className="reveal on-dark mt-14 grid overflow-hidden rounded-[2.25rem] bg-evergreen text-blush shadow-lift md:grid-cols-[1.15fr_1fr]">
          <div className="zoom relative min-h-[280px] overflow-hidden sm:min-h-[380px]">
            {sig.img && <Image src={sig.img} alt={sig.alt} fill sizes="(min-width:768px) 55vw, 100vw" className="object-cover" />}
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
        {menu[cats[sel]]?.map((it, i) => <Card key={cats[sel] + it.name} it={it} i={i} />)}
      </div>
    </>
  );
}
