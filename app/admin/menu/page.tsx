'use client';

import { useState } from 'react';
import type { CategoryRow, MenuRow } from '@/lib/supabase';
import { Badge, CategoryManager, Drawer, Empty, Field, Icon, ImagePicker, PageHeader, Skeleton, Toggle, btn, input, move, peso, useAdmin, useConfirm, useRows } from '../ui';

type Draft = Omit<MenuRow, 'id' | 'sort' | 'price' | 'tags'> & { id?: string; price: string; tags: string };

export default function MenuPage() {
  const admin = useAdmin();
  const { rows, reload } = useRows<MenuRow>('menu_items');
  const { rows: catRows, reload: reloadCats } = useRows<CategoryRow>('menu_categories');
  const [managing, setManaging] = useState(false);
  const [cat, setCat] = useState<string>('');
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();

  const cats = (catRows ?? []).map((c) => c.name);
  const counts = Object.fromEntries(cats.map((c) => [c, (rows ?? []).filter((r) => r.category === c).length]));
  const active = cats.includes(cat) ? cat : cats[0] ?? '';
  const inCat = (rows ?? []).filter((r) => r.category === active);
  const needle = q.trim().toLowerCase();
  const list = needle ? (rows ?? []).filter((r) => (r.name + ' ' + r.category + ' ' + r.tags.join(' ')).toLowerCase().includes(needle)) : inCat;

  const blank = (): Draft => ({ category: active, name: '', description: '', price: '', tags: '', image_url: '', image_alt: '', signature: false, available: true });
  const edit = (r: MenuRow) => setDraft({ ...r, price: String(r.price), tags: r.tags.join(', ') });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const { id, ...f } = draft;
    const row = { ...f, category: f.category.trim(), name: f.name.trim(), description: f.description.trim(), image_alt: f.image_alt.trim(), price: Number(f.price), tags: f.tags.split(',').map((t) => t.trim()).filter(Boolean) };
    setSaving(true);
    const ok = await admin.save(async () => {
      // only one signature dish at a time
      if (row.signature) {
        const r = await admin.db.from('menu_items').update({ signature: false }).eq('signature', true).neq('id', id ?? '00000000-0000-0000-0000-000000000000');
        if (r.error) return r;
      }
      return id ? admin.db.from('menu_items').update(row).eq('id', id)
        : admin.db.from('menu_items').insert({ ...row, sort: Math.max(-1, ...(rows ?? []).map((r) => r.sort)) + 1 });
    });
    setSaving(false);
    if (ok) { setDraft(null); setCat(row.category); reload(); }
  };

  const remove = async (r: MenuRow) => {
    if (!(await confirm.ask(`Delete “${r.name}”?`, 'It will be removed from the website menu. To hide it only while it’s sold out, switch “Available” off instead.'))) return;
    if (await admin.save(() => admin.db.from('menu_items').delete().eq('id', r.id), 'Item deleted')) reload();
  };
  const setAvail = async (r: MenuRow, available: boolean) => {
    if (await admin.save(() => admin.db.from('menu_items').update({ available }).eq('id', r.id), available ? `${r.name} is back on the menu` : `${r.name} hidden from the menu`)) reload();
  };

  return (
    <>
      <PageHeader title="Menu" desc="Everything on the website menu, grouped by category. Switch an item off when it’s sold out — it comes back with one tap.">
        <button type="button" className={btn.secondary} onClick={() => setManaging(true)}><Icon name="edit" className="h-4 w-4" />Categories</button>
        <button type="button" className={btn.primary} onClick={() => setDraft(blank())}><Icon name="plus" className="h-4 w-4" />Add item</button>
      </PageHeader>

      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="tablist" aria-label="Menu categories" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {cats.map((c) => (
            <button key={c} type="button" role="tab" aria-selected={!needle && c === active} onClick={() => { setCat(c); setQ(''); }}
              className={`flex min-h-10 flex-none items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 transition ${!needle && c === active ? 'bg-evergreen text-white ring-evergreen' : 'bg-white text-ink/75 ring-black/10 hover:text-ink'}`}>
              {c}<span className={`rounded-full px-1.5 text-xs ${!needle && c === active ? 'bg-white/20' : 'bg-black/5'}`}>{counts[c]}</span>
            </button>
          ))}
        </div>
        <label className="relative md:w-64">
          <span className="sr-only">Search menu</span>
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/45" />
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all items…" className={`${input} pl-9`} />
        </label>
      </div>

      {!rows || !catRows ? <Skeleton rows={6} /> : !list.length ? (
        <Empty icon="menu" title={needle ? 'No matches' : 'No menu items yet'} text={needle ? `Nothing matches “${q}”.` : cats.length ? `Nothing in ${active} yet.` : 'Create a category first (e.g. Coffee), then add items to it.'}
          action={!needle && (cats.length
            ? <button type="button" className={btn.primary} onClick={() => setDraft(blank())}><Icon name="plus" className="h-4 w-4" />Add item</button>
            : <button type="button" className={btn.primary} onClick={() => setManaging(true)}><Icon name="plus" className="h-4 w-4" />Add a category</button>)} />
      ) : (
        <ul className="divide-y divide-black/5 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
          {list.map((r, i) => (
            <li key={r.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 p-3 sm:flex-nowrap sm:p-4 ${r.available ? '' : 'bg-stone-50'}`}>
              <button type="button" onClick={() => edit(r)} className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4" aria-label={`Edit ${r.name}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {r.image_url ? <img src={r.image_url} alt="" className={`h-14 w-14 flex-none rounded-lg object-cover ${r.available ? '' : 'opacity-50 grayscale'}`} />
                  : <span className="grid h-14 w-14 flex-none place-items-center rounded-lg bg-stone-100 text-ink/30"><Icon name="menu" /></span>}
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className={`font-semibold ${r.available ? 'text-ink' : 'text-ink/55'}`}>{r.name}</span>
                    {r.signature && <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/25"><Icon name="star" className="h-3 w-3" />Signature</span>}
                    {!r.available && <Badge tone="hidden">Hidden</Badge>}
                  </span>
                  <span className="mt-0.5 block truncate text-sm text-ink/60">{needle && <>{r.category} · </>}{r.tags.join(' · ') || r.description}</span>
                </span>
              </button>
              <span className="w-20 flex-none text-right font-semibold text-clay">{peso(r.price)}</span>
              <span className="flex w-full items-center justify-between sm:w-auto">
                <Toggle checked={r.available} onChange={(v) => setAvail(r, v)} label={`${r.name} available`} hideLabel />
                <span className="flex">
                  {!needle && <>
                    <button type="button" className={btn.icon} disabled={i === 0} onClick={() => move(admin, 'menu_items', inCat, i, -1).then((ok) => { if (ok) reload(); })} aria-label={`Move ${r.name} up`}><Icon name="up" /></button>
                    <button type="button" className={btn.icon} disabled={i === inCat.length - 1} onClick={() => move(admin, 'menu_items', inCat, i, 1).then((ok) => { if (ok) reload(); })} aria-label={`Move ${r.name} down`}><Icon name="down" /></button>
                  </>}
                  <button type="button" className={btn.icon} onClick={() => edit(r)} aria-label={`Edit ${r.name}`}><Icon name="edit" /></button>
                  <button type="button" className={`${btn.icon} hover:!text-red-700`} onClick={() => remove(r)} aria-label={`Delete ${r.name}`}><Icon name="trash" /></button>
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <Drawer open={!!draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit menu item' : 'Add menu item'}
        footer={<>
          <button type="button" className={btn.secondary} onClick={() => setDraft(null)}>Cancel</button>
          <button type="submit" form="menuForm" className={btn.primary} disabled={saving}>{saving ? 'Saving…' : draft?.id ? 'Save changes' : 'Add to menu'}</button>
        </>}>
        {draft && (
          <form id="menuForm" onSubmit={submit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-[1fr_9rem]">
              <Field label="Name" htmlFor="m-name"><input id="m-name" required maxLength={80} className={input} value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
              <Field label="Price (₱)" htmlFor="m-price"><input id="m-price" required type="number" inputMode="decimal" min={0} step="0.01" className={input} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></Field>
            </div>
            <Field label="Category" htmlFor="m-cat">
              <select id="m-cat" required className={input} value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}>
                <option value="" disabled>Choose a category…</option>
                {cats.map((c) => <option key={c}>{c}</option>)}
              </select>
              <button type="button" onClick={() => setManaging(true)} className="mt-1.5 min-h-9 text-sm font-medium text-evergreen underline-offset-4 hover:underline">+ Add or edit categories</button>
            </Field>
            <Field label="Description" htmlFor="m-desc">
              <textarea id="m-desc" rows={3} maxLength={300} className={`${input} py-2`} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <Field label="Tags" htmlFor="m-tags" hint="Separate with commas, e.g. Hot / Iced, Bestseller. “Bestseller” adds a ribbon on the photo.">
              <input id="m-tags" className={input} value={draft.tags} onChange={(e) => setDraft({ ...draft, tags: e.target.value })} />
            </Field>
            <Field label="Photo"><ImagePicker folder="menu" value={draft.image_url} onChange={(image_url) => setDraft({ ...draft, image_url })} /></Field>
            {draft.image_url && (
              <Field label="Describe the photo" htmlFor="m-alt" hint="Read aloud to visitors using screen readers, and helps Google.">
                <input id="m-alt" className={input} value={draft.image_alt} onChange={(e) => setDraft({ ...draft, image_alt: e.target.value })} placeholder="e.g. Iced latte with milk swirling into espresso" />
              </Field>
            )}
            <div className="divide-y divide-black/5 rounded-xl bg-white px-4 ring-1 ring-black/10">
              <div className="py-2"><Toggle checked={draft.available} onChange={(available) => setDraft({ ...draft, available })} label="Available — show on the website" /></div>
              <div className="py-2">
                <Toggle checked={draft.signature} onChange={(signature) => setDraft({ ...draft, signature })} label="House signature" />
                <p className="pb-2 text-[13px] text-ink/60">Featured in the big card above the menu. Only one item can be the signature.</p>
              </div>
            </div>
          </form>
        )}
      </Drawer>
      <CategoryManager table="menu_categories" noun="tabs on the menu" open={managing} onClose={() => setManaging(false)} cats={catRows ?? []} counts={counts} onChange={() => { reloadCats(); reload(); }} />
      {confirm.ui}
    </>
  );
}
