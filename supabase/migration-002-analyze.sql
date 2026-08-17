-- Creatively.ai — migration 002: real credits + real creative analysis
-- Run this in the Supabase SQL editor (Table Editor -> SQL Editor -> New query).

-- 1. Add credit balance + notification preference to profiles
alter table public.profiles
  add column if not exists ai_credits integer not null default 10000,
  add column if not exists notifications_enabled boolean not null default true;

-- 2. Table to store every analyzed creative
create table if not exists public.creatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  file_url text not null,
  file_type text not null check (file_type in ('image', 'video')),
  platform text,
  score integer,
  summary text,
  whats_working text,
  whats_not text,
  what_to_test text,
  credits_used integer not null default 0,
  is_simulated boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.creatives enable row level security;

create policy "Users can view their own creatives"
  on public.creatives for select
  using (auth.uid() = user_id);

create policy "Users can insert their own creatives"
  on public.creatives for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own creatives"
  on public.creatives for delete
  using (auth.uid() = user_id);

-- 3. Storage policies for the 'creatives' bucket.
-- IMPORTANT: Before running this section, create the bucket first:
-- Supabase dashboard -> Storage -> New bucket -> name it exactly "creatives" -> Private (not public).
-- Then come back and run the policies below.

create policy "Users can upload to their own folder"
  on storage.objects for insert
  with check (
    bucket_id = 'creatives'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can view their own files"
  on storage.objects for select
  using (
    bucket_id = 'creatives'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own files"
  on storage.objects for delete
  using (
    bucket_id = 'creatives'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
