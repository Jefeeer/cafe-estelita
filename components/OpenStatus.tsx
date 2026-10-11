'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { HOURS, type Day } from '@/lib/content';
import { fmtTime, statusAt, zonedNow, type Status } from '@/lib/hours';

/** Weekly hours edited in /admin (defaults to lib/content.ts). */
const HoursContext = createContext<Day[]>(HOURS.week);
export const HoursProvider = ({ week, children }: { week: Day[]; children: React.ReactNode }) => <HoursContext value={week}>{children}</HoursContext>;
const useWeek = () => useContext(HoursContext);
const firstOpen = (week: Day[]) => week.find((d) => d.open)?.open;

/** Re-evaluates every minute, always in Manila time. Null until mounted (avoids SSR/client clock mismatch). */
export function useCafeClock() {
  const week = useWeek();
  const [now, setNow] = useState<{ day: number; status: Status } | null>(null);
  useEffect(() => {
    const tick = () => {
      const { day, mins } = zonedNow(HOURS.timezone);
      setNow({ day, status: statusAt(week, day, mins) });
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [week]);
  return now;
}

export function statusText(s: Status | undefined, variant: 'short' | 'long', first?: string | null) {
  if (!s) return first ? `Opens at ${fmtTime(first)}` : 'Hours';
  if (s.open) return variant === 'long' ? `Open now · until ${fmtTime(s.closes)}` : 'Open now';
  if (!s.at) return 'Closed';
  if (variant === 'long') return `Closed · opens ${s.when} at ${fmtTime(s.at)}`;
  return `Opens ${s.when === 'today' ? '' : s.when!.replace('on ', '') + ' '}${fmtTime(s.at)}`;
}

export default function OpenStatus({ variant = 'long', className = '' }: { variant?: 'short' | 'long'; className?: string }) {
  const clock = useCafeClock();
  const week = useWeek();
  return (
    <p className={`${className} ${clock?.status.open ? 'status-open' : ''}`}>
      <span className="status-dot" aria-hidden="true" />
      <span>{statusText(clock?.status, variant, firstOpen(week))}</span>
    </p>
  );
}

export function HoursTable() {
  const clock = useCafeClock();
  const week = useWeek();
  return (
    <table className="w-full text-left">
      <caption className="sr-only">Weekly opening hours (Philippine time)</caption>
      <tbody>
        {week.map((d, i) => {
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
  const week = useWeek();
  const d = clock ? week[clock.day] : null;
  const first = firstOpen(week);
  if (!d) return <span>{first ? `From ${fmtTime(first)}` : '—'}</span>;
  return <span>{d.open && d.close ? `${fmtTime(d.open)} – ${fmtTime(d.close)}` : 'Closed today'}</span>;
}
