-- Creatively.ai — migration 011: safe, atomic AI-credit charging
-- Run this once in the Supabase SQL editor (Dashboard → SQL Editor → New query → paste → Run).
-- It is safe to run more than once.
--
-- WHY
-- 1. SECURITY: the original "Users can update their own profile" policy let any
--    signed-in user update EVERY column of their own profile row straight from
--    the browser (the anon key is public). That includes ai_credits,
--    subscription_status and plan, so anyone could give themselves unlimited
--    credits or a paid status. Below, browser sessions may only update their
--    own name, avatar, notification and onboarding fields. Billing columns are
--    written only by the server (service role) and by the functions here.
-- 2. CREDIT SAFETY: credits used to be read, then written back in a separate
--    step, with no record of the charge. Two requests at once could both pass
--    the balance check, and a retry could charge twice. Now every analysis has
--    a ledger row keyed by a request id:
--      reserve  → credits leave the balance atomically, only if enough remain
--      settle   → the analysis was saved; the charge is final
--      release  → the analysis failed; the credits go straight back
--    A request that crashed mid-way (e.g. a function timeout) is released
--    automatically after 3 minutes.

-- ── 1. Ledger ───────────────────────────────────────────────────────────────
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  request_id text not null,
  amount integer not null check (amount > 0),
  media_type text,
  status text not null default 'reserved' check (status in ('reserved', 'settled', 'released')),
  creative_id uuid references public.creatives (id) on delete set null,
  balance_after integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, request_id)
);

create index if not exists credit_transactions_user_status_idx
  on public.credit_transactions (user_id, status, created_at);

alter table public.credit_transactions enable row level security;

drop policy if exists "Users can view their own credit transactions" on public.credit_transactions;
create policy "Users can view their own credit transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);
-- No insert/update/delete policies: only the functions below write here.

-- Links a saved report to the request that produced it (idempotent retries).
alter table public.creatives add column if not exists request_id text;
create unique index if not exists creatives_user_request_id_key
  on public.creatives (user_id, request_id) where request_id is not null;

-- ── 2. Functions (server only) ──────────────────────────────────────────────

-- Gives back credits held by requests that never finished (crash / timeout).
create or replace function public.release_stale_credit_reservations(p_user_id uuid)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  v_total integer;
begin
  with stale as (
    update public.credit_transactions
       set status = 'released', updated_at = now()
     where user_id = p_user_id
       and status = 'reserved'
       and created_at < now() - interval '3 minutes'
    returning amount
  )
  select coalesce(sum(amount), 0) into v_total from stale;

  if v_total > 0 then
    update public.profiles set ai_credits = ai_credits + v_total where id = p_user_id;
  end if;
  return v_total;
end;
$$;

