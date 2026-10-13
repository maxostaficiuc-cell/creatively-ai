-- Creatively.ai — migration 012: Winning Ads library
-- Run once in Supabase (SQL Editor → New query → paste → Run). Safe to run again.
-- Then run supabase/seed-winning-ads.sql to add the curated examples.
--
-- The library is curated inspiration, stored separately from users' own
-- analyses (public.creatives). Browsing it never touches credits or history.
-- Only the server (service role, via /admin/library) can add or change entries.

create table if not exists public.library_creatives (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  brand text not null,
  title text not null,
  industry text not null,
  platform text not null,
  format text not null check (format in ('image', 'video', 'carousel')),
  angles text[] not null default '{}',
  summary text not null,
  hook text,
  visual_strategy text,
  offer text,
  messaging text,
  cta text,
  why_study text,
  test_idea text,
  preview_kind text not null default 'none' check (preview_kind in ('youtube', 'image', 'none')),
  youtube_id text,
  image_url text,
  image_width integer,
  image_height integer,
  headline text,
  source_url text not null check (source_url ~ '^https://'),
  source_label text,
  attribution text,
  year integer check (year is null or year between 1850 and 2100),
  label text not null default 'inspiration' check (label in ('verified_winner', 'strong_structure', 'inspiration')),
  evidence_url text,
  evidence_note text,
  is_published boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- "Verified Winner" is only allowed with a linked, quoted source.
  constraint library_verified_needs_evidence
    check (label <> 'verified_winner' or (evidence_url ~ '^https://' and length(coalesce(evidence_note, '')) > 10)),
  constraint library_youtube_needs_id
    check (preview_kind <> 'youtube' or youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  constraint library_image_needs_url
    check (preview_kind <> 'image' or image_url ~ '^https://')
);

create index if not exists library_creatives_published_idx
  on public.library_creatives (is_published, sort_order, created_at desc);

alter table public.library_creatives enable row level security;

drop policy if exists "Signed-in users can browse the published library" on public.library_creatives;
create policy "Signed-in users can browse the published library"
  on public.library_creatives for select
  to authenticated
  using (is_published);
-- No insert/update/delete policies: only the service role (admin tools) writes.

-- Saved / bookmarked library items, one row per user + item.
create table if not exists public.library_saves (
  user_id uuid not null references auth.users (id) on delete cascade,
  creative_id uuid not null references public.library_creatives (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, creative_id)
);

alter table public.library_saves enable row level security;

drop policy if exists "Users can view their own saves" on public.library_saves;
create policy "Users can view their own saves"
  on public.library_saves for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users can save library items" on public.library_saves;
create policy "Users can save library items"
  on public.library_saves for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users can remove their saves" on public.library_saves;
create policy "Users can remove their saves"
  on public.library_saves for delete to authenticated using (auth.uid() = user_id);
