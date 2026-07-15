-- 50 Days of Hardware — Supabase setup.
-- Paste this WHOLE file into the SQL editor, then Run (make sure nothing is
-- highlighted, or it only runs the selection). Safe to run more than once.
--
-- Single-user app with no auth: anon gets full access. The anon key + project
-- URL are the only gate, so don't share the deployed URL widely.

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
  purchased boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists resources (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  url text not null default '',
  created_at timestamptz not null default now()
);

-- ── Row-level security: allow anon full access (no auth) ───────────────────

alter table day_notes enable row level security;
alter table shopping_items enable row level security;
alter table resources enable row level security;

drop policy if exists "anon all" on day_notes;
drop policy if exists "anon all" on shopping_items;
drop policy if exists "anon all" on resources;

create policy "anon all" on day_notes for all using (true) with check (true);
create policy "anon all" on shopping_items for all using (true) with check (true);
create policy "anon all" on resources for all using (true) with check (true);

-- ── Storage: public bucket for pasted/dropped note images ──────────────────

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "anon upload images" on storage.objects;
drop policy if exists "anon read images" on storage.objects;

create policy "anon upload images" on storage.objects
  for insert with check (bucket_id = 'images');
create policy "anon read images" on storage.objects
  for select using (bucket_id = 'images');
