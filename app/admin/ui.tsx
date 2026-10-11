'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { setScrollLock } from '@/components/SmoothScroll';
import type { CategoryRow } from '@/lib/supabase';

/* ---------- Admin context: db client, user, toast, publish ---------- */
export type Admin = {
  db: SupabaseClient;
  user: User;
  toast: (msg: string, tone?: 'ok' | 'err') => void;
  /** Run a write, then refresh the public site. Returns false (and toasts) on error. */
  save: (write: () => PromiseLike<{ error: { message: string } | null }>, done?: string) => Promise<boolean>;
};
export const AdminCtx = createContext<Admin | null>(null);
export const useAdmin = () => useContext(AdminCtx)!;

/** Load a table (admin sees hidden rows too, via RLS). */
export function useRows<T>(table: string, order = 'sort') {
  const { db, toast } = useAdmin();
  const [rows, setRows] = useState<T[] | null>(null);
  const reload = useCallback(async () => {
    const { data, error } = await db.from(table).select('*').order(order);
    if (error) toast(`Couldn't load: ${error.message}`, 'err');
    setRows((data as T[]) ?? []);
  }, [db, table, order, toast]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch on mount; state is set after the await
  useEffect(() => { reload(); }, [reload]);
  return { rows, setRows, reload };
}

/** Swap with the neighbour — powers the ↑/↓ buttons. `list` may be a slice (one menu category):
 *  it reuses the slice's own sort values so other rows keep their place. */
export async function move<T extends { id: string; sort: number }>(admin: Admin, table: string, list: T[], i: number, dir: -1 | 1) {
  if (!list[i + dir]) return false;
  const next = [...list];
  [next[i], next[i + dir]] = [next[i + dir], next[i]];
  let slots = list.map((r) => r.sort).sort((a, b) => a - b);
  if (new Set(slots).size < slots.length) slots = slots.map((_, k) => slots[0] + k); // ties: spread them out
  return admin.save(async () => {
    for (const [k, r] of next.entries()) {
      if (r.sort === slots[k]) continue;
      const res = await admin.db.from(table).update({ sort: slots[k] }).eq('id', r.id);
      if (res.error) return res;
    }
    return { error: null };
  }, 'Order updated');
}

export const peso = (n: number) => '₱' + Number(n).toLocaleString('en-PH', { maximumFractionDigits: 2 });
export const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

/* ---------- Photo upload: shrinks phone photos before upload ---------- */
export async function uploadImage(db: SupabaseClient, file: File, folder: string) {
  const bmp = await createImageBitmap(file);
  const scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h);
  const blob = await new Promise<Blob>((ok, no) => canvas.toBlob((b) => (b ? ok(b) : no(new Error('Could not read this image'))), 'image/webp', 0.85));
  const path = `${folder}/${crypto.randomUUID()}.webp`;
  const { error } = await db.storage.from('media').upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' });
  if (error) throw error;
  return { url: db.storage.from('media').getPublicUrl(path).data.publicUrl, w, h };
}

