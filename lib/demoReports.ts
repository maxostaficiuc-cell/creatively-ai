// Fixed, hand-authored example reports for the "See what's working" section
// on the public homepage. These are NOT AI-generated at request time —
// they're static demo data showing visitors the depth of a real
// Creatively.ai report. Scores are fixed by design, not randomized.
import type { CreativeReport } from "@/lib/analyzeCreative";

export type DemoCreative = {
  slug: string;
  title: string;
  imageUrl: string;
  report: CreativeReport;
};

const demo1: CreativeReport = {
  score: 91,
  verdict_label: "Strong",
  summary: "A strong, well-composed creative — the offer is instantly clear, though the CTA and differentiation could be sharper.",
  whats_working: "Strong visual hierarchy draws the eye straight to the yacht, and the headline communicates a clear, specific benefit.",
  whats_not: "The CTA ('Book Now') is functional but generic, and the ad doesn't differentiate from other detailing services visually or in copy.",
  what_to_test: "Test a more specific CTA tied to the offer, and add a visual or copy element that separates this service from competitors.",
  executive_summary: "This creative analyzes a yacht detailing service ad. The composition is clean and the headline immediately communicates value protection, which is a strong angle for a high-consideration purchase like yacht ownership. The main ceiling on this ad's score is a lack of differentiation — it's a strong ad, but not yet a distinct one.",
  biggest_strength: "Immediate visual clarity — the viewer knows exactly what's being sold within a second.",
  biggest_weakness: "The CTA and offer feel interchangeable with any other detailing service ad.",
  biggest_opportunity: "Adding a specific differentiator (turnaround time, certification, guarantee) could meaningfully lift conversion intent.",
  campaign_readiness: "Ready to launch, with room to strengthen through testing",
  strengths: [
    "Strong visual hierarchy — the eye moves naturally from headline to product to CTA",
    "High-contrast, premium color palette suited to the yacht ownership audience",
    "Headline reframes detailing as investment protection, a stronger angle than generic cleanliness",
    "Clean, uncluttered composition with clear focal point",
  ],
  priority_fixes: [
    "CTA ('Book Now') doesn't reinforce the specific value proposition",
    "No visible differentiator versus competing detailing services",
    "Subheadline is functional but could carry more persuasive weight",
  ],
  expected_impact: "Sharpening the CTA and adding a differentiator could likely improve click-through intent among considerers who are comparing multiple providers.",
  signal_scores: [
    { label: "Hook Strength", score: 8.6 },
    { label: "Scroll-Stop Potential", score: 8.2 },
    { label: "Message Clarity", score: 9.1 },
    { label: "Visual Hierarchy", score: 9.3 },
    { label: "Offer Strength", score: 8.4 },
    { label: "CTA Strength", score: 6.8 },
    { label: "Audience Match", score: 9.0 },
    { label: "Brand Consistency", score: 8.7 },
    { label: "Trust / Credibility", score: 8.0 },
    { label: "Differentiation", score: 6.2 },
    { label: "Emotional Appeal", score: 8.3 },
    { label: "Mobile Readability", score: 8.9 },
    { label: "Creative Fatigue Risk", score: 7.5 },
  ],
  positive_factors: [
    "Headline uses an investment-protection framing rather than generic cleanliness claims",
    "Strong color contrast keeps the ad legible even in a fast-scrolling feed",
    "Product (the yacht) is instantly recognizable and well-lit",
  ],
  negative_factors: [
    "CTA doesn't tie back to the specific offer or benefit",
    "No trust signal (reviews, guarantee, certification) visible in the creative",
    "Differentiation from competing services is not established",
  ],
  improvement_plan: [
    "Replace the generic CTA with one tied directly to the value prop, e.g. 'Protect My Investment'",
    "Add a small trust signal — a guarantee badge or client count",
    "Test a version naming a specific differentiator (turnaround time, certification)",
  ],
  hook_analysis: "The headline leads with 'protects your investment,' which reframes a routine service as risk mitigation — a stronger angle than 'get your yacht clean.' It's specific enough to stop a relevant scroller, though it doesn't yet create urgency or curiosity beyond the initial framing.",
  hook_recommendations: [
    { category: "Emotional", hooks: ["Your yacht deserves more than a quick wash."] },
    { category: "Curiosity", hooks: ["The one detailing step most owners skip."] },
    { category: "Direct Response", hooks: ["Book premium detailing — protect your investment today."] },
    { category: "Problem Awareness", hooks: ["Salt, sun, and neglect are costing you resale value."] },
    { category: "Benefit Driven", hooks: ["Detailing that adds years to your yacht's finish."] },
  ],
  new_ad_angles: [
    "Before/after transformation showing visible results",
    "Resale-value angle: detailing as a financial decision, not just aesthetics",
    "Behind-the-scenes look at the detailing process to build trust",
  ],
  creative_improvements: [
    "Add a small guarantee or certification badge near the CTA",
    "Introduce a secondary visual element that differentiates from competitors",
    "Test a benefit-specific CTA instead of the generic 'Book Now'",
  ],
  audience_inference: {
    likely_audience: "Yacht owners in the mid-to-high consideration range for professional detailing services — inferred from the product shown and premium visual tone.",
    pain_points: ["Concern about maintaining resale value", "Limited time to manage upkeep personally"],
    desires: ["Peace of mind that their investment is protected", "A hassle-free, trustworthy service"],
    awareness_level: "Solution Aware — the audience likely already knows detailing services exist and is comparing providers.",
  },
  campaign_recommendations: {
    objective: "Consider a conversions objective optimized for booking or lead form completion.",
    optimization_event: "Lead or booking-form completion, if available.",
    testing_strategy: "Run this creative alongside a differentiator-led variant to isolate the impact of a specific competitive claim.",
    placements: "Feed placements suit this composition well given the strong central focal point.",
  },
  testing_plan: [
    { name: "Test A: Current creative", variable_isolated: "Baseline" },
    { name: "Test B: Differentiator-led CTA", variable_isolated: "CTA specificity" },
    { name: "Test C: Trust badge added", variable_isolated: "Credibility signal" },
    { name: "Test D: Before/after visual", variable_isolated: "Proof-driven angle" },
  ],
  creative_variations: [
    { name: "Variation 1", angle: "Hook-focused — lead with a resale-value stat or claim" },
    { name: "Variation 2", angle: "Benefit-focused — emphasize hassle-free, done-for-you service" },
    { name: "Variation 3", angle: "Pain-focused — open with the cost of neglecting upkeep" },
    { name: "Variation 4", angle: "Social-proof-focused — feature a client testimonial or review count" },
  ],
  final_recommendation: {
    verdict: "YES — WITH CHANGES",
    reason: "Strong enough to launch as-is, but sharpening the CTA and adding a differentiator would likely improve performance meaningfully.",
  },
  creative_readiness_score: 91,
};

