import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/analyze",
  "/creative-strategy",
  "/winning-ads",
  "/my-creatives",
  "/campaigns",
  "/ad-sets",
  "/ads",
  "/insights",
  "/accounts",
  "/billing",
  "/settings",
  "/contact",
  "/onboarding",
];

// ── Admin Control Center isolation ─────────────────────────────────────────
// The console lives at /admin (overview) and the sections below, plus its API
// under /api/admin/control. The older /admin/showcase, /admin/library and
// /admin/rewards tools are not part of it and are left exactly as they were.
const ADMIN_CONSOLE_SECTIONS = ["users", "credits", "access", "payments", "analytics", "health", "audit", "admins"];
export function isAdminConsolePath(path: string): boolean {
  if (path === "/admin" || path === "/admin/") return true;
  if (path === "/api/admin/control" || path.startsWith("/api/admin/control/")) return true;
  const m = path.match(/^\/admin\/([^/]+)/);
  return !!m && ADMIN_CONSOLE_SECTIONS.includes(m[1]);
}
// Pages the admin subdomain still needs: signing in and the auth callback.
const ADMIN_HOST_ALLOWED = ["/login", "/forgot-password", "/auth/", "/account-suspended"];

// ── Account suspension ──────────────────────────────────────────────────────
// A suspended account (profiles.access_status = 'suspended', set only from the
// admin console) is blocked from the app and every API route here, server-side.
// Still reachable: billing (so they can manage or cancel their Whop subscription),
// the support form, sign-in pages, and endpoints that never act for a user.
const SUSPENSION_EXEMPT = [
  "/account-suspended",
  "/billing",
  "/api/billing",
  "/contact",
  "/api/webhooks",
  "/api/public-stats",
  "/auth/",
];

function notFound() {
  return new NextResponse("Not found", { status: 404, headers: { "content-type": "text/plain", "x-robots-tag": "noindex" } });
}

export async function updateSession(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Optional separate admin hostname (e.g. admin.trycreatively.space). When
  // ADMIN_HOST is set, the console is served ONLY there, and that host serves
  // nothing but the console and sign-in.
  const adminHost = (process.env.ADMIN_HOST ?? "").trim().toLowerCase();
  if (adminHost) {
    const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "").split(",")[0].trim().toLowerCase().split(":")[0];
    const consolePath = isAdminConsolePath(path);
    if (host === adminHost) {
      if (path === "/") return NextResponse.redirect(new URL("/admin", request.url));
      if (!consolePath && !ADMIN_HOST_ALLOWED.some((p) => path === p || (p.endsWith("/") && path.startsWith(p)))) return notFound();
    } else if (consolePath) {
      return notFound();
    }
  }

  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    // keep the query (?plan=Starter&offer=trial) so the chosen offer survives login
    redirectUrl.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && (isProtected || path.startsWith("/api/")) && !SUSPENSION_EXEMPT.some((p) => path === p || path.startsWith(p.endsWith("/") ? p : `${p}/`))) {
    // Reads the signed-in user's own row (RLS). Fails open if the column doesn't
    // exist yet (migration 016 not run), so deploying this never locks anyone out.
    const { data: access, error } = await supabase.from("profiles").select("access_status").eq("id", user.id).maybeSingle();
    if (!error && (access as { access_status?: string } | null)?.access_status === "suspended") {
      if (path.startsWith("/api/")) {
        return NextResponse.json({ error: "This account is suspended. Contact support.", code: "account_suspended" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/account-suspended", request.url));
    }
  }

  if ((path === "/login" || path === "/signup") && user) {
    // Already signed in: honour where they were heading instead of dumping
    // them on the dashboard (e.g. the $1 trial → straight to checkout).
    const params = request.nextUrl.searchParams;
    const next = params.get("next");
    let dest = "/dashboard";
    if (params.get("offer") === "trial") dest = "/start-trial?from=signup";
    else if (next && next.startsWith("/") && !next.startsWith("//")) dest = next;
    else if (path === "/signup" && params.get("plan")) dest = `/onboarding?plan=${encodeURIComponent(params.get("plan")!)}`;
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return response;
}
