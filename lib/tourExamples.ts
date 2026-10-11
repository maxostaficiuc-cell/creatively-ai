// ─────────────────────────────────────────────────────────────────────────────
// Example ads for the homepage "Inside every report" carousel.
//
// Each card uses a DIFFERENT real ad from public/winning-ads (plus the Buffy ad,
// which comes from lib/demoCreative so it always matches the hero). Every
// observation below is written from what is visible in that specific image.
// Scores are illustrative visual assessments — not campaign performance data.
// ─────────────────────────────────────────────────────────────────────────────

export type TourAd = {
  brand: string;
  category: string;
  src: string;
  width: number;
  height: number;
  alt: string;
};

export const BLISSY_AD: TourAd = {
  brand: "Blissy",
  category: "Sleep mask",
  src: "/winning-ads/creative-3.png",
  width: 600,
  height: 600,
  alt: "Blissy sleep mask ad with a five-star customer quote, a Blissy vs regular sleep mask comparison and press logos.",
};

export const RIPTIDE_AD: TourAd = {
  brand: "Riptide Dive Services",
  category: "Yacht care",
  src: "/winning-ads/creative-1.png",
  width: 1254,
  height: 1254,
  alt: "Riptide Dive Services ad: “If you’re a yacht owner, listen up or stop scrolling”, a before/after yacht illustration, comparison lists and a free-quote button.",
};

export const PIQUE_AD: TourAd = {
  brand: "Pique",
  category: "Mushroom supplement",
  src: "/winning-ads/creative-2.png",
  width: 1080,
  height: 1350,
  alt: "Pique ad asking “What’s really in your mushroom supplement?”, comparing fruiting-body product with mycelium-based alternatives.",
};

/** Card 1 — what's working, on the Blissy ad. */
export const BLISSY_WORKING = {
  score: 8.4,
  highlight: "Customer quote as the hook",
  signals: [
    { label: "Trust / Credibility", score: 9.0 },
    { label: "Differentiation", score: 8.5 },
    { label: "Message Clarity", score: 8.5 },
    { label: "Visual Hierarchy", score: 8.0 },
    { label: "Hook Strength", score: 8.0 },
  ],
};

/** Card 3 — test ideas, on the Riptide ad. */
export const RIPTIDE_TESTS = [
  { title: "One clear benefit", detail: "Lead with a single benefit instead of two long comparison lists." },
  { title: "Real photography", detail: "Compare the illustration with a photo of a freshly cleaned yacht." },
  { title: "Shorter opening line", detail: "Test a tighter hook than the current two-line headline." },
];
export const RIPTIDE_KEEP = "Keep: the before/after idea and the “free quote” CTA.";

/** Card 4 — audience hypotheses, on the Pique ad. */
export const PIQUE_AUDIENCES = [
  { name: "Mushroom & supplement buyers", tag: "Test first" },
  { name: "Ingredient “label readers”", tag: "Test first" },
  { name: "Wellness & clean-living shoppers", tag: "Also test" },
  { name: "People switching from competitors", tag: "Also test" },
];
export const PIQUE_ANGLE = "Position around ingredient transparency — what’s actually in the product.";

export const TOUR_DISCLAIMER = "Example assessments of real ads · visual observations, not campaign performance data";
