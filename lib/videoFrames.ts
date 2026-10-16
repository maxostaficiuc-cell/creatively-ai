// Browser-only: reads a video file locally and picks representative frames for
// the analysis — the opening, scene changes, the middle and the closing shot —
// with their real timestamps. Near-identical frames are skipped. Nothing is
// uploaded here; the caller sends the frames (small JPEGs) with the request.

export type ExtractedFrame = { t: number; blob: Blob };
export type ExtractedVideo = { duration: number; width: number; height: number; frames: ExtractedFrame[] };

export class VideoReadError extends Error {}

const MAX_FRAMES = 8;
const MAX_CANDIDATES = 40;
const LONG_EDGE = 768;
const THUMB = 24;

function once(el: HTMLVideoElement, ok: string, ms: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => {
      cleanup();
      reject(new VideoReadError(`timeout waiting for ${ok}`));
    }, ms);
    const onOk = () => {
      cleanup();
      resolve();
    };
    const onErr = () => {
      cleanup();
      reject(new VideoReadError("the browser could not decode this video"));
    };
    const cleanup = () => {
      clearTimeout(t);
      el.removeEventListener(ok, onOk);
      el.removeEventListener("error", onErr);
    };
    el.addEventListener(ok, onOk);
    el.addEventListener("error", onErr);
  });
}

async function seek(v: HTMLVideoElement, t: number) {
  if (Math.abs(v.currentTime - t) < 0.001) return;
  const p = once(v, "seeked", 6000);
  v.currentTime = t;
  await p;
}

function thumbOf(v: HTMLVideoElement, ctx: CanvasRenderingContext2D): Float32Array {
  ctx.drawImage(v, 0, 0, THUMB, THUMB);
  const d = ctx.getImageData(0, 0, THUMB, THUMB).data;
  const out = new Float32Array(THUMB * THUMB);
  for (let i = 0; i < out.length; i++) out[i] = (d[i * 4] * 0.299 + d[i * 4 + 1] * 0.587 + d[i * 4 + 2] * 0.114) / 255;
  return out;
}

const diff = (a: Float32Array, b: Float32Array) => {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += Math.abs(a[i] - b[i]);
  return s / a.length;
};

export async function extractVideoFrames(file: File): Promise<ExtractedVideo> {
  const url = URL.createObjectURL(file);
  const v = document.createElement("video");
  v.muted = true;
  v.playsInline = true;
  v.setAttribute("playsinline", "");
  v.preload = "auto";
  v.crossOrigin = "anonymous";
  try {
    const meta = once(v, "loadedmetadata", 15000);
    v.src = url;
    v.load();
    await meta;
    let duration = v.duration;
    if (!Number.isFinite(duration) || duration <= 0) {
      // Some recorded WebM files report no length until the end has been read.
      const p = once(v, "durationchange", 8000).catch(() => undefined);
      v.currentTime = 1e7;
      await p;
      duration = v.duration;
    }
    if (!Number.isFinite(duration) || duration <= 0) throw new VideoReadError("could not read the video length");
    const width = v.videoWidth;
    const height = v.videoHeight;
    if (!width || !height) throw new VideoReadError("this file has no video picture the browser can read");
    if (v.readyState < 2) {
      // iOS Safari only decodes a picture after playback has started once.
      await v.play().catch(() => undefined);
      v.pause();
    }

    const small = document.createElement("canvas");
    small.width = small.height = THUMB;
    const sctx = small.getContext("2d", { willReadFrequently: true });
    if (!sctx) throw new VideoReadError("canvas unavailable");

    // 1) cheap pass over evenly spaced points to find scene changes
    const end = Math.max(0, duration - 0.1);
    const n = Math.min(MAX_CANDIDATES, Math.max(MAX_FRAMES, Math.ceil(duration / 0.5)));
    const times = Array.from({ length: n }, (_, i) => Math.min(end, (i / (n - 1)) * end));
    const thumbs: Float32Array[] = [];
    for (const t of times) {
      await seek(v, t);
      thumbs.push(thumbOf(v, sctx));
    }
    const change = thumbs.map((th, i) => (i === 0 ? 0 : diff(th, thumbs[i - 1])));

    // 2) choose: opening, closing, the biggest scene changes, then fill the gaps
    const chosen = new Set<number>([0, times.length - 1]);
    const hook = times.findIndex((t) => t >= Math.min(1.5, duration * 0.15));
    if (hook > 0) chosen.add(hook);
    const byChange = change
      .map((c, i) => ({ c, i }))
      .filter((x) => x.c > 0.06)
      .sort((a, b) => b.c - a.c);
    for (const { i } of byChange) {
      if (chosen.size >= MAX_FRAMES) break;
      chosen.add(i);
    }
    while (chosen.size < Math.min(MAX_FRAMES, times.length)) {
      // the candidate furthest (in time) from everything chosen so far
      const sorted = Array.from(chosen).sort((a, b) => a - b);
      let best = -1;
      let gap = 0;
      for (let k = 0; k + 1 < sorted.length; k++) {
        if (sorted[k + 1] - sorted[k] > gap) {
          gap = sorted[k + 1] - sorted[k];
          best = Math.floor((sorted[k] + sorted[k + 1]) / 2);
        }
      }
      if (best < 0 || chosen.has(best)) break;
      chosen.add(best);
    }
    // drop near-identical neighbours (a static shot sampled twice)
    const order = Array.from(chosen).sort((a, b) => a - b);
    const keep: number[] = [];
    for (const i of order) {
      const prev = keep[keep.length - 1];
      if (prev !== undefined && i !== times.length - 1 && diff(thumbs[i], thumbs[prev]) < 0.015) continue;
      keep.push(i);
    }

    // 3) capture the chosen frames at analysis size
    const scale = Math.min(1, LONG_EDGE / Math.max(width, height));
    const big = document.createElement("canvas");
    big.width = Math.round(width * scale);
    big.height = Math.round(height * scale);
    const bctx = big.getContext("2d");
    if (!bctx) throw new VideoReadError("canvas unavailable");
    const frames: ExtractedFrame[] = [];
    for (const i of keep) {
      await seek(v, times[i]);
      bctx.drawImage(v, 0, 0, big.width, big.height);
      const blob = await new Promise<Blob | null>((r) => big.toBlob(r, "image/jpeg", 0.82));
      if (blob) frames.push({ t: Math.round(times[i] * 100) / 100, blob });
    }
    if (!frames.length) throw new VideoReadError("no frames could be captured");
    return { duration, width, height, frames };
  } finally {
    v.removeAttribute("src");
    v.load();
    URL.revokeObjectURL(url);
  }
}
