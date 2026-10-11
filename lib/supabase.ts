import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
export const supabaseConfigured = !!(url && key);

/** Server-side, anonymous: sees only what visitors may see (enforced by RLS). */
export const anonClient = () => createClient(url!, key!, { auth: { persistSession: false } });

/** Browser singleton for /admin — keeps the signed-in session in localStorage. */
let browser: SupabaseClient | undefined;
export const browserClient = () => (browser ??= createClient(url!, key!));

/* ---------- Row types (mirror supabase/schema.sql) ---------- */
export type Deal = {
  id: string; title: string; description: string; includes: string[];
  price: number; original_price: number | null; badge: string; image_url: string;
  starts_on: string | null; ends_on: string | null; active: boolean; sort: number; updated_at?: string;
};
export type MenuRow = {
  id: string; category: string; name: string; description: string; price: number; tags: string[];
  image_url: string; image_alt: string; signature: boolean; available: boolean; sort: number;
};
export type PhotoRow = { id: string; src: string; w: number; h: number; cat: string; alt: string; visible: boolean; sort: number };
export type CategoryRow = { id: string; name: string; sort: number };
export type HoursRow = { dow: number; open: string | null; close: string | null };

/** Today's date in Manila as YYYY-MM-DD (deal start/end dates are cafe-local). */
export const manilaToday = (now = new Date()) => now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

export type DealState = 'live' | 'scheduled' | 'ended' | 'paused';
export function dealState(d: Pick<Deal, 'active' | 'starts_on' | 'ends_on'>, today = manilaToday()): DealState {
  if (!d.active) return 'paused';
  if (d.starts_on && d.starts_on > today) return 'scheduled';
  if (d.ends_on && d.ends_on < today) return 'ended';
  return 'live';
}
