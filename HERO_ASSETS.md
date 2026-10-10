# Homepage hero — image files

The cinematic hero uses two image files. Both live in `public/images/`.
Neither is embedded in the code, so you can swap either one without touching
the animation.

| File | What it is | Shown where |
|---|---|---|
| `public/images/hero-hand-phone.png` | Photoreal hand holding a phone, **black background**, 1024 × 1536 (2:3). `.jpg`, `.jpeg` or `.webp` also work — the first one found is used. | The hand + phone that rises from the bottom |
| `public/images/creatively-demo-ad.png` | Your exact Everyday Dose ad, unchanged | Inside the phone screen (never cropped — `object-fit: contain`) |

If a file is missing, the site shows a clearly labelled placeholder in its place
instead of breaking.

## Everything you might want to tweak is in `lib/heroDemo.ts`

- `DEMO_AD_IMAGE.src` – path of the ad shown on the phone.
- `HAND_PHONE_ASSET.screen` – where the phone's display sits inside the hand
  photo (percentages). Only change these if you replace the hand photo with a
  different one.
- `heroAnalysis` – the three cards (What's great / What's not great / What to
  test). These are hand-written, illustrative creative observations — not AI
  output and not performance data.
- `heroAnalysis[n].anchors` – where each card's glowing line lands on the ad,
  as fractions of the ad image (`x: 0` = left edge, `x: 1` = right edge,
  `y: 0` = top, `y: 1` = bottom). Nudge these once your real ad is in place so
  the lines point at the price, gifts, labels, etc.

## Components

- `components/hero/HeroScrollSequence.tsx` – desktop scroll choreography (pinned ~150vh)
- `components/hero/MobileHero.tsx` – phones/tablets: stacked cards, simpler motion
- `components/hero/HandPhone.tsx` – hand photo layer + phone screen layer
- `components/hero/PhoneScreenAd.tsx` – the ad inside the screen + placeholder
- `components/hero/AnalysisCard.tsx` – green / red / purple glass cards
- `components/hero/ConnectorLines.tsx` – the glowing lines and anchor dots
- `components/hero/HeroHeadline.tsx`, `HeroAmbient.tsx` – headline/CTAs, background light
- `components/marketing/CapabilitiesSection.tsx` – "Your ads have potential" section (`#how-it-works`)

Respects `prefers-reduced-motion` (no pinning, everything shown in its final state).
