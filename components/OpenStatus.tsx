'use client';

import { useEffect, useState } from 'react';
import { HOURS } from '@/lib/content';
import { fmtTime, statusAt, zonedNow, type Status } from '@/lib/hours';

/** Re-evaluates every minute, always in Manila time. Null until mounted (avoids SSR/client clock mismatch). */
export function useCafeClock() {
  const [now, setNow] = useState<{ day: number; status: Status } | null>(null);
  useEffect(() => {
    const tick = () => {
      const { day, mins } = zonedNow(HOURS.timezone);
      setNow({ day, status: statusAt(HOURS.week, day, mins) });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return now;
}

const firstOpen = HOURS.week.find((d) => d.open)?.open;

export function statusText(s: Status | undefined, variant: 'short' | 'long') {
  if (!s) return firstOpen ? `Opens at ${fmtTime(firstOpen)}` : 'Hours';
  if (s.open) return variant === 'long' ? `Open now · until ${fmtTime(s.closes)}` : 'Open now';
  if (!s.at) return 'Closed';
  if (variant === 'long') return `Closed · opens ${s.when} at ${fmtTime(s.at)}`;
  return `Opens ${s.when === 'today' ? '' : s.when!.replace('on ', '') + ' '}${fmtTime(s.at)}`;
}

export default function OpenStatus({ variant = 'long', className = '' }: { variant?: 'short' | 'long'; className?: string }) {
  const clock = useCafeClock();
  return (
    <p className={`${className} ${clock?.status.open ? 'is-open' : ''}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{statusText(clock?.status, variant)}</span>
    </p>
  );
}

export function HoursTable() {
  const clock = useCafeClock();
  return (
    <table className="w-full text-left">
      <caption className="sr-only">Weekly opening hours (Philippine time)</caption>
      <tbody>
        {HOURS.week.map((d, i) => {
          const today = clock?.day === i;
          return (
            <tr key={d.day} className={`border-b border-blush/10 ${today ? 'font-semibold text-mint' : ''}`}>
              <th scope="row" className="py-1.5 pr-4 font-normal">
                {d.day}
                {today && <span className="sr-only"> (today)</span>}
              </th>
              <td className="py-1.5 text-right">{d.open && d.close ? `${fmtTime(d.open)} – ${fmtTime(d.close)}` : 'Closed'}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** "Today · 3 PM – 11 PM" for the at-a-glance strip. */
export function TodayHours() {
  const clock = useCafeClock();
  const d = clock ? HOURS.week[clock.day] : null;
  if (!d) return <span>{firstOpen ? `From ${fmtTime(firstOpen)}` : '—'}</span>;
  return <span>{d.open && d.close ? `${fmtTime(d.open)} – ${fmtTime(d.close)}` : 'Closed today'}</span>;
}
