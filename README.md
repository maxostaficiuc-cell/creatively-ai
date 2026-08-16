# Creatively.ai — v1

Production-structured Next.js 14 (App Router) + TypeScript + Tailwind app with
real Supabase authentication, a protected dashboard, and polished placeholder
pages for every future feature. No mocked auth, no fake sessions.

## 1. Install

```bash
npm install
```

## 2. Create a Supabase project

1. Go to https://supabase.com and create a new project.
2. In the SQL Editor, run everything in `supabase/schema.sql`. This creates
   the `profiles` table, row-level security policies, and a trigger that
   auto-creates a profile row whenever someone signs up.
3. In **Authentication → URL Configuration**, set:
   - Site URL: `http://localhost:3000` (and your production URL later)
   - Redirect URLs: `http://localhost:3000/auth/callback`
4. In **Authentication → Providers → Email**, decide whether you want email
   confirmation required before login (recommended for production). The
   signup page already handles both cases.

## 3. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from
your Supabase project's API settings.

## 4. Run it

```bash
npm run dev
```

Visit `http://localhost:3000`.

## What's real vs. placeholder

**Real:**
- Signup / login / logout via Supabase Auth
- Persistent sessions via `@supabase/ssr` cookies
- Middleware-protected routes (`/dashboard`, `/analyze`, `/billing`, etc. —
  see `PROTECTED_PREFIXES` in `lib/supabase/middleware.ts`)
- User profile stored in Postgres (`profiles` table), isolated per user via
  row-level security
- Onboarding answers saved to the profile
- Dashboard header pulls the real logged-in user's name — never hard-coded

**Placeholder (by design, per the product rules — no fake data):**
- Ad spend / ROAS / CTR / conversions cards show an empty state until a real
  ad account is connected
- Meta / TikTok / Google OAuth — `/accounts` is a polished placeholder ready
  for real OAuth integration
- Creative analysis, winning ads library, campaigns/ad sets/ads/insights —
  polished placeholder pages using the same design system, ready to wire up
  to real features
- Billing — placeholder, ready for Stripe

## Structure

```
app/
  page.tsx                 marketing landing page
  pricing/                 marketing pricing page
  (auth)/login, signup, forgot-password
  auth/callback/route.ts   Supabase email-link handler
  onboarding/
  (app)/                   protected route group (dashboard + all app pages)
lib/supabase/              browser / server / middleware Supabase clients
components/ui/             Button, Modal, EmptyState, LoadingState, Logo
components/marketing/      Nav, Footer
components/dashboard/      Sidebar, TopBar, MetricCard, PerformanceChart,
                            CreativeInsightCard, CreativeCard,
                            RecentAnalysisTable, AccountStatusCard, AppShell
supabase/schema.sql         database schema + RLS policies
```

## Note on this build

This codebase was generated without a live network connection, so it hasn't
been run through `npm install` / `next dev` in this environment. It's
straightforward, standard Next.js + Supabase — but run it locally (or in
Claude Code / Vercel) and fix anything a fresh install surfaces before
shipping. The most likely rough edges are minor TypeScript/ESLint nits, not
architectural ones.
