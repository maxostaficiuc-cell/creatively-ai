// ─────────────────────────────────────────────────────────────────────────────
// Homepage hero — the hand/phone photograph and how it is laid out.
//
// The ad on the phone and its analysis live in lib/demoCreative.ts (one shared
// object). This file only describes the photograph of the hand holding the phone.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Photoreal hand-holding-phone photograph (black background).
 * File: public/images/hero-hand-phone.jpg (a .png / .jpeg / .webp with the same
 * name also works — the first one that loads is used).
 *
 * `screen` is where the phone's display sits inside that photo, in percent of
 * the photo's width/height (measured on the 1024 × 1536 photo, leaving a thin
 * even bezel). If you swap the photo, only these numbers change.
 */
export const HAND_PHONE_ASSET = {
  sources: [
    "/images/hero-hand-phone.jpg",
    "/images/hero-hand-phone.png",
    "/images/hero-hand-phone.jpeg",
    "/images/hero-hand-phone.webp",
  ],
  /** Natural aspect ratio of the photo (width / height). */
  aspect: 1024 / 1536,
  screen: {
    left: 31.25, // %
    top: 6.05, // %
    width: 37.5, // %
    height: 53.5, // %
    /** CSS border-radius for the display corners (horizontal / vertical). */
    radius: "12.5% / 5.85%",
  },
};

/**
 * CSS custom properties derived from HAND_PHONE_ASSET, so the hero layout
 * (photo size, card positions) follows the photo automatically.
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
