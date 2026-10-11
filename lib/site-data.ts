import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';
import { MENU, GALLERY, HOURS, DEFAULT_CONTENT, mergeContent, type MenuItem, type Photo, type Day, type SiteContent } from './content';
import { anonClient, supabaseConfigured, dealState, type Deal, type MenuRow, type PhotoRow, type HoursRow, type CategoryRow } from './supabase';

export type SiteData = { deals: Deal[]; menu: Record<string, MenuItem[]>; gallery: Photo[]; galleryCats: string[]; week: Day[]; content: SiteContent };

const fallback: SiteData = { deals: [], menu: MENU, gallery: GALLERY, galleryCats: [...new Set(GALLERY.map((g) => g.cat))], week: HOURS.week, content: DEFAULT_CONTENT };

/** Everything the admin can edit. Cached; /admin saves call updateTag('site'). Falls back to lib/content.ts if the DB is unreachable. */
export async function getSiteData(): Promise<SiteData> {
  'use cache';
  cacheTag('site');
  cacheLife('hours'); // also rolls deals over at their start/end dates without a save
  if (!supabaseConfigured) return fallback;

  const db = anonClient();
  const [deals, menu, photos, hours, menuCats, galCats, page] = await Promise.all([
    db.from('deals').select('*').order('sort'),
    db.from('menu_items').select('*').order('sort'),
    db.from('gallery_photos').select('*').order('sort'),
    db.from('hours').select('*').order('dow'),
    db.from('menu_categories').select('*').order('sort'),
    db.from('gallery_categories').select('*').order('sort'),
    db.from('site_content').select('data').eq('id', 1).maybeSingle(),
  ]);
  const err = deals.error || menu.error || photos.error || hours.error || menuCats.error || galCats.error || page.error;
  if (err) {
    console.error('[site-data] falling back to lib/content.ts:', err.message);
    return fallback;
  }

  // tabs follow the category order set in /admin; empty categories are skipped
  const grouped: Record<string, MenuItem[]> = {};
  for (const c of menuCats.data as CategoryRow[]) grouped[c.name] = [];
  for (const m of menu.data as MenuRow[]) {
    (grouped[m.category] ??= []).push({
      name: m.name, price: Number(m.price), desc: m.description, tags: m.tags, img: m.image_url, alt: m.image_alt || m.name, signature: m.signature, soldOut: m.sold_out,
    });
  }
  const rows = hours.data as HoursRow[];

  return {
    deals: (deals.data as Deal[]).filter((d) => dealState(d) === 'live').map((d) => ({ ...d, price: Number(d.price), original_price: d.original_price === null ? null : Number(d.original_price) })),
    menu: Object.fromEntries(Object.entries(grouped).filter(([, items]) => items.length)),
    gallery: (photos.data as PhotoRow[]).map(({ src, w, h, cat, alt }) => ({ src, w, h, cat, alt })),
    galleryCats: (galCats.data as CategoryRow[]).map((c) => c.name).filter((n) => (photos.data as PhotoRow[]).some((p) => p.cat === n)),
    content: mergeContent(DEFAULT_CONTENT, page.data?.data),
    week: rows.length === 7 ? HOURS.week.map((d, i) => ({ day: d.day, open: rows[i].open, close: rows[i].close })) : HOURS.week,
  };
}
