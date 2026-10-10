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

import type { CreativeReport } from "@/lib/analyzeCreative";

export type AnalysisTone = "green" | "red" | "purple";

export type AnalysisFinding = {
  /** Short label shown on the card ("Clear hierarchy"). */
  label: string;
  /** One-sentence explanation. */
  detail: string;
  /** Full report only: why this matters (never a claimed performance effect). */
  why?: string;
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
  /** The complete report behind "Show full analysis" (see FullCreativeReport). */
  report: FullCreativeReport;
};

/**
 * The complete report behind "Show full analysis".
 *
 * `core` is the product's own report shape (CreativeReport — the same schema the
 * AI analysis, saved reports and /report pages use: 0–100 score, signal scores,
 * hooks, audience inference, testing plan…). The other fields add the deeper
 * sections of the demo report. Everything is a visual creative assessment of the
 * image — no campaign data exists for this demo, so no performance values appear.
 */
export type FullCreativeReport = {
  creativeId: string;
  kind: "illustrative-visual-assessment";
  core: CreativeReport;
  /** core.score expressed out of 10 (65 / 100 → 6.5). */
  scoreOutOf10: number;
  scoreNote: string;
  scoreDimensions: { name: string; rating: "Strong" | "Moderate" | "Weak"; note: string }[];
  overview: { label: string; value: string; basis: "Visible in the ad" | "Inferred" }[];
  audiences: { name: string; why: string; signals: string[] }[];
  hook: {
    headline: string;
    checks: { aspect: string; note: string }[];
    mainWeakness: string;
    alternatives: { text: string; note: string }[];
  };
  visual: { aspect: string; verdict: "Works well" | "Mixed" | "Could improve"; note: string }[];
  copy: { element: string; text?: string; note: string }[];
  copyOpportunity: string;
  offer: { visible: string; assessment: string; clarify: string[]; testNote: string };
  trust: { claims: { claim: string; note: string }[]; notes: string[] };
  cta: { checks: { aspect: string; note: string }[]; alternatives: string[]; note: string };
  tests: {
    priority: number;
    name: string;
    hypothesis: string;
    changes: string;
    staysSame: string;
    metric: string;
    condition?: string;
  }[];
  /** Campaign metrics the product can read from a connected ad account (lib/meta/client.ts). */
  metrics: string[];
  finalRecommendations: { action: string; why: string }[];
};

