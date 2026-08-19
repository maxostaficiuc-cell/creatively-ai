"use client";

import { useState } from "react";
import { ImageOff, Video } from "lucide-react";

export function CreativeThumb({
  url,
  fileType,
}: {
  url: string;
  fileType: "image" | "video";
}) {
  const [errored, setErrored] = useState(false);

  if (fileType === "video") {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-base-border bg-base-surface text-ink-muted">
        <Video size={22} />
      </div>
    );
  }

  if (errored) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-base-border bg-base-surface text-ink-muted">
        <ImageOff size={20} />
      </div>
    );
  }

  return (
    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-base-border bg-base-surface">
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
