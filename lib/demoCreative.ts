// ─────────────────────────────────────────────────────────────────────────────
// The homepage demo creative — ONE object, used by every breakpoint.
//
// The phone screen (desktop + mobile) and all three analysis cards read from
// this object, so the ad that is displayed and the analysis that describes it
// can never drift apart again. To change the demo, replace this object.
//
// The analysis below is a hand-written VISUAL creative review of the image
// itself. It is not AI output generated on page load and it contains no
// campaign data — no CTR, ROAS, CPA, spend, conversions or sales.
// ─────────────────────────────────────────────────────────────────────────────

export type AnalysisTone = "green" | "red" | "purple";

export type AnalysisFinding = {
  /** Short label shown on the card ("Clear hierarchy"). */
  label: string;
  /** One-sentence explanation. */
  detail: string;
};

export type AnalysisCardData = {
  id: string;
  tone: AnalysisTone;
  title: string;
  findings: AnalysisFinding[];
  /**
   * Where this card's connector line touches the ad on desktop, as fractions
   * of the ad image (x: 0 = left edge → 1 = right edge, y: 0 = top → 1 = bottom).
   * Chosen to land on empty background next to the element being discussed,
   * so lines never run across the ad's text.
   */
  anchor: { x: number; y: number };
};

export type DemoCreative = {
  id: string;
  brand: string;
  category: string;
  image: {
    src: string;
    /** Natural pixel size of the file — used to reserve space (no layout shift). */
    width: number;
    height: number;
    alt: string;
  };
  analysis: {
    status: "completed";
    type: "visual-creative-analysis";
    /** Shown next to the demo so it is never mistaken for performance data. */
    disclaimer: string;
    cards: [AnalysisCardData, AnalysisCardData, AnalysisCardData];
  };
};

export const BUFFY_DEMO: DemoCreative = {
  id: "buffy-bedding-demo",
  brand: "Buffy",
  category: "Bedding and home products",
  image: {
    src: "/images/buffy-ad-creative.png",
    width: 338,
    height: 600,
    alt:
      "Buffy bedding ad on a pale blue background: the headline “You Spend 1/3 of Your Life in Bed”, a folded white comforter, four checkmarked benefits and a Shop Now button.",
  },
  analysis: {
    status: "completed",
    type: "visual-creative-analysis",
    disclaimer: "Visual creative observations of this ad · not campaign performance data",
    cards: [
      {
        id: "great",
        tone: "green",
        title: "What's great",
        anchor: { x: 0.33, y: 0.15 }, // just left of the Buffy logo (top of the hierarchy)
        findings: [
          {
            label: "Clear hierarchy",
            detail: "The logo, headline, product image, benefits, and CTA create an understandable sequence.",
          },
          {
            label: "Recognizable product",
            detail:
              "The white bedding stands out against the pale blue background, making the advertised product easy to identify.",
          },
          {
            label: "Scannable benefits",
            detail: "The checkmarks and short benefit statements allow viewers to process the key messages quickly.",
          },
          {
            label: "Direct CTA",
            detail: "“SHOP NOW” communicates the next action without requiring interpretation.",
          },
        ],
      },
      {
        id: "not-great",
        tone: "red",
        title: "What's not great",
        anchor: { x: 0.9, y: 0.235 }, // right end of the headline
        findings: [
          {
            label: "Generic headline",
            detail:
              "“You Spend 1/3 of Your Life in Bed” creates context but does not communicate a distinctive reason to choose Buffy over competitors.",
          },
          {
            label: "No visible offer",
            detail:
              "The creative does not display a discount, bundle, free-shipping message, or other concrete buying incentive.",
          },
          {
            label: "Unsupported benefit claims",
            detail:
              "Claims such as “Support deeper sleep” and “Temperature regulating” are not substantiated within the image itself.",
          },
          {
            label: "Missing social proof",
            detail: "There are no visible customer testimonials, ratings, or reviews.",
          },
          {
            label: "Limited urgency",
            detail: "“SHOP NOW” is clear, but the ad does not provide an additional reason to purchase immediately.",
          },
        ],
      },
      {
        id: "test",
        tone: "purple",
        title: "What to test",
        anchor: { x: 0.07, y: 0.47 }, // left of the benefit list
        findings: [
          {
            label: "Stronger hook",
            detail:
              "Test a more product-specific hook, e.g. “Make your bed your favorite place.” — a creative concept, not a proven headline.",
          },
          {
            label: "Lifestyle creative",
            detail:
              "Compare the isolated product shot with a real bedroom setting to see whether the context improves engagement.",
          },
          {
            label: "Offer-led variant",
            detail:
              "If Buffy has a real, available promotion, make it prominent and compare it against this version — never an invented discount.",
          },
          {
            label: "Genuine reviews",
            detail: "Test a genuine customer review or rating, provided it is authentic and authorized for use.",
          },
          {
            label: "One primary benefit",
            detail: "Compare the four-benefit list with one strong, substantiated primary benefit.",
          },
        ],
      },
    ],
  },
};

/** The creative the homepage hero shows. Swap this to change the demo everywhere. */
export const HERO_CREATIVE: DemoCreative = BUFFY_DEMO;