/* ---------- Icons ---------- */
const paths = {
  home: <><path d="M3 11 12 4l9 7" /><path d="M5 10v10h14V10" /></>,
  tag: <><path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z" /><circle cx="7.5" cy="7.5" r="1.5" /></>,
  menu: <><path d="M4 3v8a3 3 0 0 0 6 0V3M7 3v18" /><path d="M17 21V3c-2 0-4 2-4 6v5h4" /></>,
  image: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="2" /><path d="m21 16-5-5-9 9" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  edit: <><path d="M4 20h4L19 9l-4-4L4 16z" /><path d="m13 7 4 4" /></>,
  trash: <><path d="M4 7h16M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></>,
  up: <path d="m6 15 6-6 6 6" />,
  down: <path d="m6 9 6 6 6-6" />,
  left: <path d="m15 6-6 6 6 6" />,
  right: <path d="m9 6 6 6-6 6" />,
  x: <path d="M6 6l12 12M18 6 6 18" />,
  ext: <><path d="M14 4h6v6M10 14 20 4" /><path d="M19 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h6" /></>,
  out: <><path d="M15 4h4a1 1 0 0 1 1 1v14a1 1 0 0 1-1 1h-4M10 17l5-5-5-5M15 12H3" /></>,
  star: <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  upload: <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></>,
  eye: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18M10.6 5.1A10 10 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4.1M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  alert: <><path d="M12 3 2 20h20z" /><path d="M12 10v4M12 17h.01" /></>,
  check: <path d="M5 12l5 5 9-10" />,
};
export type IconName = keyof typeof paths;
export const Icon = ({ name, className = 'h-5 w-5' }: { name: IconName; className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
);

/* ---------- Building blocks ---------- */
export const btn = {
  primary: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-evergreen px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-evergreen-deep disabled:opacity-50',
  secondary: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-white px-4 text-sm font-semibold text-ink ring-1 ring-black/10 transition hover:bg-stone-50 disabled:opacity-50',
  danger: 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-700 px-4 text-sm font-semibold text-white transition hover:bg-red-800 disabled:opacity-50',
  icon: 'grid h-10 w-10 place-items-center rounded-lg text-ink/70 transition hover:bg-black/5 hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent',
};
export const input = 'block min-h-11 w-full rounded-lg border-0 bg-white px-3 text-[15px] text-ink ring-1 ring-black/15 placeholder:text-ink/40 focus:ring-2 focus:ring-evergreen focus:outline-none';

export function PageHeader({ title, desc, children }: { title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1 max-w-2xl text-[15px] text-ink/65">{desc}</p>
      </div>
      {children && <div className="flex flex-wrap gap-2">{children}</div>}
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">{label}</label>
      {children}
      {hint && <p className="mt-1.5 text-[13px] text-ink/60">{hint}</p>}
    </div>
  );
}

export function Toggle({ checked, onChange, label, hideLabel }: { checked: boolean; onChange: (v: boolean) => void; label: string; hideLabel?: boolean }) {
  return (
    <label className="inline-flex min-h-11 cursor-pointer items-center gap-3">
      <input type="checkbox" role="switch" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span aria-hidden="true" className="relative h-6 w-11 flex-none rounded-full bg-stone-300 transition peer-checked:bg-evergreen peer-focus-visible:ring-2 peer-focus-visible:ring-clay peer-focus-visible:ring-offset-2 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition peer-checked:after:translate-x-5" />
      <span className={hideLabel ? 'sr-only' : 'text-sm font-medium text-ink'}>{label}</span>
    </label>
  );
}

const tones = {
  live: 'bg-emerald-50 text-emerald-800 ring-emerald-600/20',
  scheduled: 'bg-sky-50 text-sky-800 ring-sky-600/20',
  ended: 'bg-stone-100 text-stone-600 ring-stone-500/20',
  paused: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  hidden: 'bg-stone-100 text-stone-600 ring-stone-500/20',
};
export function Badge({ tone, children }: { tone: keyof typeof tones; children: React.ReactNode }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${tones[tone]}`}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />{children}</span>;
}

export function Empty({ icon, title, text, action }: { icon: IconName; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="grid place-items-center rounded-xl border-2 border-dashed border-black/10 bg-white/60 px-6 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-fern/25 text-evergreen"><Icon name={icon} /></span>
      <h2 className="mt-4 font-semibold text-ink">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-ink/65">{text}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export const Skeleton = ({ rows = 4 }: { rows?: number }) => (
  <div className="space-y-3" aria-busy="true" aria-label="Loading">
    {[...Array(rows)].map((_, i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-black/[.05]" />)}
  </div>
);

/** Native <dialog> as a right-side panel (full screen on phones). */
export function Drawer({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current!;
    if (open && !d.open) { d.showModal(); setScrollLock('drawer'); }
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} data-lenis-prevent onClose={() => { setScrollLock(); onClose(); }} aria-labelledby="drawerTitle"
      className="admin-drawer m-0 ml-auto h-dvh max-h-dvh w-full max-w-full bg-stone-50 p-0 text-ink shadow-2xl sm:w-[34rem]">
      {open && (
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between gap-4 border-b border-black/10 bg-white px-5 py-3">
            <h2 id="drawerTitle" className="text-lg font-semibold">{title}</h2>
            <button type="button" className={btn.icon} onClick={() => ref.current?.close()} aria-label="Close"><Icon name="x" /></button>
          </header>
          <div className="flex-1 overflow-y-auto px-5 py-6">{children}</div>
          <footer className="flex justify-end gap-2 border-t border-black/10 bg-white px-5 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">{footer}</footer>
        </div>
      )}
    </dialog>
  );
}

/** "Are you sure?" — resolves true when confirmed. */
export function useConfirm() {
  const [state, setState] = useState<{ title: string; text: string; resolve: (v: boolean) => void } | null>(null);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { if (state && !ref.current!.open) ref.current!.showModal(); }, [state]);
  const ask = (title: string, text: string) => new Promise<boolean>((resolve) => setState({ title, text, resolve }));
  const done = (v: boolean) => { state?.resolve(v); setState(null); ref.current?.close(); };
  const ui = (
    <dialog ref={ref} onClose={() => state && done(false)} aria-labelledby="cfTitle"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl bg-white p-6 text-ink shadow-2xl backdrop:bg-black/40">
      <div className="flex gap-4">
        <span className="grid h-10 w-10 flex-none place-items-center rounded-full bg-red-50 text-red-700"><Icon name="alert" /></span>
        <div>
          <h2 id="cfTitle" className="font-semibold">{state?.title}</h2>
          <p className="mt-1 text-sm text-ink/70">{state?.text}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={btn.secondary} onClick={() => done(false)} autoFocus>Cancel</button>
        <button type="button" className={btn.danger} onClick={() => done(true)}>Delete</button>
      </div>
    </dialog>
  );
  return { ask, ui };
}

/** Photo field: preview + upload / replace / remove. */
export function ImagePicker({ value, onChange, folder, onSize }: { value: string; onChange: (url: string) => void; folder: string; onSize?: (w: number, h: number) => void }) {
  const { db, toast } = useAdmin();
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const r = await uploadImage(db, f, folder);
      onChange(r.url); onSize?.(r.w, r.h);
    } catch (e) { toast(`Upload failed: ${(e as Error).message}`, 'err'); }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = '';
  };
  return (
    <div className="flex items-center gap-4">
      <div className="relative grid h-24 w-32 flex-none place-items-center overflow-hidden rounded-lg bg-stone-200 ring-1 ring-black/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <Icon name="image" className="h-7 w-7 text-ink/35" />}
        {busy && <span className="absolute inset-0 grid place-items-center bg-white/70 text-xs font-semibold">Uploading…</span>}
      </div>
      <div className="flex flex-col gap-2">
        <input ref={fileRef} type="file" accept="image/*" className="sr-only" id={`file-${folder}`} onChange={(e) => pick(e.target.files?.[0])} />
        <label htmlFor={`file-${folder}`} className={`${btn.secondary} cursor-pointer`}><Icon name="upload" className="h-4 w-4" />{value ? 'Replace photo' : 'Upload photo'}</label>
        {value && <button type="button" className="text-left text-sm font-medium text-red-700 hover:underline" onClick={() => onChange('')}>Remove photo</button>}
      </div>
    </div>
  );
}

/** Add / rename / reorder / delete categories. Renames cascade to items in the database;
 *  a category that still has items can't be deleted (also enforced by a foreign key). */
export function CategoryManager({ table, open, onClose, cats, counts, noun, onChange }: {
  table: 'menu_categories' | 'gallery_categories'; open: boolean; onClose: () => void;
  cats: CategoryRow[]; counts: Record<string, number>; noun: string; onChange: () => void;
}) {
  const admin = useAdmin();
  const [names, setNames] = useState<Record<string, string>>({});
  const [fresh, setFresh] = useState('');
  const nameOf = (c: CategoryRow) => names[c.id] ?? c.name;
  const clear = (id: string) => setNames((n) => { const r = { ...n }; delete r[id]; return r; });
  const taken = (n: string, id?: string) => cats.some((c) => c.id !== id && c.name.toLowerCase() === n.toLowerCase());

  const rename = async (c: CategoryRow) => {
    const n = nameOf(c).trim();
    if (!n || n === c.name) return clear(c.id);
    if (taken(n, c.id)) return admin.toast(`There’s already a category called “${n}”.`, 'err');
    if (await admin.save(() => admin.db.from(table).update({ name: n }).eq('id', c.id), `Renamed to “${n}”`)) { clear(c.id); onChange(); }
  };
  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = fresh.trim();
    if (!n) return;
    if (taken(n)) return admin.toast(`There’s already a category called “${n}”.`, 'err');
    if (await admin.save(() => admin.db.from(table).insert({ name: n, sort: Math.max(-1, ...cats.map((c) => c.sort)) + 1 }), `“${n}” added`)) { setFresh(''); onChange(); }
  };
  const remove = async (c: CategoryRow) => {
    if (await admin.save(() => admin.db.from(table).delete().eq('id', c.id), `“${c.name}” deleted`)) onChange();
  };

  return (
    <Drawer open={open} onClose={onClose} title="Manage categories" footer={<button type="button" className={btn.primary} onClick={onClose}>Done</button>}>
      <p className="mb-5 text-sm text-ink/65">These are the {noun} on the website, in this order. Renaming a category moves all its items with it. Changes save as soon as you leave a field.</p>
      <ul className="divide-y divide-black/5 rounded-xl bg-white ring-1 ring-black/10">
        {cats.map((c, i) => {
          const n = counts[c.name] ?? 0;
          return (
            <li key={c.id} className="flex items-center gap-1 p-2">
              <label className="sr-only" htmlFor={`cat-${c.id}`}>Category name</label>
              <input id={`cat-${c.id}`} maxLength={40} className={`${input} min-w-0 flex-1`} value={nameOf(c)}
                onChange={(e) => setNames({ ...names, [c.id]: e.target.value })} onBlur={() => rename(c)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }} />
              <span className="w-16 flex-none text-center text-xs text-ink/55">{n} item{n === 1 ? '' : 's'}</span>
              <button type="button" className={btn.icon} disabled={i === 0} onClick={() => move(admin, table, cats, i, -1).then((ok) => { if (ok) onChange(); })} aria-label={`Move ${c.name} up`}><Icon name="up" /></button>
              <button type="button" className={btn.icon} disabled={i === cats.length - 1} onClick={() => move(admin, table, cats, i, 1).then((ok) => { if (ok) onChange(); })} aria-label={`Move ${c.name} down`}><Icon name="down" /></button>
              <button type="button" className={`${btn.icon} hover:!text-red-700`} disabled={n > 0} onClick={() => remove(c)}
                aria-label={`Delete ${c.name}`} title={n ? `Move or delete its ${n} item${n === 1 ? '' : 's'} first` : `Delete ${c.name}`}><Icon name="trash" /></button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-[13px] text-ink/55">Only empty categories can be deleted.</p>
      <form onSubmit={add} className="mt-6 flex gap-2">
        <label className="sr-only" htmlFor={`new-${table}`}>New category name</label>
        <input id={`new-${table}`} maxLength={40} className={`${input} flex-1`} placeholder="New category, e.g. Rice Meals" value={fresh} onChange={(e) => setFresh(e.target.value)} />
        <button type="submit" className={btn.secondary} disabled={!fresh.trim()}><Icon name="plus" className="h-4 w-4" />Add</button>
      </form>
    </Drawer>
  );
}
