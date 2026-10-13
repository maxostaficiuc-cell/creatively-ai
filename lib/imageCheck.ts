// SERVER ONLY — checks that an uploaded file really is a STATIC image, by
// reading its bytes (never trusting the file name or the browser's MIME type).
// Accepts PNG, JPEG and WebP. Rejects video containers, GIFs (often animated),
// animated PNG (APNG) and animated WebP.

export type ImageCheck =
  | { ok: true; type: "png" | "jpeg" | "webp"; mime: string; ext: string; width: number; height: number }
  | { ok: false; reason: string };

const MIN_SIDE = 200;
const MAX_SIDE = 8000;
export const MAX_IMAGE_BYTES = 12 * 1024 * 1024;

const ascii = (b: Uint8Array, start: number, len: number) => String.fromCharCode(...b.subarray(start, start + len));
const u32be = (b: Uint8Array, i: number) => ((b[i] << 24) | (b[i + 1] << 16) | (b[i + 2] << 8) | b[i + 3]) >>> 0;
const u16be = (b: Uint8Array, i: number) => (b[i] << 8) | b[i + 1];
const u24le = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8) | (b[i + 2] << 16);

function sized(type: "png" | "jpeg" | "webp", width: number, height: number): ImageCheck {
  if (!(width > 0 && height > 0)) return { ok: false, reason: "Could not read the image size." };
  if (width < MIN_SIDE || height < MIN_SIDE) return { ok: false, reason: `Image is too small (${width}×${height}). Use the full-size ad.` };
  if (width > MAX_SIDE || height > MAX_SIDE) return { ok: false, reason: `Image is too large (${width}×${height}).` };
  const mime = type === "jpeg" ? "image/jpeg" : `image/${type}`;
  return { ok: true, type, mime, ext: type === "jpeg" ? "jpg" : type, width, height };
}

export function checkStaticImage(b: Uint8Array): ImageCheck {
  if (b.length < 32) return { ok: false, reason: "The file is empty or not an image." };
  if (b.length > MAX_IMAGE_BYTES) return { ok: false, reason: "Image is larger than 12 MB." };

  // Video containers — rejected outright, whatever the file is called.
  if (ascii(b, 4, 4) === "ftyp") return { ok: false, reason: "This is a video file (MP4/MOV), not a static image." };
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return { ok: false, reason: "This is a video file (WebM/MKV), not a static image." };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "AVI ") return { ok: false, reason: "This is a video file (AVI), not a static image." };
  if (ascii(b, 0, 3) === "GIF") return { ok: false, reason: "GIFs aren't accepted (they're often animated). Use a PNG, JPG or WebP of the ad." };

  // PNG
  if (b[0] === 0x89 && ascii(b, 1, 3) === "PNG") {
    let i = 8;
    let w = 0;
    let h = 0;
    while (i + 8 <= b.length) {
      const len = u32be(b, i);
      const type = ascii(b, i + 4, 4);
      if (type === "IHDR") {
        w = u32be(b, i + 8);
        h = u32be(b, i + 12);
      }
      if (type === "acTL") return { ok: false, reason: "This is an animated PNG, not a static image." };
      if (type === "IDAT" || type === "IEND") break;
      i += 12 + len;
    }
    return sized("png", w, h);
  }

  // JPEG
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) {
        i++;
        continue;
      }
      const marker = b[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
        i += 2;
        continue;
      }
      const len = u16be(b, i + 2);
      // SOF0–SOF15 except DHT(C4), JPG(C8), DAC(CC)
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return sized("jpeg", u16be(b, i + 7), u16be(b, i + 5));
      }
      i += 2 + len;
    }
    return { ok: false, reason: "Could not read the JPEG." };
  }

  // WebP
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 4) === "WEBP") {
    const chunk = ascii(b, 12, 4);
    if (chunk === "VP8X") {
      const flags = b[20];
      if (flags & 0x02) return { ok: false, reason: "This is an animated WebP, not a static image." };
      return sized("webp", u24le(b, 24) + 1, u24le(b, 27) + 1);
    }
    if (chunk === "VP8 ") return sized("webp", ((b[26] | (b[27] << 8)) & 0x3fff), ((b[28] | (b[29] << 8)) & 0x3fff));
    if (chunk === "VP8L") {
      const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
      return sized("webp", (bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1);
    }
    return { ok: false, reason: "Unsupported WebP." };
  }

  return { ok: false, reason: "Not a PNG, JPG or WebP image." };
}
