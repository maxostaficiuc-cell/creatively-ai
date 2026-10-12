-- Migration 010 — "pay first, create the account after" for the $1 Starter trial.
--
-- "Try for $1" now sends visitors straight to the Whop checkout. When Whop's
-- verified webhook arrives and NO account exists for the buyer's email yet,
-- the grant is parked here. It is applied automatically when an account with
-- that email exists AND its email address is confirmed — so nobody can claim
-- someone else's payment just by typing their email into the signup form.
--
-- Only the service role (the webhook) writes to this table; RLS has no policies.

create table if not exists public.pending_grants (
  email              text primary key,          -- lower-cased buyer email from Whop
  plan               text not null,
  credits            integer not null,
  whop_membership_id text,
  created_at         timestamptz not null default now()
);
alter table public.pending_grants enable row level security;

create or replace function public.apply_pending_grant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  g public.pending_grants;
begin
  if new.email_confirmed_at is null or new.email is null then
    return new;
  end if;

  select * into g from public.pending_grants where email = lower(new.email);
  if not found then
    return new;
  end if;

  update public.profiles
     set plan                 = g.plan,
         subscription_status  = 'active',
         ai_credits           = g.credits,
         credits_reset_at     = now() + interval '7 days',
         cancel_at_period_end = false,
         whop_membership_id   = coalesce(g.whop_membership_id, whop_membership_id)
   where id = new.id;

  if found then
    delete from public.pending_grants where email = g.email;
  end if;
  return new;
end;
$$;

-- Runs AFTER on_auth_user_created (trigger names fire alphabetically), so the
-- profile row already exists. Covers projects with email confirmation off
-- (confirmed at insert) and on (confirmed later).
drop trigger if exists zz_apply_pending_grant_on_insert on auth.users;
create trigger zz_apply_pending_grant_on_insert
  after insert on auth.users
  for each row execute function public.apply_pending_grant();

drop trigger if exists zz_apply_pending_grant_on_confirm on auth.users;
create trigger zz_apply_pending_grant_on_confirm
  after update of email_confirmed_at on auth.users
  for each row
  when (old.email_confirmed_at is null and new.email_confirmed_at is not null)
  execute function public.apply_pending_grant();
