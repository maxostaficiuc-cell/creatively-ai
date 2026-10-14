// ─────────────────────────────────────────────────────────────────────────────
// Marketing-site content for Creative Strategy (homepage only).
//
// Everything here is an ILLUSTRATION of the real feature's screens, built
// around a fictional brand ("Aurel Skin"). Nothing is output from the live
// product, and every place that shows it is labelled as an illustration.
// Field names, basis labels, aspect ratios and progress steps mirror the real
// UI (components/strategy/*, lib/strategyTypes.ts) so the preview stays accurate.
// ─────────────────────────────────────────────────────────────────────────────

export type Basis = "verified" | "inferred" | "assumption";

export const BASIS_LABEL: Record<Basis, string> = {
  verified: "Verified",
  inferred: "Inferred",
  assumption: "Needs confirmation",
};

export const DEMO_BRAND = {
  name: "Aurel Skin",
  // The real input's placeholders, so no real brand's site is implied.
  website: "https://yourbrand.com",
  social: "https://instagram.com/yourbrand",
};

/** Same labels as the real progress screen (components/strategy/Progress.tsx). */
export const PROGRESS_STEPS = [
  "Understanding your brand",
  "Analyzing your products and positioning",
  "Identifying your target audience",
  "Developing advertising concepts",
];

/** Brand snapshot rows — labels from lib/strategyTypes.ts PROFILE_FIELDS. */
export const SNAPSHOT: { label: string; value: string; basis: Basis }[] = [
  { label: "What it sells", value: "Vitamin C face serum", basis: "verified" },
  { label: "Value proposition", value: "A simple, daily brightening step", basis: "inferred" },
  { label: "Likely audience", value: "Adults building an easy routine", basis: "inferred" },
  { label: "Pricing & offers", value: "Not found on the site", basis: "assumption" },
];

export const CONCEPTS: { angle: string; name: string; hook: string }[] = [
  { angle: "Benefit-led", name: "The 30-second routine", hook: "One step, every morning." },
  { angle: "Problem–solution", name: "Dull-morning reset", hook: "Dull mornings? Start with one drop." },
  { angle: "Product demonstration", name: "One drop, close up", hook: "See the texture before you buy." },
  { angle: "Offer-led", name: "First-bottle offer", hook: "Try it with a first-order offer." },
];

/** The concept the generation previews are built from. */
export const SELECTED_CONCEPT = 1;

export type AdRatio = "4:5" | "1:1" | "9:16";

export const AD_VARIANTS: { ratio: AdRatio; lines: [string, string]; cta: string }[] = [
  { ratio: "4:5", lines: ["Dull mornings?", "Start with one drop."], cta: "Shop now" },
  { ratio: "1:1", lines: ["Your morning,", "simplified."], cta: "Learn more" },
  { ratio: "9:16", lines: ["One drop.", "Every morning."], cta: "Shop now" },
];

export const SUGGESTED_COPY = {
  headline: "Dull mornings? Start with one drop.",
  primary: "A vitamin C serum that fits into the first 30 seconds of your day.",
  cta: "Shop now",
};

export const ILLUSTRATION_NOTE = "Illustration of the product screens with a fictional brand — not real customer output.";
