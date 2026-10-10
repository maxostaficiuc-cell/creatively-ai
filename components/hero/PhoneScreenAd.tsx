"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ImageIcon } from "lucide-react";
import { DEMO_AD_IMAGE } from "@/lib/heroDemo";

export type AdNaturalSize = { width: number; height: number };

/**
 * The phone's display: a minimal, unbranded social-feed frame around the
 * supplied ad image. The ad itself is shown exactly as supplied
 * (object-fit: contain), and the ref points at the <img> so connector lines
 * can target real coordinates on it.
 *
 * No handles, follower counts, likes or comments are drawn — those would be
 * fabricated engagement.
 */
export const PhoneScreenAd = forwardRef<
  HTMLImageElement,
  { onAdLoad?: (size: AdNaturalSize) => void; priority?: boolean }
>(function PhoneScreenAd({ onAdLoad, priority = true }, ref) {
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

  return (
    <div className="flex h-full w-full flex-col bg-[#0B0B0F] text-white">
      {/* status bar */}
      <div className="flex h-[6%] shrink-0 items-end justify-between px-[9%] pb-[1%] text-[clamp(7px,0.7vw,10px)] font-semibold">
        <span>9:41</span>
        <span className="flex items-center gap-[3px] opacity-90">
          <span className="h-[5px] w-[14px] rounded-[2px] border border-white/80" />
        </span>
      </div>

      {/* post header — deliberately generic */}
      <div className="flex h-[7%] shrink-0 items-center gap-[4%] px-[5%]">
        <span className="aspect-square h-[60%] rounded-full bg-gradient-to-br from-white/25 to-white/5 ring-1 ring-white/15" />
        <span className="flex flex-col leading-tight">
          <span className="h-[5px] w-[56px] rounded-full bg-white/35" />
          <span className="mt-[3px] text-[clamp(6px,0.55vw,8px)] text-white/45">Sponsored</span>
        </span>
      </div>

      {/* the ad — replaceable, never cropped */}
      <div className="relative flex min-h-0 flex-1 items-center justify-center bg-black">
        {missing ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 border border-dashed border-white/20 p-[8%] text-center">
            <ImageIcon className="text-white/40" size={18} />
            <p className="text-[clamp(7px,0.7vw,10px)] font-medium text-white/70">Ad image placeholder</p>
            <p className="font-mono text-[clamp(6px,0.55vw,8px)] leading-snug text-white/40">
              add public/images/
              <br />
              creatively-demo-ad.png
            </p>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            ref={imgRef}
            src={DEMO_AD_IMAGE.src}
            alt={DEMO_AD_IMAGE.alt}
            className="h-full w-full object-contain"
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              onAdLoad?.({ width: img.naturalWidth, height: img.naturalHeight });
            }}
            onError={() => setMissing(true)}
          />
        )}
      </div>

      {/* call-to-action bar + neutral feed rows */}
      <div className="shrink-0 px-[5%] pb-[6%] pt-[3%]">
        <div className="flex items-center justify-between rounded-[6px] bg-white/[0.06] px-[5%] py-[3%] text-[clamp(6px,0.6vw,9px)] text-white/70">
          <span>Learn more</span>
          <span aria-hidden>›</span>
        </div>
        <div className="mt-[5%] space-y-[4px]">
          <span className="block h-[4px] w-[78%] rounded-full bg-white/[0.12]" />
          <span className="block h-[4px] w-[52%] rounded-full bg-white/[0.08]" />
        </div>
      </div>
    </div>
  );
});
