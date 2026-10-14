# Admin Control Center

A private console for managing Creatively.ai: users, credits, account access, payments, usage, system health and an append-only audit log. It is a separate part of the app (`app/admin/(console)`, its own layout and design), and the public website and customer dashboard are not changed.

- URL: `https://trycreatively.space/admin`, or `https://admin.trycreatively.space` once the subdomain is set up (see below).
- Sections: Overview · Users (and a page per user) · Credits · Access · Payments · Analytics · System health · Audit log · Admins (owners only).

## 1. Turn it on

1. **Run the migration.** In the Supabase SQL Editor, run `supabase/migration-016-admin-control-center.sql`. It needs migrations 011, 013 and 015 first, and it stops with a clear message if they're missing. It only adds tables, functions and one column (`profiles.access_status`). No existing row, balance or billing record is changed. The undo script is `supabase/migration-016-admin-control-center-down.sql`.
2. **Add environment variables** in Netlify (Site configuration → Environment variables). Server-only, never `NEXT_PUBLIC_`:
   | Name | Required | Value |
   |---|---|---|
   | `ADMIN_EMAILS` | yes | The email(s) of your own Creatively.ai account, comma-separated. These accounts are **owners**. |
   | `SUPABASE_SERVICE_ROLE_KEY` | yes (already set) | Used only on the server. |
   | `WHOP_COMPANY_ID` | for the Payments tab | Your Whop company id (`biz_…`). |
   | `WHOP_COMPANY_API_KEY` | already set | Needs the permissions `payment:basic:read`, `member:basic:read`, `member:email:read` and `plan:basic:read` for the Payments tab. |
   | `ADMIN_HOST` | optional | `admin.trycreatively.space`. When this is set, the console is served only on that hostname. |
3. **Redeploy**, sign in with the account whose email is in `ADMIN_EMAILS`, and open `/admin`. That account must have a **confirmed** email address.

### How access is decided

These checks run on every page and every API request, on the server:

- There must be a valid Supabase session, verified with Supabase Auth.
- The account's email must be confirmed.
- The account must be either:
  - an **owner**: its email is in `ADMIN_EMAILS`, or
  - an active row in `admin_users`, with the role `admin` or `viewer`. Only owners can grant these roles, from the Admins page, and every grant is audited.
- The account must not be suspended.

Anyone else who opens a console page gets a plain 404, and any console API call gets a 401 or 403.

Nobody can give themselves a role:

- `admin_users` is unreadable and unwritable from browsers. RLS is on, there are no policies, and anon and authenticated have no privileges on it.
- Owners exist only in server config.
- An unauthenticated request can never create an admin.

| Role | Can do |
|---|---|
| viewer | See everything, change nothing |
| admin | Also adjust credits, suspend and restore customers, add notes, resolve health events |
| owner | Everything, plus grant and revoke admin or viewer roles. Owners can't be suspended from the console. |

## 2. Optional: admin.trycreatively.space

The app is hosted on **Netlify**, not Vercel. The simplest setup uses the same Netlify site:

1. Netlify → your site → Domain management → **Add a domain alias** → `admin.trycreatively.space`.
2. DNS:
   - If the domain uses Netlify DNS, the record is added for you.
   - Otherwise, at your DNS provider, add a `CNAME` record: name `admin`, value `<your-site>.netlify.app`.
3. Wait until Netlify shows the HTTPS certificate as issued for the alias.
4. Set `ADMIN_HOST=admin.trycreatively.space` and redeploy.
   - The console and its API now answer **only** on the admin host. They return 404 on `trycreatively.space`.
   - The admin host serves only the console and the sign-in pages.
5. Optional: in Supabase → Authentication → URL Configuration, add `https://admin.trycreatively.space/**` to Redirect URLs. This is only needed if you use password-reset links from that host.

You sign in separately on the admin subdomain, because session cookies aren't shared between hosts.

A fully separate Netlify site, built from the same repository with the same env vars plus `ADMIN_HOST`, also works. It uses the same Supabase project, so there's no second user database. Most setups don't need the extra site.

## 3. Where each number comes from

Every card has an ⓘ that names its source. In short:

- **Users and signups:** Supabase Auth (`auth.users`).
- **Paying customers:** `profiles.subscription_status = 'active'`. This is set only by the signature-verified Whop webhook.
- **Credits consumed:** settled rows in the credit ledger (`credit_transactions`).
- **Analyses, images and strategies:** their own tables.
- **Payments and memberships:** live, read-only calls to Whop's API (`GET /payments`, `GET /memberships`), made from the server.
- **Verified webhooks** (`billing_events`) and the **error log** (`system_events`) start recording when migration 016 is deployed. Nothing before that date is invented.

### Not available, and why

- **MRR.** The real per-customer recurring price isn't stored anywhere reliable, because annual plans, the $1 trial and promo codes all change it. The console shows money actually collected (from Whop) instead.
- **Visitors and page views.** No analytics provider is installed. Netlify Web Analytics, if it's enabled in your Netlify account, has no documented public API. The Analytics page explains the options. **Nothing is added to the public site without your approval.**
- **Auth errors.** These live in Supabase → Logs → Auth.
- **Weekly allowance refills.** These aren't recorded as ledger rows, because the existing reset logic sets the balance directly.

## 4. Credits

Adjustments go through `admin_adjust_credits`, which runs as a single database transaction:

- It locks the profile row, validates the amount, applies the change and writes both `credit_adjustments` and the audit log.
- A repeated request with the same key returns the stored result instead of applying the change again.

Added credits are stored as bonus credits, the same way the early-customer reward works, so the weekly reset never wipes them. Removals take bonus credits first.

Prices, plan allowances and the reset logic are untouched.

## 5. Suspension

Suspension sets `profiles.access_status = 'suspended'`. The middleware then sends that account to `/account-suspended` and answers every app API call with 403 `account_suspended`.

Suspension does **not** do any of the following:

- delete the account
- touch plan, credits or Whop
- cancel, refund or change a payment

The billing page stays reachable so the customer can manage or cancel their subscription. Restoring access takes effect on their next request.

## 6. Security notes

- **Server-only data.** All console data is read on the server with the service role. The browser receives only rendered HTML and never receives the service-role key, Whop keys or `ADMIN_EMAILS`. This was verified by scanning the built browser bundles.
- **Request checks.** State-changing console APIs require a same-origin `Origin` header and a JSON body, which protects against CSRF. Inputs are validated on the server.
- **Rate limits.** Credit and access changes are rate-limited in the database (20 per admin per minute).
- **Audit log.** The log is append-only. A database trigger rejects every UPDATE, DELETE and TRUNCATE, even from the table owner.
- **Error log.** Messages are sanitised: keys, tokens, JWTs, emails and long digit runs are masked.
- **Rejected webhooks.** Rejected deliveries are logged at most once per minute per server instance, so the log can't be flooded.
