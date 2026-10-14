-- Creatively.ai — migration 015: Creative Strategy
-- Run once in Supabase (SQL Editor → New query → paste → Run). Safe to run again.
-- Only ADDS tables and columns; nothing existing is changed or deleted.
--
-- brand_strategies     one row per analysis version (re-running or editing makes a new
--                      version linked by parent_id, so earlier work is never overwritten)
-- strategy_generations one row per generated ad image (with its copy, options, status,
--                      and the credit ledger request it was charged under)
-- creatives.*          lets a generated ad be saved into My Creatives

create table if not exists public.brand_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  parent_id uuid references public.brand_strategies (id) on delete set null,
  version integer not null default 1,
  website_url text,
  social_url text,
  user_context jsonb not null default '{}'::jsonb,   -- optional details the user typed
  sources jsonb not null default '[]'::jsonb,        -- what was (and wasn't) retrieved, per source
  brand_profile jsonb,                               -- extracted profile, each field marked verified / inferred / assumption / confirmed
  audience jsonb,                                    -- audience segments
  opportunities jsonb,                               -- advertising opportunities
  concepts jsonb,                                    -- recommended ad concepts
  status text not null default 'profiled' check (status in ('profiled', 'audience', 'ready', 'failed')),
  brand_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint brand_strategies_has_source check (website_url is not null or social_url is not null)
);

create index if not exists brand_strategies_user_idx on public.brand_strategies (user_id, created_at desc);

alter table public.brand_strategies enable row level security;
drop policy if exists "Users can view their own strategies" on public.brand_strategies;
create policy "Users can view their own strategies"
  on public.brand_strategies for select to authenticated using (auth.uid() = user_id);
-- No insert/update/delete policies: the server writes these after checking ownership.

create table if not exists public.strategy_generations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  strategy_id uuid not null references public.brand_strategies (id) on delete cascade,
  concept_id text not null,
  batch_id uuid not null,
  variation integer not null,
  request_id text not null,                          -- credit ledger request id (one charge per image, retry-safe)
  status text not null default 'pending' check (status in ('pending', 'generating', 'completed', 'failed')),
  spec jsonb not null,                               -- headline, primary_text, cta, visual_direction
  options jsonb not null,                            -- aspect_ratio, style, text_density, brand_consistency, platform
  image_path text,
  image_mime text,
  model text,
  credits_charged integer not null default 0,
  credit_transaction_id uuid,
  error text,
  attempts integer not null default 0,
  saved_creative_id uuid references public.creatives (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_id)
);

create index if not exists strategy_generations_strategy_idx on public.strategy_generations (strategy_id, created_at desc);

alter table public.strategy_generations enable row level security;
drop policy if exists "Users can view their own generations" on public.strategy_generations;
create policy "Users can view their own generations"
  on public.strategy_generations for select to authenticated using (auth.uid() = user_id);

-- Saving a generated ad into My Creatives
alter table public.creatives
  add column if not exists source text not null default 'analysis',
  add column if not exists strategy_id uuid references public.brand_strategies (id) on delete set null,
  add column if not exists generation_id uuid references public.strategy_generations (id) on delete set null,
  add column if not exists ad_copy jsonb;

create unique index if not exists creatives_generation_id_key on public.creatives (generation_id) where generation_id is not null;
