// ─────────────────────────────────────────────────────────────────────────────
// Content for the homepage feature carousel (components/marketing/FeatureCarousel).
//
// The ads are real creatives already used on the site (public/winning-ads, plus
// the Buffy hero ad from lib/demoCreative). Every callout is written from what is
// visible in that specific image. Scores are illustrative visual assessments and
// account metrics are SAMPLE DATA — the cards say so on screen.
// ─────────────────────────────────────────────────────────────────────────────

import { HERO_CREATIVE } from "@/lib/demoCreative";

export type TourAd = {
  brand: string;
  category: string;
  src: string;
  width: number;
  height: number;
  alt: string;
};

export const RIPTIDE_AD: TourAd = {
  brand: "Riptide Dive Services",
  category: "Services",
  src: "/winning-ads/creative-1.png",
  width: 1254,
  height: 1254,
  alt: "Riptide Dive Services ad: “If you’re a yacht owner, listen up or stop scrolling”, a before/after yacht illustration, comparison lists and a “Get your free quote today” button.",
};

export const PIQUE_AD: TourAd = {
  brand: "Pique",
  category: "Wellness",
  src: "/winning-ads/creative-2.png",
  width: 1080,
  height: 1350,
  alt: "Pique ad asking “What’s really in your mushroom supplement?”, comparing a fruiting-body product with mycelium-based alternatives.",
};

export const BLISSY_AD: TourAd = {
  brand: "Blissy",
  category: "Beauty & sleep",
  src: "/winning-ads/creative-3.png",
  width: 600,
  height: 600,
  alt: "Blissy sleep mask ad with a five-star customer quote, a Blissy vs regular sleep mask comparison and press logos.",
};

export const BUFFY_AD: TourAd = {
  brand: HERO_CREATIVE.brand,
  category: "Home",
  src: HERO_CREATIVE.image.src,
  width: HERO_CREATIVE.image.width,
  height: HERO_CREATIVE.image.height,
  alt: HERO_CREATIVE.image.alt,
};

/** Card 1 — Ads that sell (Riptide). `at` = point on the ad the callout refers to (fractions of the ad). */
export const SELL_CALLOUTS = [
  { label: "Attention-grabbing hook", at: { x: 0.86, y: 0.06 } },
  { label: "Before / after story", at: { x: 0.68, y: 0.28 } },
  { label: "Clear offer: free quote", at: { x: 0.5, y: 0.84 } },
  { label: "Compelling call to action", at: { x: 0.92, y: 0.84 } },
];
export const SELL_SCORE = {
  score: 8.1,
  bars: [
    { label: "Hook", score: 8.5 },
    { label: "Offer", score: 8.0 },
    { label: "CTA", score: 8.5 },
  ],
};

/** Card 2 — account overview. SAMPLE DATA, shown as such on the card. */
export const SAMPLE_ACCOUNT = {
  metrics: [
    { label: "Ad spend", value: 4820, prefix: "$", suffix: "", decimals: 0, spark: [12, 14, 13, 17, 16, 19, 21] },
    { label: "ROAS", value: 3.1, prefix: "", suffix: "×", decimals: 1, spark: [2.4, 2.6, 2.5, 2.9, 2.8, 3.0, 3.1] },
    { label: "CTR", value: 1.9, prefix: "", suffix: "%", decimals: 1, spark: [1.5, 1.6, 1.7, 1.6, 1.8, 1.8, 1.9] },
    { label: "Conversions", value: 212, prefix: "", suffix: "", decimals: 0, spark: [20, 24, 23, 29, 31, 34, 38] },
  ],
  trend: [2.3, 2.5, 2.4, 2.7, 2.6, 2.9, 2.8, 3.0, 3.2, 3.1],
};

/** Card 3 — Buffy weaknesses (all true for the image; same object as the hero). */
export const BACK_CALLOUTS = [
  { label: "Generic headline", note: "Doesn’t say why Buffy is different.", at: { x: 0.92, y: 0.235 } },
  { label: "No visible offer", note: "No clear incentive to buy now.", at: { x: 0.82, y: 0.8 } },
  { label: "Limited social proof", note: "No reviews or ratings shown.", at: { x: 0.26, y: 0.94 } },
];

/** Card 4 — library previews (illustrative examples, no performance claims). */
export const LIBRARY = {
  queries: ["testimonial ads", "before / after", "comparison ads", "product shots"],
  filters: ["All", "Beauty", "Wellness", "Home", "Services", "Static"],
  items: [
    { ad: BLISSY_AD, approach: "Testimonial" },
    { ad: PIQUE_AD, approach: "Comparison" },
    { ad: BUFFY_AD, approach: "Product shot" },
    { ad: RIPTIDE_AD, approach: "Before / after" },
  ],
};

export const TOUR_DISCLAIMER =
  "Example assessments of real ads · account figures are sample data · not campaign performance results";
