// SERVER ONLY — the Creative Strategy AI steps (Claude), each small enough to
// finish inside one serverless request:
//   1. buildProfile   — sources → brand profile (every field marked by how we know it)
//   2. buildAudience  — profile → audience segments
//   3. buildConcepts  — profile + audience → opportunities + 4–6 ad concepts
//   4. buildVariations— concept + options → N copy/visual specs for image generation
import { claudeJSON, S, strs, obj, list, type Schema } from "@/lib/claudeJson";
import { PROFILE_FIELDS, type AudienceSegment, type BrandProfile, type Concept, type GenerationOptions, type Opportunity, type ProfileKey, type VariationSpec, STYLES, TEXT_DENSITY } from "@/lib/strategyTypes";

const BASIS: Schema = { type: "string", enum: ["verified", "inferred", "assumption", "confirmed"] };
const FIELD = obj({ value: S, basis: BASIS, source: { type: ["string", "null"] } });

const TRUTH_RULES = `Rules you must follow:
- Use ONLY what the sources and the user's own details say. Never invent testimonials, reviews, ratings, customer counts, certifications, awards, guarantees, prices, discounts, ingredients, features or performance statistics.
- If something isn't in the sources, say so plainly instead of guessing.
- Don't claim to know the brand's real customers or ad results; you only have public pages.`;

/* ── 1. profile ─────────────────────────────────────────────────────────── */

const PROFILE_SCHEMA = obj({
  fields: obj(Object.fromEntries(PROFILE_FIELDS.map((f) => [f.key, FIELD]))),
  colors: strs,
  products: list(obj({ name: S, detail: S, basis: BASIS })),
  consistent_messages: strs,
  discrepancies: strs,
  missing_info: strs,
  summary: S,
});

export async function buildProfile(input: {
  sourcesText: string;
  userContext: Record<string, string>;
  images: { mediaType: string; base64: string; origin: string }[];
  deadline: number;
}): Promise<BrandProfile> {
  const ctx = Object.entries(input.userContext).filter(([, v]) => v?.trim());
  const prompt = `You are a senior advertising strategist preparing a brand brief.

SOURCES (retrieved just now; some may be partial):
${input.sourcesText || "(no readable source text)"}

${input.images.length ? `${input.images.length} image(s) are attached: ${input.images.map((i, n) => `#${n + 1} from ${i.origin}`).join(", ")}. Use them for visual identity and product presentation.` : "No images were available."}

DETAILS THE USER TYPED (treat as confirmed by the user):
${ctx.length ? ctx.map(([k, v]) => `- ${k}: ${v}`).join("\n") : "(none)"}

Fill every field of the brand profile. For each field give:
- value: one or two short sentences (max 40 words). If nothing supports it, value = "Unknown — not found in the sources".
- basis: "verified" = stated explicitly in a source; "inferred" = a reasonable reading of what the sources show; "assumption" = a guess the user should confirm (or unknown); "confirmed" = taken from the user's own details.
- source: where it came from ("website", "social profile", "screenshots", "your notes", "your details") or null.

Also return:
- colors: brand colors as hex codes ONLY if they appear in the sources/page code or are clearly visible in the images (max 5).
- products: up to 6 actual products/services named in the sources, each with a short detail and its basis.
- consistent_messages: messages that repeat across sources (max 5).
- discrepancies: where the website and social profile disagree (e.g. different prices, audiences, tone). Empty if only one source or none found. Never resolve a contradiction yourself.
- missing_info: important things an advertiser needs that the sources don't say (e.g. price, shipping area, proof points), max 6.
- summary: 2 sentences, plain language.

${TRUTH_RULES}`;
  const out = (await claudeJSON({ prompt, images: input.images, schema: PROFILE_SCHEMA, maxTokens: 2600, deadline: input.deadline, tag: "profile" })) as unknown as BrandProfile;
  return normalizeProfile(out);
}

