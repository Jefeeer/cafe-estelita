'use client';

import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_CONTENT, mergeContent, type SiteContent } from '@/lib/content';
import { Bone, Field, Icon, ImagePicker, PageHeader, btn, input, useAdmin } from '../ui';

type Key = keyof SiteContent;
const TABS: { id: string; label: string; keys: Key[]; anchor: string; desc: string }[] = [
  { id: 'hero', label: 'Hero', keys: ['hero'], anchor: '#top', desc: 'The first screen visitors see.' },
  { id: 'about', label: 'Our story', keys: ['about'], anchor: '#about', desc: 'Your story, quick facts and the photo collage.' },
  { id: 'experience', label: 'Experience', keys: ['experience'], anchor: '#experience', desc: 'The four highlights under “The experience”.' },
  { id: 'headings', label: 'Menu & gallery titles', keys: ['menu', 'gallery'], anchor: '#menu', desc: 'Headings and short notes above the menu and gallery.' },
  { id: 'reviews', label: 'Reviews', keys: ['reviews'], anchor: '#reviews', desc: 'Guest quotes shown in the reviews slider.' },
  { id: 'contact', label: 'Contact & map', keys: ['visit', 'contact'], anchor: '#visit', desc: 'Address, phone, map and the “Finding us” section.' },
  { id: 'footer', label: 'Footer & Google', keys: ['footer', 'seo'], anchor: '#top', desc: 'Social links, footer text, and how the site appears on Google.' },
];

/* immutable get/set by "a.b.0.c" path */
const getIn = (o: unknown, path: string) => path.split('.').reduce<unknown>((v, k) => (v as Record<string, unknown>)?.[k], o);
function setIn<T>(o: T, [k, ...rest]: string[], v: unknown): T {
  const c = (Array.isArray(o) ? [...o] : { ...o }) as Record<string, unknown>;
  c[k] = rest.length ? setIn(c[k], rest, v) : v;
  return c as T;
}

/** Live preview of *accent* words, same rule as the website. */
const Preview = ({ text }: { text: string }) => (
  <p className="mt-1.5 rounded-md bg-stone-100 px-2.5 py-1.5 text-[13px] text-ink/70">Preview: {text.split(/\*([^*]+)\*/).map((p, i) => (i % 2 ? <span key={i} className="font-semibold text-clay">{p}</span> : p))}</p>
);

const Card = ({ title, children, hint }: { title: string; hint?: string; children: React.ReactNode }) => (
  <section className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-black/5">
    <h2 className="font-semibold">{title}</h2>
    {hint && <p className="mt-0.5 text-sm text-ink/60">{hint}</p>}
    <div className="mt-4 space-y-4">{children}</div>
  </section>
);

