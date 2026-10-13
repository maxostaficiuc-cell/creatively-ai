-- Creatively.ai — migration 013: early-customer reward (10,000 bonus credits)
-- Run once in Supabase (SQL Editor → New query → paste → Run). Safe to run again.
-- It only ADDS a column, two tables, functions and a trigger. Nothing is deleted
-- and no balance changes when you run it.
--
-- HOW IT WORKS
-- 1. Eligibility (recorded, never guessed): an account is an "early customer"
--    when it has a verified paid subscription (subscription_status = 'active',
--    which only the signed Whop webhook can set) BEFORE the reward program
--    launches. A trigger records a 'reserved' row the moment that happens;
--    the backfill below records everyone who already qualifies today.
-- 2. Nothing is credited until the program is launched, which happens only
--    when ad-account integrations actually go live (see /admin/rewards — the
--    launch button is disabled until an integration is configured and live).
-- 3. grant_reward() is idempotent: one row per user per program, and a
--    row can move from 'reserved' to 'granted' exactly once. The row itself is
--    the audit record (amount, granted_at, balance_after).
-- 4. Bonus credits are tracked in profiles.bonus_credits so weekly resets keep
--    any unspent bonus on top of the normal allowance (see lib/profile.ts).

-- ── 1. Bonus balance (server-only; migration-011 already blocks browser writes) ──
alter table public.profiles
  add column if not exists bonus_credits integer not null default 0;
do $$ begin
  alter table public.profiles add constraint profiles_bonus_credits_nonneg check (bonus_credits >= 0);
exception when duplicate_object then null; end $$;

-- ── 2. Programs ─────────────────────────────────────────────────────────────
create table if not exists public.reward_programs (
  id text primary key,
  amount integer not null check (amount > 0),
  description text not null,
  launched_at timestamptz,            -- null until integrations launch; no grants before this
  created_at timestamptz not null default now()
);

insert into public.reward_programs (id, amount, description)
values ('early_ad_integrations', 10000,
        'Early customers: 10,000 bonus credits when ad-account integrations become available.')
on conflict (id) do nothing;

alter table public.reward_programs enable row level security;
drop policy if exists "Signed-in users can read reward programs" on public.reward_programs;
create policy "Signed-in users can read reward programs"
  on public.reward_programs for select to authenticated using (true);

-- ── 3. Per-user reservations / grants (also the audit record) ───────────────
create table if not exists public.reward_grants (
  id uuid primary key default gen_random_uuid(),
  program_id text not null references public.reward_programs (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  status text not null default 'reserved' check (status in ('reserved', 'granted', 'void')),
  amount integer not null check (amount > 0),
  reason text not null,
  reserved_at timestamptz not null default now(),
  granted_at timestamptz,
  balance_after integer,
  unique (program_id, user_id)
);

alter table public.reward_grants enable row level security;
drop policy if exists "Users can view their own rewards" on public.reward_grants;
create policy "Users can view their own rewards"
  on public.reward_grants for select to authenticated using (auth.uid() = user_id);
-- No insert/update/delete policies: only the trigger and functions below write here.

-- ── 4. Record eligibility the moment a verified payment activates an account ──
create or replace function public.reserve_early_customer_reward()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  p public.reward_programs;
begin
  if new.subscription_status = 'active'
     and (tg_op = 'INSERT' or old.subscription_status is distinct from 'active') then
    select * into p from public.reward_programs where id = 'early_ad_integrations';
    if found and p.launched_at is null then
      insert into public.reward_grants (program_id, user_id, amount, reason)
      values (p.id, new.id, p.amount, 'paid_subscription_before_launch')
      on conflict (program_id, user_id) do nothing;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists zz_reserve_early_customer_reward on public.profiles;
create trigger zz_reserve_early_customer_reward
  after insert or update of subscription_status on public.profiles
  for each row execute function public.reserve_early_customer_reward();

-- Backfill: everyone who is a paying customer now, or has had a verified
-- Whop membership attached before (whop_membership_id is only set by the webhook).
insert into public.reward_grants (program_id, user_id, amount, reason)
select 'early_ad_integrations', pr.id, rp.amount,
       case when pr.subscription_status = 'active' then 'paid_subscription_before_launch'
            else 'previous_paid_membership_before_launch' end
from public.profiles pr
cross join public.reward_programs rp
where rp.id = 'early_ad_integrations'
  and rp.launched_at is null
  and (pr.subscription_status = 'active' or pr.whop_membership_id is not null)
on conflict (program_id, user_id) do nothing;

-- ── 5. Grant (server only) ──────────────────────────────────────────────────
-- Credits one reserved reward. Only after launch, only to an account with an
-- active paid subscription (unpaid accounts always hold 0 credits by design;
-- their reservation stays and is granted on a later run once they're active).
create or replace function public.grant_reward(p_program_id text, p_user_id uuid)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  p public.reward_programs;
  g public.reward_grants;
  v_balance integer;
begin
  select * into p from public.reward_programs where id = p_program_id;
  if not found then return jsonb_build_object('status', 'no_program'); end if;
  if p.launched_at is null or p.launched_at > now() then
    return jsonb_build_object('status', 'not_launched');
  end if;

  select * into g from public.reward_grants
   where program_id = p_program_id and user_id = p_user_id
   for update;
  if not found then return jsonb_build_object('status', 'not_eligible'); end if;
  if g.status = 'granted' then
    return jsonb_build_object('status', 'already_granted', 'granted_at', g.granted_at, 'amount', g.amount);
  end if;
  if g.status <> 'reserved' then return jsonb_build_object('status', g.status); end if;

  update public.profiles
     set ai_credits = ai_credits + g.amount,
         bonus_credits = bonus_credits + g.amount
   where id = p_user_id and subscription_status = 'active'
  returning ai_credits into v_balance;
  if not found then return jsonb_build_object('status', 'inactive'); end if;

  update public.reward_grants
     set status = 'granted', granted_at = now(), balance_after = v_balance
   where id = g.id;

  return jsonb_build_object('status', 'granted', 'amount', g.amount, 'balance', v_balance);
end;
$$;

-- Marks the program launched (once) and grants every reserved reward it can.
-- Safe to run again later: already-granted rows are skipped, and reservations
-- for accounts that were inactive last time are granted if they're active now.
create or replace function public.launch_reward_program(p_program_id text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  r record;
  res jsonb;
  v_granted integer := 0;
  v_waiting integer := 0;
begin
  update public.reward_programs set launched_at = now()
   where id = p_program_id and launched_at is null;
  if not exists (select 1 from public.reward_programs where id = p_program_id) then
    return jsonb_build_object('status', 'no_program');
  end if;

  for r in select user_id from public.reward_grants where program_id = p_program_id and status = 'reserved' loop
    res := public.grant_reward(p_program_id, r.user_id);
    if res->>'status' = 'granted' then v_granted := v_granted + 1; else v_waiting := v_waiting + 1; end if;
  end loop;

  return jsonb_build_object('status', 'ok', 'granted_now', v_granted, 'still_reserved', v_waiting);
end;
$$;

revoke all on function public.grant_reward(text, uuid) from public, anon, authenticated;
revoke all on function public.launch_reward_program(text) from public, anon, authenticated;
revoke all on function public.reserve_early_customer_reward() from public, anon, authenticated;
grant execute on function public.grant_reward(text, uuid) to service_role;
grant execute on function public.launch_reward_program(text) to service_role;
