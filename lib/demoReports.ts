// Fixed, hand-written example reports for the "See what's working" section on
// the public homepage. They are NOT generated at request time and are not
// connected to any ad account. Each one describes its own image accurately and
// is built in the same structured format a real analysis returns (it goes
// through the same normalizeReport step), so the example page shows exactly
// what a subscriber's report looks like.
import { normalizeReport, type CreativeReport } from "@/lib/analyzeCreative";

export type DemoCreative = {
  slug: string;
  title: string;
  imageUrl: string;
  report: CreativeReport;
};

/* ── 1. Riptide Dive Services (hull cleaning, 1:1) ─────────────────────── */

const riptide = normalizeReport(
  {
    score: 82,
    verdict_label: "Strong",
    format: "Static illustration, 1:1 square",
    placement_guess: "Meta Feed, Instagram Feed",
    verdict:
      "Riptide's before-and-after drawing explains the service in a second, but about thirty pieces of copy compete with it and the free quote arrives last.",
    priority_action: "Cut the square to the hook, the two boats and the free quote.",
    summary_points: {
      message: "Neglecting your hull costs money; Riptide's divers keep it clean, fast and fairly priced.",
      audience: "Local yacht owners who maintain their own boat or manage a small fleet.",
      strongest: "The sad green boat next to the clean smiling boat.",
      weakest: "Too many separate messages for a single feed image.",
      opportunity: "Move the free quote up and let the comparison list live in a carousel.",
      next_action: "Test a stripped-back version with only the hook, boats and offer.",
    },
    executive_summary:
      "Riptide has the hardest part solved: one glance at the two boats tells a yacht owner what the service does and why it matters. The problem is volume. Eight icon labels, ten comparison bullets and five service names sit between the hook and the \"GET YOUR FREE QUOTE TODAY\" box, so most viewers will scroll on before they reach the offer.",
    annotations: [
      { id: "a1", label: "Headline", x: 0.5, y: 0.085, w: 0.84, h: 0.13, tone: "neutral", note: "\"IF YOU'RE A YACHT OWNER\" picks the right reader. \"LISTEN UP OR STOP SCROLLING...\" spends space without giving a reason." },
      { id: "a2", label: "Visual", x: 0.48, y: 0.29, w: 0.9, h: 0.27, tone: "positive", note: "The fouled hull versus the clean hull explains the service with no reading required." },
      { id: "a3", label: "Supporting text", x: 0.5, y: 0.47, w: 0.92, h: 0.09, tone: "negative", note: "Eight icon labels repeat what the boats already show and are hard to read at phone size." },
      { id: "a4", label: "Logo", x: 0.7, y: 0.57, w: 0.36, h: 0.08, tone: "negative", note: "Riptide's logo sits mid-ad, beside the competitor list, where it is easy to miss." },
      { id: "a5", label: "CTA", x: 0.5, y: 0.815, w: 0.77, h: 0.085, tone: "positive", note: "\"GET YOUR FREE QUOTE TODAY\" is a clear, low-risk offer. It just arrives after six other blocks." },
      { id: "a6", label: "Supporting text", x: 0.5, y: 0.925, w: 0.94, h: 0.12, tone: "neutral", note: "Five services listed. Useful on the landing page, crowded in a feed square." },
    ],
    strength_items: [
      { title: "Before-and-after anyone can read", evidence: "A green, frowning hull labelled \"IGNORE NOW\" next to a clean, smiling hull labelled \"ACT NOW\".", why: "It shows the problem and the result without the viewer reading a word.", keep: "Keep the two boats as the centre of every version.", annotation: "a2" },
      { title: "Names the audience first", evidence: "The headline opens with \"IF YOU'RE A YACHT OWNER\".", why: "It filters for the only people who can buy, which suits a high-value local service.", keep: "Keep the call-out in the first few words.", annotation: "a1" },
      { title: "Looks unlike other marine ads", evidence: "Hand-drawn boats and handwritten type on white instead of stock photos of marinas.", why: "A sketch stands out in a feed full of polished boat photography.", keep: "Change the copy, keep the illustration style.", annotation: null },
    ],
    fix_items: [
      { issue: "Too many messages in one square", where: "Everything below the boats", why: "Feed viewers read the headline and one more thing. Thirty labels turn into texture at phone size.", fix: "Keep the headline, the two boats and the quote box. Move the comparison list to a second carousel card.", example: "Card 1: hook and boats. Card 2: Riptide vs others. Card 3: services and quote.", priority: "High", effort: "Moderate", impact: "More viewers reach the offer before they scroll on.", annotation: "a3" },
      { issue: "The free quote comes last", where: "Bottom box, \"GET YOUR FREE QUOTE TODAY\"", why: "The only offer sits below six blocks, so people who stop at the boats never see it.", fix: "Mention the free quote in or right under the headline, and keep the bottom box.", example: "\"Yacht owners: book a free hull check and quote this week.\"", priority: "High", effort: "Quick", impact: "The offer is seen by the people already stopped by the hook.", annotation: "a5" },
      { issue: "The brand is easy to miss", where: "Riptide logo, middle right", why: "Placed beside \"OTHER COMPANIES\", the logo reads as part of the comparison rather than the sender.", fix: "Add a small logo in the top corner and keep the existing one in the comparison.", example: "Riptide Dive Services mark, top left, about a tenth of the width.", priority: "Medium", effort: "Quick", impact: "Better recall of who the ad was from.", annotation: "a4" },
      { issue: "Claims without proof", where: "Riptide checklist", why: "\"TOP-RATED LOCAL SERVICE\" and \"EXPERT DIVERS\" are assertions every competitor can make.", fix: "Back one claim with a real rating, review count or years in business.", example: "\"[Your rating] from [number] Google reviews\" under the logo.", priority: "Medium", effort: "Quick", impact: "The comparison feels earned rather than asserted.", annotation: null },
      { issue: "Filler in the headline", where: "\"LISTEN UP OR STOP SCROLLING...\"", why: "It asks for attention instead of giving a reason to pay it.", fix: "Replace the second line with the cost of waiting.", example: "\"Marine growth is costing you speed, fuel and resale value.\"", priority: "Low", effort: "Quick", impact: "A sharper reason to keep reading for owners already stopped.", annotation: "a1" },
    ],
    signal_scores: [
      { label: "Hook Strength", score: 8, reason: "Direct call-out to yacht owners, weakened by the generic second line.", improve: "Swap \"listen up\" for a concrete cost." },
      { label: "Scroll-Stop Potential", score: 9, reason: "Hand-drawn style and the frowning boat are unusual in a feed.", improve: "Give the boats more of the frame." },
      { label: "Emotional Appeal", score: 8, reason: "Boat faces make neglect feel personal without being heavy.", improve: "Tie the sad boat to resale value." },
      { label: "Message Clarity", score: 8, reason: "The idea is clear, but it is repeated in four different formats.", improve: "Say it once, with the boats." },
      { label: "Offer Strength", score: 7, reason: "Free quote is low risk but generic and placed last.", improve: "Make it a free hull check this week." },
      { label: "CTA Strength", score: 7, reason: "Clear button-style box with arrows, but at the very bottom.", improve: "Reference the quote near the headline too." },
      { label: "Audience Match", score: 9, reason: "Copy and imagery speak only to yacht owners.", improve: "Mention the service area." },
      { label: "Visual Hierarchy", score: 6, reason: "Six blocks of similar weight compete after the boats.", improve: "Remove the icon row and services row." },
      { label: "Mobile Readability", score: 6, reason: "Icon labels and bullets are small at feed size.", improve: "Fewer words, larger type." },
      { label: "Brand Consistency", score: 7, reason: "Logo and blue type match, but the logo is mid-ad.", improve: "Add a corner logo." },
      { label: "Trust / Credibility", score: 6, reason: "No reviews, ratings, certifications or photos of the team.", improve: "Add a real rating or review count." },
      { label: "Differentiation", score: 8, reason: "Direct comparison with \"OTHER COMPANIES\" makes the positioning explicit.", improve: "Back one claim with evidence." },
      { label: "Creative Fatigue Risk", score: 8, reason: "Fresh illustrated format, not a common template in this category.", improve: "Rotate the headline before the art." },
    ],
    positive_factors: [
      "Before-and-after boats explain the service instantly",
      "Opens by naming yacht owners",
      "Illustrated style stands out from marina photography",
      "Explicit comparison against other companies",
    ],
    negative_factors: [
      "Around thirty separate text items in one square",
      "The only offer is the last thing on the page",
      "Quality claims have no supporting proof",
    ],
    hook: { text: "IF YOU'RE A YACHT OWNER, LISTEN UP OR STOP SCROLLING...", type: "Audience call-out", clarity: "High", specificity: "Medium", emotional_angle: "Urgency, mild warning", strength: "The first five words select exactly the right viewer.", limitation: "The rest asks for attention without giving a reason." },
    expected_impact: "A simpler square should let more of the people stopped by the boats reach the free quote, which is where the ad currently loses them.",
    campaign_readiness: "Ready to test",
    final_recommendation: { verdict: "YES — WITH CHANGES", reason: "The concept is strong enough to run. Simplify the layout and lift the offer before putting real budget behind it." },
    creative_readiness_score: 78,
  },
  {
    hook_ideas: [
      { category: "Problem-aware", hook: "Marine growth is costing you speed, fuel and resale value.", why: "Turns the sad boat into a money problem owners already worry about.", changes: "Replaces the attention command with a cost" },
      { category: "Direct response", hook: "Yacht owners: free hull check and quote this week.", why: "Puts the offer where everyone reads it.", changes: "Moves the offer into the headline" },
      { category: "Curiosity", hook: "What's growing under your hull right now?", why: "Owners rarely see below the waterline, which makes the question hard to ignore.", changes: "Question instead of command" },
      { category: "Benefit-driven", hook: "A clean hull, every month, without leaving the dock.", why: "Sells the convenience of divers coming to the boat.", changes: "Leads with the outcome" },
      { category: "Emotional", hook: "Your yacht shouldn't look like the one on the left.", why: "Uses the existing drawing as the punchline.", changes: "Points at the visual directly" },
    ],
    ad_angles: [
      { name: "Cost of neglect", message: "Fouling quietly costs fuel, speed and resale value.", hook: "Marine growth is costing you more than a cleaning.", offer: "Free hull check with a written quote.", visual: "The fouled boat large, a short list of costs beside it.", cta: "Get free quote", hypothesis: "Money framing moves owners who think cleaning is cosmetic." },
      { name: "Convenience", message: "Divers come to your slip; you never move the boat.", hook: "Hull cleaned at your dock while you're at work.", offer: "Monthly plan, cancel any time.", visual: "Diver under a docked yacht, owner's coffee cup on the pier.", cta: "See plans", hypothesis: "Busy owners respond to the removal of hassle." },
      { name: "Local proof", message: "The divers other owners at your marina already use.", hook: "Trusted by owners at [marina name].", offer: "Free quote, same-week visit.", visual: "Real photo of the team at a recognisable local marina.", cta: "Book a visit", hypothesis: "Local social proof lowers the risk of trying a new provider." },
    ],
    improvements: [
      { area: "Headline", before: "\"LISTEN UP OR STOP SCROLLING...\"", after: "\"Marine growth is costing you speed and resale value.\"" },
      { area: "Visual", before: "Boats fill about a quarter of the square", after: "Let the two boats fill half the square; drop the icon row." },
      { area: "Offer", before: "Free quote appears at the very bottom", after: "Repeat \"Free quote\" under the headline and keep the bottom box." },
      { area: "Proof", before: "\"TOP-RATED LOCAL SERVICE\" with no source", after: "Show your real Google rating and review count beside the logo." },
      { area: "Mobile", before: "Bullets and labels around 2% of image height", after: "Keep any remaining text above roughly 4% of image height." },
      { area: "Branding", before: "Logo mid-ad beside the competitor list", after: "Add a small logo in the top-left corner." },
    ],
    variations: [
      { name: "Variation A", focus: "Hook", headline: "Marine growth is costing you speed, fuel and resale value.", changes: "Rewrite the second headline line around the cost of neglect.", why: "The current line asks for attention without giving a reason.", hypothesis: "A concrete cost holds owners longer than a command.", keep: "Illustration, comparison, offer box.", layout: "Same layout. Only the headline text changes, same type style and size." },
      { name: "Variation B", focus: "Benefit", headline: "A clean hull every month, without moving your boat.", changes: "Lead with convenience; replace the icon row with one line: \"Divers come to your slip.\"", why: "The service's main advantage over hauling out is not stated.", hypothesis: "Convenience is a stronger reason to book than general upkeep.", keep: "Before-and-after boats, illustration style.", layout: "Headline, boats, one benefit line, quote box. Remove the comparison and services rows." },
      { name: "Variation C", focus: "Offer", headline: "Yacht owners: free hull check and quote this week.", changes: "Offer goes into the headline; the square holds only headline, boats and quote box.", why: "The offer is currently the last thing anyone sees.", hypothesis: "Seeing the offer first raises quote requests from the same reach.", keep: "Illustration and brand colours.", layout: "Three blocks only: offer headline, boats at 50% height, \"Get your free quote\" box with logo." },
    ],
    audiences: [
      { type: "Primary", name: "Owner-operators of cruising yachts", overview: "Owners who use the boat often and handle maintenance themselves, and who notice growth and lost speed.", motivations: ["Protect resale value", "Keep the boat ready to use", "Avoid haul-out costs"], pain_points: ["Unreliable contractors", "Surprise repair bills", "Time spent arranging work"], objections: ["Already have a diver", "Unsure what it costs"], awareness: "Problem aware, they know hulls foul but delay cleaning", messaging: "Show what waiting costs and how little effort the fix takes.", angle: "Cost of neglect", evidence: "The headline addresses owners directly and the visual is about neglect." },
      { type: "Secondary", name: "Captains and yacht managers", overview: "People who look after one or more boats for an owner and need dependable scheduling.", motivations: ["Reliable recurring schedule", "Clear invoices for owners"], pain_points: ["Long wait times", "Inconsistent results"], objections: ["Switching from a current provider"], awareness: "Solution aware, they compare providers", messaging: "Lead with reliability and transparent pricing.", angle: "Reliability and pricing", evidence: "The comparison list targets \"LONG WAIT TIMES\" and \"HIDDEN FEES\"." },
    ],
    campaign: {
      objective: { rec: "Leads, if quote requests are the goal", why: "The ad's only action is a free quote; use Sales if you book online instead." },
      optimization: { rec: "Lead form submission", why: "Optimise for the quote request itself rather than clicks, which are cheap but less useful here." },
      testing: { test: "Current square against the simplified Variation C", keep: "Audience, budget split, placements and the illustration", measure: "Cost per quote request", evidence: "Variation C producing more quote requests from similar reach." },
      placements: { rec: "Facebook and Instagram Feed", why: "The 1:1 square and small text suit feed; it would need a 9:16 version for Stories." },
      readiness: { status: "Ready to test", reasons: ["Concept and audience are clear", "Layout simplification should be tested alongside"] },
    },
    tests: [
      { name: "Test A: Simplified layout", variable_isolated: "Amount of copy", hypothesis: "Removing the icon, comparison and service rows lets more viewers reach the offer.", change: "Headline, boats and quote box only", keep: "Headline wording, illustration, offer", primary_metric: "Cost per quote request", secondary_metrics: "Click-through rate, thumb-stop rate", interpret: "If quote cost falls with similar reach, the extra copy was costing attention." },
      { name: "Test B: Offer in the headline", variable_isolated: "Headline", hypothesis: "Leading with the free hull check increases quote requests.", change: "Headline becomes the offer", keep: "Layout, illustration, audience", primary_metric: "Quote requests", secondary_metrics: "Click-through rate", interpret: "Compare at similar spend; a higher request rate supports offer-first copy." },
      { name: "Test C: Cost-of-neglect hook", variable_isolated: "Headline angle", hypothesis: "A money-based hook outperforms the attention command.", change: "Second headline line only", keep: "Everything else", primary_metric: "Click-through rate", secondary_metrics: "Cost per quote request", interpret: "Look for higher CTR without a drop in quote quality." },
    ],
  }
);