const demo2: CreativeReport = {
  score: 92,
  verdict_label: "Strong",
  summary: "A well-balanced beauty creative with strong audience relevance — urgency and social proof are the clearest levers left to pull.",
  whats_working: "The headline is confident and benefit-led, and the product presentation feels premium and on-brand for the skincare category.",
  whats_not: "There's no urgency mechanism and no social proof — both are common high-leverage additions for beauty/skincare offers.",
  what_to_test: "Add a limited-time or first-order incentive, and test including a rating or review count near the CTA.",
  executive_summary: "This creative analyzes a premium skincare serum ad. The headline and visual treatment work well together to signal quality and efficacy. The ad is close to its ceiling on message clarity and audience fit — the clearest remaining opportunities are urgency and trust signals, both common levers in the beauty category.",
  biggest_strength: "Headline and visual tone work together to signal a premium, credible product.",
  biggest_weakness: "No urgency or scarcity mechanism to prompt immediate action.",
  biggest_opportunity: "Adding a review count or rating could meaningfully boost trust for a first-time buyer.",
  campaign_readiness: "Ready to launch",
  strengths: [
    "Confident, benefit-led headline ('Glow That Lasts') that's specific to the category",
    "Premium visual treatment with a soft, cohesive color palette",
    "Product is clearly the visual focal point without competing elements",
    "Strong fit between visual tone and the likely target audience",
  ],
  priority_fixes: [
    "No urgency or limited-time incentive to prompt immediate action",
    "No social proof (ratings, review count, or user testimonial) visible",
    "Subheadline could more directly state the core benefit or ingredient claim",
  ],
  expected_impact: "Adding a first-order incentive and a trust signal could likely increase conversion rate among first-time visitors comparing skincare brands.",
  signal_scores: [
    { label: "Hook Strength", score: 8.9 },
    { label: "Scroll-Stop Potential", score: 8.7 },
    { label: "Message Clarity", score: 9.0 },
    { label: "Visual Hierarchy", score: 9.2 },
    { label: "Offer Strength", score: 8.1 },
    { label: "CTA Strength", score: 8.3 },
    { label: "Audience Match", score: 9.4 },
    { label: "Brand Consistency", score: 9.1 },
    { label: "Trust / Credibility", score: 6.8 },
    { label: "Differentiation", score: 7.9 },
    { label: "Emotional Appeal", score: 8.8 },
    { label: "Mobile Readability", score: 9.0 },
    { label: "Creative Fatigue Risk", score: 8.0 },
  ],
  positive_factors: [
    "Headline is specific and benefit-led rather than vague ('lasts' implies a measurable outcome)",
    "Color palette and product styling signal a premium price point clearly",
    "Composition is clean with a single, unambiguous focal point",
  ],
  negative_factors: [
    "No urgency mechanism (limited time, limited stock, first-order discount)",
    "No visible social proof, which is a common trust lever in the beauty category",
    "Ingredient or mechanism claim isn't stated, leaving efficacy skepticism unaddressed",
  ],
  improvement_plan: [
    "Add a first-order incentive or limited-time offer near the CTA",
    "Introduce a review count or star rating for trust",
    "Consider naming a key ingredient or clinical claim in the subheadline",
  ],
  hook_analysis: "The headline 'Glow That Lasts' is short, benefit-led, and implies durability of results, which differentiates it from generic 'get glowing skin' claims. It creates mild curiosity about how the product delivers on 'lasts' but doesn't establish urgency or specificity about the mechanism.",
  hook_recommendations: [
    { category: "Emotional", hooks: ["The serum your skin has been asking for."] },
    { category: "Curiosity", hooks: ["Why this serum outlasts the rest."] },
    { category: "Direct Response", hooks: ["Try the serum — first order 20% off."] },
    { category: "Problem Awareness", hooks: ["Tired of glow that fades by noon?"] },
    { category: "Benefit Driven", hooks: ["Radiance that holds up all day."] },
  ],
  new_ad_angles: [
    "Ingredient-education angle explaining the key active and why it works",
    "Before/after or time-lapse result demonstration",
    "Founder or dermatologist-backed credibility angle",
  ],
  creative_improvements: [
    "Add a star rating or review count near the CTA",
    "Introduce a limited-time offer badge",
    "Name the hero ingredient in the subheadline for specificity",
  ],
  audience_inference: {
    likely_audience: "Skincare-conscious buyers in the premium/prestige segment — inferred from the visual styling, product form, and color treatment.",
    pain_points: ["Skepticism toward beauty claims without proof", "Fatigue from trying products that don't deliver"],
    desires: ["Visible, lasting results", "A product that feels premium and trustworthy"],
    awareness_level: "Problem Aware to Solution Aware — likely aware of the general category but evaluating specific brands.",
  },
  campaign_recommendations: {
    objective: "A conversions objective optimized for purchase would suit this creative's clear product focus.",
    optimization_event: "Purchase, or add-to-cart if purchase volume is still building signal.",
    testing_strategy: "Test this creative against a variant with a review count added to isolate the trust-signal impact.",
    placements: "Feed and Stories both suit the vertical product framing.",
  },
  testing_plan: [
    { name: "Test A: Current creative", variable_isolated: "Baseline" },
    { name: "Test B: First-order discount added", variable_isolated: "Urgency" },
    { name: "Test C: Review count added", variable_isolated: "Trust signal" },
    { name: "Test D: Ingredient named in subheadline", variable_isolated: "Specificity" },
  ],
  creative_variations: [
    { name: "Variation 1", angle: "Hook-focused — lead with the ingredient or mechanism" },
    { name: "Variation 2", angle: "Benefit-focused — emphasize the 'lasts all day' result" },
    { name: "Variation 3", angle: "Pain-focused — open with common skincare frustrations" },
    { name: "Variation 4", angle: "Social-proof-focused — feature a rating or testimonial quote" },
  ],
  final_recommendation: {
    verdict: "YES",
    reason: "Strong, well-targeted creative ready to launch — urgency and trust signals are optimization opportunities, not blockers.",
  },
  creative_readiness_score: 92,
};