export function normalizeProfile(p: Partial<BrandProfile>): BrandProfile {
  const fields = {} as BrandProfile["fields"];
  for (const f of PROFILE_FIELDS) {
    const v = p.fields?.[f.key as ProfileKey];
    const basis = v?.basis && ["verified", "inferred", "assumption", "confirmed"].includes(v.basis) ? v.basis : "assumption";
    fields[f.key as ProfileKey] = { value: String(v?.value ?? "Unknown — not found in the sources").slice(0, 600), basis, source: v?.source ?? null };
  }
  const arr = (x: unknown, n: number) => (Array.isArray(x) ? x.map(String).filter(Boolean).slice(0, n) : []);
  return {
    fields,
    colors: arr(p.colors, 5).filter((c) => /^#[0-9a-f]{3,8}$/i.test(c)),
    products: Array.isArray(p.products) ? p.products.slice(0, 6).map((x) => ({ name: String(x.name ?? ""), detail: String(x.detail ?? ""), basis: (x.basis as BrandProfile["products"][number]["basis"]) ?? "inferred" })) : [],
    consistent_messages: arr(p.consistent_messages, 5),
    discrepancies: arr(p.discrepancies, 6),
    missing_info: arr(p.missing_info, 6),
    summary: String(p.summary ?? "").slice(0, 600),
    reference_images: Array.isArray(p.reference_images) ? p.reference_images.map(String).slice(0, 3) : [],
  };
}

export function profileText(p: BrandProfile): string {
  return [
    ...PROFILE_FIELDS.map((f) => `${f.label}: ${p.fields[f.key].value} [${p.fields[f.key].basis}]`),
    p.products.length ? `Products: ${p.products.map((x) => `${x.name} — ${x.detail} [${x.basis}]`).join("; ")}` : "Products: none named",
    p.colors.length ? `Brand colors: ${p.colors.join(", ")}` : "Brand colors: not identified",
    p.missing_info.length ? `Missing information: ${p.missing_info.join("; ")}` : "",
    p.discrepancies.length ? `Discrepancies between sources: ${p.discrepancies.join("; ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/* ── 2. audience ────────────────────────────────────────────────────────── */

const AUDIENCE_SCHEMA = obj({
  segments: list(obj({ name: S, who: S, problem_or_desire: S, motivation: S, message: S, validate: S })),
});

export async function buildAudience(profile: BrandProfile, deadline: number): Promise<AudienceSegment[]> {
  const prompt = `You are a senior advertising strategist. Based ONLY on this brand profile, recommend 3 or 4 audience segments worth testing in paid social ads.

BRAND PROFILE (each line marked verified / inferred / assumption / confirmed):
${profileText(profile)}

For each segment (each field max 30 words):
- name: short segment name
- who: who they are
- problem_or_desire: their likely problem or desire this product addresses
- motivation: what might make them consider the product
- message: the message or benefit most likely to resonate
- validate: what must be validated before spending money on this segment

These are hypotheses from public information, not known customer data.
${TRUTH_RULES}`;
  const out = (await claudeJSON({ prompt, schema: AUDIENCE_SCHEMA, maxTokens: 1400, deadline, tag: "audience" })) as { segments?: AudienceSegment[] };
  return (out.segments ?? []).slice(0, 4).map((s) => ({
    name: String(s.name ?? ""),
    who: String(s.who ?? ""),
    problem_or_desire: String(s.problem_or_desire ?? ""),
    motivation: String(s.motivation ?? ""),
    message: String(s.message ?? ""),
    validate: String(s.validate ?? ""),
  }));
}

/* ── 3. opportunities + concepts ────────────────────────────────────────── */

const CONCEPTS_SCHEMA = obj({
  opportunities: list(obj({ angle: S, audience: S, core_message: S, why_test: S, hypothesis: S })),
  concepts: list(
    obj({ name: S, angle: S, audience: S, hook: S, message: S, visual: S, emphasis: S, cta: S, placement: S, why: S, needs_confirmation: strs })
  ),
});

export async function buildConcepts(profile: BrandProfile, audience: AudienceSegment[], deadline: number): Promise<{ opportunities: Opportunity[]; concepts: Concept[] }> {
  const prompt = `You are a senior performance creative strategist. Using ONLY this brand profile and audience, choose the advertising opportunities that genuinely fit this business, then write ad concepts for static image ads on Meta (Facebook/Instagram).

BRAND PROFILE:
${profileText(profile)}

AUDIENCE SEGMENTS:
${audience.map((a) => `- ${a.name}: ${a.who}; wants: ${a.problem_or_desire}; message: ${a.message}`).join("\n") || "(none)"}

1) opportunities: 3 to 5. Pick only angles that fit (e.g. problem–solution, product demonstration, benefit-led, objection handling, social proof ONLY if real proof exists in the profile, offer-led ONLY if a real offer/price exists, founder/brand story ONLY if the sources tell one, comparison, educational, use cases). Each: angle, audience, core_message, why_test, hypothesis (each max 30 words).

2) concepts: 5 meaningfully different concepts (different angles, audiences or visual ideas — not rewordings). Each:
- name: memorable concept name (max 5 words)
- angle, audience (one of the segments above)
- hook: the primary hook/headline (max 10 words)
- message: main message (max 25 words)
- visual: proposed visual composition for a static image (max 40 words) — describe layout, subject, product placement, background
- emphasis: the offer or product benefit to emphasize (only real ones)
- cta: button-style CTA (2–4 words)
- placement: e.g. "Instagram feed 4:5", "Facebook & Instagram feed 1:1", "Stories 9:16"
- why: why it may be worth testing (max 30 words)
- needs_confirmation: list any claim in this concept the user must confirm before running it (empty if none)
Fit the business type: a SaaS product gets software-appropriate concepts (product UI, workflow outcomes), a physical product gets product-led visuals, a service gets outcome/process visuals.

${TRUTH_RULES}`;
  const out = (await claudeJSON({ prompt, schema: CONCEPTS_SCHEMA, maxTokens: 3400, deadline, tag: "concepts" })) as { opportunities?: Opportunity[]; concepts?: Omit<Concept, "id">[] };
  const str = (x: unknown, n = 400) => String(x ?? "").slice(0, n);
  return {
    opportunities: (out.opportunities ?? []).slice(0, 5).map((o) => ({ angle: str(o.angle, 120), audience: str(o.audience, 160), core_message: str(o.core_message), why_test: str(o.why_test), hypothesis: str(o.hypothesis) })),
    concepts: (out.concepts ?? []).slice(0, 6).map((c, i) => ({
      id: `c${i + 1}`,
      name: str(c.name, 80),
      angle: str(c.angle, 120),
      audience: str(c.audience, 160),
      hook: str(c.hook, 160),
      message: str(c.message),
      visual: str(c.visual, 600),
      emphasis: str(c.emphasis),
      cta: str(c.cta, 40),
      placement: str(c.placement, 80),
      why: str(c.why),
      needs_confirmation: Array.isArray(c.needs_confirmation) ? c.needs_confirmation.map(String).slice(0, 5) : [],
    })),
  };
}

/* ── 4. variation specs (copy + visual direction per image) ─────────────── */

const VARIATIONS_SCHEMA = obj({ variations: list(obj({ headline: S, primary_text: S, cta: S, visual_direction: S })) });

export async function buildVariations(input: { profile: BrandProfile; concept: Concept; options: GenerationOptions; count: number; deadline: number }): Promise<VariationSpec[]> {
  const style = STYLES.find((s) => s.id === input.options.style)?.label ?? input.options.style;
  const density = TEXT_DENSITY.find((d) => d.id === input.options.text_density)?.label ?? input.options.text_density;
  const prompt = `You write Meta (Facebook/Instagram) static image ads. Write ${input.count} distinct variation(s) of this concept.

BRAND PROFILE:
${profileText(input.profile)}

CONCEPT: ${input.concept.name}
Angle: ${input.concept.angle} | Audience: ${input.concept.audience}
Hook: ${input.concept.hook}
Message: ${input.concept.message}
Visual idea: ${input.concept.visual}
Emphasize: ${input.concept.emphasis}
CTA: ${input.concept.cta}

FORMAT: ${input.options.aspect_ratio}, style "${style}", text on image "${density}", platform ${input.options.platform}.

For each variation:
- headline: the text that will appear ON the image (max 8 words for Minimal/Balanced, max 10 for Information-rich)
- primary_text: the ad's primary text above the image (max 45 words, plain, no hashtags, no emojis unless the brand tone uses them)
- cta: button text (2–4 words)
- visual_direction: what the image shows (max 45 words): subject, product placement, setting, lighting, composition. Keep all variations on-concept but visually different.
Never add claims, numbers, prices, discounts, reviews or guarantees that aren't in the profile.
${TRUTH_RULES}`;
  const out = (await claudeJSON({ prompt, schema: VARIATIONS_SCHEMA, maxTokens: 1800, deadline: input.deadline, tag: "variations" })) as { variations?: VariationSpec[] };
  const v = (out.variations ?? []).slice(0, input.count).map((x) => ({
    headline: String(x.headline ?? "").slice(0, 120),
    primary_text: String(x.primary_text ?? "").slice(0, 600),
    cta: String(x.cta ?? input.concept.cta).slice(0, 40),
    visual_direction: String(x.visual_direction ?? input.concept.visual).slice(0, 600),
  }));
  while (v.length < input.count) v.push({ headline: input.concept.hook, primary_text: input.concept.message, cta: input.concept.cta, visual_direction: input.concept.visual });
  return v;
}

/* ── image prompt (no AI call: built from the saved strategy) ───────────── */

const STYLE_PROMPT: Record<string, string> = {
  clean_product: "clean, premium product advertisement; uncluttered background; studio lighting; the product is the hero",
  editorial: "editorial magazine-style photograph with refined art direction and natural light",
  ugc_static: "authentic smartphone-photo look, as if shot by a real customer; natural setting; slightly imperfect framing; no studio polish",
  bold_promo: "bold promotional layout; strong color blocks; large high-contrast typography; energetic composition",
  brand_specific: "follows the brand's own visual identity closely (colors, mood and photography style described below)",
};

const DENSITY_PROMPT: Record<string, string> = {
  minimal: "Render ONLY the headline text on the image (plus a small CTA button). Lots of empty space.",
  balanced: "Render the headline prominently and a small CTA button. At most one short supporting line taken from the primary text.",
  rich: "Render the headline, up to three short benefit lines taken ONLY from the profile's verified facts, and a CTA button. Keep it readable on a phone.",
};

export function imagePrompt(input: { profile: BrandProfile; concept: Concept; spec: VariationSpec; options: GenerationOptions }): string {
  const p = input.profile.fields;
  const brand = p.brand_name.value.startsWith("Unknown") ? "the brand" : p.brand_name.value;
  return [
    `Create a finished static social media ad image for ${brand}, for a ${input.options.platform === "meta" ? "Facebook and Instagram" : input.options.platform} feed.`,
    `What the brand sells: ${p.offering.value}`,
    `Concept "${input.concept.name}" (${input.concept.angle}) for ${input.concept.audience}.`,
    `Image: ${input.spec.visual_direction}`,
    `Style: ${STYLE_PROMPT[input.options.style] ?? input.options.style}.`,
    input.options.brand_consistency
      ? `Brand identity to preserve: ${p.visual_identity.value.replace(/[.\s]*$/, ".")}${input.profile.colors.length ? ` Use these brand colors: ${input.profile.colors.join(", ")}.` : ""} If reference images are attached, match their product appearance, packaging and look exactly — do not redesign the product.`
      : "",
    `Text on the image, spelled exactly: headline "${input.spec.headline}"; CTA button "${input.spec.cta}". ${DENSITY_PROMPT[input.options.text_density] ?? ""}`,
    "Do not add any other words, prices, ratings, badges, certifications, testimonials or logos that aren't specified. No watermarks. Keep key content away from the edges so nothing important is cut off.",
  ]
    .filter(Boolean)
    .join("\n");
}
