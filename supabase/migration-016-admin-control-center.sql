-- Creatively.ai — migration 016: private Admin Control Center
-- Run once in Supabase (SQL Editor → New query → paste → Run). Safe to run again.
-- Requires migrations 011 (credit ledger), 013 (bonus credits) and 015 (creative strategy).
-- Undo: supabase/migration-016-admin-control-center-down.sql
--
-- This migration only ADDS things. It does not delete or rewrite any existing row,
-- balance, price, allowance or billing record.
--
--   admin_users          extra admins (owners come from the ADMIN_EMAILS server env var)
--   admin_audit_log      append-only record of every admin action (cannot be edited or deleted)
--   credit_adjustments   manual credit additions/removals (idempotent, with balances before/after)
--   admin_user_notes     internal notes about an account (never visible to the customer)
--   billing_events       verified Whop webhook events, recorded from now on (amounts, status, ids)
--   system_events        structured failure log (webhooks, AI provider, analyses, generations, credits)
--   profiles.access_status   'active' | 'suspended' — enforced server-side by the app middleware
--
-- Every table has RLS on and NO policies, and anon/authenticated have no privileges on
-- them: browsers can never read or write them. Writes happen only through the
-- functions below, which only the service role (the server) may call.

-- ── 0. Preflight ─────────────────────────────────────────────────────────────
do $$
begin
  if to_regclass('public.credit_transactions') is null then
    raise exception 'Run migration-011-credit-ledger.sql first.';
  end if;
  if not exists (select 1 from information_schema.columns
                  where table_schema = 'public' and table_name = 'profiles' and column_name = 'bonus_credits') then
    raise exception 'Run migration-013-early-customer-reward.sql first.';
  end if;
  if to_regclass('public.strategy_generations') is null
     or not exists (select 1 from information_schema.columns
                     where table_schema = 'public' and table_name = 'creatives' and column_name = 'source') then
    raise exception 'Run migration-015-creative-strategy.sql first.';
  end if;
end $$;

-- ── 1. Account access (suspension) ───────────────────────────────────────────
alter table public.profiles
  add column if not exists access_status text not null default 'active',
  add column if not exists access_changed_at timestamptz;
do $$ begin
  alter table public.profiles add constraint profiles_access_status_check check (access_status in ('active', 'suspended'));
exception when duplicate_object then null; end $$;
-- Not added to the browser-updatable column list from migration 011, so customers
-- can read their own status but can never change it.

-- ── 2. Tables ────────────────────────────────────────────────────────────────
create table if not exists public.admin_users (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  role       text not null check (role in ('admin', 'viewer')),
  granted_by uuid,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz
);

create table if not exists public.admin_audit_log (
  id             bigint generated always as identity primary key,
  created_at     timestamptz not null default now(),
  admin_id       uuid not null,
  admin_email    text,
  target_user_id uuid,                 -- no FK: the record must outlive the account
  action         text not null,
  reason         text,
  before_value   jsonb,
  after_value    jsonb,
  metadata       jsonb
);
create index if not exists admin_audit_log_created_idx on public.admin_audit_log (created_at desc);
create index if not exists admin_audit_log_target_idx on public.admin_audit_log (target_user_id, created_at desc);

create table if not exists public.credit_adjustments (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  admin_id        uuid not null,
  admin_email     text,
  delta           integer not null check (delta <> 0),
  reason          text not null,
  idempotency_key text not null unique,
  balance_before  integer not null,
  balance_after   integer not null,
  bonus_before    integer not null,
  bonus_after     integer not null,
  subscription_status text
);
create index if not exists credit_adjustments_user_idx on public.credit_adjustments (user_id, created_at desc);
create index if not exists credit_adjustments_admin_idx on public.credit_adjustments (admin_id, created_at desc);

create table if not exists public.admin_user_notes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  admin_id    uuid not null,
  admin_email text,
  note        text not null check (char_length(note) between 1 and 2000)
);
create index if not exists admin_user_notes_user_idx on public.admin_user_notes (user_id, created_at desc);

