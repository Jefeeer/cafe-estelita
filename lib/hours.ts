import type { Day } from './content';

export const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
};

export const fmtTime = (t: string) => {
  const [H, m] = t.split(':').map(Number);
  const ap = H % 24 >= 12 ? 'PM' : 'AM';
  const h = H % 12 || 12;
  return m ? `${h}:${String(m).padStart(2, '0')} ${ap}` : `${h} ${ap}`;
};

export type Status =
  | { open: true; closes: string }
  | { open: false; when?: string; at?: string };

/** Pure: given the week (0 = Sunday), a weekday and minutes since midnight → open/closed. */
export function statusAt(week: Day[], day: number, mins: number): Status {
  const today = week[day], yest = week[(day + 6) % 7];
  // still inside last night's after-midnight hours?
  if (yest.open && yest.close && toMin(yest.close) <= toMin(yest.open) && mins < toMin(yest.close)) return { open: true, closes: yest.close };
  if (today.open && today.close) {
    const o = toMin(today.open), c = toMin(today.close);
    if (mins >= o && (c <= o || mins < c)) return { open: true, closes: today.close };
    if (mins < o) return { open: false, when: 'today', at: today.open };
  }
  for (let i = 1; i <= 7; i++) {
    const d = week[(day + i) % 7];
    if (d.open) return { open: false, when: i === 1 ? 'tomorrow' : 'on ' + d.day, at: d.open };
  }
  return { open: false };
}

/** Current weekday + minutes in the cafe's timezone, regardless of the visitor's timezone. */
export function zonedNow(timeZone: string, now = new Date()) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short', hour: 'numeric', minute: 'numeric', hourCycle: 'h23' })
      .formatToParts(now).map((x) => [x.type, x.value]),
  );
  return {
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(p.weekday),
    mins: (+p.hour % 24) * 60 + +p.minute,
  };
}
