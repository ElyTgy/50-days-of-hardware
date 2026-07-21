-- 50 Days of Hardware — Supabase setup.
-- Paste this WHOLE file into the SQL editor, then Run (make sure nothing is
-- highlighted, or it only runs the selection). Safe to run more than once.
--
-- Access model: anyone can READ; only the owner (you, signed in with Google)
-- can WRITE. Editing is enforced here in the database, not just the UI.
-- >>> Set your Google account email in is_owner() below. <<<

-- ── Tables ────────────────────────────────────────────────────────────────

-- One notes row per (day, section): intro, activity, question, xpost, resources.
create table if not exists day_notes (
  day int not null,
  section text not null,
  content text not null default '',
  updated_at timestamptz not null default now(),
  primary key (day, section)
);

create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  part_name text not null default '',
  what_it_does text not null default '',
  days_required_for text not null default '',
  related_concepts text not null default '',
  link text not null default '',
  status text not null default 'not ordered',
  purchased boolean not null default false,
  created_at timestamptz not null default now()
);

-- Add the status column to tables created before it existed (safe on re-run).
alter table shopping_items
  add column if not exists status text not null default 'not ordered';

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  url text not null default '',
  created_at timestamptz not null default now()
);

-- ── Owner check ────────────────────────────────────────────────────────────
-- The one email allowed to edit. CHANGE THIS to your Google account email.
create or replace function public.is_owner() returns boolean
language sql stable as $$
  select coalesce(auth.jwt() ->> 'email', '') = 'yeganehtagh13@gmail.com'
$$;

-- ── Row-level security: anyone reads, only the owner writes ────────────────

alter table day_notes enable row level security;
alter table shopping_items enable row level security;
alter table resources enable row level security;

-- Drop older policies (both the previous open ones and these, so re-runs work).
drop policy if exists "anon all" on day_notes;
drop policy if exists "anon all" on shopping_items;
drop policy if exists "anon all" on resources;

do $$
declare t text;
begin
  foreach t in array array['day_notes', 'shopping_items', 'resources'] loop
    execute format('drop policy if exists "read" on %I', t);
    execute format('drop policy if exists "owner insert" on %I', t);
    execute format('drop policy if exists "owner update" on %I', t);
    execute format('drop policy if exists "owner delete" on %I', t);
    execute format('create policy "read" on %I for select using (true)', t);
    execute format('create policy "owner insert" on %I for insert with check (public.is_owner())', t);
    execute format('create policy "owner update" on %I for update using (public.is_owner()) with check (public.is_owner())', t);
    execute format('create policy "owner delete" on %I for delete using (public.is_owner())', t);
  end loop;
end $$;

-- ── Storage: public read, owner-only upload ────────────────────────────────

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "anon upload images" on storage.objects;
drop policy if exists "anon read images" on storage.objects;
drop policy if exists "read images" on storage.objects;
drop policy if exists "owner upload images" on storage.objects;

create policy "read images" on storage.objects
  for select using (bucket_id = 'images');
create policy "owner upload images" on storage.objects
  for insert with check (bucket_id = 'images' and public.is_owner());