create table if not exists public.billing_events (
  id              text primary key,      -- Whop webhook event id (one row per verified event)
  type            text not null,
  received_at     timestamptz not null default now(),
  occurred_at     timestamptz,
  email           text,                  -- lower-cased buyer email
  matched_user_id uuid,
  outcome         text,                  -- granted | parked | revoked | no_account | ignored | ...
  whop_payment_id text,
  whop_membership_id text,
  whop_plan_id    text,
  plan            text,                  -- our plan name, when the Whop plan id is recognised
  status          text,
  substatus       text,
  billing_reason  text,
  amount          numeric,               -- as reported by Whop (total), never computed by us
  currency        text,
  refunded_amount numeric,
  paid_at         timestamptz
);
create index if not exists billing_events_received_idx on public.billing_events (received_at desc);
create index if not exists billing_events_email_idx on public.billing_events (email);

create table if not exists public.system_events (
  id              bigint generated always as identity primary key,
  created_at      timestamptz not null default now(),
  category        text not null check (category in ('analysis', 'image_generation', 'strategy', 'ai_provider', 'credits', 'webhook', 'auth', 'backend', 'job')),
  severity        text not null default 'error' check (severity in ('info', 'warning', 'error')),
  source          text not null,         -- route or job name
  code            text,
  message         text,                  -- sanitised, no secrets / tokens / user content
  user_id         uuid,
  ref_id          text,                  -- request id, generation id, webhook event id …
  resolved_at     timestamptz,
  resolved_by     uuid,
  resolution_note text
);
create index if not exists system_events_created_idx on public.system_events (created_at desc);
create index if not exists system_events_open_idx on public.system_events (category, created_at desc) where resolved_at is null;

-- ── 3. Lock everything down ─────────────────────────────────────────────────
alter table public.admin_users       enable row level security;
alter table public.admin_audit_log   enable row level security;
alter table public.credit_adjustments enable row level security;
alter table public.admin_user_notes  enable row level security;
alter table public.billing_events    enable row level security;
alter table public.system_events     enable row level security;

revoke all on public.admin_users, public.admin_audit_log, public.credit_adjustments,
              public.admin_user_notes, public.billing_events, public.system_events
  from public, anon, authenticated, service_role;
-- The server may read everything; it may only INSERT the two log tables directly.
grant select on public.admin_users, public.admin_audit_log, public.credit_adjustments,
                public.admin_user_notes, public.billing_events, public.system_events to service_role;
grant insert on public.billing_events, public.system_events to service_role;

-- The audit log is append-only, even for the table owner going through the API.
create or replace function public.admin_audit_log_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'admin_audit_log is append-only';
end;
$$;
drop trigger if exists admin_audit_log_no_update on public.admin_audit_log;
create trigger admin_audit_log_no_update before update or delete on public.admin_audit_log
  for each row execute function public.admin_audit_log_immutable();
drop trigger if exists admin_audit_log_no_truncate on public.admin_audit_log;
create trigger admin_audit_log_no_truncate before truncate on public.admin_audit_log
  for each statement execute function public.admin_audit_log_immutable();

-- ── 4. Functions (service role only) ────────────────────────────────────────

-- Internal: one audit row.
create or replace function public.admin_write_audit(
  p_admin_id uuid, p_admin_email text, p_target uuid, p_action text, p_reason text,
  p_before jsonb, p_after jsonb, p_meta jsonb default null
) returns bigint
language plpgsql security definer set search_path = public
as $$
declare v_id bigint;
begin
  insert into public.admin_audit_log (admin_id, admin_email, target_user_id, action, reason, before_value, after_value, metadata)
  values (p_admin_id, p_admin_email, p_target, p_action, p_reason, p_before, p_after, p_meta)
  returning id into v_id;
  return v_id;
end;
$$;

