import { NextResponse } from "next/server";

// Same-site redirect that always lands on the PUBLIC site address.
//
// On Netlify, route handlers see request.url as the internal deploy address
// (e.g. https://<deploy-id>--creatively-ai-web.netlify.app), not
// trycreatively.space. Building redirects from that origin sent visitors to a
// different domain where they weren't logged in (so the $1 trial skipped the
// Whop checkout). Netlify sets URL to the site's main address
// (https://trycreatively.space); without it we fall back to a relative
// Location, which the browser resolves against the address it requested.
export function redirectTo(path: string, status: 302 | 303 | 307 = 303) {
  const site = (process.env.SITE_URL || process.env.URL || "").replace(/\/+$/, "");
  const location = site.startsWith("https://") ? `${site}${safePath(path)}` : safePath(path);
  return new NextResponse(null, { status, headers: { Location: location } });
}

/** Only allow same-site paths ("/x"), never "//evil.com" or absolute URLs. */
export function safePath(path: string | null | undefined, fallback = "/") {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) return fallback;
  return path;
}
