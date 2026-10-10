# Homepage hero — the demo creative

## One source of truth: `lib/demoCreative.ts`

The ad shown in the phone **and** the three analysis cards come from a single
object, `BUFFY_DEMO` (id `buffy-bedding-demo`), exported as `HERO_CREATIVE`.
Desktop (`HeroScrollSequence`) and mobile (`MobileHero`) both receive that same
object, so they can never show different ads or analysis for the wrong ad.

To change the demo, edit or replace that object:

- `image.src / width / height / alt` – the creative file and its real pixel size.
- `analysis.cards` – What's great / What's not great / What to test. Each finding
  has a short `label` and a one-sentence `detail`.
- `analysis.cards[n].anchor` – where that card's line touches the ad on desktop,
  as fractions of the image (x: 0 = left → 1 = right, y: 0 = top → 1 = bottom).
  Anchors sit on empty background next to the element being discussed, so lines
  never run across the ad's text.
- `analysis.disclaimer` – shown next to the demo. The findings are visual creative
  observations of the image, not campaign performance data.

## Image files (`public/images/`)

| File | What it is |
|---|---|
| `buffy-ad-creative.png` | The Buffy ad, exactly as supplied (338 × 600). Shown with `object-fit: contain` — never cropped or stretched. Portrait ads fill the phone like a Story; the letterbox is a blur of the same image. |
| `hero-hand-phone.jpg` | Photoreal hand holding the phone, black background, 1024 × 1536. |

Screen position of the phone inside the hand photo: `HAND_PHONE_ASSET.screen` in
`lib/heroDemo.ts`. Only change it if you replace the hand photo.

Missing files show a clearly labelled placeholder instead of breaking the page.

## Components (`components/hero/`)

- `HeroScrollSequence.tsx` – desktop (≥ 1024px): pinned scroll sequence (~150vh).
- `MobileHero.tsx` – phones/tablets: phone + compact cards on an animated "analysis thread".
- `HandPhone.tsx` – hand photo layer + phone screen layer.
- `PhoneScreenAd.tsx` – the creative inside the screen (Story or feed framing).
- `AnalysisCard.tsx` – green / red / purple cards (`full` and `compact` variants).
- `ConnectorLines.tsx` – desktop connector lines and anchor dots.
- `HeroHeadline.tsx`, `HeroAmbient.tsx` – headline/CTAs and background light.

Respects `prefers-reduced-motion` (no pinning; everything shown in its final
state) and works with JavaScript disabled (cards shown via `<noscript>` styles).
