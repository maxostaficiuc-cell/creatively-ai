-- Creatively.ai — migration 004: Whop payment webhook idempotency
-- Run this in the Supabase SQL editor for your project.

create table if not exists public.webhook_events (
  id text primary key,
  type text not null,
  processed_at timestamptz not null default now()
);

-- This table is only ever touched by the webhook route using the service
-- role key, which bypasses RLS entirely — so no policies are needed here.
-- RLS is still enabled as a safety default (deny-by-default for any other
-- access path).
alter table public.webhook_events enable row level security;
