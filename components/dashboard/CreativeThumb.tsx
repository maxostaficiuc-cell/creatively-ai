"use client";

import { useState } from "react";
import { ImageOff, Video } from "lucide-react";

export function CreativeThumb({
  url,
  fileType,
  className = "h-20 w-20 rounded-xl",
}: {
  url: string;
  fileType: "image" | "video";
  className?: string;
}) {
  const [errored, setErrored] = useState(false);

  if (fileType === "video") {
    return (
      <div className={`flex shrink-0 items-center justify-center border border-base-border bg-base-surface text-ink-muted ${className}`}>
        <Video size={22} />
      </div>
    );
  }

  if (errored) {
    return (
      <div className={`flex shrink-0 items-center justify-center border border-base-border bg-base-surface text-ink-muted ${className}`}>
        <ImageOff size={20} />
      </div>
    );
  }

  return (
    <div className={`shrink-0 overflow-hidden border border-base-border bg-base-surface ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="h-full w-full object-cover"
        onError={() => setErrored(true)}
      />
    </div>
  );
}
