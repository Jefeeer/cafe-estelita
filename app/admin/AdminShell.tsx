'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { browserClient, supabaseConfigured } from '@/lib/supabase';
import { publishSite } from './actions';
import { AdminCtx, Icon, ShellSkeleton, btn, input, useConfirm, type Admin, type IconName } from './ui';

const NAV: { href: string; label: string; short: string; icon: IconName }[] = [
  { href: '/admin', label: 'Overview', short: 'Home', icon: 'home' },
  { href: '/admin/deals', label: 'Deals & Bundles', short: 'Deals', icon: 'tag' },
  { href: '/admin/menu', label: 'Menu', short: 'Menu', icon: 'menu' },
  { href: '/admin/gallery', label: 'Gallery', short: 'Gallery', icon: 'image' },
  { href: '/admin/hours', label: 'Opening Hours', short: 'Hours', icon: 'clock' },
  { href: '/admin/content', label: 'Website Content', short: 'Content', icon: 'layout' },
];

type Toast = { id: number; msg: string; tone: 'ok' | 'err' };

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const db = useMemo(() => (supabaseConfigured ? browserClient() : null), []);
  const [user, setUser] = useState<User | null | undefined>(db ? undefined : null); // undefined = still checking
  const [toasts, setToasts] = useState<Toast[]>([]);
  const confirm = useConfirm();
  const path = usePathname();

  // Restore the session, and require an `admins` row (RLS returns only your own).
  const check = useCallback(async (u: User | null) => {
    if (!u || !db) return setUser(null);
    const { data } = await db.from('admins').select('user_id').eq('user_id', u.id).maybeSingle();
    if (data) return setUser(u);
    await db.auth.signOut();
    setUser(null);
  }, [db]);
  useEffect(() => {
    if (!db) return;
    db.auth.getSession().then(({ data }) => check(data.session?.user ?? null));
    const { data: sub } = db.auth.onAuthStateChange((e, s) => { if (e === 'SIGNED_OUT') setUser(null); else if (e === 'TOKEN_REFRESHED' && s) setUser(s.user); });
    return () => sub.subscription.unsubscribe();
  }, [db, check]);

  const toast = useCallback((msg: string, tone: 'ok' | 'err' = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), tone === 'err' ? 7000 : 3500);
  }, []);

  const admin = useMemo<Admin | null>(() => db && user ? {
    db, user, toast, confirm: confirm.ask,
    save: async (write, done = 'Saved — the website is updated') => {
      const { error } = await write();
      if (error) { toast(`Couldn't save: ${error.message}`, 'err'); return false; }
      const { data } = await db.auth.getSession();
      await publishSite(data.session?.access_token ?? '').catch(() => null);
      toast(done);
      return true;
    },
  } : null, [db, user, toast, confirm.ask]);

  const toastUi = (
    <div className="pointer-events-none fixed inset-x-3 bottom-20 z-[60] flex flex-col items-center gap-2 lg:bottom-6 lg:left-auto lg:right-6 lg:items-end" role="status" aria-live="polite">
      {toasts.map((t) => (
        <p key={t.id} className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${t.tone === 'ok' ? 'bg-evergreen text-white' : 'bg-red-700 text-white'}`}>
          <Icon name={t.tone === 'ok' ? 'check' : 'alert'} className="h-4 w-4 flex-none" />{t.msg}
        </p>
      ))}
    </div>
  );

  if (user === undefined) return <ShellSkeleton />;
  if (!admin) return <div className="admin-app"><Login onDone={check} />{toastUi}</div>;

  const isActive = (href: string) => (href === '/admin' ? path === '/admin' : path.startsWith(href));
  const signOut = async () => {
    if (await confirm.ask({ title: 'Sign out?', text: 'You’ll need your email and password to sign back in. Everything you saved is already on the website.', action: 'Sign out', tone: 'neutral', icon: 'out' })) db!.auth.signOut();
  };

  return (
    <AdminCtx value={admin}>
      <div className="admin-app min-h-dvh font-sans text-ink lg:pl-64">
        {/* Sidebar (desktop) */}
        <aside className="on-dark fixed inset-y-0 left-0 hidden w-64 flex-col bg-evergreen text-blush lg:flex">
          <Brand />
          <nav aria-label="Admin" className="flex-1 px-3">
            <ul className="space-y-1">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-[15px] font-medium transition ${isActive(n.href) ? 'bg-white/12 text-white' : 'text-blush/75 hover:bg-white/6 hover:text-white'}`}>
                    <Icon name={n.icon} />{n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-white/10 p-3">
            <a href="/" target="_blank" rel="noopener" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm text-blush/75 hover:bg-white/6 hover:text-white">
              <Icon name="ext" />View website<span className="sr-only"> (opens in new tab)</span>
            </a>
            <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
              <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-moss text-sm font-semibold text-evergreen-deep" aria-hidden="true">{admin.user.email?.[0].toUpperCase()}</span>
              <span className="min-w-0 flex-1 truncate text-sm text-blush/85" title={admin.user.email}>{admin.user.email}</span>
              <button type="button" onClick={signOut} className="grid h-10 w-10 place-items-center rounded-lg text-blush/75 hover:bg-white/10 hover:text-white" aria-label="Sign out" title="Sign out"><Icon name="out" /></button>
            </div>
          </div>
        </aside>

        {/* Top bar (phones & tablets) */}
        <header className="on-dark sticky top-0 z-30 flex items-center justify-between bg-evergreen px-3 py-2 text-blush lg:hidden">
          <Link href="/admin" className="flex items-center gap-2.5">
            <Image src="/brand/logo-mark.png" alt="" width={36} height={36} className="h-9 w-9 rounded-full ring-1 ring-ivory/60" />
            <span className="font-semibold">Casa Estelita <span className="font-normal text-blush/70">Admin</span></span>
          </Link>
          <AccountMenu email={admin.user.email ?? ''} onSignOut={signOut} />
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">{children}</main>

        {/* Bottom tabs (phones & tablets) */}
        <nav aria-label="Admin" className="fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
          <ul className="mx-auto grid max-w-xl grid-cols-6">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link href={n.href} aria-current={isActive(n.href) ? 'page' : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${isActive(n.href) ? 'text-evergreen' : 'text-ink/55'}`}>
                  <span className={`grid h-7 w-11 place-items-center rounded-full ${isActive(n.href) ? 'bg-fern/40' : ''}`}><Icon name={n.icon} /></span>{n.short}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        {toastUi}
        {confirm.ui}
      </div>
    </AdminCtx>
  );
}

const Brand = () => (
  <div className="flex items-center gap-3 px-5 py-6">
    <Image src="/brand/logo-mark.png" alt="" width={44} height={44} className="h-11 w-11 rounded-full ring-2 ring-ivory/70" />
    <div className="leading-tight">
      <p className="caps text-[13px]" style={{ letterSpacing: '.18em' }}>Casa Estelita</p>
      <p className="text-xs text-moss">Website admin</p>
    </div>
  </div>
);

function AccountMenu({ email, onSignOut }: { email: string; onSignOut: () => void }) {
  const ref = useRef<HTMLDetailsElement>(null);
  return (
    <details ref={ref} className="relative">
      <summary className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full [&::-webkit-details-marker]:hidden" aria-label="Account menu">
        <span className="grid h-9 w-9 place-items-center rounded-full bg-moss text-sm font-semibold text-evergreen-deep">{email[0]?.toUpperCase()}</span>
      </summary>
      <div className="absolute right-0 top-12 w-64 rounded-xl bg-white p-2 text-ink shadow-xl ring-1 ring-black/10">
        <p className="truncate px-3 py-2 text-sm text-ink/60">{email}</p>
        <a href="/" target="_blank" rel="noopener" className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium hover:bg-stone-100"><Icon name="ext" className="h-4 w-4" />View website</a>
        <button type="button" onClick={() => { ref.current!.open = false; onSignOut(); }} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-red-700 hover:bg-red-50"><Icon name="out" className="h-4 w-4" />Sign out</button>
      </div>
    </details>
  );
}

function Login({ onDone }: { onDone: (u: User | null) => Promise<void> }) {
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!supabaseConfigured) return setErr('The admin is not connected to the database yet (missing Supabase settings).');
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr('');
    const db = browserClient();
    const { data, error } = await db.auth.signInWithPassword({ email: String(f.get('email')).trim(), password: String(f.get('password')) });
    if (error) { setErr(error.message === 'Invalid login credentials' ? 'That email and password don’t match. Please try again.' : error.message); setBusy(false); return; }
    const { data: ok } = await db.from('admins').select('user_id').eq('user_id', data.user.id).maybeSingle();
    if (!ok) { setErr('This account doesn’t have admin access.'); await db.auth.signOut(); setBusy(false); return; }
    await onDone(data.user);
  };

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1fr_1.1fr]">
      <div className="on-dark relative hidden overflow-hidden bg-evergreen text-blush lg:flex lg:flex-col lg:justify-between lg:p-12">
        <Image src="/brand/logo-mark.png" alt="" width={520} height={520} className="pointer-events-none absolute -bottom-32 -right-32 h-[32rem] w-[32rem] opacity-[.07]" />
        <Brand />
        <div className="relative max-w-md">
          <p className="display text-4xl leading-tight">Keep the garden&apos;s menu fresh.</p>
          <p className="mt-4 text-blush/80">Update deals, menu items, photos and opening hours. Changes appear on the website as soon as you save.</p>
        </div>
        <p className="text-sm text-blush/60">Casa Estelita Garden Cafe · Dasmariñas, Cavite</p>
      </div>

      <div className="flex items-center justify-center px-5 py-12">
        <form onSubmit={submit} className="w-full max-w-sm" noValidate={false}>
          <Image src="/brand/logo-mark.png" alt="" width={64} height={64} className="mb-6 h-16 w-16 rounded-full ring-2 ring-white shadow lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-[15px] text-ink/65">Casa Estelita website admin</p>

          {err && <p role="alert" className="mt-6 flex gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800 ring-1 ring-red-200"><Icon name="alert" className="mt-0.5 h-4 w-4 flex-none" />{err}</p>}

          <div className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email</label>
              <input id="email" name="email" type="email" autoComplete="username" required className={input} />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <input id="password" name="password" type={show ? 'text' : 'password'} autoComplete="current-password" required className={`${input} pr-12`} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-0.5 top-0.5 grid h-10 w-11 place-items-center rounded-lg text-ink/60 hover:text-ink" aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
                  <Icon name={show ? 'eyeOff' : 'eye'} />
                </button>
              </div>
            </div>
          </div>
          <button type="submit" disabled={busy} className={`${btn.primary} mt-6 w-full`}>{busy ? 'Signing in…' : 'Sign in'}</button>
          <p className="mt-6 text-center text-sm text-ink/60"><Link href="/" className="underline underline-offset-4 hover:text-ink">Back to the website</Link></p>
        </form>
      </div>
    </main>
  );
}
