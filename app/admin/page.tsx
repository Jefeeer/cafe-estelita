'use client';

import Link from 'next/link';
import { dealState, manilaToday, type Deal, type HoursRow, type MenuRow, type PhotoRow } from '@/lib/supabase';
import { fmtTime, statusAt, zonedNow } from '@/lib/hours';
import { Badge, Bone, Icon, fmtDate, peso, useAdmin, useRows, type IconName } from './ui';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const daysUntil = (d: string, today: string) => Math.round((Date.parse(d) - Date.parse(today)) / 864e5);

export default function Overview() {
  const { user } = useAdmin();
  const deals = useRows<Deal>('deals').rows;
  const menu = useRows<MenuRow>('menu_items').rows;
  const photos = useRows<PhotoRow>('gallery_photos').rows;
  const hours = useRows<HoursRow>('hours', 'dow').rows;

  const today = manilaToday();
  const hour = Number(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', hourCycle: 'h23' }));
  const hello = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const live = deals?.filter((d) => dealState(d, today) === 'live') ?? [];
  const endingSoon = live.filter((d) => d.ends_on && daysUntil(d.ends_on, today) <= 14);
  const scheduled = deals?.filter((d) => dealState(d, today) === 'scheduled') ?? [];

  let todayText = '—', statusLine = '';
  if (hours?.length === 7) {
    const week = DAYS.map((day, i) => ({ day, open: hours[i].open, close: hours[i].close }));
    const { day, mins } = zonedNow('Asia/Manila');
    const t = week[day], s = statusAt(week, day, mins);
    todayText = t.open && t.close ? `${fmtTime(t.open)} – ${fmtTime(t.close)}` : 'Closed today';
    statusLine = s.open ? 'Open right now' : 'Closed right now';
  }

  const stats: { label: string; value: string | number | undefined; sub: string; href: string; icon: IconName }[] = [
    { label: 'Live deals', value: deals ? live.length : undefined, sub: scheduled.length ? `${scheduled.length} scheduled` : 'on the website now', href: '/admin/deals', icon: 'tag' },
    { label: 'Menu items', value: menu?.filter((m) => m.available).length, sub: menu ? `${menu.filter((m) => m.available && m.sold_out).length} sold out · ${menu.filter((m) => !m.available).length} hidden` : '', href: '/admin/menu', icon: 'menu' },
    { label: 'Gallery photos', value: photos?.filter((p) => p.visible).length, sub: photos ? `${photos.filter((p) => !p.visible).length} hidden` : '', href: '/admin/gallery', icon: 'image' },
    { label: 'Today', value: hours ? todayText : undefined, sub: statusLine, href: '/admin/hours', icon: 'clock' },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">{hello}{user.user_metadata?.name ? `, ${user.user_metadata.name}` : ''}</h1>
        <p className="mt-1 text-[15px] text-ink/65">Here’s what visitors see on the Casa Estelita website right now.</p>
      </div>

      <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s) => (
          <li key={s.label}>
            <Link href={s.href} className="group flex h-full flex-col rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 transition hover:ring-evergreen/30 sm:p-5">
              <span className="flex items-center justify-between text-sm font-medium text-ink/65">{s.label}
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-fern/25 text-evergreen"><Icon name={s.icon} className="h-4 w-4" /></span></span>
              <span className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">{s.value ?? <Bone className="mt-1 h-8 w-16" />}</span>
              <span className="mt-1 text-[13px] text-ink/55">{s.sub}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="self-start rounded-xl bg-white shadow-sm ring-1 ring-black/5" aria-labelledby="liveTitle">
          <header className="flex items-center justify-between border-b border-black/5 px-5 py-4">
            <h2 id="liveTitle" className="font-semibold">Deals on the website</h2>
            <Link href="/admin/deals" className="text-sm font-medium text-evergreen hover:underline">Manage</Link>
          </header>
          {!deals ? <div className="divide-y divide-black/5" aria-busy="true">{[0, 1].map((i) => <div key={i} className="flex items-center gap-4 px-5 py-3"><Bone className="h-12 w-12 flex-none rounded-lg" /><div className="flex-1 space-y-2"><Bone className="h-4 w-1/2" /><Bone className="h-3 w-1/3" /></div></div>)}</div> : !live.length ? (
            <p className="px-5 py-8 text-center text-sm text-ink/60">No deals are live. <Link href="/admin/deals" className="font-semibold text-evergreen underline">Create one</Link></p>
          ) : (
            <ul className="divide-y divide-black/5">
              {live.map((d) => (
                <li key={d.id} className="flex items-center gap-4 px-5 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {d.image_url ? <img src={d.image_url} alt="" className="h-12 w-12 flex-none rounded-lg object-cover" /> : <span className="h-12 w-12 flex-none rounded-lg bg-stone-100" />}
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{d.title}</span>
                    <span className="text-sm text-ink/60">{peso(d.price)} · {d.ends_on ? `until ${fmtDate(d.ends_on)}` : 'no end date'}</span>
                  </span>
                  {d.ends_on && daysUntil(d.ends_on, today) <= 14 && <Badge tone="paused">{daysUntil(d.ends_on, today) === 0 ? 'Ends today' : `${daysUntil(d.ends_on, today)}d left`}</Badge>}
                </li>
              ))}
            </ul>
          )}
          {!!endingSoon.length && (
            <p className="flex gap-2 border-t border-black/5 bg-amber-50/60 px-5 py-3 text-sm text-amber-900">
              <Icon name="alert" className="mt-0.5 h-4 w-4 flex-none" />
              {endingSoon.length === 1 ? '1 deal ends' : `${endingSoon.length} deals end`} within two weeks — a good time to plan the next one.
            </p>
          )}
        </section>

        <section aria-labelledby="qaTitle">
          <h2 id="qaTitle" className="mb-3 font-semibold">Quick actions</h2>
          <ul className="grid gap-2">
            {([
              ['/admin/deals', 'tag', 'Add or update a deal', 'Bundles, promos and seasonal offers'],
              ['/admin/menu', 'menu', 'Mark an item sold out', 'Or change prices and photos'],
              ['/admin/gallery', 'upload', 'Upload new photos', 'Straight from your phone'],
              ['/admin/hours', 'clock', 'Change opening hours', 'Holidays, new schedule'],
              ['/admin/content', 'layout', 'Edit website text & photos', 'Hero, story, contact details, reviews'],
            ] as const).map(([href, icon, t, s]) => (
              <li key={t}>
                <Link href={href} className="flex items-center gap-4 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5 transition hover:ring-evergreen/30">
                  <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-evergreen text-blush"><Icon name={icon} className="h-5 w-5" /></span>
                  <span className="flex-1"><span className="block font-medium">{t}</span><span className="text-sm text-ink/60">{s}</span></span>
                  <Icon name="right" className="h-4 w-4 text-ink/40" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