-- Atomically takes p_amount credits for one analysis request.
-- Returns {status: reserved | completed | in_progress | insufficient | inactive | no_profile, ...}
create or replace function public.reserve_analysis_credits(
  p_user_id uuid,
  p_request_id text,
  p_amount integer,
  p_media_type text default null
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_tx public.credit_transactions;
  v_tx_id uuid;
  v_balance integer;
  v_status text;
begin
  if p_amount is null or p_amount <= 0 then
    raise exception 'invalid amount';
  end if;

  perform public.release_stale_credit_reservations(p_user_id);

  insert into public.credit_transactions (user_id, request_id, amount, media_type)
  values (p_user_id, p_request_id, p_amount, p_media_type)
  on conflict (user_id, request_id) do nothing
  returning id into v_tx_id;

  if v_tx_id is null then
    -- Same request seen before (double click, retry, or replay).
    select * into v_tx from public.credit_transactions
     where user_id = p_user_id and request_id = p_request_id
     for update;
    if v_tx.status = 'settled' then
      select ai_credits into v_balance from public.profiles where id = p_user_id;
      return jsonb_build_object('status', 'completed', 'creative_id', v_tx.creative_id,
                                'transaction_id', v_tx.id, 'balance', v_balance);
    elsif v_tx.status = 'reserved' then
      return jsonb_build_object('status', 'in_progress', 'transaction_id', v_tx.id);
    end if;
    -- Previously released (that attempt failed): this retry may charge again.
    v_tx_id := v_tx.id;
  end if;

  update public.profiles
     set ai_credits = ai_credits - p_amount
   where id = p_user_id
     and subscription_status = 'active'
     and ai_credits >= p_amount
  returning ai_credits into v_balance;

  if not found then
    select ai_credits, subscription_status into v_balance, v_status from public.profiles where id = p_user_id;
    -- Undo the ledger row: nothing was charged.
    update public.credit_transactions set status = 'released', updated_at = now() where id = v_tx_id;
    if v_status is null then
      return jsonb_build_object('status', 'no_profile');
    elsif v_status <> 'active' then
      return jsonb_build_object('status', 'inactive', 'balance', v_balance);
    end if;
    return jsonb_build_object('status', 'insufficient', 'balance', v_balance);
  end if;

  update public.credit_transactions
     set status = 'reserved', amount = p_amount, balance_after = v_balance,
         created_at = now(), updated_at = now()
   where id = v_tx_id;

  return jsonb_build_object('status', 'reserved', 'transaction_id', v_tx_id,
                            'balance', v_balance, 'amount', p_amount);
end;
$$;

-- Finalises the charge once the report is saved. Safe to call twice.
create or replace function public.settle_analysis_credits(
  p_user_id uuid,
  p_request_id text,
  p_creative_id uuid
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_tx public.credit_transactions;
  v_balance integer;
begin
  update public.credit_transactions
     set status = 'settled', creative_id = p_creative_id, updated_at = now()
   where user_id = p_user_id and request_id = p_request_id and status = 'reserved'
  returning * into v_tx;

  select ai_credits into v_balance from public.profiles where id = p_user_id;

  if v_tx.id is null then
    select * into v_tx from public.credit_transactions
     where user_id = p_user_id and request_id = p_request_id;
    if v_tx.status = 'settled' then
      return jsonb_build_object('status', 'settled', 'transaction_id', v_tx.id,
                                'amount', v_tx.amount, 'balance', v_balance, 'replay', true);
    end if;
    -- Released in the meantime (should not happen inside one request).
    return jsonb_build_object('status', coalesce(v_tx.status, 'missing'), 'balance', v_balance);
  end if;

  return jsonb_build_object('status', 'settled', 'transaction_id', v_tx.id,
                            'amount', v_tx.amount, 'balance', v_balance);
end;
$$;

-- Gives the credits back for a request that failed. Safe to call twice.
create or replace function public.release_analysis_credits(
  p_user_id uuid,
  p_request_id text
)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_amount integer;
  v_balance integer;
begin
  update public.credit_transactions
     set status = 'released', updated_at = now()
   where user_id = p_user_id and request_id = p_request_id and status = 'reserved'
  returning amount into v_amount;

  if not found then
    select ai_credits into v_balance from public.profiles where id = p_user_id;
    return jsonb_build_object('status', 'noop', 'balance', v_balance);
  end if;

  update public.profiles set ai_credits = ai_credits + v_amount
   where id = p_user_id
  returning ai_credits into v_balance;

  return jsonb_build_object('status', 'released', 'refunded', v_amount, 'balance', v_balance);
end;
$$;

-- Only the server (service role) may call these. Browsers cannot.
revoke all on function public.release_stale_credit_reservations(uuid) from public, anon, authenticated;
revoke all on function public.reserve_analysis_credits(uuid, text, integer, text) from public, anon, authenticated;
revoke all on function public.settle_analysis_credits(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.release_analysis_credits(uuid, text) from public, anon, authenticated;
grant execute on function public.release_stale_credit_reservations(uuid) to service_role;
grant execute on function public.reserve_analysis_credits(uuid, text, integer, text) to service_role;
grant execute on function public.settle_analysis_credits(uuid, text, uuid) to service_role;
grant execute on function public.release_analysis_credits(uuid, text) to service_role;

-- ── 3. Lock billing columns on profiles ─────────────────────────────────────
-- Browser sessions keep read access to their own row (existing select policy)
-- and may only change these profile fields. Everything else (ai_credits,
-- credits_reset_at, plan, subscription_status, whop_membership_id,
-- cancel_at_period_end, email) is server-only.
revoke insert, update on public.profiles from anon, authenticated;
grant update (full_name, avatar_url, persona, ad_platforms, main_goal, onboarding_completed, notifications_enabled)
  on public.profiles to authenticated;
