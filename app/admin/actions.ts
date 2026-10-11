'use server';

import { updateTag } from 'next/cache';
import { createClient } from '@supabase/supabase-js';

/** Called after every admin save so the public site shows the change on the next visit. */
export async function publishSite(accessToken: string) {
  // Verify the caller is a signed-in admin (RLS on `admins` only returns your own row).
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
  const { data: { user } } = await db.auth.getUser(accessToken);
  if (!user) return { ok: false };
  const { data } = await db.from('admins').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!data) return { ok: false };
  updateTag('site');
  return { ok: true };
}
