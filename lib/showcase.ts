// ─────────────────────────────────────────────────────────────────────────────
// Homepage showcase ("Know what makes an ad work.") — shared config + types.
// Safe to import from client components: no secrets, no server code.
// ─────────────────────────────────────────────────────────────────────────────

import { STARTER_TRIAL } from "@/lib/starterTrial";

/** The CTA under the showcase headline. Change label / destination HERE only. */
export const SHOWCASE_CTA = STARTER_TRIAL.enabled
  ? { label: "Try now for $1", href: "/start-trial?from=showcase" }
  : // No introductory offer is purchasable yet → no price in the label.
    { label: "See plans & pricing", href: "/pricing" };

/** Hard limit for the admin upload system. */
export const SHOWCASE_MAX_ITEMS = 10;
export const SHOWCASE_BUCKET = "showcase";

export type ShowcaseCreative = {
  id: string;
  imageUrl: string;
  width: number;
  height: number;
  /** 0–100 creative score assigned in the admin panel (or illustrative, for demo items) */
  score: number;
  title: string | null;
  category: string | null;
  sortOrder: number;
};

/**
 * Temporary demonstration gallery, used until real creatives are uploaded.
 * These are the example ads already used elsewhere on the site. Scores are
 * illustrative and stable (they never change between renders).
 */
export const DEMO_SHOWCASE: ShowcaseCreative[] = [
  { id: "demo-1", imageUrl: "/winning-ads/creative-1.png", width: 1254, height: 1254, score: 86, title: "Before / after", category: "Services", sortOrder: 0 },
  { id: "demo-2", imageUrl: "/winning-ads/creative-2.png", width: 1080, height: 1350, score: 91, title: "Comparison", category: "Wellness", sortOrder: 1 },
  { id: "demo-3", imageUrl: "/images/buffy-ad-creative.png", width: 338, height: 600, score: 65, title: "Product shot", category: "Home", sortOrder: 2 },
  { id: "demo-4", imageUrl: "/winning-ads/creative-3.png", width: 600, height: 600, score: 89, title: "Testimonial", category: "Beauty", sortOrder: 3 },
];
