-- Creatively.ai — migration 003: weekly credits + ad account connections
-- Run this in the Supabase SQL editor for your project.

-- 1. Weekly credit reset tracking
alter table public.profiles
  add column if not exists credits_reset_at timestamptz not null default (now() + interval '7 days');

-- 2. Connected advertising accounts (Meta now, TikTok/Google architecture-ready)
create table if not exists public.ad_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  platform text not null check (platform in ('meta', 'tiktok', 'google')),
  external_account_id text,
  account_name text,
  access_token text,
  token_expires_at timestamptz,
  status text not null default 'connected' check (status in ('connected', 'error', 'disconnected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform)
);

alter table public.ad_accounts enable row level security;

create policy "Users can view their own ad accounts"
  on public.ad_accounts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own ad accounts"
  on public.ad_accounts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own ad accounts"
  on public.ad_accounts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own ad accounts"
  on public.ad_accounts for delete
  using (auth.uid() = user_id);

create trigger on_ad_accounts_updated
  before update on public.ad_accounts
  for each row execute procedure public.handle_updated_at();
