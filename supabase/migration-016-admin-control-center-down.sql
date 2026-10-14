-- Creatively.ai — ROLLBACK for migration 016 (Admin Control Center)
-- Only run this if you want to remove the Admin Control Center completely.
--
-- Credit balances are NOT touched: credits added or removed by admins stay exactly as
-- they are now. What is lost: the admin tables below (audit log, credit adjustment
-- history, admin notes, recorded billing and system events) and every account's
-- suspension flag (suspended accounts get access back).
--
-- Deploy the previous app version (without the admin console) BEFORE running this,
-- otherwise the middleware's suspension check simply allows everyone (it fails open
-- when the column is missing), and the admin pages show setup errors.

drop function if exists public.admin_funnel(timestamptz);
drop function if exists public.admin_overview(timestamptz, text);
drop function if exists public.admin_list_admins();
drop function if exists public.admin_list_users(text, text, text, text, timestamptz, timestamptz, text, text, integer, integer, uuid);
drop function if exists public.admin_resolve_system_event(uuid, text, bigint, text);
drop function if exists public.admin_set_role(uuid, text, text, text, text);
drop function if exists public.admin_add_note(uuid, text, uuid, text);
drop function if exists public.admin_set_access(uuid, text, uuid, text, text);
drop function if exists public.admin_adjust_credits(uuid, text, uuid, integer, text, text);
drop function if exists public.admin_write_audit(uuid, text, uuid, text, text, jsonb, jsonb, jsonb);

drop table if exists public.system_events;
drop table if exists public.billing_events;
drop table if exists public.admin_user_notes;
drop table if exists public.credit_adjustments;
drop trigger if exists admin_audit_log_no_truncate on public.admin_audit_log;
drop trigger if exists admin_audit_log_no_update on public.admin_audit_log;
drop table if exists public.admin_audit_log;
drop function if exists public.admin_audit_log_immutable();
drop table if exists public.admin_users;

alter table public.profiles drop constraint if exists profiles_access_status_check;
alter table public.profiles drop column if exists access_changed_at;
alter table public.profiles drop column if exists access_status;
