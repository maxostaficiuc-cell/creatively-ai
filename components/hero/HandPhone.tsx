"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import { HAND_PHONE_ASSET } from "@/lib/heroDemo";
import { PhoneScreenAd, type AdNaturalSize } from "@/components/hero/PhoneScreenAd";

/*
 * The hand + phone is built from two independent, same-sized layers that the
 * hero moves together:
 *
 *  1. <HandPhoto>        the photoreal photograph (public/images/hero-hand-phone.*).
 *                        It has a black background, so its parent applies
 *                        `mix-blend-mode: lighten` — the black melts into the
 *                        page and the ambient light shows through around the hand.
 *  2. <PhoneScreenLayer> the replaceable ad, positioned over the phone's display
 *                        using HAND_PHONE_ASSET.screen. Rendered normally (no
 *                        blending) so the ad is shown with its exact colours.
 *
 * Keeping them as siblings (not nested) matters: blend modes only mix with
 * what is behind the element's stacking context, and the ad must not blend.
 */

const aspectStyle = { aspectRatio: `${HAND_PHONE_ASSET.aspect}` };

// Generated/studio photos are rarely pure black at the edges; feathering the
// frame removes any visible rectangle where the photo meets the page.
const FEATHER = "radial-gradient(ellipse 72% 78% at 50% 46%, #000 58%, transparent 100%)";
const photoFeather: React.CSSProperties = { WebkitMaskImage: FEATHER, maskImage: FEATHER };

export function HandPhoto({ className }: { className?: string }) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const exhausted = sourceIndex >= HAND_PHONE_ASSET.sources.length;
  const imgRef = useRef<HTMLImageElement>(null);

  // If a candidate 404s before React hydrates, onError never fires —
  // so check the server-rendered <img> once we're mounted.
  useEffect(() => {
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth === 0) setSourceIndex((i) => i + 1);
  }, [sourceIndex]);

  return (
    <div className={`relative select-none ${className || ""}`} style={{ ...aspectStyle, ...photoFeather }}>
      {exhausted ? (
        <MissingHandNotice />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          key={HAND_PHONE_ASSET.sources[sourceIndex]}
          src={HAND_PHONE_ASSET.sources[sourceIndex]}
          alt=""
          aria-hidden
          draggable={false}
          loading="eager"
          decoding="async"
          className="absolute inset-0 h-full w-full object-contain"
          onError={() => setSourceIndex((i) => i + 1)}
        />
      )}
    </div>
  );
}

export const PhoneScreenLayer = forwardRef<
  HTMLImageElement,
  { className?: string; onAdLoad?: (size: AdNaturalSize) => void; screenRef?: React.Ref<HTMLDivElement> }
>(function PhoneScreenLayer({ className, onAdLoad, screenRef }, adRef) {
  const { screen } = HAND_PHONE_ASSET;
  return (
    <div className={`relative ${className || ""}`} style={aspectStyle}>
      <div
        ref={screenRef}
        className="absolute overflow-hidden"
        style={{
          left: `${screen.left}%`,
          top: `${screen.top}%`,
          width: `${screen.width}%`,
          height: `${screen.height}%`,
          borderRadius: screen.radius,
          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
        }}
      >
        <PhoneScreenAd ref={adRef} onAdLoad={onAdLoad} />
        {/* faint glass reflection so the display reads as glass, not a flat box */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(115deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 26%, rgba(255,255,255,0) 72%, rgba(255,255,255,0.03) 100%)",
          }}
        />
      </div>
    </div>
  );
});

/**
 * Shown only while no hand photograph has been added. A labelled outline of
 * where the photo goes — intentionally NOT an attempt at drawing a hand.
 */
function MissingHandNotice() {
  const { screen } = HAND_PHONE_ASSET;
  return (
    <div className="absolute inset-0">
      <div
        className="absolute border border-white/15 bg-white/[0.02]"
        style={{
          left: `${screen.left - 1.4}%`,
          top: `${screen.top - 1}%`,
          width: `${screen.width + 2.8}%`,
          height: `${screen.height + 2}%`,
          borderRadius: screen.radius,
        }}
      />
      <div
        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-dashed border-white/20 bg-black/50 px-3 py-2 text-center"
        style={{ top: `${screen.top + screen.height + 4}%` }}
      >
        <p className="text-[11px] font-medium text-white/65">Hand photo placeholder</p>
        <p className="font-mono text-[10px] text-white/40">public/images/hero-hand-phone.png</p>
      </div>
    </div>
  );
}