const BUFFY_BASE: Omit<DemoCreative, "report"> = {
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
            why: "A clear reading order lets someone scrolling past take in brand, message, product and action in a few seconds, without working out where to look first.",
          },
          {
            label: "Recognizable product",
            detail:
              "The white bedding stands out against the pale blue background, making the advertised product easy to identify.",
            why: "When the product is obvious at a glance, the viewer knows what is being sold before reading any copy — useful in a feed where most people only glance.",
          },
          {
            label: "Scannable benefits",
            detail: "The checkmarks and short benefit statements allow viewers to process the key messages quickly.",
            why: "Short checkmarked phrases can be absorbed in one pass, so the main selling points still get across to people who skim rather than read.",
          },
          {
            label: "Direct CTA",
            detail: "“SHOP NOW” communicates the next action without requiring interpretation.",
            why: "A familiar, unambiguous action removes guesswork about what to do next for anyone who is already interested.",
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
            why: "A line that could sit on almost any bedding ad gives viewers context but no specific reason to choose this brand over the alternatives.",
          },
          {
            label: "No visible offer",
            detail:
              "The creative does not display a discount, bundle, free-shipping message, or other concrete buying incentive.",
            why: "Without a concrete incentive, the ad relies entirely on the product and benefits to motivate a click — there is nothing that rewards acting now.",
          },
          {
            label: "Unsupported benefit claims",
            detail:
              "Claims such as “Support deeper sleep” and “Temperature regulating” are not substantiated within the image itself.",
            why: "Sleep- and temperature-related claims invite the question “how?”; without visible support they may read as generic and can need evidence before they are used in advertising.",
          },
          {
            label: "Missing social proof",
            detail: "There are no visible customer testimonials, ratings, or reviews.",
            why: "New customers often look for signs that other people have bought and liked a product; none are visible here.",
          },
          {
            label: "Limited urgency",
            detail: "“SHOP NOW” is clear, but the ad does not provide an additional reason to purchase immediately.",
            why: "With no time-bound reason or incentive, interested viewers can easily postpone the decision.",
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


// ── Full report (behind "Show full analysis") ────────────────────────────────
// Built from the same cards above, so the compact cards and the report can never
// disagree. Scores are an illustrative visual assessment, not measured results.

const [GREAT, NOT_GREAT, TO_TEST] = BUFFY_BASE.analysis.cards;

const BUFFY_REPORT: FullCreativeReport = {
  creativeId: BUFFY_BASE.id,
  kind: "illustrative-visual-assessment",
  scoreOutOf10: 6.5,
  scoreNote:
    "An illustrative visual assessment of this image — 65 on the Creatively.ai 0–100 scale (60–79 = Average). It is not a measured or statistically validated performance score; no campaign data is connected for this example.",
  scoreDimensions: [
    { name: "Visual clarity", rating: "Strong", note: "Clean layout with a clear top-to-bottom reading order and plenty of space." },
    { name: "Message strength", rating: "Weak", note: "The headline sets context but gives no distinctive reason to choose Buffy." },
    { name: "Product presentation", rating: "Strong", note: "The white comforter is large, central and contrasts well with the pale blue background." },
    { name: "Benefit communication", rating: "Moderate", note: "Four benefits are easy to scan, but none is explained or supported." },
    { name: "Offer strength", rating: "Weak", note: "No price, discount, bundle or other incentive is visible." },
    { name: "Trust and credibility", rating: "Weak", note: "No reviews, ratings or evidence behind the sleep and temperature claims." },
    { name: "CTA clarity", rating: "Strong", note: "“SHOP NOW” is unambiguous and visually distinct at the bottom of the ad." },
  ],
  overview: [
    { label: "Brand", value: "Buffy", basis: "Visible in the ad" },
    { label: "Product category", value: "Bedding / home products", basis: "Inferred" },
    { label: "Creative format", value: "Static image advertisement, vertical 9:16", basis: "Visible in the ad" },
    { label: "Primary message", value: "“You Spend 1/3 of Your Life in Bed”", basis: "Visible in the ad" },
    { label: "Main visual", value: "Folded white bedding on a white block against a pale blue, cloud-like background", basis: "Visible in the ad" },
    { label: "Benefit statements", value: "Support deeper sleep · Temperature regulating · Softer than a cloud · Natural lightweight", basis: "Visible in the ad" },
    { label: "Closing line", value: "“Make every moment count.”", basis: "Visible in the ad" },
    { label: "Primary CTA", value: "“SHOP NOW”", basis: "Visible in the ad" },
    { label: "Main creative angle", value: "Comfort and sleep-related product benefits", basis: "Inferred" },
    { label: "Platform, placement, objective, publication date", value: "Not stated in the creative — not assumed", basis: "Inferred" },
  ],
  audiences: [
    {
      name: "Sleep-comfort and bedding shoppers",
      why: "The ad's message is entirely about time in bed and comfort, which speaks most directly to people already thinking about better sleep or new bedding.",
      signals: ["Interests: bedding, sleep, mattresses, bedroom comfort", "Intent: browsing comforters, duvets or bedding sets"],
    },
    {
      name: "People furnishing or refreshing a bedroom",
      why: "Someone moving home or redecorating is actively buying bedroom items, so a clean product-led ad may fit their shopping moment.",
      signals: ["Interests: home furnishing, interior design", "Intent: recent searches for bedroom furniture or décor"],
    },
    {
      name: "Home décor and home-comfort shoppers",
      why: "The calm, minimal visual style aligns with people who buy home products for look and feel as well as function.",
      signals: ["Interests: home décor, home-comfort brands, minimalist interiors"],
    },
    {
      name: "Gift shoppers for practical home products",
      why: "Bedding can be a practical gift; this is the most speculative hypothesis and would need its own creative angle to test fairly.",
      signals: ["Intent: gift-related browsing for home products", "Seasonal: gifting periods"],
    },
  ],
  hook: {
    headline: "“You Spend 1/3 of Your Life in Bed” (introduced by “Did you know?”)",
    checks: [
      { aspect: "Attention", note: "The “Did you know?” framing and a relatable fact can prompt a glance, helped by the large serif headline." },
      { aspect: "Specificity", note: "Low — the fact applies to everyone and to every bedding brand." },
      { aspect: "Relevance to the product", note: "Relevant: it connects time in bed to the value of good bedding." },
      { aspect: "Differentiation", note: "Weak — it does not say what is different about Buffy’s comforter." },
      { aspect: "Reason to keep reading", note: "It sets up a problem but does not promise a specific answer, so the benefit list has to do all the persuading." },
    ],
    mainWeakness:
      "The headline establishes context but not a distinctive reason to choose Buffy, so the most prominent text on the ad does not sell the product.",
    alternatives: [
      { text: "“Make your bed your favorite place.”", note: "Comfort-focused concept — a suggestion to test, not a proven winner." },
      { text: "A product-specific headline built on one verified benefit", note: "Use only a benefit Buffy can substantiate, stated plainly." },
      { text: "A comfort-focused headline paired with a short, truthful product explanation", note: "Keeps the emotional angle but adds what the product actually is and does." },
    ],
  },
  visual: [
    { aspect: "Color contrast", verdict: "Works well", note: "White bedding against pale blue separates product and background clearly; dark text reads well on the light sky." },
    { aspect: "Product prominence", verdict: "Works well", note: "The comforter occupies the visual centre and is the largest element." },
    { aspect: "Typography", verdict: "Mixed", note: "The serif headline feels premium and on-brand; the benefit labels are set very small." },
    { aspect: "Text hierarchy", verdict: "Works well", note: "Brand → hook → headline → benefits → closing line → CTA follows a logical order." },
    { aspect: "Benefit-list readability", verdict: "Could improve", note: "Checkmarks help scanning, but the small type may be hard to read at phone size." },
    { aspect: "Background and composition", verdict: "Works well", note: "Calm sky background supports the softness theme without competing with the product." },
    { aspect: "Visual balance", verdict: "Mixed", note: "Benefits on the left balance the product on the right, though the left column is visually light." },
    { aspect: "CTA visibility", verdict: "Works well", note: "The outlined “SHOP NOW” button stands apart from the background near the bottom." },
    { aspect: "Mobile readability", verdict: "Could improve", note: "Headline and CTA read well; the four benefit labels are likely the first thing to become illegible on small screens." },
  ],
  copy: [
    { element: "Opening line", text: "Did you know?", note: "Sets up a fact; adds curiosity but no product information." },
    { element: "Main headline", text: "You Spend 1/3 of Your Life in Bed", note: "Clear and relatable, but generic to the category." },
    { element: "Benefit statements", text: "Support deeper sleep · Temperature regulating · Softer than a cloud · Natural lightweight", note: "Short and scannable; four parallel claims compete for attention and none is explained." },
    { element: "Closing message", text: "Make every moment count.", note: "Pleasant but abstract; it does not add a reason to buy." },
    { element: "CTA wording", text: "SHOP NOW", note: "Clear and direct." },
    { element: "Message consistency", note: "Consistent comfort/sleep theme throughout; tone is calm and premium." },
    { element: "Clarity for a new customer", note: "It is clear the product is bedding; it is less clear what makes this bedding different or why it is worth the price." },
    { element: "Distinctive reason to buy", note: "Not visible — no unique feature, material, guarantee or offer is shown." },
  ],
  copyOpportunity:
    "Replace one generic element (the headline or closing line) with a specific, verifiable statement about the product — what it is made of, how it feels, or what makes it different — without adding claims Buffy cannot support.",
  offer: {
    visible: "None — the creative shows no price, discount, bundle, free-shipping message, trial or guarantee.",
    assessment:
      "The value proposition rests on the product image and four benefit phrases. That communicates the category but not why this comforter is worth buying now or over alternatives.",
    clarify: [
      "State one concrete, true differentiator (material, construction, feel) instead of four general benefits.",
      "If a real price point or guarantee is a strength, consider showing it.",
      "Connect the headline to the product (“…so make it the most comfortable place you know”).",
    ],
    testNote:
      "Only test an offer-led version if Buffy actually has a promotion available. Do not create discounts, prices, guarantees or shipping terms for a test.",
  },
  trust: {
    claims: [
      { claim: "Support deeper sleep", note: "A sleep-related claim; may need appropriate supporting evidence before use in advertising." },
      { claim: "Temperature regulating", note: "A functional performance claim; typically needs product testing or specifications behind it." },
      { claim: "Softer than a cloud", note: "Figurative comparison — likely read as puffery rather than a factual claim." },
      { claim: "Natural lightweight", note: "Ambiguous wording; if it refers to materials, the material claim may need to be accurate and verifiable." },
    ],
    notes: [
      "No customer reviews, ratings or testimonials are visible.",
      "Add genuine reviews or ratings only when they are authentic and authorized for use.",
      "This review does not conclude that the ad breaks any advertising policy — it flags claims worth checking.",
    ],
  },
  cta: {
    checks: [
      { aspect: "Clarity", note: "Unambiguous — the viewer knows the next step is shopping." },
      { aspect: "Visibility", note: "Distinct outlined button with an arrow, placed where the eye ends." },
      { aspect: "Relevance", note: "Appropriate for a direct-to-consumer product ad." },
      { aspect: "Strength of the next step", note: "Generic; it does not say what the viewer gets by clicking." },
      { aspect: "Motivation to click", note: "Limited — there is no offer or urgency above it, so the CTA depends on interest created by the benefits alone." },
    ],
    alternatives: ["“Shop the comforter”", "“Find your comforter”", "“See how it feels”"],
    note: "Alternative CTAs are concepts to test, not changes expected to perform better.",
  },
  tests: [
    {
      priority: 1,
      name: "Hook test",
      hypothesis: "A product-specific headline may give viewers a clearer reason to care than the general “1/3 of your life” fact.",
      changes: "Headline only (e.g. “Make your bed your favorite place.” or a verified-benefit headline).",
      staysSame: "Image, benefits, layout, closing line and CTA.",
      metric: "CTR, then conversion rate — if campaign tracking is available.",
    },
    {
      priority: 2,
      name: "Lifestyle test",
      hypothesis: "Showing the comforter in a real bedroom may help viewers imagine using it.",
      changes: "Product-on-sky visual replaced by a realistic bedroom scene.",
      staysSame: "Headline, benefits, CTA and brand placement.",
      metric: "CTR and thumb-stop / hook rate — if available.",
    },
    {
      priority: 3,
      name: "Offer test",
      hypothesis: "A visible, genuine incentive may give interested viewers a reason to act now.",
      changes: "Adds a real, currently available promotion to the creative.",
      staysSame: "Visual, headline and CTA.",
      metric: "Conversion rate and CPA — if available.",
      condition: "Only if Buffy has a real offer to show.",
    },
    {
      priority: 4,
      name: "Social-proof test",
      hypothesis: "An authentic review or rating may increase trust for first-time buyers.",
      changes: "Adds one genuine customer review or rating.",
      staysSame: "Everything else.",
      metric: "Conversion rate — if available.",
      condition: "Only with authentic, authorized reviews.",
    },
    {
      priority: 5,
      name: "Simplified-message test",
      hypothesis: "One prominent, substantiated benefit may be easier to read and remember than four small ones.",
      changes: "Four-benefit list replaced by a single, larger benefit statement.",
      staysSame: "Image, headline and CTA.",
      metric: "CTR and conversion rate — if available.",
    },
  ],
  metrics: ["Spend", "Impressions", "Clicks", "CTR", "CPC", "CPM", "Conversions", "CPA", "Revenue", "ROAS"],
  finalRecommendations: [
    { action: "Test a more product-specific headline", why: "The headline is the most prominent text and currently does not sell the product — the highest-leverage change on the image." },
    { action: "Sharpen the value proposition", why: "Nothing visible explains why this comforter over others; one concrete, true differentiator would do more than four general claims." },
    { action: "Try a lifestyle variation", why: "The isolated product is clear, but a real bedroom may make the comfort promise easier to picture." },
    { action: "Strengthen the evidence behind benefits", why: "Sleep and temperature claims are the most specific statements in the ad and currently have nothing supporting them." },
    { action: "Test authentic social proof where available", why: "Trust signals are absent; genuine reviews are a low-effort addition if Buffy has them." },
  ],
  core: {
    score: 65,
    verdict_label: "Average",
    summary:
      "A clean, clearly branded product ad with a direct CTA, held back by a generic headline, no visible offer and unsupported benefit claims.",
    whats_working: GREAT.findings.map((f) => f.detail).join(" "),
    whats_not: NOT_GREAT.findings.map((f) => f.detail).join(" "),
    what_to_test: TO_TEST.findings.map((f) => f.detail).join(" "),
    executive_summary:
      "This report reviews the Buffy bedding ad shown in the phone: a vertical static image with the headline “You Spend 1/3 of Your Life in Bed”, a folded white comforter, four benefit statements and a “SHOP NOW” button. The creative is visually clear and the product is easy to recognise, but its most prominent message is generic, it shows no offer, and its sleep and temperature claims are unsupported in the image. It is a reasonable control to test stronger variants against.",
    biggest_strength: "The product is instantly recognisable and the layout reads in a clear order from brand to CTA.",
    biggest_weakness: "The headline gives no distinctive reason to choose Buffy over other bedding brands.",
    biggest_opportunity: "A product-specific hook built on one verifiable benefit.",
    campaign_readiness: "Usable as a baseline — test stronger variants alongside it",
    strengths: GREAT.findings.map((f) => `${f.label}: ${f.detail}`),
    priority_fixes: NOT_GREAT.findings.map((f) => `${f.label}: ${f.detail}`),
    expected_impact:
      "Clarifying the headline and value proposition could make the ad more persuasive to new customers; whether it does can only be confirmed by testing with real campaign data.",
    signal_scores: [
      { label: "Hook Strength", score: 5 },
      { label: "Scroll-Stop Potential", score: 6 },
      { label: "Message Clarity", score: 8 },
      { label: "Visual Hierarchy", score: 8 },
      { label: "Offer Strength", score: 3 },
      { label: "CTA Strength", score: 7 },
      { label: "Audience Match", score: 7 },
      { label: "Brand Consistency", score: 8 },
      { label: "Trust / Credibility", score: 5 },
      { label: "Differentiation", score: 4 },
      { label: "Emotional Appeal", score: 7 },
      { label: "Mobile Readability", score: 7 },
      { label: "Creative Fatigue Risk", score: 7 },
    ],
    positive_factors: [
      "Clear visual hierarchy from logo to CTA",
      "High product/background contrast",
      "Scannable checkmarked benefits",
      "Unambiguous “SHOP NOW” call to action",
    ],
    negative_factors: [
      "Generic, category-wide headline",
      "No visible offer or incentive",
      "Benefit claims without visible support",
      "No reviews, ratings or other social proof",
    ],
    improvement_plan: [
      "Rewrite the headline around one specific, verifiable product benefit — it is the most prominent text.",
      "Show one concrete differentiator so the value proposition is clear.",
      "Increase the size of the benefit text, or reduce four benefits to one, for mobile readability.",
      "Add genuine social proof if authentic reviews are available.",
      "Test a lifestyle version against this product-focused control.",
    ],
    hook_analysis:
      "“Did you know? You Spend 1/3 of Your Life in Bed” is relatable and creates mild curiosity, but it is true of every bedding brand. It frames why bedding matters without saying why this comforter is the answer, so it does little to differentiate Buffy.",
    hook_recommendations: [
      { category: "Emotional", hooks: ["Make your bed your favorite place."] },
      { category: "Curiosity", hooks: ["What your comforter does in the hours you don’t notice it"] },
      { category: "Direct Response", hooks: ["Upgrade the bed you spend a third of your life in."] },
      { category: "Problem Awareness", hooks: ["Waking up too warm? (only with a substantiated temperature claim)"] },
      { category: "Benefit Driven", hooks: ["[One verified benefit] — in a comforter built for everyday comfort"] },
    ],
    new_ad_angles: [
      "Lifestyle: the comforter in a real, lived-in bedroom",
      "Material story: what the comforter is made of (if verifiable)",
      "Social proof: one genuine customer quote or rating (if authorized)",
    ],
    creative_improvements: [
      "Enlarge the benefit text or reduce it to one benefit",
      "Tie the headline directly to the product",
      "Give the left benefit column more visual weight to balance the product",
    ],
    audience_inference: {
      likely_audience:
        "Adults interested in sleep comfort and bedroom upgrades — an inference from the creative's message and visuals, not Buffy's verified customer data.",
      pain_points: ["Uncomfortable or poor-quality bedding", "Sleeping too warm or too cold", "Not knowing which bedding is worth paying for"],
      desires: ["A more comfortable bed", "Better rest", "A calm, inviting bedroom"],
      awareness_level: "Problem Aware — the ad educates about the importance of bed time before naming specific product qualities.",
    },
    campaign_recommendations: {
      objective: "Not stated in the creative. If the goal is purchases, a sales/conversion objective lets you measure the tests in this report.",
      optimization_event: "Purchase, where conversion tracking is installed.",
      testing_strategy: "Keep this ad as the control and change one variable per test (headline, visual, offer, social proof, benefit list).",
      placements: "Not specified by the creative; the vertical 9:16 format is designed for full-screen vertical placements such as Stories and Reels.",
    },
    testing_plan: [
      { name: "Test A: Current creative", variable_isolated: "Baseline / control" },
      { name: "Test B: Product-specific headline", variable_isolated: "Hook" },
      { name: "Test C: Lifestyle bedroom image", variable_isolated: "Visual context" },
      { name: "Test D: Single primary benefit", variable_isolated: "Message simplicity" },
    ],
    creative_variations: [
      { name: "Variation 1", angle: "Hook-focused — “Make your bed your favorite place.” over the current visual" },
      { name: "Variation 2", angle: "Benefit-focused — one substantiated benefit, set large" },
      { name: "Variation 3", angle: "Lifestyle — the comforter in a real bedroom setting" },
    ],
    final_recommendation: {
      verdict: "TEST FIRST",
      reason:
        "The ad is clear and on-brand, but with a generic hook and no visible offer it is best run as a control while a more specific variant is tested.",
    },
    creative_readiness_score: 65,
  },
};

export const BUFFY_DEMO: DemoCreative = { ...BUFFY_BASE, report: BUFFY_REPORT };

/** The creative the homepage hero shows. Swap this to change the demo everywhere. */
export const HERO_CREATIVE: DemoCreative = BUFFY_DEMO;