/* ── 2. Pique Nandaka (mushroom coffee alternative, 4:5) ──────────────── */

const pique = normalizeReport(
  {
    score: 88,
    verdict_label: "Strong",
    format: "Static image, 4:5 portrait",
    placement_guess: "Meta Feed, Instagram Feed",
    verdict:
      "Pique's question headline and side-by-side glasses make a sharp category argument, but the ad stops there with no offer or next step in the empty bottom band.",
    priority_action: "Use the empty bottom band for the offer and a shop line.",
    summary_points: {
      message: "Most mushroom supplements are mycelium on grain; Pique Nandaka uses fruiting bodies.",
      audience: "Wellness buyers who already take or are considering mushroom supplements.",
      strongest: "\"What's Really in Your Mushroom Supplement?\" answered with \"Probably Not Mushrooms\".",
      weakest: "No offer, price or call to action anywhere.",
      opportunity: "Turn the category argument into a reason to try Nandaka today.",
      next_action: "Add the offer and \"Shop Nandaka\" to the bottom of the image.",
    },
    executive_summary:
      "Pique uses the headline to question the whole mushroom category, then backs it up with a clean two-column comparison: its fruiting-body product against \"OTHERS\" made from mycelium. The design is calm and premium. It educates well but asks for nothing, and about the bottom sixth of the image is empty space that could carry the offer.",
    annotations: [
      { id: "a1", label: "Headline", x: 0.5, y: 0.25, w: 0.76, h: 0.15, tone: "positive", note: "A question that challenges what the buyer already takes, with a short, slightly provocative answer underneath." },
      { id: "a2", label: "Product", x: 0.31, y: 0.57, w: 0.36, h: 0.22, tone: "positive", note: "Real pouch and an iced drink make the product concrete. The \"NANDAKA\" name is small on the pack." },
      { id: "a3", label: "Visual", x: 0.72, y: 0.57, w: 0.2, h: 0.22, tone: "neutral", note: "The cloudy glass reads as the inferior option without naming a competitor." },
      { id: "a4", label: "Proof", x: 0.3, y: 0.775, w: 0.34, h: 0.15, tone: "negative", note: "\"Clinically Studied\" has no source, which is the claim sceptical buyers will check first." },
      { id: "a5", label: "CTA", x: 0.5, y: 0.93, w: 0.9, h: 0.1, tone: "negative", note: "Empty band. No offer, price or call to action anywhere on the image." },
    ],
    strength_items: [
      { title: "Headline questions the category", evidence: "\"What's Really in Your Mushroom Supplement?\" followed by \"Probably Not Mushrooms\".", why: "It targets current supplement users and gives them a reason to doubt their product.", keep: "Keep the question and answer pair.", annotation: "a1" },
      { title: "Comparison you can see", evidence: "Dark iced drink and pouch on the left, a pale cloudy glass on the right, labelled \"VS.\"", why: "The visual makes the quality difference before any reading.", keep: "Keep two columns and the glasses.", annotation: "a2" },
      { title: "Premium, consistent design", evidence: "Soft pink gradient, serif \"PIQUE\" logo and lots of space.", why: "Matches a premium price point and avoids looking like a supplement deal ad.", keep: "Keep the palette and spacing.", annotation: null },
    ],
    fix_items: [
      { issue: "No offer or next step", where: "Empty bottom band", why: "Viewers convinced by the comparison have nothing to act on in the image itself.", fix: "Add the current first-order offer and \"Shop Nandaka\" in the bottom band.", example: "\"Shop Nandaka · [your first-order offer]\" centred under the checklist.", priority: "High", effort: "Quick", impact: "More of the interest the comparison creates turns into clicks.", annotation: "a5" },
      { issue: "\"Clinically Studied\" has no source", where: "Left checklist, third line", why: "Category buyers are sceptical, and an unsourced claim weakens the credible tone.", fix: "Add an asterisk and a one-line source in small type.", example: "\"Clinically studied*\" with \"*[Study name, year]\" at the bottom.", priority: "Medium", effort: "Quick", impact: "The comparison holds up for the most sceptical readers.", annotation: "a4" },
      { issue: "Two brand names to remember", where: "\"PIQUE\" logo and \"NANDAKA\" column title", why: "Viewers may not connect the product name to the brand they will search for.", fix: "Label the left column \"Pique Nandaka\".", example: "Column title: \"PIQUE NANDAKA\".", priority: "Medium", effort: "Quick", impact: "Better recall when people search later.", annotation: "a2" },
      { issue: "\"Mycelium\" needs explaining", where: "\"MADE FROM MYCELIUM\" label", why: "Most buyers don't know why mycelium is worse, so the key claim relies on the subhead alone.", fix: "Add one plain sentence explaining the difference.", example: "\"Mycelium is grown on grain. Fruiting bodies are the actual mushroom.\"", priority: "Low", effort: "Quick", impact: "The core argument makes sense to newer buyers too.", annotation: "a3" },
    ],
    signal_scores: [
      { label: "Hook Strength", score: 9, reason: "Question plus blunt answer challenges current buyers directly.", improve: "Test naming a benefit in the subhead." },
      { label: "Scroll-Stop Potential", score: 8, reason: "Large dark headline on a soft gradient is easy to read, if calm.", improve: "Make the drinks larger." },
      { label: "Emotional Appeal", score: 7, reason: "Mild suspicion and curiosity rather than strong desire.", improve: "Show the benefit people want." },
      { label: "Message Clarity", score: 9, reason: "One idea: fruiting bodies versus mycelium.", improve: "Explain mycelium in plain words." },
      { label: "Offer Strength", score: null, reason: "No offer or price is shown, so there is nothing to rate.", improve: "Add the first-order offer." },
      { label: "CTA Strength", score: 3, reason: "No call to action on the image at all.", improve: "Add \"Shop Nandaka\" in the bottom band." },
      { label: "Audience Match", score: 9, reason: "Speaks directly to people already buying mushroom supplements.", improve: "None needed." },
      { label: "Visual Hierarchy", score: 9, reason: "Logo, headline, comparison, checklist in a clean vertical order.", improve: "Use the empty bottom space." },
      { label: "Mobile Readability", score: 8, reason: "Headline and checklist are readable; the pouch text is not.", improve: "Enlarge the product name." },
      { label: "Brand Consistency", score: 9, reason: "Palette, logo and type all feel like one premium brand.", improve: "Tie Nandaka to Pique." },
      { label: "Trust / Credibility", score: 7, reason: "Comparison is persuasive, but \"Clinically Studied\" is unsourced.", improve: "Cite the study." },
      { label: "Differentiation", score: 9, reason: "Positions against the whole category on a specific ingredient claim.", improve: "None needed." },
      { label: "Creative Fatigue Risk", score: 7, reason: "Us-versus-them layouts are common in supplements.", improve: "Rotate the visual comparison." },
    ],
    positive_factors: ["Question headline challenges current buyers", "Clear visual comparison with real product", "Calm, consistent premium design"],
    negative_factors: ["No offer, price or call to action", "Unsourced \"Clinically Studied\" claim", "Mycelium point needs explaining"],
    hook: { text: "What's Really in Your Mushroom Supplement?", type: "Category challenge question", clarity: "High", specificity: "High", emotional_angle: "Suspicion, curiosity", strength: "Makes current supplement users doubt what they already buy.", limitation: "Says what's wrong with others, not what Nandaka does for you." },
    expected_impact: "Adding an offer and a shop line should convert more of the curiosity this ad already creates, without changing what makes it work.",
    campaign_readiness: "Ready to test",
    final_recommendation: { verdict: "YES — WITH CHANGES", reason: "The argument and design are strong. Add the offer and a call to action, then run it against the current version." },
    creative_readiness_score: 84,
  },
  {
    hook_ideas: [
      { category: "Curiosity", hook: "Most mushroom supplements contain more oats than mushrooms.", why: "A specific, surprising claim tied to the \"Grown on Oats\" line.", changes: "Statement instead of question" },
      { category: "Problem-aware", hook: "Paying for mushrooms and getting mycelium?", why: "Speaks to value-conscious buyers who feel misled.", changes: "Adds a money frame" },
      { category: "Benefit-driven", hook: "Real fruiting bodies, for focus without the jitters.", why: "Names the outcome buyers want, which the current ad leaves out.", changes: "Leads with the benefit" },
      { category: "Direct response", hook: "Switch to Pique Nandaka. [first-order offer].", why: "Gives convinced viewers a reason to act now.", changes: "Adds the offer to the hook" },
    ],
    ad_angles: [
      { name: "Ingredient truth", message: "Fruiting bodies are the mushroom; mycelium is mostly the grain it grows on.", hook: "Check your label for the word \"mycelium\".", offer: "First-order offer shown in the bottom band.", visual: "Two labels side by side, Nandaka's highlighted.", cta: "Shop Nandaka", hypothesis: "Giving buyers something to check makes the claim feel verifiable." },
      { name: "Coffee replacement", message: "Energy and focus without the coffee crash.", hook: "Your afternoon coffee, without the crash.", offer: "Starter box with the first-order offer.", visual: "Iced Nandaka on a desk at 3pm, laptop open.", cta: "Try Nandaka", hypothesis: "Coffee drinkers are a bigger pool than supplement users." },
      { name: "Ritual", message: "A morning drink that tastes good and feels considered.", hook: "The morning ritual worth getting up for.", offer: "Subscription with first-order offer.", visual: "Pouch being poured into a glass in morning light.", cta: "Start your ritual", hypothesis: "Lifestyle framing reaches buyers who don't care about mycelium." },
    ],
    improvements: [
      { area: "CTA", before: "No call to action", after: "\"Shop Nandaka\" in the empty bottom band, centred." },
      { area: "Offer", before: "No offer shown", after: "State the current first-order offer next to the CTA." },
      { area: "Proof", before: "\"Clinically Studied\" without a source", after: "Add an asterisk and a one-line study reference." },
      { area: "Branding", before: "Column titled \"NANDAKA\"", after: "Column titled \"PIQUE NANDAKA\" so the product links to the brand." },
      { area: "Headline", before: "Subhead \"Probably Not Mushrooms\"", after: "Test \"Probably Not Mushrooms. Ours are.\" to claim the answer." },
    ],
    variations: [
      { name: "Variation A", focus: "Hook", headline: "Most mushroom supplements contain more oats than mushrooms.", changes: "Replace the question with a specific statement taken from the \"Grown on Oats\" line.", why: "A concrete claim can stop scrollers faster than a question.", hypothesis: "A specific claim lifts click-through among current supplement users.", keep: "Comparison, glasses, palette, checklist.", layout: "Same layout; new two-line headline in the same type and size." },
      { name: "Variation B", focus: "Benefit", headline: "Real mushrooms. Steady energy, no coffee crash.", changes: "Add the benefit buyers want and reduce the checklist to two lines each side.", why: "The current ad explains quality but never says what the drink does.", hypothesis: "Naming the outcome widens appeal beyond ingredient-savvy buyers.", keep: "Product shot, comparison idea, brand look.", layout: "Headline, glasses, two-line checklists, benefit line above an offer strip." },
      { name: "Variation C", focus: "Offer", headline: "What's Really in Your Mushroom Supplement?", changes: "Keep the headline; fill the bottom band with the offer and a button-style \"Shop Nandaka\".", why: "The ad builds interest and then gives nothing to act on.", hypothesis: "An on-image offer raises clicks from viewers convinced by the comparison.", keep: "Everything above the checklist.", layout: "Add a soft rounded bar in the bottom 12% with offer text left and \"Shop Nandaka\" right." },
    ],
    audiences: [
      { type: "Primary", name: "Current mushroom supplement buyers", overview: "People already taking lion's mane or similar blends who may be using mycelium products.", motivations: ["Get what they pay for", "Focus and energy", "Clean ingredients"], pain_points: ["Unsure products work", "Confusing labels"], objections: ["Already have a brand", "Higher price"], awareness: "Product aware, they buy the category but not Pique", messaging: "Show them what's in their current product and why it matters.", angle: "Ingredient truth", evidence: "The headline addresses \"Your Mushroom Supplement\" directly." },
      { type: "Secondary", name: "Coffee drinkers looking to cut back", overview: "People who want energy without jitters and are curious about functional drinks.", motivations: ["Steady energy", "Less caffeine", "A pleasant ritual"], pain_points: ["Afternoon crash", "Anxiety from coffee"], objections: ["Does it taste good?"], awareness: "Problem aware, they know coffee affects them", messaging: "Lead with how it feels and tastes, then the ingredient story.", angle: "Coffee replacement", evidence: "The iced drink looks like coffee, which invites the comparison." },
    ],
    campaign: {
      objective: { rec: "Sales, if you sell direct online", why: "The product is bought online; use Traffic only if the landing page is still being tested." },
      optimization: { rec: "Purchase", why: "The comparison filters for intent, so optimise for buyers rather than cheap clicks." },
      testing: { test: "Current ad against Variation C with the offer band", keep: "Headline, comparison, audience and placements", measure: "Cost per purchase", evidence: "Variation C producing purchases at a lower cost with similar reach." },
      placements: { rec: "Instagram and Facebook Feed", why: "4:5 portrait suits feed. A 9:16 version would need the comparison stacked." },
      readiness: { status: "Ready to test", reasons: ["Strong hook and clear comparison", "Needs an on-image offer to convert"] },
    },
    tests: [
      { name: "Test A: Offer band", variable_isolated: "Offer and CTA", hypothesis: "Adding the offer and \"Shop Nandaka\" raises clicks and purchases.", change: "Bottom band with offer and CTA", keep: "All other elements", primary_metric: "Cost per purchase", secondary_metrics: "Click-through rate", interpret: "A lower cost per purchase at similar CTR means the offer closed the gap." },
      { name: "Test B: Statement hook", variable_isolated: "Headline", hypothesis: "\"More oats than mushrooms\" stops more scrollers than the question.", change: "Headline only", keep: "Comparison, checklist, palette", primary_metric: "Click-through rate", secondary_metrics: "Thumb-stop rate", interpret: "Higher CTR with stable purchase rate supports the statement." },
      { name: "Test C: Sourced claim", variable_isolated: "Proof", hypothesis: "Citing the study improves conversion among sceptical buyers.", change: "Add study footnote", keep: "Everything else", primary_metric: "Conversion rate", secondary_metrics: "Cost per purchase", interpret: "Small effects are likely; judge only with enough purchases on each side." },
    ],
  }
);

