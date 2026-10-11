'use client';

import { useState } from 'react';
import { dealState, manilaToday, type Deal, type DealState } from '@/lib/supabase';
import { Badge, Drawer, Empty, Field, Icon, ImagePicker, PageHeader, ChipsSkeleton, ListSkeleton, Toggle, btn, fmtDate, input, move, peso, useAdmin, useRows } from '../ui';

const STATES: { key: DealState | 'all'; label: string }[] = [
  { key: 'all', label: 'All' }, { key: 'live', label: 'Live' }, { key: 'scheduled', label: 'Scheduled' }, { key: 'paused', label: 'Paused' }, { key: 'ended', label: 'Ended' },
];
const STATE_LABEL: Record<DealState, string> = { live: 'Live on website', scheduled: 'Scheduled', paused: 'Paused', ended: 'Ended' };

type Draft = Omit<Deal, 'id' | 'sort' | 'includes' | 'price' | 'original_price'> & { id?: string; includes: string; price: string; original_price: string };
const blank = (): Draft => ({ title: '', description: '', includes: '', price: '', original_price: '', badge: '', image_url: '', starts_on: manilaToday(), ends_on: null, active: true });

const addMonths = (from: string, n: number) => {
  const d = new Date(from + 'T00:00:00');
  d.setMonth(d.getMonth() + n);
  return d.toLocaleDateString('en-CA');
};

