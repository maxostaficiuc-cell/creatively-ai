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

export async function updateSession(request: NextRequest) {
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

  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => path.startsWith(prefix));

  if (isProtected && !user) {
    const redirectUrl = new URL("/login", request.url);
    // keep the query (?plan=Starter&offer=trial) so the chosen offer survives login
    redirectUrl.searchParams.set("next", path + request.nextUrl.search);
    return NextResponse.redirect(redirectUrl);
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