-- Manual credit adjustment. Atomic (row lock), idempotent (idempotency key), audited.
-- Additions are stored as bonus credits so the weekly reset never wipes them (same
-- rule the early-customer reward uses). Removals take from bonus credits first.
-- Returns {status: applied | duplicate | key_conflict | invalid | no_profile |
--          insufficient | rate_limited, ...}
create or replace function public.admin_adjust_credits(
  p_admin_id uuid, p_admin_email text, p_user_id uuid, p_delta integer, p_reason text, p_idempotency_key text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_prev public.credit_adjustments;
  v_prof record;
  v_balance integer;
  v_bonus integer;
  v_bonus_after integer;
  v_id uuid;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if p_admin_id is null or p_user_id is null or p_delta is null or p_delta = 0
     or abs(p_delta) > 1000000 or char_length(v_reason) < 3 or char_length(v_reason) > 500
     or p_idempotency_key is null or p_idempotency_key !~ '^[A-Za-z0-9-]{16,80}$' then
    return jsonb_build_object('status', 'invalid');
  end if;

  -- Retried request: return the original result instead of applying it twice.
  select * into v_prev from public.credit_adjustments where idempotency_key = p_idempotency_key;
  if found then
    if v_prev.user_id <> p_user_id or v_prev.delta <> p_delta or v_prev.admin_id <> p_admin_id then
      return jsonb_build_object('status', 'key_conflict');
    end if;
    return jsonb_build_object('status', 'duplicate', 'adjustment_id', v_prev.id, 'delta', v_prev.delta,
                              'balance_before', v_prev.balance_before, 'balance_after', v_prev.balance_after);
  end if;

  if (select count(*) from public.credit_adjustments
       where admin_id = p_admin_id and created_at > now() - interval '1 minute') >= 20 then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  select id, ai_credits, coalesce(bonus_credits, 0) as bonus_credits, subscription_status
    into v_prof from public.profiles where id = p_user_id for update;
  if not found then return jsonb_build_object('status', 'no_profile'); end if;

  -- Two concurrent requests with the same key: the loser waits on the row lock above,
  -- then sees the winner's row here.
  select * into v_prev from public.credit_adjustments where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('status', 'duplicate', 'adjustment_id', v_prev.id, 'delta', v_prev.delta,
                              'balance_before', v_prev.balance_before, 'balance_after', v_prev.balance_after);
  end if;

  v_balance := v_prof.ai_credits + p_delta;
  if v_balance < 0 then
    return jsonb_build_object('status', 'insufficient', 'balance', v_prof.ai_credits);
  end if;
  v_bonus := v_prof.bonus_credits;
  v_bonus_after := greatest(0, least(v_bonus + p_delta, v_balance));

  update public.profiles set ai_credits = v_balance, bonus_credits = v_bonus_after where id = p_user_id;

  insert into public.credit_adjustments (user_id, admin_id, admin_email, delta, reason, idempotency_key,
                                         balance_before, balance_after, bonus_before, bonus_after, subscription_status)
  values (p_user_id, p_admin_id, p_admin_email, p_delta, v_reason, p_idempotency_key,
          v_prof.ai_credits, v_balance, v_bonus, v_bonus_after, v_prof.subscription_status)
  returning id into v_id;

  perform public.admin_write_audit(p_admin_id, p_admin_email, p_user_id,
    case when p_delta > 0 then 'credits.add' else 'credits.remove' end, v_reason,
    jsonb_build_object('balance', v_prof.ai_credits, 'bonus_credits', v_bonus),
    jsonb_build_object('balance', v_balance, 'bonus_credits', v_bonus_after),
    jsonb_build_object('delta', p_delta, 'adjustment_id', v_id, 'idempotency_key', p_idempotency_key));

  return jsonb_build_object('status', 'applied', 'adjustment_id', v_id, 'delta', p_delta,
                            'balance_before', v_prof.ai_credits, 'balance_after', v_balance,
                            'subscription_status', v_prof.subscription_status);
end;
$$;

-- Suspend / restore app access. Never touches billing columns.
-- Returns {status: changed | unchanged | invalid | no_profile | rate_limited, ...}
create or replace function public.admin_set_access(
  p_admin_id uuid, p_admin_email text, p_user_id uuid, p_status text, p_reason text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_before text;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if p_admin_id is null or p_user_id is null or p_status not in ('active', 'suspended')
     or char_length(v_reason) < 3 or char_length(v_reason) > 500 then
    return jsonb_build_object('status', 'invalid');
  end if;
  if p_admin_id = p_user_id then
    return jsonb_build_object('status', 'invalid', 'detail', 'self');
  end if;
  if (select count(*) from public.admin_audit_log
       where admin_id = p_admin_id and action like 'access.%' and created_at > now() - interval '1 minute') >= 20 then
    return jsonb_build_object('status', 'rate_limited');
  end if;

  select access_status into v_before from public.profiles where id = p_user_id for update;
  if not found then return jsonb_build_object('status', 'no_profile'); end if;
  if v_before = p_status then
    return jsonb_build_object('status', 'unchanged', 'access_status', v_before);
  end if;

  update public.profiles set access_status = p_status, access_changed_at = now() where id = p_user_id;

  perform public.admin_write_audit(p_admin_id, p_admin_email, p_user_id,
    case when p_status = 'suspended' then 'access.suspend' else 'access.restore' end, v_reason,
    jsonb_build_object('access_status', v_before), jsonb_build_object('access_status', p_status), null);

  return jsonb_build_object('status', 'changed', 'access_status', p_status, 'previous', v_before);
end;
$$;

create or replace function public.admin_add_note(
  p_admin_id uuid, p_admin_email text, p_user_id uuid, p_note text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_note text := btrim(coalesce(p_note, ''));
  v_id uuid;
begin
  if p_admin_id is null or p_user_id is null or char_length(v_note) < 1 or char_length(v_note) > 2000 then
    return jsonb_build_object('status', 'invalid');
  end if;
  if not exists (select 1 from auth.users where id = p_user_id) then
    return jsonb_build_object('status', 'no_user');
  end if;
  insert into public.admin_user_notes (user_id, admin_id, admin_email, note)
  values (p_user_id, p_admin_id, p_admin_email, v_note) returning id into v_id;
  perform public.admin_write_audit(p_admin_id, p_admin_email, p_user_id, 'note.add', null, null,
    jsonb_build_object('note_id', v_id), null);
  return jsonb_build_object('status', 'added', 'note_id', v_id);
end;
$$;

-- Grant / revoke an admin role (the app only lets owners call these).
create or replace function public.admin_set_role(
  p_admin_id uuid, p_admin_email text, p_target_email text, p_role text, p_reason text
) returns jsonb
language plpgsql security definer set search_path = public, auth
as $$
declare
  v_target uuid;
  v_before text;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if p_admin_id is null or p_role not in ('admin', 'viewer', 'none')
     or char_length(v_reason) < 3 or char_length(v_reason) > 500 then
    return jsonb_build_object('status', 'invalid');
  end if;
  select id into v_target from auth.users where lower(email) = lower(btrim(p_target_email));
  if v_target is null then return jsonb_build_object('status', 'no_user'); end if;
  if v_target = p_admin_id then return jsonb_build_object('status', 'invalid', 'detail', 'self'); end if;

  select role into v_before from public.admin_users where user_id = v_target and revoked_at is null;

  if p_role = 'none' then
    if v_before is null then return jsonb_build_object('status', 'unchanged'); end if;
    update public.admin_users set revoked_at = now() where user_id = v_target;
  else
    if v_before = p_role then return jsonb_build_object('status', 'unchanged'); end if;
    insert into public.admin_users (user_id, role, granted_by, granted_at, revoked_at)
    values (v_target, p_role, p_admin_id, now(), null)
    on conflict (user_id) do update set role = excluded.role, granted_by = excluded.granted_by,
                                        granted_at = excluded.granted_at, revoked_at = null;
  end if;

  perform public.admin_write_audit(p_admin_id, p_admin_email, v_target, 'admin.role', v_reason,
    jsonb_build_object('role', coalesce(v_before, 'none')), jsonb_build_object('role', p_role), null);
  return jsonb_build_object('status', 'changed', 'role', p_role, 'previous', coalesce(v_before, 'none'));
end;
$$;

create or replace function public.admin_resolve_system_event(
  p_admin_id uuid, p_admin_email text, p_event_id bigint, p_note text
) returns jsonb
language plpgsql security definer set search_path = public
as $$
declare v_row public.system_events;
begin
  update public.system_events
     set resolved_at = now(), resolved_by = p_admin_id, resolution_note = left(btrim(coalesce(p_note, '')), 500)
   where id = p_event_id and resolved_at is null
  returning * into v_row;
  if v_row.id is null then return jsonb_build_object('status', 'unchanged'); end if;
  perform public.admin_write_audit(p_admin_id, p_admin_email, v_row.user_id, 'health.resolve', nullif(btrim(coalesce(p_note, '')), ''),
    null, jsonb_build_object('event_id', v_row.id, 'category', v_row.category, 'code', v_row.code), null);
  return jsonb_build_object('status', 'resolved', 'id', v_row.id);
end;
$$;

-- Users list: Supabase Auth (auth.users) is the source of truth, joined with profiles
-- and usage. Only non-secret columns are returned.
create or replace function public.admin_list_users(
  p_search text default null, p_plan text default null, p_subscription text default null,
  p_access text default null, p_signup_from timestamptz default null, p_signup_to timestamptz default null,
  p_sort text default 'created_at', p_dir text default 'desc', p_limit integer default 25, p_offset integer default 0,
  p_user_id uuid default null
) returns table (
  id uuid, email text, created_at timestamptz, email_confirmed_at timestamptz, last_sign_in_at timestamptz,
  has_profile boolean, plan text, subscription_status text, access_status text, ai_credits integer,
  bonus_credits integer, cancel_at_period_end boolean, credits_consumed bigint, analyses bigint,
  generated bigint, last_activity_at timestamptz, total_count bigint
)
language sql stable security definer set search_path = public, auth
as $$
  with q as (
    select nullif(btrim(p_search), '') as s
  ),
  base as (
    select u.id, u.email::text as email, u.created_at, u.email_confirmed_at, u.last_sign_in_at,
           (p.id is not null) as has_profile, p.plan, p.subscription_status,
           coalesce(p.access_status, 'active') as access_status, p.ai_credits,
           coalesce(p.bonus_credits, 0) as bonus_credits, p.cancel_at_period_end
      from auth.users u
      left join public.profiles p on p.id = u.id, q
     where (p_user_id is null or u.id = p_user_id)
       and (q.s is null
            or u.email ilike '%' || replace(replace(replace(q.s, '\', '\\'), '%', '\%'), '_', '\_') || '%'
            or u.id::text = q.s)
       and (p_plan is null or p.plan = p_plan)
       and (p_subscription is null or coalesce(p.subscription_status, 'none') = p_subscription)
       and (p_access is null or coalesce(p.access_status, 'active') = p_access)
       and (p_signup_from is null or u.created_at >= p_signup_from)
       and (p_signup_to is null or u.created_at < p_signup_to)
  ),
  tx as (
    select t.user_id, coalesce(sum(t.amount) filter (where t.status = 'settled'), 0)::bigint as consumed, max(t.created_at) as last_at
      from public.credit_transactions t where t.user_id in (select b.id from base b) group by t.user_id
  ),
  cr as (
    select c.user_id, count(*) filter (where coalesce(c.source, 'analysis') = 'analysis')::bigint as analyses, max(c.created_at) as last_at
      from public.creatives c where c.user_id in (select b.id from base b) group by c.user_id
  ),
  gen as (
    select g.user_id, count(*) filter (where g.status = 'completed')::bigint as generated, max(g.created_at) as last_at
      from public.strategy_generations g where g.user_id in (select b.id from base b) group by g.user_id
  ),
  st as (
    select s.user_id, max(s.created_at) as last_at
      from public.brand_strategies s where s.user_id in (select b.id from base b) group by s.user_id
  ),
  rows as (
    select b.*, coalesce(tx.consumed, 0) as credits_consumed, coalesce(cr.analyses, 0) as analyses,
           coalesce(gen.generated, 0) as generated,
           nullif(greatest(coalesce(tx.last_at, '-infinity'), coalesce(cr.last_at, '-infinity'),
                           coalesce(gen.last_at, '-infinity'), coalesce(st.last_at, '-infinity')), '-infinity') as last_activity_at
      from base b
      left join tx on tx.user_id = b.id
      left join cr on cr.user_id = b.id
      left join gen on gen.user_id = b.id
      left join st on st.user_id = b.id
  )
  select r.id, r.email, r.created_at, r.email_confirmed_at, r.last_sign_in_at, r.has_profile, r.plan,
         r.subscription_status, r.access_status, r.ai_credits, r.bonus_credits, r.cancel_at_period_end,
         r.credits_consumed, r.analyses, r.generated, r.last_activity_at, count(*) over () as total_count
    from rows r
   order by
     case when p_sort = 'email' and p_dir = 'asc' then r.email end asc nulls last,
     case when p_sort = 'email' and p_dir <> 'asc' then r.email end desc nulls last,
     case when p_sort = 'credits' and p_dir = 'asc' then r.ai_credits end asc nulls last,
     case when p_sort = 'credits' and p_dir <> 'asc' then r.ai_credits end desc nulls last,
     case when p_sort = 'consumed' and p_dir = 'asc' then r.credits_consumed end asc nulls last,
     case when p_sort = 'consumed' and p_dir <> 'asc' then r.credits_consumed end desc nulls last,
     case when p_sort = 'analyses' and p_dir = 'asc' then r.analyses end asc nulls last,
     case when p_sort = 'analyses' and p_dir <> 'asc' then r.analyses end desc nulls last,
     case when p_sort = 'last_sign_in' and p_dir = 'asc' then r.last_sign_in_at end asc nulls last,
     case when p_sort = 'last_sign_in' and p_dir <> 'asc' then r.last_sign_in_at end desc nulls last,
     case when p_sort = 'last_activity' and p_dir = 'asc' then r.last_activity_at end asc nulls last,
     case when p_sort = 'last_activity' and p_dir <> 'asc' then r.last_activity_at end desc nulls last,
     case when p_dir = 'asc' then r.created_at end asc,
     r.created_at desc,
     r.id
   limit least(greatest(coalesce(p_limit, 25), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

-- Active admins with their emails (for the Admins page).
create or replace function public.admin_list_admins()
returns table (user_id uuid, email text, role text, granted_by uuid, granted_at timestamptz)
language sql stable security definer set search_path = public, auth
as $$
  select a.user_id, u.email::text, a.role, a.granted_by, a.granted_at
    from public.admin_users a join auth.users u on u.id = a.user_id
   where a.revoked_at is null
   order by a.granted_at desc;
$$;

-- Overview metrics for [p_since, now()), plus a bucketed series. Every number is a
-- direct count/sum over recorded rows; nothing is estimated.
create or replace function public.admin_overview(p_since timestamptz, p_bucket text default 'day')
returns jsonb
language plpgsql stable security definer set search_path = public, auth
as $$
declare
  v_now timestamptz := now();
  v_prev timestamptz := p_since - (now() - p_since);
  v_unit text := case when p_bucket = 'hour' then 'hour' else 'day' end;
  v jsonb;
begin
  select jsonb_build_object(
    'generated_at', v_now,
    'since', p_since,
    'users_total', (select count(*) from auth.users),
    'signups', (select count(*) from auth.users where created_at >= p_since),
    'signups_prev', (select count(*) from auth.users where created_at >= v_prev and created_at < p_since),
    'signed_in', (select count(*) from auth.users where last_sign_in_at >= p_since),
    'active_users', (select count(distinct x.uid) from (
        select user_id as uid from public.credit_transactions where created_at >= p_since
        union all select user_id from public.creatives where created_at >= p_since and user_id is not null
        union all select user_id from public.brand_strategies where created_at >= p_since
        union all select user_id from public.strategy_generations where created_at >= p_since) x),
    'paying', (select count(*) from public.profiles where subscription_status = 'active'),
    'paying_by_plan', (select coalesce(jsonb_object_agg(plan, n), '{}'::jsonb) from (
        select plan, count(*) as n from public.profiles where subscription_status = 'active' group by plan) s),
    'status_breakdown', (select coalesce(jsonb_object_agg(subscription_status, n), '{}'::jsonb) from (
        select subscription_status, count(*) as n from public.profiles group by subscription_status) s),
    'canceling', (select count(*) from public.profiles where subscription_status = 'active' and cancel_at_period_end),
    'with_membership', (select count(*) from public.profiles where subscription_status = 'active' and whop_membership_id is not null),
    'suspended', (select count(*) from public.profiles where access_status = 'suspended'),
    'credits_consumed', (select coalesce(sum(amount), 0) from public.credit_transactions where status = 'settled' and created_at >= p_since),
    'credits_by_type', (select coalesce(jsonb_object_agg(coalesce(media_type, 'unknown'), n), '{}'::jsonb) from (
        select media_type, sum(amount) as n from public.credit_transactions
         where status = 'settled' and created_at >= p_since group by media_type) s),
    'analyses', (select count(*) from public.creatives
        where created_at >= p_since and user_id is not null and coalesce(source, 'analysis') = 'analysis' and not is_free_report),
    'free_reports', (select count(*) from public.creatives where created_at >= p_since and is_free_report),
    'generated', (select count(*) from public.strategy_generations where status = 'completed' and created_at >= p_since),
    'strategies', (select count(*) from public.brand_strategies where created_at >= p_since),
    'failed_generations', (select count(*) from public.strategy_generations where status = 'failed' and updated_at >= p_since),
    'failed_strategies', (select count(*) from public.brand_strategies where status = 'failed' and updated_at >= p_since),
    'refunded_charges', (select count(*) from public.credit_transactions
        where status = 'released' and balance_after is not null and updated_at >= p_since),
    'refunded_by_type', (select coalesce(jsonb_object_agg(coalesce(media_type, 'unknown'), n), '{}'::jsonb) from (
        select media_type, count(*) as n from public.credit_transactions
         where status = 'released' and balance_after is not null and updated_at >= p_since group by media_type) s),
    'system_errors', (select count(*) from public.system_events where severity = 'error' and created_at >= p_since),
    'billing_events_since', (select min(received_at) from public.billing_events),
    'system_events_since', (select min(created_at) from public.system_events),
    'paid_activations', (select count(distinct coalesce(email, id)) from public.billing_events
        where type = 'membership.activated' and received_at >= p_since),
    'payments_succeeded', (select count(*) from public.billing_events where type = 'payment.succeeded' and received_at >= p_since),
    'payments_failed', (select count(*) from public.billing_events where type = 'payment.failed' and received_at >= p_since),
    'cohort_paying', (select count(*) from auth.users u join public.profiles p on p.id = u.id
        where u.created_at >= p_since and p.subscription_status = 'active'),
    'series', (
      select coalesce(jsonb_agg(jsonb_build_object(
               't', b.t,
               'signups', (select count(*) from auth.users where created_at >= b.t and created_at < b.t + ('1 ' || v_unit)::interval),
               'analyses', (select count(*) from public.creatives where user_id is not null and not is_free_report
                              and coalesce(source, 'analysis') = 'analysis'
                              and created_at >= b.t and created_at < b.t + ('1 ' || v_unit)::interval),
               'generated', (select count(*) from public.strategy_generations where status = 'completed'
                              and created_at >= b.t and created_at < b.t + ('1 ' || v_unit)::interval),
               'credits', (select coalesce(sum(amount), 0) from public.credit_transactions where status = 'settled'
                              and created_at >= b.t and created_at < b.t + ('1 ' || v_unit)::interval),
               'activations', (select count(*) from public.billing_events where type = 'membership.activated'
                              and received_at >= b.t and received_at < b.t + ('1 ' || v_unit)::interval)
             ) order by b.t), '[]'::jsonb)
        from generate_series(date_trunc(v_unit, p_since), date_trunc(v_unit, v_now), ('1 ' || v_unit)::interval) as b(t)
    )
  ) into v;
  return v;
end;
$$;


-- Signup cohort funnel for [p_since, now()): of the accounts created in the window,
-- how many reached each step (by now). Steps are recorded facts, not page views.
create or replace function public.admin_funnel(p_since timestamptz)
returns jsonb
language sql stable security definer set search_path = public, auth
as $$
  with c as (
    select u.id, u.email_confirmed_at, p.onboarding_completed, p.subscription_status
      from auth.users u left join public.profiles p on p.id = u.id
     where u.created_at >= p_since
  )
  select jsonb_build_object(
    'signups', (select count(*) from c),
    'confirmed', (select count(*) from c where email_confirmed_at is not null),
    'onboarded', (select count(*) from c where onboarding_completed),
    'used_product', (select count(*) from c where exists (select 1 from public.credit_transactions t where t.user_id = c.id)
                                            or exists (select 1 from public.creatives x where x.user_id = c.id)
                                            or exists (select 1 from public.brand_strategies b where b.user_id = c.id)),
    'paying_now', (select count(*) from c where subscription_status = 'active'),
    'ever_paid', (select count(*) from c where subscription_status in ('active', 'cancelled', 'past_due'))
  );
$$;

revoke all on function public.admin_write_audit(uuid, text, uuid, text, text, jsonb, jsonb, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.admin_adjust_credits(uuid, text, uuid, integer, text, text) from public, anon, authenticated;
revoke all on function public.admin_set_access(uuid, text, uuid, text, text) from public, anon, authenticated;
revoke all on function public.admin_add_note(uuid, text, uuid, text) from public, anon, authenticated;
revoke all on function public.admin_set_role(uuid, text, text, text, text) from public, anon, authenticated;
revoke all on function public.admin_resolve_system_event(uuid, text, bigint, text) from public, anon, authenticated;
revoke all on function public.admin_list_users(text, text, text, text, timestamptz, timestamptz, text, text, integer, integer, uuid) from public, anon, authenticated;
revoke all on function public.admin_list_admins() from public, anon, authenticated;
revoke all on function public.admin_overview(timestamptz, text) from public, anon, authenticated;
revoke all on function public.admin_funnel(timestamptz) from public, anon, authenticated;
revoke all on function public.admin_audit_log_immutable() from public, anon, authenticated;
grant execute on function public.admin_adjust_credits(uuid, text, uuid, integer, text, text) to service_role;
grant execute on function public.admin_set_access(uuid, text, uuid, text, text) to service_role;
grant execute on function public.admin_add_note(uuid, text, uuid, text) to service_role;
grant execute on function public.admin_set_role(uuid, text, text, text, text) to service_role;
grant execute on function public.admin_resolve_system_event(uuid, text, bigint, text) to service_role;
grant execute on function public.admin_list_users(text, text, text, text, timestamptz, timestamptz, text, text, integer, integer, uuid) to service_role;
grant execute on function public.admin_list_admins() to service_role;
grant execute on function public.admin_overview(timestamptz, text) to service_role;
grant execute on function public.admin_funnel(timestamptz) to service_role;
