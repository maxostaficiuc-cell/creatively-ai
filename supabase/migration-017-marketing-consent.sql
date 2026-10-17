-- Migration 017 — record of explicit marketing-email consent.
--
-- One row per email address that ticked an (unticked-by-default) "email me"
-- box: the free-report form or the sign-up form. The app then adds that person
-- to Loops (on the marketing mailing list) and notes here whether the sync
-- worked, so a failed sync can be retried from the admin console.
--
-- People who never ticked a box are never written here and never sent to Loops
-- as marketing contacts. Unsubscribes are handled by Loops; the app never
-- resubscribes anyone.
--
-- Only the server (service role) reads or writes this table: RLS is on with no
-- policies, so browsers can't read or change it.
--
-- Safe to run more than once. Undo: drop table public.marketing_consents;

create table if not exists public.marketing_consents (
  email             text primary key check (email = lower(email) and position('@' in email) > 1),
  full_name         text,
  user_id           uuid references auth.users (id) on delete set null,
  source            text not null,                -- where they FIRST agreed: free_report | signup
  last_source       text not null,                -- where they most recently agreed
  consent_text      text not null,                -- the exact checkbox wording they agreed to
  consented_at      timestamptz not null default now(),
  last_consented_at timestamptz not null default now(),
  loops_synced_at   timestamptz,                  -- last successful sync to Loops
  loops_error       text,                         -- last sync error (null after a success)
  updated_at        timestamptz not null default now()
);

create index if not exists marketing_consents_unsynced_idx
  on public.marketing_consents (updated_at)
  where loops_synced_at is null or loops_error is not null;

alter table public.marketing_consents enable row level security;
-- No policies: service role only.
