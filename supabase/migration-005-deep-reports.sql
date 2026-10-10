-- Creatively.ai — migration 005: deep creative reports + free public report flow
-- Run this in the Supabase SQL editor for your project.

-- 1. Store the full, deep report (signal breakdown, recommendations, etc.)
--    as flexible JSON alongside the existing summary fields. Also allow
--    creatives rows for unauthenticated free-report leads (user_id nullable,
--    lead_name/lead_email capture who they were).
alter table public.creatives
  add column if not exists report jsonb,
  add column if not exists is_free_report boolean not null default false,
  add column if not exists lead_name text,
  add column if not exists lead_email text;

alter table public.creatives alter column user_id drop not null;

alter table public.creatives
  add constraint creatives_user_or_free_report check (
    user_id is not null or is_free_report = true
  );

-- 2. Server-side free-report eligibility tracking. Never exposed to the
-- browser — only written to and read from via the service-role client.
-- Stores HASHES only, never raw IP/email/device values.
create table if not exists public.free_report_claims (
  id uuid primary key default gen_random_uuid(),
  email_hash text not null,
  ip_hash text not null,
  device_hash text not null,
  cookie_token_hash text,
  creative_id uuid references public.creatives (id) on delete set null,
  status text not null default 'completed' check (status in ('completed', 'blocked')),
  created_at timestamptz not null default now()
);

create index if not exists free_report_claims_email_hash_idx on public.free_report_claims (email_hash);
create index if not exists free_report_claims_ip_hash_idx on public.free_report_claims (ip_hash);
create index if not exists free_report_claims_device_hash_idx on public.free_report_claims (device_hash);

-- RLS enabled with no public policies — this table is only ever touched
-- via the service-role client (lib/supabase/admin.ts), same pattern as
-- webhook_events.
alter table public.free_report_claims enable row level security;
