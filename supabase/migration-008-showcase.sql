-- Migration 008 — Homepage "Know what makes an ad work" showcase.
--
-- Up to 10 admin-managed ad creatives shown in the rotating gallery on the
-- homepage. Public visitors can READ this table; nobody can write to it
-- through the anon/authenticated roles — all writes go through the server
-- route app/api/admin/showcase, which uses the service-role key after
-- checking the signed-in user against SHOWCASE_ADMIN_EMAILS.
--
-- BEFORE running: Supabase dashboard -> Storage -> New bucket ->
--   name it exactly "showcase" -> tick "Public bucket" -> Save.
-- (The images must be publicly readable because they appear on the homepage.)

create table if not exists public.showcase_creatives (
  id          uuid primary key default gen_random_uuid(),
  image_path  text not null,                       -- object path inside the "showcase" bucket
  image_url   text not null,                       -- public URL of that object
  width       integer not null check (width > 0),
  height      integer not null check (height > 0),
  score       integer not null default 80 check (score between 0 and 100),
  title       text,                                -- optional short title
  category    text,                                -- optional industry / category
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.showcase_creatives enable row level security;

-- Anyone (including logged-out visitors) can read the showcase.
drop policy if exists "Showcase is publicly readable" on public.showcase_creatives;
create policy "Showcase is publicly readable"
  on public.showcase_creatives for select
  using (true);

-- No insert/update/delete policies on purpose: only the service role (server) writes.

create index if not exists showcase_creatives_sort_idx on public.showcase_creatives (sort_order, created_at);

-- Public read access to the "showcase" storage bucket (uploads/deletes are server-only).
drop policy if exists "Showcase images are publicly readable" on storage.objects;
create policy "Showcase images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'showcase');