export default function DealsPage() {
  const admin = useAdmin();
  const { rows, reload } = useRows<Deal>('deals');
  const [filter, setFilter] = useState<DealState | 'all'>('all');
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const today = manilaToday();
  const list = (rows ?? []).filter((d) => filter === 'all' || dealState(d, today) === filter);
  const count = (k: DealState | 'all') => (rows ?? []).filter((d) => k === 'all' || dealState(d, today) === k).length;

  const edit = (d: Deal) => setDraft({ ...d, includes: d.includes.join('\n'), price: String(d.price), original_price: d.original_price == null ? '' : String(d.original_price) });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const { id, ...f } = draft;
    const row = {
      ...f,
      title: f.title.trim(), badge: f.badge.trim(), description: f.description.trim(),
      includes: f.includes.split('\n').map((s) => s.trim()).filter(Boolean),
      price: Number(f.price), original_price: f.original_price === '' ? null : Number(f.original_price),
      starts_on: f.starts_on || null, ends_on: f.ends_on || null,
    };
    setSaving(true);
    const ok = await admin.save(() => id
      ? admin.db.from('deals').update(row).eq('id', id)
      : admin.db.from('deals').insert({ ...row, sort: Math.max(-1, ...(rows ?? []).map((r) => r.sort)) + 1 }));
    setSaving(false);
    if (ok) { setDraft(null); reload(); }
  };

  const remove = async (d: Deal) => {
    if (!(await admin.confirm({ title: `Delete “${d.title}”?`, text: 'It will be removed from the website right away. This can’t be undone — to hide it for now, switch it off instead.', action: 'Delete deal' }))) return;
    if (await admin.save(() => admin.db.from('deals').delete().eq('id', d.id), 'Deal deleted')) reload();
  };
  const setActive = async (d: Deal, active: boolean) => {
    if (await admin.save(() => admin.db.from('deals').update({ active }).eq('id', d.id), active ? 'Deal switched on' : 'Deal paused — hidden from the website')) reload();
  };

  const st = draft && dealState({ active: draft.active, starts_on: draft.starts_on, ends_on: draft.ends_on }, today);
  const save = draft && Number(draft.original_price) > Number(draft.price) ? Number(draft.original_price) - Number(draft.price) : 0;

  return (
    <>
      <PageHeader title="Deals & Bundles" desc="Promos shown at the top of the menu on the website. Set an end date and they disappear on their own — no need to remember to take them down.">
        <button type="button" className={btn.primary} onClick={() => setDraft(blank())}><Icon name="plus" className="h-4 w-4" />New deal</button>
      </PageHeader>

      {!rows ? <ChipsSkeleton n={5} /> : <div role="group" aria-label="Filter deals" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {STATES.map((s) => (
          <button key={s.key} type="button" aria-pressed={filter === s.key} onClick={() => setFilter(s.key)}
            className={`flex min-h-10 flex-none items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 transition ${filter === s.key ? 'bg-evergreen text-white ring-evergreen' : 'bg-white text-ink/75 ring-black/10 hover:text-ink'}`}>
            {s.label}<span className={`rounded-full px-1.5 text-xs ${filter === s.key ? 'bg-white/20' : 'bg-black/5'}`}>{count(s.key)}</span>
          </button>
        ))}
      </div>}

      {!rows ? <ListSkeleton rows={3} /> : !list.length ? (
        <Empty icon="tag" title={filter === 'all' ? 'No deals yet' : `No ${filter} deals`}
          text={filter === 'all' ? 'Create your first bundle — for example “Merienda for Two”.' : 'Deals show up here based on their dates and on/off switch.'}
          action={filter === 'all' && <button type="button" className={btn.primary} onClick={() => setDraft(blank())}><Icon name="plus" className="h-4 w-4" />New deal</button>} />
      ) : (
        <ul className="space-y-3">
          {list.map((d) => {
            const s = dealState(d, today);
            const i = (rows ?? []).indexOf(d);
            return (
              <li key={d.id} className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 sm:flex-row sm:items-center">
                <button type="button" onClick={() => edit(d)} className="flex min-w-0 flex-1 items-center gap-4 text-left" aria-label={`Edit ${d.title}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {d.image_url ? <img src={d.image_url} alt="" className="h-16 w-20 flex-none rounded-lg object-cover" />
                    : <span className="grid h-16 w-20 flex-none place-items-center rounded-lg bg-stone-100 text-ink/30"><Icon name="tag" /></span>}
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-ink">{d.title}</span>
                      <Badge tone={s}>{STATE_LABEL[s]}</Badge>
                    </span>
                    <span className="mt-1 block text-sm text-ink/65">
                      <span className="font-semibold text-clay">{peso(d.price)}</span>
                      {d.original_price != null && d.original_price > d.price && <span className="ml-1.5 line-through">{peso(d.original_price)}</span>}
                      <span className="mx-1.5" aria-hidden="true">·</span>
                      {d.starts_on || d.ends_on ? `${d.starts_on ? fmtDate(d.starts_on) : 'Now'} – ${d.ends_on ? fmtDate(d.ends_on) : 'no end date'}` : 'No dates set'}
                    </span>
                  </span>
                </button>
                <div className="flex items-center justify-between gap-1 border-t border-black/5 pt-3 sm:border-0 sm:pt-0">
                  <Toggle checked={d.active} onChange={(v) => setActive(d, v)} label={d.active ? 'On' : 'Off'} />
                  <span className="flex">
                    <button type="button" className={btn.icon} disabled={i === 0} onClick={() => move(admin, 'deals', rows!, i, -1).then((ok) => { if (ok) reload(); })} aria-label={`Move ${d.title} up`}><Icon name="up" /></button>
                    <button type="button" className={btn.icon} disabled={i === rows!.length - 1} onClick={() => move(admin, 'deals', rows!, i, 1).then((ok) => { if (ok) reload(); })} aria-label={`Move ${d.title} down`}><Icon name="down" /></button>
                    <button type="button" className={btn.icon} onClick={() => edit(d)} aria-label={`Edit ${d.title}`}><Icon name="edit" /></button>
                    <button type="button" className={`${btn.icon} hover:!text-red-700`} onClick={() => remove(d)} aria-label={`Delete ${d.title}`}><Icon name="trash" /></button>
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Drawer open={!!draft} value={draft} onClose={() => setDraft(null)} title={draft?.id ? 'Edit deal' : 'New deal'}
        footer={<>
          <button type="button" className={btn.secondary} data-close>Cancel</button>
          <button type="submit" form="dealForm" className={btn.primary} disabled={saving}>{saving ? 'Saving…' : draft?.id ? 'Save changes' : 'Create deal'}</button>
        </>}>
        {draft && (
          <form id="dealForm" onSubmit={submit} className="space-y-5">
            <Field label="Deal name" htmlFor="d-title"><input id="d-title" required maxLength={80} className={input} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Merienda for Two" /></Field>
            <Field label="Short description" htmlFor="d-desc" hint="One or two sentences.">
              <textarea id="d-desc" rows={2} maxLength={400} className={`${input} py-2`} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
            </Field>
            <Field label="What’s included" htmlFor="d-inc" hint="One item per line.">
              <textarea id="d-inc" rows={3} className={`${input} py-2`} value={draft.includes} onChange={(e) => setDraft({ ...draft, includes: e.target.value })} placeholder={'2 Spanish Lattes\n2 pastries of your choice'} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Deal price (₱)" htmlFor="d-price"><input id="d-price" required type="number" inputMode="decimal" min={0} step="0.01" className={input} value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} /></Field>
              <Field label="Regular price (₱)" htmlFor="d-orig" hint={save ? `Shows “Save ${peso(save)}”` : 'Optional — shows the savings'}>
                <input id="d-orig" type="number" inputMode="decimal" min={0} step="0.01" className={input} value={draft.original_price} onChange={(e) => setDraft({ ...draft, original_price: e.target.value })} />
              </Field>
            </div>
            <Field label="Label" htmlFor="d-badge" hint="Optional tag on the photo, e.g. “Bestseller” or “Weekends only”.">
              <input id="d-badge" maxLength={30} list="badges" className={input} value={draft.badge} onChange={(e) => setDraft({ ...draft, badge: e.target.value })} />
              <datalist id="badges"><option value="Bestseller" /><option value="New" /><option value="Limited time" /><option value="Good for sharing" /><option value="Weekends only" /></datalist>
            </Field>

            <fieldset className="rounded-xl bg-white p-4 ring-1 ring-black/10">
              <legend className="px-1 text-sm font-semibold">When it runs</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Starts" htmlFor="d-start"><input id="d-start" type="date" className={input} value={draft.starts_on ?? ''} onChange={(e) => setDraft({ ...draft, starts_on: e.target.value || null })} /></Field>
                <Field label="Ends" htmlFor="d-end"><input id="d-end" type="date" min={draft.starts_on ?? undefined} className={input} value={draft.ends_on ?? ''} onChange={(e) => setDraft({ ...draft, ends_on: e.target.value || null })} /></Field>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-ink/60">Run for</span>
                {[1, 2, 3].map((n) => (
                  <button key={n} type="button" className="min-h-9 rounded-full bg-stone-100 px-3 font-medium hover:bg-stone-200"
                    onClick={() => setDraft({ ...draft, ends_on: addMonths(draft.starts_on || today, n) })}>{n} month{n > 1 ? 's' : ''}</button>
                ))}
                {draft.ends_on && <button type="button" className="min-h-9 px-2 font-medium text-ink/60 underline" onClick={() => setDraft({ ...draft, ends_on: null })}>No end date</button>}
              </div>
              <div className="mt-4 border-t border-black/5 pt-3">
                <Toggle checked={draft.active} onChange={(active) => setDraft({ ...draft, active })} label="Show on website" />
                {st && <p className="text-[13px] text-ink/65">
                  {st === 'live' && <>Visitors will see this deal{draft.ends_on ? ` until ${fmtDate(draft.ends_on)}` : ''}.</>}
                  {st === 'scheduled' && <>Goes live automatically on {fmtDate(draft.starts_on!)}.</>}
                  {st === 'ended' && <>The end date has passed, so it’s hidden. Pick a later end date to bring it back.</>}
                  {st === 'paused' && <>Hidden from the website until you switch it on.</>}
                </p>}
              </div>
            </fieldset>

            <Field label="Photo"><ImagePicker folder="deals" value={draft.image_url} onChange={(image_url) => setDraft({ ...draft, image_url })} /></Field>
          </form>
        )}
      </Drawer>
    </>
  );
}
