-- Casa Estelita — content tables for the /admin dashboard.
-- Run once in the Supabase SQL editor (safe to re-run).

-- Who may edit. Add a row here for every staff login (see README).
create table if not exists public.admins (
  user_id uuid primary key references auth.users on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

drop policy if exists "admins read self" on public.admins;
create policy "admins read self" on public.admins for select to authenticated using (user_id = auth.uid());

-- Deals & bundles
create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(title) between 1 and 80),
  description text not null default '' check (length(description) <= 400),
  includes text[] not null default '{}',
  price numeric(10,2) not null check (price >= 0),
  original_price numeric(10,2) check (original_price is null or original_price >= 0),
  badge text not null default '' check (length(badge) <= 30),
  image_url text not null default '',
  starts_on date,
  ends_on date check (ends_on is null or starts_on is null or ends_on >= starts_on),
  active boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Menu
create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (length(category) between 1 and 40),
  name text not null check (length(name) between 1 and 80),
  description text not null default '' check (length(description) <= 300),
  price numeric(10,2) not null check (price >= 0),
  tags text[] not null default '{}',
  image_url text not null default '',
  image_alt text not null default '',
  signature boolean not null default false,
  available boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists deals_touch on public.deals;
create trigger deals_touch before update on public.deals for each row execute function public.touch_updated_at();
drop trigger if exists menu_touch on public.menu_items;
create trigger menu_touch before update on public.menu_items for each row execute function public.touch_updated_at();

alter table public.deals enable row level security;
alter table public.menu_items enable row level security;

-- Visitors see only what's live; admins see and edit everything.
drop policy if exists "public read live deals" on public.deals;
create policy "public read live deals" on public.deals for select to anon, authenticated using (active or public.is_admin());
drop policy if exists "admins write deals" on public.deals;
create policy "admins write deals" on public.deals for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public read available menu" on public.menu_items;
create policy "public read available menu" on public.menu_items for select to anon, authenticated using (available or public.is_admin());
drop policy if exists "admins write menu" on public.menu_items;
create policy "admins write menu" on public.menu_items for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Photo uploads (public bucket, admin-only writes, 5 MB images)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

drop policy if exists "admins upload media" on storage.objects;
create policy "admins upload media" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "admins update media" on storage.objects;
create policy "admins update media" on storage.objects for update to authenticated using (bucket_id = 'media' and public.is_admin());
drop policy if exists "admins delete media" on storage.objects;
create policy "admins delete media" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.is_admin());

-- Gallery
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  src text not null,
  w int not null check (w > 0),
  h int not null check (h > 0),
  cat text not null check (cat in ('Vibe','Coffee','Food','Garden')),
  alt text not null default '' check (length(alt) <= 200),
  visible boolean not null default true,
  sort int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.gallery_photos enable row level security;
drop policy if exists "public read visible photos" on public.gallery_photos;
create policy "public read visible photos" on public.gallery_photos for select to anon, authenticated using (visible or public.is_admin());
drop policy if exists "admins write photos" on public.gallery_photos;
create policy "admins write photos" on public.gallery_photos for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Opening hours, Manila time. dow 0 = Sunday. Both null = closed that day.
create table if not exists public.hours (
  dow int primary key check (dow between 0 and 6),
  open text check (open ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  close text check (close ~ '^([01]\d|2[0-3]):[0-5]\d$'),
  check ((open is null) = (close is null))
);
alter table public.hours enable row level security;
drop policy if exists "public read hours" on public.hours;
create policy "public read hours" on public.hours for select to anon, authenticated using (true);
drop policy if exists "admins write hours" on public.hours;
create policy "admins write hours" on public.hours for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Editable categories (menu tabs and gallery filters). Renaming cascades to items;
-- a category that still has items can't be deleted.
create table if not exists public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 1 and 40),
  sort int not null default 0
);
create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(name) between 1 and 40),
  sort int not null default 0
);
insert into public.menu_categories (name, sort)
  select category, min(sort) from public.menu_items group by category on conflict (name) do nothing;
insert into public.gallery_categories (name, sort)
  values ('Vibe',0),('Coffee',1),('Food',2),('Garden',3) on conflict (name) do nothing;
insert into public.gallery_categories (name, sort)
  select distinct cat, 100 from public.gallery_photos on conflict (name) do nothing;

alter table public.menu_items drop constraint if exists menu_items_category_fkey;
alter table public.menu_items add constraint menu_items_category_fkey
  foreign key (category) references public.menu_categories(name) on update cascade on delete restrict;
alter table public.gallery_photos drop constraint if exists gallery_photos_cat_check;
alter table public.gallery_photos drop constraint if exists gallery_photos_cat_fkey;
alter table public.gallery_photos add constraint gallery_photos_cat_fkey
  foreign key (cat) references public.gallery_categories(name) on update cascade on delete restrict;

alter table public.menu_categories enable row level security;
alter table public.gallery_categories enable row level security;
drop policy if exists "public read menu categories" on public.menu_categories;
create policy "public read menu categories" on public.menu_categories for select to anon, authenticated using (true);
drop policy if exists "admins write menu categories" on public.menu_categories;
create policy "admins write menu categories" on public.menu_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "public read gallery categories" on public.gallery_categories;
create policy "public read gallery categories" on public.gallery_categories for select to anon, authenticated using (true);
drop policy if exists "admins write gallery categories" on public.gallery_categories;
create policy "admins write gallery categories" on public.gallery_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- "Sold out" keeps an item on the website with a tag; available = false hides it entirely.
alter table public.menu_items add column if not exists sold_out boolean not null default false;
