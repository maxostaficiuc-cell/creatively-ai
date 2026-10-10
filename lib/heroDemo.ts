// ─────────────────────────────────────────────────────────────────────────────
// Homepage hero demo — every replaceable piece of the cinematic hero lives here.
//
// Nothing in this file is AI output. The findings below are hand-written,
// illustrative creative observations for one example ad. They are NOT
// verified campaign results and must never be presented as ROAS / CTR / CPA /
// conversion / spend data. When real AI output should drive the hero, replace
// `heroAnalysis` with the same shape and the components keep working.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The advertisement shown inside the phone screen.
 * Put your exact Everyday Dose ad at:  public/images/creatively-demo-ad.png
 * It is displayed as-is (object-fit: contain — never cropped, never regenerated).
 */
export const DEMO_AD_IMAGE = {
  src: "/images/creatively-demo-ad.png",
  alt: "Example advertisement being analyzed by Creatively.ai",
};

/**
 * The photoreal hand-holding-phone photograph (black background).
 * Place the file at public/images/hero-hand-phone.png (or .jpg / .jpeg / .webp —
 * the first one that exists is used).
 *
 * `screen` is where the phone's display sits inside that photo, in percent of
 * the photo's width/height. The ad layer is positioned on top of this box, so
 * if you ever swap the photo for a different one, only these numbers change —
 * the animation code does not.
 */
export const HAND_PHONE_ASSET = {
  sources: [
    "/images/hero-hand-phone.png",
    "/images/hero-hand-phone.jpg",
    "/images/hero-hand-phone.jpeg",
    "/images/hero-hand-phone.webp",
  ],
  /** Natural aspect ratio of the photo (width / height). The supplied photo is 848 × 1264. */
  aspect: 848 / 1264,
  screen: {
    left: 33.2, // %
    top: 13.8, // %
    width: 33.0, // %
    height: 47.9, // %
    /** CSS border-radius for the display corners (horizontal / vertical). */
    radius: "12% / 5.6%",
  },
};

/**
 * CSS custom properties derived from HAND_PHONE_ASSET, so the hero's layout
 * (photo size, where the cards sit) follows the photo automatically.
 */
export function handPhoneCssVars(): Record<string, string> {
  const { aspect, screen } = HAND_PHONE_ASSET;
  return {
    "--hp-aspect": String(aspect),
    "--scr-left": String(screen.left / 100),
    "--scr-top": String(screen.top / 100),
    "--scr-w": String(screen.width / 100),
    "--scr-h": String(screen.height / 100),
  };
}

export type AnalysisTone = "green" | "red" | "purple";

export type HeroAnalysisCard = {
  id: string;
  tone: AnalysisTone;
  title: string;
  /** Rendered as `lead` (emphasised) immediately followed by `rest` — together they form the exact sentence. */
  items: { lead: string; rest: string }[];
  /**
   * Points on the ad image each connector line should touch, as fractions of
   * the ad image (0,0 = top-left, 1,1 = bottom-right). Tune these once your
   * exact ad is in place so the lines land on the price, gifts, labels, etc.
   */
  anchors: { x: number; y: number }[];
};

/** Illustrative creative observations for the Everyday Dose example ad. */
export const heroAnalysis: HeroAnalysisCard[] = [
  {
    id: "great",
    tone: "green",
    title: "What's great",
    items: [
      {
        lead: "Strong price anchoring",
        rest: ": the crossed-out $179 price and prominent $30 offer create a clear visual hook.",
      },
      {
        lead: "Valuable incentive",
        rest: ": the five free gifts increase the perceived value of the starter kit.",
      },
      {
        lead: "Distinctive contrast",
        rest: ": the dark purple background and bright pink price treatment attract attention.",
      },
      {
        lead: "Product-focused composition",
        rest: ": the packaging and surrounding ingredients establish the product category.",
      },
      {
        lead: "Scannable benefits",
        rest: ": the small benefit labels communicate several intended product benefits quickly.",
      },
    ],
    anchors: [{ x: 0.3, y: 0.3 }],
  },
  {
    id: "not-great",
    tone: "red",
    title: "What's not great",
    items: [
      {
        lead: "Competing messages",
        rest: ": the headline, crossed-out price, $30 price, and free-gift claim compete for attention.",
      },
      {
        lead: "Limited explanation",
        rest: ": new customers may not immediately understand what mushroom coffee is.",
      },
      {
        lead: "Small supporting text",
        rest: ": the benefit labels and package details may be difficult to read on mobile.",
      },
      {
        lead: "Limited visible social proof",
        rest: ": a testimonial or review could help establish trust.",
      },
      {
        lead: "Claims need substantiation",
        rest: ": health-related advertising claims should be supported and compliant.",
      },
    ],
    anchors: [{ x: 0.72, y: 0.14 }],
  },
  {
    id: "test",
    tone: "purple",
    title: "What to test",
    items: [
      { lead: "Test a clearer offer headline", rest: " explaining the $30 starter kit and five free gifts." },
      { lead: "Test a concise explanation", rest: " of mushroom coffee and its intended use." },
      { lead: "Test genuine customer reviews", rest: " or testimonials, if available." },
      { lead: "Test a lifestyle creative", rest: " showing the product being prepared and consumed." },
      { lead: "Test a benefit-led creative", rest: " using substantiated claims." },
    ],
    anchors: [{ x: 0.28, y: 0.78 }],
  },
];

/** Shown alongside the demo so it is never mistaken for performance data. */
export const HERO_DISCLAIMER =
  "Example analysis · illustrative creative observations, not campaign performance data";
