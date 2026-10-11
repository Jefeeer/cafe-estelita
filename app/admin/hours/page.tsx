'use client';

import { useEffect, useState } from 'react';
import type { HoursRow } from '@/lib/supabase';
import { fmtTime } from '@/lib/hours';
import { Icon, PageHeader, HoursSkeleton, Toggle, btn, input, useAdmin, useRows } from '../ui';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // show Monday first

export default function HoursPage() {
  const admin = useAdmin();
  const { rows, reload } = useRows<HoursRow>('hours', 'dow');
  const [week, setWeek] = useState<HoursRow[] | null>(null);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- editable copy of the loaded rows
  useEffect(() => { if (rows) setWeek(DAYS.map((_, dow) => rows.find((r) => r.dow === dow) ?? { dow, open: null, close: null })); }, [rows]);

  if (!week) return <><PageHeader title="Opening Hours" desc="Used for the “Open now” badge, the hours table and Google." /><HoursSkeleton /></>;

  const dirty = JSON.stringify(week) !== JSON.stringify(DAYS.map((_, dow) => rows!.find((r) => r.dow === dow) ?? { dow, open: null, close: null }));
  const set = (dow: number, patch: Partial<HoursRow>) => setWeek(week.map((d) => (d.dow === dow ? { ...d, ...patch } : d)));
  const copyToAll = (src: HoursRow) => setWeek(week.map((d) => ({ ...d, open: src.open, close: src.close })));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    if (await admin.save(() => admin.db.from('hours').upsert(week), 'Opening hours updated')) reload();
    setSaving(false);
  };

  return (
    <form onSubmit={submit}>
      <PageHeader title="Opening Hours" desc="Used for the “Open now” badge, the hours table and Google. Times are Philippine time; a closing time after midnight is fine (e.g. 3 PM – 1 AM).">
        <button type="submit" className={btn.primary} disabled={!dirty || saving}>{saving ? 'Saving…' : dirty ? 'Save hours' : 'Saved'}</button>
      </PageHeader>

      <ul className="divide-y divide-black/5 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5">
        {ORDER.map((dow) => {
          const d = week[dow];
          const isOpen = d.open !== null;
          return (
            <li key={dow} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 p-4 md:grid-cols-[9rem_8rem_1fr_auto]">
              <span className="font-semibold">{DAYS[dow]}</span>
              <span className="md:order-none">
                <Toggle checked={isOpen} label={isOpen ? 'Open' : 'Closed'}
                  onChange={(v) => set(dow, v ? { open: '15:00', close: '23:00' } : { open: null, close: null })} />
              </span>
              {isOpen ? (
                <span className="col-span-2 flex items-center gap-2 md:col-span-1">
                  <label className="sr-only" htmlFor={`o${dow}`}>{DAYS[dow]} opening time</label>
                  <input id={`o${dow}`} type="time" required className={`${input} min-w-0 flex-1 md:w-36 md:flex-none`} value={d.open ?? ''} onChange={(e) => set(dow, { open: e.target.value })} />
                  <span className="flex-none text-ink/50">to</span>
                  <label className="sr-only" htmlFor={`c${dow}`}>{DAYS[dow]} closing time</label>
                  <input id={`c${dow}`} type="time" required className={`${input} min-w-0 flex-1 md:w-36 md:flex-none`} value={d.close ?? ''} onChange={(e) => set(dow, { close: e.target.value })} />
                </span>
              ) : <span className="col-span-2 text-sm text-ink/55 md:col-span-1">Closed all day</span>}
              <button type="button" onClick={() => copyToAll(d)} className="col-span-2 min-h-9 justify-self-start text-sm font-medium text-evergreen underline-offset-4 hover:underline md:col-span-1 md:justify-self-end">
                Copy to all days
              </button>
              {d.open && d.close && d.close <= d.open && <p className="col-span-2 text-[13px] text-ink/60 md:col-span-4 md:pl-[19rem]">Closes after midnight — {fmtTime(d.close)} the next morning.</p>}
            </li>
          );
        })}
      </ul>
      {dirty && <p className="mt-4 flex items-center gap-2 text-sm text-amber-800"><Icon name="alert" className="h-4 w-4" />You have unsaved changes.</p>}
    </form>
  );
}