/* ── 3. Blissy sleep mask (review + comparison, 1:1) ───────────────────── */

const blissy = normalizeReport(
  {
    score: 90,
    verdict_label: "Excellent",
    format: "Static image, 1:1 square",
    placement_guess: "Meta Feed, Instagram Feed",
    verdict:
      "Blissy stacks a five-star review, a clean product comparison and press logos into one tidy square; the only real gap is the missing offer.",
    priority_action: "Add the offer or price and a short \"Shop Blissy\" line.",
    summary_points: {
      message: "Blissy's handmade silk sleep mask is softer and gentler than a regular mask.",
      audience: "Comfort-focused sleepers and gift buyers interested in silk products.",
      strongest: "A customer quote as the headline, backed by five stars.",
      weakest: "No price, offer or call to action.",
      opportunity: "Convert the trust built by review and press into a purchase reason.",
      next_action: "Test an offer line under the press bar.",
    },
    executive_summary:
      "Blissy lets a customer make the claim: \"Blissy was so much SOFTER than any other mask I've tried!\" sits under five stars, then a checklist comparison and a press bar back it up. Every block supports the same idea, softness and quality, which is why the ad works. It never tells the viewer what it costs or what to do next.",
    annotations: [
      { id: "a1", label: "Proof", x: 0.5, y: 0.065, w: 0.32, h: 0.07, tone: "positive", note: "Five stars at the very top set the tone before anything is read." },
      { id: "a2", label: "Headline", x: 0.5, y: 0.19, w: 0.86, h: 0.17, tone: "positive", note: "A customer's words carry the claim; \"SOFTER\" in caps makes the benefit unmissable." },
      { id: "a3", label: "Product", x: 0.3, y: 0.4, w: 0.36, h: 0.22, tone: "positive", note: "Box, pouch and mask in teal show a giftable, premium product." },
      { id: "a4", label: "Supporting text", x: 0.5, y: 0.71, w: 0.9, h: 0.29, tone: "neutral", note: "Checklist comparison is easy to scan. \"Regular Sleep Mask\" is a vague opponent." },
      { id: "a5", label: "Proof", x: 0.5, y: 0.94, w: 0.94, h: 0.08, tone: "neutral", note: "Five press logos add authority but are small at feed size." },
    ],
    strength_items: [
      { title: "Customer quote as headline", evidence: "\"Blissy was so much SOFTER than any other mask I've tried!\" - Norma T., under five stars.", why: "A buyer's words are more believable than the brand making the same claim.", keep: "Keep a real review as the headline in every version.", annotation: "a2" },
      { title: "Comparison that's easy to scan", evidence: "Four green ticks for Blissy against four red crosses for \"Regular Sleep Mask\".", why: "Viewers get the argument in two seconds without reading full sentences.", keep: "Keep two columns of four short lines.", annotation: "a4" },
      { title: "Layered trust signals", evidence: "Stars, a named reviewer and \"BLISSY HAS BEEN FEATURED ON\" with five publications.", why: "Each block answers a different doubt: other buyers, quality, credibility.", keep: "Keep stars, review and press together.", annotation: "a5" },
    ],
    fix_items: [
      { issue: "No offer, price or next step", where: "Whole image", why: "Viewers persuaded by the review have no reason to act now and no idea of cost.", fix: "Add the current offer or price and \"Shop Blissy\" above the press bar.", example: "\"[Current offer] · Shop Blissy\" in a slim bar under the comparison.", priority: "High", effort: "Quick", impact: "More of the trust the ad builds turns into clicks.", annotation: null },
      { issue: "Review attribution is thin", where: "\"- Norma T.\"", why: "A first name and initial is easy to doubt in a category full of fake reviews.", fix: "Add \"Verified buyer\" if that is true for this review.", example: "\"- Norma T., verified buyer\"", priority: "Medium", effort: "Quick", impact: "The quote carries more weight with sceptical viewers.", annotation: "a2" },
      { issue: "\"Regular Sleep Mask\" is vague", where: "Right column title", why: "A nameless opponent with \"Irritating\" can feel like a straw man.", fix: "Name the material you are comparing against.", example: "\"Polyester sleep mask\" as the right column title.", priority: "Low", effort: "Quick", impact: "The comparison feels fairer and more specific.", annotation: "a4" },
      { issue: "Press logos are small", where: "Bottom bar", why: "At feed size the logos are a few pixels tall and hard to recognise.", fix: "Show three logos larger instead of five small ones.", example: "Keep the three most recognisable publications at double the height.", priority: "Low", effort: "Quick", impact: "The authority signal registers at a glance.", annotation: "a5" },
    ],
    signal_scores: [
      { label: "Hook Strength", score: 9, reason: "Five stars plus a quote with \"SOFTER\" in caps.", improve: "Test a shorter quote." },
      { label: "Scroll-Stop Potential", score: 8, reason: "Gold stars and bold navy type stand out on light blue.", improve: "Give the product photo more space." },
      { label: "Emotional Appeal", score: 8, reason: "Softness and comfort are sensory and easy to imagine.", improve: "Show the mask being worn." },
      { label: "Message Clarity", score: 10, reason: "Every element supports one idea: softer, better silk.", improve: "None needed." },
      { label: "Offer Strength", score: null, reason: "No price or offer appears in the image.", improve: "Add the current offer." },
      { label: "CTA Strength", score: 3, reason: "No call to action on the image.", improve: "Add \"Shop Blissy\"." },
      { label: "Audience Match", score: 9, reason: "Speaks to people who have tried masks and been disappointed.", improve: "None needed." },
      { label: "Visual Hierarchy", score: 9, reason: "Stars, quote, product, comparison, press in a clear order.", improve: "None needed." },
      { label: "Mobile Readability", score: 8, reason: "Headline and checklist are clear; press logos are small.", improve: "Fewer, larger logos." },
      { label: "Brand Consistency", score: 9, reason: "Teal product, navy type and logo feel like one brand.", improve: "None needed." },
      { label: "Trust / Credibility", score: 10, reason: "Stars, named review and five press logos together.", improve: "Mark the review as verified." },
      { label: "Differentiation", score: 8, reason: "Silk and handmade versus mass-produced is clear, if generic.", improve: "Compare against a named material." },
      { label: "Creative Fatigue Risk", score: 7, reason: "Review-plus-checklist is a common DTC template.", improve: "Rotate the review quote." },
    ],
    positive_factors: ["A customer quote makes the main claim", "Three separate trust signals", "Clear four-line comparison", "One consistent message throughout"],
    negative_factors: ["No price, offer or call to action", "Vague comparison opponent"],
    hook: { text: "Blissy was so much SOFTER than any other mask I've tried!", type: "Customer review", clarity: "High", specificity: "Medium", emotional_angle: "Comfort, relief", strength: "Puts the benefit in a buyer's words, which reads as more credible.", limitation: "\"Softer\" is the only benefit; nothing about better sleep." },
    expected_impact: "An on-image offer and call to action should convert more of the trust this ad already earns; the rest of the creative needs little change.",
    campaign_readiness: "Ready to scale",
    final_recommendation: { verdict: "YES", reason: "A complete, credible creative. Add the offer in a test version, but this one can run as it is." },
    creative_readiness_score: 88,
  },
  {
    hook_ideas: [
      { category: "Benefit-driven", hook: "The silk sleep mask that doesn't leave creases.", why: "Adds a second concrete benefit beyond softness.", changes: "New benefit, brand voice" },
      { category: "Emotional", hook: "\"I finally sleep through the night.\"", why: "Shifts the review from material to outcome.", changes: "Outcome-led quote" },
      { category: "Direct response", hook: "100% silk sleep mask. [current offer].", why: "Puts price or offer into the first read.", changes: "Offer-first headline" },
      { category: "Curiosity", hook: "Why your sleep mask might be irritating your skin.", why: "Speaks to the \"Irritating\" point already in the ad.", changes: "Question about a problem" },
    ],
    ad_angles: [
      { name: "Gift", message: "A beautifully boxed silk mask for someone who sleeps badly.", hook: "The gift for the light sleeper in your life.", offer: "Gift-ready box with the current offer.", visual: "The box and pouch, wrapped, on a bedside table.", cta: "Shop gifts", hypothesis: "The premium box makes gift buyers a strong secondary market." },
      { name: "Skin care", message: "Silk is gentle on skin and doesn't tug while you sleep.", hook: "Your night cream works better on silk.", offer: "Mask plus pillowcase bundle, if available.", visual: "Close-up of silk against skin, soft morning light.", cta: "Shop silk", hypothesis: "Beauty buyers respond to skin benefits more than comfort." },
      { name: "Better sleep", message: "Total darkness, without pressure on your eyes.", hook: "Block the light, not your comfort.", offer: "Risk-free trial, if offered.", visual: "Sleeper wearing the mask in a sunlit room.", cta: "Sleep better", hypothesis: "Outcome framing reaches people who don't think about materials." },
    ],
    improvements: [
      { area: "CTA", before: "No call to action", after: "\"Shop Blissy\" in a slim bar above the press logos." },
      { area: "Offer", before: "No price or offer", after: "State the current offer or price next to the CTA." },
      { area: "Proof", before: "\"- Norma T.\"", after: "\"- Norma T., verified buyer\" if accurate." },
      { area: "Mobile", before: "Five small press logos", after: "Three logos at double height." },
      { area: "Headline", before: "Softness only", after: "Test a review that mentions sleeping better." },
    ],
    variations: [
      { name: "Variation A", focus: "Hook", headline: "\"I finally sleep through the night.\"", changes: "Swap the review for one about the sleep outcome rather than the material.", why: "Softness is a feature; better sleep is what people pay for.", hypothesis: "An outcome review lifts click-through among poor sleepers.", keep: "Stars, comparison, press bar.", layout: "Same layout; new quote at the same size, reviewer name below." },
      { name: "Variation B", focus: "Benefit", headline: "Softer on skin. Darker for sleep.", changes: "Brand headline with two benefits; move the customer quote into a smaller line above the comparison.", why: "Tests whether a direct benefit claim outperforms social proof.", hypothesis: "Two clear benefits widen appeal beyond comfort seekers.", keep: "Product shot, checklist, press bar.", layout: "Benefit headline, product, short quote, comparison, press." },
      { name: "Variation C", focus: "Offer", headline: "\"Blissy was so much SOFTER than any other mask I've tried!\"", changes: "Keep everything; add a slim offer bar with \"Shop Blissy\" above the press logos.", why: "The ad has every element except a reason to buy now.", hypothesis: "An on-image offer increases purchases with little loss of trust.", keep: "Everything currently in the ad.", layout: "Shrink the checklist boxes slightly to free a 10% band for the offer bar." },
    ],
    audiences: [
      { type: "Primary", name: "Disappointed sleep-mask users", overview: "People who have tried cheap masks and found them scratchy, hot or uncomfortable.", motivations: ["Comfort", "Better sleep", "Quality that lasts"], pain_points: ["Scratchy synthetics", "Skin irritation"], objections: ["Price for a mask", "Will it stay on?"], awareness: "Solution aware, they already use masks", messaging: "Your old mask was the problem, not masks in general.", angle: "Comparison with regular masks", evidence: "The quote says \"any other mask I've tried\"." },
      { type: "Secondary", name: "Gift buyers", overview: "People shopping for a considered gift for partners, parents or friends.", motivations: ["Looks premium", "Useful every day"], pain_points: ["Generic gift options"], objections: ["Colour choice"], awareness: "Unaware, not searching for masks", messaging: "A small luxury they'll use every night.", angle: "Gift", evidence: "The product is shown in a gift box with a pouch." },
    ],
    campaign: {
      objective: { rec: "Sales", why: "The product is bought online and the ad already builds purchase-level trust." },
      optimization: { rec: "Purchase", why: "Strong proof elements suit buyers; optimise for purchases, not clicks." },
      testing: { test: "Current ad against Variation C with the offer bar", keep: "Review, comparison, press bar and audience", measure: "Cost per purchase", evidence: "Variation C converting at lower cost with similar click-through." },
      placements: { rec: "Instagram and Facebook Feed", why: "1:1 suits feed. Stories would need a 9:16 version with larger text." },
      readiness: { status: "Ready to test", reasons: ["Complete, credible creative", "Offer test likely the main lever"] },
    },
    tests: [
      { name: "Test A: Offer bar", variable_isolated: "Offer and CTA", hypothesis: "Adding the offer increases purchases without hurting trust.", change: "Add offer bar and \"Shop Blissy\"", keep: "All existing elements", primary_metric: "Cost per purchase", secondary_metrics: "Click-through rate", interpret: "Lower cost per purchase at similar CTR supports the offer bar." },
      { name: "Test B: Outcome review", variable_isolated: "Headline quote", hypothesis: "A sleep-outcome quote outperforms the softness quote.", change: "Swap the review quote", keep: "Layout, stars, comparison", primary_metric: "Click-through rate", secondary_metrics: "Cost per purchase", interpret: "Look for higher CTR and stable conversion rate." },
      { name: "Test C: Gift angle", variable_isolated: "Angle", hypothesis: "Gift framing finds new buyers at a similar cost.", change: "Gift headline and wrapped-box visual", keep: "Product, brand, offer", primary_metric: "Cost per purchase", secondary_metrics: "New customer share", interpret: "Run near gifting seasons for a fair read." },
    ],
  }
);

export const DEMO_CREATIVES: Record<string, DemoCreative> = {
  "demo-creative-1": {
    slug: "demo-creative-1",
    title: "Riptide Dive Services — Static",
    imageUrl: "/winning-ads/creative-1.png",
    report: riptide,
  },
  "demo-creative-2": {
    slug: "demo-creative-2",
    title: "Pique Nandaka — Static",
    imageUrl: "/winning-ads/creative-2.png",
    report: pique,
  },
  "demo-creative-3": {
    slug: "demo-creative-3",
    title: "Blissy Sleep Mask — Static",
    imageUrl: "/winning-ads/creative-3.png",
    report: blissy,
  },
};