export default function ContentPage() {
  const admin = useAdmin();
  const [saved, setSaved] = useState<SiteContent | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [tab, setTab] = useState(TABS[0].id);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data, error } = await admin.db.from('site_content').select('data').eq('id', 1).maybeSingle();
    if (error) admin.toast(`Couldn't load: ${error.message}`, 'err');
    const c = mergeContent(DEFAULT_CONTENT, data?.data);
    setSaved(c); setDraft(c);
  }, [admin]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state is set after the await
  useEffect(() => { load(); }, [load]);

  const dirty = !!draft && JSON.stringify(draft) !== JSON.stringify(saved);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    addEventListener('beforeunload', warn);
    return () => removeEventListener('beforeunload', warn);
  }, [dirty]);

  if (!draft) return (
    <>
      <PageHeader title="Website content" desc="Edit the text, photos and contact details on every section of the website." />
      <div aria-busy="true" className="space-y-4"><Bone className="h-10 w-full max-w-3xl rounded-full" /><Bone className="h-64 rounded-xl" /><Bone className="h-48 rounded-xl" /></div>
    </>
  );

  const set = (path: string, v: unknown) => setDraft((d) => setIn(d!, path.split('.'), v));
  const str = (path: string) => (getIn(draft, path) as string) ?? '';
  const current = TABS.find((t) => t.id === tab)!;

  /* field helpers bound to the draft */
  const Text = ({ label, path, hint, rows, accent, max }: { label: string; path: string; hint?: string; rows?: number; accent?: boolean; max?: number }) => {
    const id = 'f-' + path;
    return (
      <Field label={label} htmlFor={id} hint={accent ? 'Wrap words in *asterisks* to show them in the accent color.' : hint}>
        {rows
          ? <textarea id={id} rows={rows} maxLength={max} className={`${input} py-2`} value={str(path)} onChange={(e) => set(path, e.target.value)} />
          : <input id={id} maxLength={max} className={input} value={str(path)} onChange={(e) => set(path, e.target.value)} />}
        {accent && <Preview text={str(path)} />}
      </Field>
    );
  };
  const Photo = ({ label, path }: { label: string; path: string }) => (
    <div className="grid gap-3 sm:grid-cols-[auto_1fr] sm:items-start">
      <Field label={label}><ImagePicker folder="site" value={str(path + '.src')} onChange={(v) => set(path + '.src', v)} /></Field>
      <Field label="Describe the photo" htmlFor={'f-' + path + '.alt'} hint="Read aloud for visitors using screen readers.">
        <input id={'f-' + path + '.alt'} className={input} value={str(path + '.alt')} onChange={(e) => set(path + '.alt', e.target.value)} />
      </Field>
    </div>
  );
  const ListButtons = ({ list, i, path, label }: { list: unknown[]; i: number; path: string; label: string }) => {
    const swap = (j: number) => { const n = [...list]; [n[i], n[j]] = [n[j], n[i]]; set(path, n); };
    return (
      <span className="flex flex-none">
        <button type="button" className={btn.icon} disabled={i === 0} onClick={() => swap(i - 1)} aria-label={`Move ${label} up`}><Icon name="up" /></button>
        <button type="button" className={btn.icon} disabled={i === list.length - 1} onClick={() => swap(i + 1)} aria-label={`Move ${label} down`}><Icon name="down" /></button>
        <button type="button" className={`${btn.icon} hover:!text-red-700`} disabled={list.length === 1} onClick={() => set(path, list.filter((_, k) => k !== i))} aria-label={`Remove ${label}`}><Icon name="trash" /></button>
      </span>
    );
  };

  const save = async () => {
    setSaving(true);
    if (await admin.save(() => admin.db.from('site_content').upsert({ id: 1, data: draft }), 'Website content saved — the website is updated')) setSaved(draft);
    setSaving(false);
  };
  const discard = async () => {
    if (await admin.confirm({ title: 'Discard your changes?', text: 'Every unsaved edit on this page will be undone.', action: 'Discard changes', cancel: 'Keep editing' })) setDraft(saved);
  };
  const restore = async () => {
    if (!(await admin.confirm({ title: `Restore “${current.label}” to the original text?`, text: 'This replaces the fields in this tab with the original website text and photos. Nothing is saved until you press Save.', action: 'Restore originals', tone: 'neutral' }))) return;
    let d = draft;
    for (const k of current.keys) d = setIn(d, [k], DEFAULT_CONTENT[k]);
    setDraft(d);
  };

  const paragraphs = draft.about.paragraphs;
  const reviews = draft.reviews.items;

  return (
    <>
      <PageHeader title="Website content" desc="Edit the text, photos and contact details on every section of the website. Design and colors stay as they are.">
        <a href={'/' + current.anchor} target="_blank" rel="noopener" className={btn.secondary}><Icon name="ext" className="h-4 w-4" />View section<span className="sr-only"> on the website (opens in new tab)</span></a>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[13rem_1fr]">
        <nav aria-label="Website sections" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
          <ul className="flex gap-2 lg:sticky lg:top-6 lg:flex-col lg:gap-1">
            {TABS.map((t) => (
              <li key={t.id} className="flex-none">
                <button type="button" onClick={() => setTab(t.id)} aria-current={tab === t.id ? 'true' : undefined}
                  className={`flex min-h-10 w-full items-center rounded-full px-4 text-left text-sm font-semibold ring-1 transition lg:rounded-lg lg:ring-0 ${tab === t.id ? 'bg-evergreen text-white ring-evergreen' : 'bg-white text-ink/75 ring-black/10 hover:text-ink lg:bg-transparent lg:hover:bg-black/5'}`}>
                  {t.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-5 pb-24">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink/65">{current.desc}</p>
            <button type="button" onClick={restore} className="min-h-9 text-sm font-medium text-ink/60 underline-offset-4 hover:text-ink hover:underline">Restore original text</button>
          </div>

          {tab === 'hero' && <>
            <Card title="Text">
              {Text({ label: 'Small line above the headline', path: 'hero.tagline', max: 60 })}
              {Text({ label: 'Headline', path: 'hero.title', accent: true, max: 120 })}
              {Text({ label: 'Subtext', path: 'hero.subtitle', rows: 2, max: 200 })}
              <div className="grid gap-4 sm:grid-cols-2">
                {Text({ label: 'Menu button', path: 'hero.ctaMenu', max: 24 })}
                {Text({ label: 'Visit button', path: 'hero.ctaVisit', max: 24 })}
              </div>
            </Card>
            <Card title="Background photo" hint="A wide, landscape photo works best. Text sits on top, so darker photos read better.">{Photo({ label: 'Photo', path: 'hero.image' })}</Card>
          </>}

          {tab === 'about' && <>
            <Card title="Heading">
              {Text({ label: 'Small label', path: 'about.eyebrow', max: 40 })}
              {Text({ label: 'Title', path: 'about.title', accent: true, max: 120 })}
            </Card>
            <Card title="Story" hint="One box per paragraph.">
              {paragraphs.map((p, i) => (
                <div key={i} className="flex items-start gap-2">
                  <label className="sr-only" htmlFor={'para-' + i}>Paragraph {i + 1}</label>
                  <textarea id={'para-' + i} rows={3} className={`${input} py-2`} value={p} onChange={(e) => set(`about.paragraphs.${i}`, e.target.value)} />
                  {ListButtons({ list: paragraphs, i, path: 'about.paragraphs', label: `paragraph ${i + 1}` })}
                </div>
              ))}
              <button type="button" className={btn.secondary} onClick={() => set('about.paragraphs', [...paragraphs, ''])}><Icon name="plus" className="h-4 w-4" />Add paragraph</button>
            </Card>
            <Card title="Quick facts" hint="Shown under the story. A third fact, “Doors open”, updates from your opening hours.">
              {[0, 1].map((i) => (
                <div key={i} className="grid gap-4 sm:grid-cols-2">
                  {Text({ label: `Fact ${i + 1} label`, path: `about.facts.${i}.k`, max: 24 })}
                  {Text({ label: `Fact ${i + 1} value`, path: `about.facts.${i}.v`, max: 30 })}
                </div>
              ))}
            </Card>
            <Card title="Photo collage">
              {Photo({ label: 'Large photo (arch)', path: 'about.main' })}
              {Photo({ label: 'Small photo', path: 'about.side' })}
              {Photo({ label: 'Polaroid photo', path: 'about.polaroid' })}
              {Text({ label: 'Polaroid caption', path: 'about.caption', max: 40 })}
            </Card>
          </>}

          {tab === 'experience' && <>
            <Card title="Heading">
              {Text({ label: 'Small label', path: 'experience.eyebrow', max: 40 })}
              {Text({ label: 'Title', path: 'experience.title', accent: true, max: 120 })}
            </Card>
            {draft.experience.items.map((_, i) => (
              <Card key={i} title={`Highlight ${i + 1}`} hint={['Garden icon', 'Laptop icon', 'Music icon', 'Home icon'][i]}>
                {Text({ label: 'Title', path: `experience.items.${i}.title`, max: 40 })}
                {Text({ label: 'Description', path: `experience.items.${i}.text`, rows: 2, max: 200 })}
              </Card>
            ))}
          </>}

          {tab === 'headings' && <>
            <Card title="Menu section">
              {Text({ label: 'Small label', path: 'menu.eyebrow', max: 40 })}
              {Text({ label: 'Title', path: 'menu.title', accent: true, max: 120 })}
              {Text({ label: 'Intro text', path: 'menu.intro', rows: 2, max: 200 })}
              {Text({ label: 'Note under the menu', path: 'menu.note', max: 120 })}
            </Card>
            <Card title="Gallery section">
              {Text({ label: 'Small label', path: 'gallery.eyebrow', max: 40 })}
              {Text({ label: 'Title', path: 'gallery.title', accent: true, max: 120 })}
            </Card>
          </>}

          {tab === 'reviews' && <>
            <Card title="Heading">
              {Text({ label: 'Small label', path: 'reviews.eyebrow', max: 40 })}
              {Text({ label: 'Title', path: 'reviews.title', accent: true, max: 120 })}
            </Card>
            <Card title="Guest quotes" hint="Shown one at a time, in this order.">
              {reviews.map((r, i) => (
                <div key={i} className="flex items-start gap-2 rounded-lg bg-stone-50 p-3 ring-1 ring-black/5">
                  <div className="min-w-0 flex-1 space-y-3">
                    {Text({ label: `Quote ${i + 1}`, path: `reviews.items.${i}.quote`, rows: 2, max: 300 })}
                    {Text({ label: 'From', path: `reviews.items.${i}.source`, hint: 'e.g. “Guest review” or “Anna, Google review”', max: 60 })}
                  </div>
                  {ListButtons({ list: reviews, i, path: 'reviews.items', label: `quote ${i + 1}` })}
                </div>
              ))}
              <button type="button" className={btn.secondary} onClick={() => set('reviews.items', [...reviews, { quote: '', source: 'Guest review' }])}><Icon name="plus" className="h-4 w-4" />Add quote</button>
            </Card>
          </>}

          {tab === 'contact' && <>
            <Card title="Contact details" hint="Used in the at-a-glance strip, the Visit section, the Call buttons and Google.">
              {Text({ label: 'Phone number', path: 'contact.phone', hint: 'e.g. 0906 508 1467 — the Call buttons dial this number.', max: 30 })}
              <div className="grid gap-4 sm:grid-cols-2">
                {Text({ label: 'Address line 1', path: 'contact.addressLine1', max: 80 })}
                {Text({ label: 'Address line 2', path: 'contact.addressLine2', max: 80 })}
              </div>
              {Text({ label: 'Short location', path: 'contact.shortLocation', hint: 'Shown in the strip under the hero, e.g. “Summerwind Dr, Burol Main”.', max: 40 })}
              <div className="grid gap-4 sm:grid-cols-2">
                {Text({ label: 'Plus code', path: 'contact.plusCode', hint: 'From Google Maps; visitors can copy it.', max: 60 })}
                {Text({ label: 'Price range per person', path: 'contact.priceRange', max: 30 })}
              </div>
              <Field label="Services" htmlFor="f-services" hint="Separate with commas, e.g. Dine-in, Curbside pickup, Delivery.">
                <input id="f-services" className={input} value={draft.contact.services.join(',')} onChange={(e) => set('contact.services', e.target.value.split(','))} />
              </Field>
            </Card>
            <Card title="Map" hint="What Google Maps should search for. The map and the Directions buttons both use it.">
              {Text({ label: 'Map search', path: 'contact.mapQuery', max: 120 })}
              <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(draft.contact.mapQuery)}`} target="_blank" rel="noopener" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-evergreen underline-offset-4 hover:underline">
                <Icon name="ext" className="h-4 w-4" />Check it on Google Maps<span className="sr-only"> (opens in new tab)</span>
              </a>
            </Card>
            <Card title="“Finding us” section">
              {Text({ label: 'Small label', path: 'visit.eyebrow', max: 40 })}
              {Text({ label: 'Title', path: 'visit.title', accent: true, max: 120 })}
              {Text({ label: 'Tip for finding the cafe', path: 'visit.tip', rows: 2, max: 200 })}
            </Card>
          </>}

          {tab === 'footer' && <>
            <Card title="Footer & social">
              {Text({ label: 'Footer text', path: 'footer.blurb', rows: 2, max: 200 })}
              {Text({ label: 'Facebook page link', path: 'footer.facebook', max: 300 })}
              {Text({ label: 'Instagram profile link', path: 'footer.instagram', max: 300 })}
            </Card>
            <Card title="Google & link previews" hint="How the website appears in Google results and when the link is shared on Messenger or Facebook.">
              {Text({ label: 'Page title', path: 'seo.title', hint: `${draft.seo.title.length}/60 characters — Google shows about 60.`, max: 90 })}
              {Text({ label: 'Description', path: 'seo.description', rows: 3, hint: `${draft.seo.description.length}/160 characters — Google shows about 160.`, max: 300 })}
              <div className="rounded-lg bg-stone-50 p-3 ring-1 ring-black/5" aria-label="Google preview">
                <p className="truncate text-[15px] text-[#1a0dab]">{draft.seo.title}</p>
                <p className="text-xs text-emerald-800">casa-estelita.vercel.app</p>
                <p className="line-clamp-2 text-[13px] text-ink/70">{draft.seo.description}</p>
              </div>
            </Card>
          </>}
        </div>
      </div>

      {/* Save bar: always reachable, shows when something changed */}
      <div className={`fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 border-t border-black/10 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgb(0_0_0/.2)] backdrop-blur transition lg:bottom-0 lg:left-64 ${dirty ? '' : 'pointer-events-none translate-y-4 opacity-0'}`} aria-hidden={!dirty}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 lg:px-6">
          <p className="flex items-center gap-2 text-sm font-medium text-amber-800"><Icon name="alert" className="h-4 w-4" />Unsaved changes</p>
          <div className="flex gap-2">
            <button type="button" className={btn.secondary} onClick={discard} tabIndex={dirty ? 0 : -1}>Discard</button>
            <button type="button" className={btn.primary} onClick={save} disabled={saving} tabIndex={dirty ? 0 : -1}>{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        </div>
      </div>
    </>
  );
}
