-- 50 Days of Hardware — run this once in the Supabase SQL editor.
-- Single-user app with no auth: anon gets full access. The anon key +
-- project URL are the only gate, so don't share the deployed URL widely.

create table if not exists day_notes (
  day int primary key,
  content text not null default '',
  updated_at timestamptz not null default now()
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

alter table day_notes enable row level security;
alter table shopping_items enable row level security;
alter table resources enable row level security;

create policy "anon all" on day_notes for all using (true) with check (true);
create policy "anon all" on shopping_items for all using (true) with check (true);
create policy "anon all" on resources for all using (true) with check (true);

-- Public bucket for pasted/dropped note images.
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "anon upload images" on storage.objects
  for insert with check (bucket_id = 'images');
create policy "anon read images" on storage.objects
  for select using (bucket_id = 'images');
