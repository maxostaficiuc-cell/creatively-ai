// Browser-only: shrinks large images before upload.
//
// The vision model works at up to ~1568px on the long edge (bigger images are
// downscaled by the provider anyway), and the hosting platform rejects request
// bodies of a few MB. Uploading a 4000px PNG therefore only adds failure risk
// and wait time. Small files are sent untouched.

const MAX_EDGE = 1568;
const KEEP_AS_IS_BYTES = 1.5 * 1024 * 1024;
const PASSTHROUGH = new Set(["image/jpeg", "image/png", "image/webp"]);

async function decode(file: File): Promise<{ w: number; h: number; draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void; close: () => void } | null> {
  try {
    if ("createImageBitmap" in window) {
      const bmp = await createImageBitmap(file);
      return { w: bmp.width, h: bmp.height, draw: (ctx, w, h) => ctx.drawImage(bmp, 0, 0, w, h), close: () => bmp.close() };
    }
  } catch {
    /* fall through to <img> */
  }
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    return { w: img.naturalWidth, h: img.naturalHeight, draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h), close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    return null; // e.g. HEIC in a browser that can't decode it: let the server explain
  }
}

export async function prepareImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const img = await decode(file);
  if (!img) return file;
  try {
    const long = Math.max(img.w, img.h);
    if (long <= MAX_EDGE && file.size <= KEEP_AS_IS_BYTES && PASSTHROUGH.has(file.type)) return file;

    const scale = Math.min(1, MAX_EDGE / long);
    const w = Math.max(1, Math.round(img.w * scale));
    const h = Math.max(1, Math.round(img.h * scale));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff"; // transparent PNG areas become white, not black
    ctx.fillRect(0, 0, w, h);
    ctx.imageSmoothingQuality = "high";
    img.draw(ctx, w, h);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    img.close();
  }
}
