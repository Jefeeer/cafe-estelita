'use client';

import { useRef, useState } from 'react';
import type { CategoryRow, PhotoRow } from '@/lib/supabase';
import { Badge, CategoryManager, Drawer, Empty, Field, Icon, PageHeader, Skeleton, Toggle, btn, input, move, uploadImage, useAdmin, useConfirm, useRows } from '../ui';


export default function GalleryPage() {
  const admin = useAdmin();
  const { rows, reload } = useRows<PhotoRow>('gallery_photos');
  const { rows: catRows, reload: reloadCats } = useRows<CategoryRow>('gallery_categories');
  const [managing, setManaging] = useState(false);
  const [filter, setFilter] = useState('All');
  const [draft, setDraft] = useState<PhotoRow | null>(null);
  const [pickedCat, setUpCat] = useState('');
  const [progress, setProgress] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  const cats = (catRows ?? []).map((c) => c.name);
  const upCat = cats.includes(pickedCat) ? pickedCat : cats[0] ?? '';
  const counts = Object.fromEntries(cats.map((c) => [c, (rows ?? []).filter((p) => p.cat === c).length]));
  const list = (rows ?? []).filter((p) => filter === 'All' || p.cat === filter);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    let sort = Math.max(-1, ...(rows ?? []).map((r) => r.sort)) + 1, done = 0;
    for (const f of Array.from(files)) {
      setProgress(`Uploading ${done + 1} of ${files.length}…`);
      try {
        const { url, w, h } = await uploadImage(admin.db, f, 'gallery');
        const { error } = await admin.db.from('gallery_photos').insert({ src: url, w, h, cat: upCat, alt: `${upCat} at Casa Estelita Garden Cafe`, sort: sort++ });
        if (error) throw error;
        done++;
      } catch (e) { admin.toast(`${f.name}: ${(e as Error).message}`, 'err'); }
    }
    setProgress('');
    if (fileRef.current) fileRef.current.value = '';
    if (done) await admin.save(async () => ({ error: null }), `${done} photo${done > 1 ? 's' : ''} added to the gallery`);
    reload();
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    const { id, cat, alt, visible } = draft;
    if (await admin.save(() => admin.db.from('gallery_photos').update({ cat, alt: alt.trim(), visible }).eq('id', id))) { setDraft(null); reload(); }
  };
  const remove = async (p: PhotoRow) => {
    if (!(await confirm.ask('Delete this photo?', 'It will be removed from the website gallery. To keep it for later, hide it instead.'))) return;
    if (await admin.save(() => admin.db.from('gallery_photos').delete().eq('id', p.id), 'Photo deleted')) { setDraft(null); reload(); }
  };

  return (
    <>
      <PageHeader title="Gallery" desc="Photos in the website gallery, in the order shown. Phone photos are resized automatically, so upload them as they are.">
        <label className="sr-only" htmlFor="upCat">Category for new photos</label>
        <select id="upCat" value={upCat} onChange={(e) => setUpCat(e.target.value)} className={`${input} w-auto pr-8`}>
          {cats.map((c) => <option key={c}>{c}</option>)}
        </select>
        <input ref={fileRef} id="gUpload" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={!!progress || !upCat} />
        <button type="button" className={btn.secondary} onClick={() => setManaging(true)}><Icon name="edit" className="h-4 w-4" />Categories</button>
        <label htmlFor="gUpload" className={`${btn.primary} cursor-pointer ${progress || !upCat ? 'pointer-events-none opacity-60' : ''}`}><Icon name="upload" className="h-4 w-4" />{progress || `Upload to ${upCat}`}</label>
      </PageHeader>

      <div role="group" aria-label="Filter photos" className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {['All', ...cats].map((c) => (
          <button key={c} type="button" aria-pressed={filter === c} onClick={() => setFilter(c)}
            className={`flex min-h-10 flex-none items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 transition ${filter === c ? 'bg-evergreen text-white ring-evergreen' : 'bg-white text-ink/75 ring-black/10 hover:text-ink'}`}>
            {c}<span className={`rounded-full px-1.5 text-xs ${filter === c ? 'bg-white/20' : 'bg-black/5'}`}>{(rows ?? []).filter((p) => c === 'All' || p.cat === c).length}</span>
          </button>
        ))}
      </div>

      {!rows || !catRows ? <Skeleton /> : !list.length ? (
        <Empty icon="image" title="No photos here yet" text="Choose a category above, then upload one or more photos." />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {list.map((p) => {
            const i = rows.indexOf(p);
            return (
              <li key={p.id} className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
                <button type="button" onClick={() => setDraft(p)} className="relative block aspect-square w-full overflow-hidden" aria-label={`Edit photo: ${p.alt}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.src} alt="" loading="lazy" className={`h-full w-full object-cover transition group-hover:scale-105 ${p.visible ? '' : 'opacity-40 grayscale'}`} />
                  <span className="absolute left-2 top-2 flex gap-1">
                    <span className="rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-ink">{p.cat}</span>
                    {!p.visible && <Badge tone="hidden">Hidden</Badge>}
                  </span>
                </button>
                <div className="flex items-center justify-between px-1 py-1">
                  <span className="flex">
                    <button type="button" className={btn.icon} disabled={i === 0} onClick={() => move(admin, 'gallery_photos', rows, i, -1).then((ok) => { if (ok) reload(); })} aria-label="Move earlier"><Icon name="left" /></button>
                    <button type="button" className={btn.icon} disabled={i === rows.length - 1} onClick={() => move(admin, 'gallery_photos', rows, i, 1).then((ok) => { if (ok) reload(); })} aria-label="Move later"><Icon name="right" /></button>
                  </span>
                  <button type="button" className={btn.icon} onClick={() => setDraft(p)} aria-label={`Edit photo: ${p.alt}`}><Icon name="edit" /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Drawer open={!!draft} onClose={() => setDraft(null)} title="Edit photo"
        footer={<>
          {draft && <button type="button" className={`${btn.secondary} mr-auto !text-red-700`} onClick={() => remove(draft)}><Icon name="trash" className="h-4 w-4" />Delete</button>}
          <button type="button" className={btn.secondary} onClick={() => setDraft(null)}>Cancel</button>
          <button type="submit" form="photoForm" className={btn.primary}>Save</button>
        </>}>
        {draft && (
          <form id="photoForm" onSubmit={submit} className="space-y-5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.src} alt="" className="max-h-72 w-full rounded-xl bg-stone-200 object-contain" />
            <Field label="Category" htmlFor="p-cat" hint="Matches the filter buttons on the website gallery.">
              <select id="p-cat" className={input} value={draft.cat} onChange={(e) => setDraft({ ...draft, cat: e.target.value })}>
                {cats.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Describe the photo" htmlFor="p-alt" hint="Shown under the photo when enlarged, and read aloud for visitors using screen readers.">
              <textarea id="p-alt" rows={2} maxLength={200} className={`${input} py-2`} value={draft.alt} onChange={(e) => setDraft({ ...draft, alt: e.target.value })} />
            </Field>
            <div className="rounded-xl bg-white px-4 py-1 ring-1 ring-black/10"><Toggle checked={draft.visible} onChange={(visible) => setDraft({ ...draft, visible })} label="Show on website" /></div>
          </form>
        )}
      </Drawer>
      <CategoryManager table="gallery_categories" noun="filter buttons on the website gallery" open={managing} onClose={() => setManaging(false)} cats={catRows ?? []} counts={counts} onChange={() => { reloadCats(); reload(); }} />
      {confirm.ui}
    </>
  );
}
