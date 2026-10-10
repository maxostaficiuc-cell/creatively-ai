-- Creatively.ai — migration 007: real Whop membership cancellation support.
--
-- Needed to actually call Whop's cancel API (which requires the specific
-- membership ID, not just the user's email) and to track a pending
-- cancellation so the UI can say "cancelling — access until <date>"
-- without touching subscription_status or credits early.

alter table public.profiles
  add column if not exists whop_membership_id text,
  add column if not exists cancel_at_period_end boolean not null default false;