const demo3: CreativeReport = {
  score: 97,
  verdict_label: "Excellent",
  summary: "An exceptional creative — hook, offer, and CTA all work together cleanly, with only minor refinement opportunities remaining.",
  whats_working: "The hook is immediate and category-specific, the offer ('Try It Free') removes purchase friction, and the visual energy matches the product's positioning.",
  whats_not: "Very few real weaknesses — the main opportunity is testing incremental variations rather than fixing a clear flaw.",
  what_to_test: "Test minor variations of the risk-reversal CTA and a UGC-style version to see if authenticity lifts performance further.",
  executive_summary: "This creative analyzes a sports-hydration drink ad. Nearly every element — hook, visual energy, offer, and CTA — is working in concert. This is a rare case where the creative is close to its ceiling; remaining opportunities are refinements and incremental tests rather than fixes to clear weaknesses.",
  biggest_strength: "The hook, visual energy, and offer are all aligned and mutually reinforcing.",
  biggest_weakness: "Minimal — the ad doesn't have a clear structural weakness at this stage.",
  biggest_opportunity: "Testing a UGC or authenticity-driven variant could reveal incremental gains beyond this already-strong baseline.",
  campaign_readiness: "Ready to launch immediately",
  strengths: [
    "Exceptional hook — 'hits different' is specific, energetic, and category-native language",
    "Strong visual hierarchy with the product clearly the hero element",
    "Offer ('Try It Free') removes purchase friction and lowers the barrier to action",
    "Strong, benefit-driven CTA that matches the low-risk offer",
    "High audience relevance for the sports/hydration category",
  ],
  priority_fixes: [
    "No major fixes identified — remaining opportunities are refinements, not corrections",
    "Could test a slightly more specific benefit claim (electrolyte count, flavor) for incremental gains",
  ],
  expected_impact: "Given the strength of this baseline, expected impact from further changes is likely incremental rather than transformative — this creative is a strong candidate to scale as-is while testing minor variants.",
  signal_scores: [
    { label: "Hook Strength", score: 9.6 },
    { label: "Scroll-Stop Potential", score: 9.5 },
    { label: "Message Clarity", score: 9.7 },
    { label: "Visual Hierarchy", score: 9.6 },
    { label: "Offer Strength", score: 9.8 },
    { label: "CTA Strength", score: 9.5 },
    { label: "Audience Match", score: 9.7 },
    { label: "Brand Consistency", score: 9.4 },
    { label: "Trust / Credibility", score: 8.6 },
    { label: "Differentiation", score: 9.0 },
    { label: "Emotional Appeal", score: 9.5 },
    { label: "Mobile Readability", score: 9.6 },
    { label: "Creative Fatigue Risk", score: 8.8 },
  ],
  positive_factors: [
    "Hook language ('hits different') is culturally current and category-native",
    "Zero-friction offer ('Try It Free') pairs naturally with the CTA",
    "Vibrant color treatment matches the energy of a sports-hydration product",
    "Clear, singular focal point with no competing visual elements",
  ],
  negative_factors: [
    "No significant negative factors identified at this score level",
  ],
  improvement_plan: [
    "Test a UGC-style variant to see if authenticity adds incremental lift",
    "Test naming a specific product attribute (electrolyte count, flavor) for specificity",
    "Monitor for creative fatigue over time and refresh visual treatment periodically",
  ],
  hook_analysis: "'Hydration that hits different' uses current, category-native language that signals both a functional benefit and an emotional/cultural relevance. It's specific enough to differentiate from generic hydration claims while remaining short and scroll-friendly. This is a strong hook with little room for structural improvement.",
  hook_recommendations: [
    { category: "Emotional", hooks: ["Finally, hydration that keeps up with you."] },
    { category: "Curiosity", hooks: ["The hydration upgrade nobody's talking about yet."] },
    { category: "Direct Response", hooks: ["Try it free — hydration that hits different."] },
    { category: "Problem Awareness", hooks: ["Still reaching for sugary sports drinks?"] },
    { category: "Benefit Driven", hooks: ["Zero sugar. Full electrolytes. Real hydration."] },
  ],
  new_ad_angles: [
    "UGC-style testimonial angle to add authenticity to the existing strong hook",
    "Comparison angle versus sugary sports-drink alternatives",
    "Occasion-based angle (workout, hot weather, travel) to widen relevance",
  ],
  creative_improvements: [
    "Test naming the electrolyte count or a specific ingredient for added specificity",
    "Consider a UGC-style variant alongside this polished version",
    "Rotate visual treatment periodically to manage creative fatigue over a longer flight",
  ],
  audience_inference: {
    likely_audience: "Active, fitness-oriented consumers looking for a healthier hydration alternative — inferred from the product category and energetic visual tone.",
    pain_points: ["Dissatisfaction with sugary traditional sports drinks", "Wanting effective hydration without added sugar"],
    desires: ["A drink that performs as well as it tastes", "Feeling good about what they're consuming"],
    awareness_level: "Product Aware — likely already familiar with hydration products and evaluating a specific new option.",
  },
  campaign_recommendations: {
    objective: "A conversions or free-trial objective aligns well with the 'Try It Free' offer already in the creative.",
    optimization_event: "Free trial signup or purchase, depending on funnel structure.",
    testing_strategy: "Scale this creative as a control while testing a UGC variant against it to look for incremental lift.",
    placements: "Strong candidate for Reels/Stories given its energetic visual tone, alongside standard feed placements.",
  },
  testing_plan: [
    { name: "Test A: Current creative", variable_isolated: "Baseline (control)" },
    { name: "Test B: UGC-style variant", variable_isolated: "Authenticity vs. polish" },
    { name: "Test C: Specific ingredient claim added", variable_isolated: "Specificity" },
    { name: "Test D: Comparison-angle variant", variable_isolated: "Competitive framing" },
  ],
  creative_variations: [
    { name: "Variation 1", angle: "Hook-focused — test alternate current, culturally-relevant phrasing" },
    { name: "Variation 2", angle: "Benefit-focused — lead with the zero-sugar, full-electrolyte claim" },
    { name: "Variation 3", angle: "Pain-focused — open by naming the sugary-drink alternative" },
    { name: "Variation 4", angle: "Social-proof-focused — UGC testimonial format" },
  ],
  final_recommendation: {
    verdict: "YES",
    reason: "An exceptionally strong creative — ready to launch and scale immediately, with only incremental refinement opportunities remaining.",
  },
  creative_readiness_score: 97,
};

export const DEMO_CREATIVES: Record<string, DemoCreative> = {
  "demo-creative-1": {
    slug: "demo-creative-1",
    title: "Yacht Detailing — Static",
    imageUrl: "/winning-ads/creative-1.png",
    report: demo1,
  },
  "demo-creative-2": {
    slug: "demo-creative-2",
    title: "Skincare Serum — Static",
    imageUrl: "/winning-ads/creative-2.png",
    report: demo2,
  },
  "demo-creative-3": {
    slug: "demo-creative-3",
    title: "Hydration Drink — Static",
    imageUrl: "/winning-ads/creative-3.png",
    report: demo3,
  },
};
