import { NextResponse } from "next/server";
import { adminGuard } from "@/lib/libraryAdmin";
import { EU_COUNTRIES, MetaAdLibraryError, metaAdLibraryConfigured, searchImageAds } from "@/lib/metaAdLibrary";

// Admin-only: search Meta Ad Library for IMAGE ads (media_type=IMAGE).
// GET ?q=<terms>&pages=<id,id>&country=<ISO|EU>&active=1&after=<cursor>

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const denied = await adminGuard();
  if (denied) return denied;
  if (!metaAdLibraryConfigured()) {
    return NextResponse.json(
      { error: "META_AD_LIBRARY_ACCESS_TOKEN is not set, so Meta Ad Library can't be searched from here. Use “Add manually” instead." },
      { status: 503 }
    );
  }
  const u = new URL(req.url);
  const terms = (u.searchParams.get("q") ?? "").trim().slice(0, 100);
  const pageIds = (u.searchParams.get("pages") ?? "").split(",").map((s) => s.trim()).filter((s) => /^\d{3,25}$/.test(s));
  if (!terms && pageIds.length === 0) return NextResponse.json({ error: "Enter a search term or a Facebook page ID." }, { status: 400 });
  const country = (u.searchParams.get("country") ?? "EU").toUpperCase();
  const countries = country === "EU" ? EU_COUNTRIES : /^[A-Z]{2}$/.test(country) ? [country] : EU_COUNTRIES;
  try {
    const { ads, after } = await searchImageAds({
      terms: terms || undefined,
      pageIds,
      countries,
      activeOnly: u.searchParams.get("active") !== "0",
      after: u.searchParams.get("after") ?? undefined,
    });
    return NextResponse.json({ ads, after, mediaType: "IMAGE", countries });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Search failed." }, { status: e instanceof MetaAdLibraryError ? e.status : 502 });
  }
}
