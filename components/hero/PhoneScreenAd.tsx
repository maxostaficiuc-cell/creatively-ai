"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import type { DemoCreative } from "@/lib/demoCreative";

export type AdNaturalSize = { width: number; height: number };

/**
 * The phone's display. Shows the creative exactly as supplied
 * (object-fit: contain — never cropped, stretched or regenerated).
 *
 * - Portrait creatives (Stories / Reels, e.g. 9:16) fill the screen the way a
 *   Story does; any letterbox above/below is filled with a soft blur of the
 *   same image, so no foreign content is introduced.
 * - Square / landscape creatives get a minimal, unbranded feed frame.
 *
 * No handles, follower counts, likes or comments are drawn — those would be
 * fabricated engagement.
 */
export const PhoneScreenAd = forwardRef<
  HTMLImageElement,
  { image: DemoCreative["image"]; onAdLoad?: (size: AdNaturalSize) => void; priority?: boolean }
>(function PhoneScreenAd({ image, onAdLoad, priority = true }, ref) {
  const [missing, setMissing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useImperativeHandle(ref, () => imgRef.current as HTMLImageElement);

  // Handle load/error events that happened before hydration.
  useEffect(() => {
    const img = imgRef.current;
    if (!img || !img.complete) return;
    if (img.naturalWidth === 0) setMissing(true);
    else onAdLoad?.({ width: img.naturalWidth, height: img.naturalHeight });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isPortrait = image.width / image.height < 0.75;

  const adImage = missing ? (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-white/20 bg-black p-[8%] text-center">
      <ImageIcon className="text-white/40" size={18} />
      <p className="text-[clamp(7px,0.7vw,10px)] font-medium text-white/70">Ad image missing</p>
      <p className="break-all font-mono text-[clamp(6px,0.55vw,8px)] leading-snug text-white/40">
        public{image.src}
      </p>
    </div>
  ) : (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={imgRef}
      src={image.src}
      alt={image.alt}
      width={image.width}
      height={image.height}
      className="relative h-full w-full object-contain"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      draggable={false}
      onLoad={(e) => {
        const img = e.currentTarget;
        onAdLoad?.({ width: img.naturalWidth, height: img.naturalHeight });
      }}
      onError={() => setMissing(true)}
    />
  );

  if (isPortrait) {
    return (
      <div className="relative h-full w-full overflow-hidden bg-black">
        {/* letterbox fill: the same image, blurred — no other content */}
        {!missing && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.src}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full scale-125 object-cover opacity-80 blur-xl"
            draggable={false}
          />
        )}
        <div className="absolute inset-0 flex items-center justify-center">{adImage}</div>

        {/* Story chrome: progress bar + status bar, kept inside the letterbox area */}
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[8%] bg-gradient-to-b from-black/25 to-transparent">
          <div className="flex items-center justify-between px-[8%] pt-[3.2%] text-[clamp(6px,0.62vw,9px)] font-semibold text-white">
            <span>9:41</span>
            <span className="h-[5px] w-[13px] rounded-[2px] border border-white/80" />
          </div>
          <div className="mx-[4%] mt-[2.2%] h-[2px] overflow-hidden rounded-full bg-white/35">
            <div className="h-full w-[38%] rounded-full bg-white" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col bg-[#0B0B0F] text-white">
      <div className="flex h-[6%] shrink-0 items-end justify-between px-[9%] pb-[1%] text-[clamp(7px,0.7vw,10px)] font-semibold">
        <span>9:41</span>
        <span className="h-[5px] w-[14px] rounded-[2px] border border-white/80" />
      </div>
      <div className="flex h-[7%] shrink-0 items-center gap-[4%] px-[5%]">
        <span className="aspect-square h-[60%] rounded-full bg-gradient-to-br from-white/25 to-white/5 ring-1 ring-white/15" />
        <span className="text-[clamp(6px,0.55vw,8px)] text-white/45">Sponsored</span>
      </div>
      <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black">{adImage}</div>
      <div className="h-[9%] shrink-0" />
    </div>
  );
});
