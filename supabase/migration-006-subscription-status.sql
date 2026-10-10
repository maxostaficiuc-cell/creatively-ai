-- Creatively.ai — migration 006: real subscription status as the source
-- of truth for credit allocation.
--
-- CRITICAL BUG THIS FIXES: profiles.plan previously defaulted to 'Pro' at
-- the database level, and the weekly-credit-reset logic (lib/profile.ts)
-- granted real credits based purely on that column — with NO check that
-- the user had ever actually paid. Every new signup got free real access.
-- Onboarding then downgraded that to 'Starter', which is the specific
-- symptom you saw, but the underlying gap was worse than that one symptom.
--
-- From now on, subscription_status is the only thing that gates whether
-- credits get allocated at all. Only the Whop webhook — after verifying a
-- real signature and a real payment event — is allowed to set it to
-- 'active'.

alter table public.profiles
  add column if not exists subscription_status text not null default 'unpaid'
  check (subscription_status in ('unpaid', 'active', 'cancelled', 'past_due'));

-- New signups should no longer default to a paid tier at the database
-- level either — Starter is just the lowest tier label, not paid access
-- by itself now that subscription_status gates credits.
alter table public.profiles alter column plan set default 'Starter';

-- ─────────────────────────────────────────────────────────────────────────
-- IMPORTANT — READ BEFORE RUNNING THE BLOCK BELOW:
--
-- Every existing profile row defaults to 'unpaid' under this migration,
-- INCLUDING any real customer who already legitimately paid before this
-- fix went in. Because the bug this migration closes meant plan/credits
-- were previously granted without verifying payment, we can't safely
-- assume an existing plan='Pro' or plan='Business' row is a real payment
-- versus something that fell through the bug.
--
-- If you know of specific real, paying customers (yourself included, if
-- you completed a real Whop checkout while testing), find their row and
-- run this manually with their real email:
--
--   update public.profiles set subscription_status = 'active'
--   where email = 'the-real-customer-email@example.com';
--
-- Do not bulk-backfill everyone to 'active' — that would just reintroduce
-- the same bug this migration is fixing.
-- ─────────────────────────────────────────────────────────────────────────
