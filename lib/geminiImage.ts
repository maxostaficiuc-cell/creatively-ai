// SERVER ONLY — image generation with Google Gemini (generateContent API).
// Needs GEMINI_API_KEY (server-side only). Model: GEMINI_IMAGE_MODEL, default
// "gemini-2.5-flash-image", which generates 1:1, 4:5 and 9:16 natively
// (set via generationConfig.imageConfig.aspectRatio) — so no cropping.
import { sniffImageType } from "@/lib/analyzeCreative";
import type { AspectRatio } from "@/lib/strategyTypes";

export const GEMINI_DEFAULT_MODEL = "gemini-2.5-flash-image";

export function geminiConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

export function geminiModel() {
  return process.env.GEMINI_IMAGE_MODEL || GEMINI_DEFAULT_MODEL;
}

export class ImageGenError extends Error {
  constructor(public code: "not_configured" | "blocked" | "no_image" | "rate_limited" | "auth" | "timeout" | "failed", message: string, public retryable = false) {
    super(message);
  }
}

export async function generateAdImage(input: {
  prompt: string;
  aspectRatio: AspectRatio;
  references: { mediaType: string; base64: string }[];
  deadline: number;
}): Promise<{ bytes: Uint8Array; mime: string; model: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new ImageGenError("not_configured", "GEMINI_API_KEY is not set.");
  const model = geminiModel();
  const base = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
  const remaining = input.deadline - Date.now();
  if (remaining < 4000) throw new ImageGenError("timeout", "Not enough time left to generate the image.", true);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), remaining);
  try {
    const res = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [...input.references.slice(0, 3).map((r) => ({ inlineData: { mimeType: r.mediaType, data: r.base64 } })), { text: input.prompt }],
          },
        ],
        generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: input.aspectRatio } },
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      const msg = body.slice(0, 300);
      if (res.status === 429) throw new ImageGenError("rate_limited", "The image service is busy. Try again in a minute.", true);
      if (res.status === 401 || res.status === 403) throw new ImageGenError("auth", `Gemini rejected the API key or model (${res.status}).`);
      if (res.status === 400 && /aspect|imageConfig/i.test(msg)) throw new ImageGenError("failed", `This Gemini model doesn't accept the requested aspect ratio: ${msg}`);
      throw new ImageGenError("failed", `Gemini error ${res.status}: ${msg}`, res.status >= 500);
    }
    const data = JSON.parse(body) as {
      promptFeedback?: { blockReason?: string };
      candidates?: { finishReason?: string; content?: { parts?: { inlineData?: { mimeType?: string; data?: string }; inline_data?: { mime_type?: string; data?: string } }[] } }[];
    };
    if (data.promptFeedback?.blockReason) throw new ImageGenError("blocked", `The image request was blocked by Gemini's safety filters (${data.promptFeedback.blockReason}). Try different wording.`);
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const img = parts.map((p) => p.inlineData ?? (p.inline_data ? { mimeType: p.inline_data.mime_type, data: p.inline_data.data } : undefined)).find((d) => d?.data);
    if (!img?.data) {
      const reason = data.candidates?.[0]?.finishReason;
      throw new ImageGenError(reason && /SAFETY|PROHIBITED|BLOCK/i.test(reason) ? "blocked" : "no_image", reason ? `Gemini returned no image (${reason}).` : "Gemini returned no image.", !reason || !/SAFETY|PROHIBITED/i.test(reason));
    }
    const bytes = new Uint8Array(Buffer.from(img.data, "base64"));
    const mime = sniffImageType(bytes);
    if (!mime || mime === "image/gif") throw new ImageGenError("no_image", "Gemini returned data that isn't a valid image.");
    return { bytes, mime, model };
  } catch (e) {
    if (e instanceof ImageGenError) throw e;
    if (ctrl.signal.aborted) throw new ImageGenError("timeout", "Image generation took too long.", true);
    throw new ImageGenError("failed", `Couldn't reach Gemini: ${e instanceof Error ? e.message : e}`, true);
  } finally {
    clearTimeout(timer);
  }
}
