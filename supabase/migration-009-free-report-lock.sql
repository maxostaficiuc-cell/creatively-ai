-- Migration 009 — prevent duplicate free reports from rapid / parallel submits.
--
-- The free-report API now writes a short-lived 'pending' claim BEFORE running
-- the analysis and turns it into 'completed' afterwards (or deletes it if the
-- analysis fails). The unique index below makes a second, simultaneous request
-- for the same email fail instantly instead of producing a second report.
--
-- Safe to run more than once. Until it is run, the API simply skips the lock
-- (the existing eligibility checks still apply).

alter table public.free_report_claims
  drop constraint if exists free_report_claims_status_check;

alter table public.free_report_claims
  add constraint free_report_claims_status_check
  check (status in ('pending', 'completed', 'blocked'));

create unique index if not exists free_report_claims_one_pending_per_email
  on public.free_report_claims (email_hash)
  where status = 'pending';
