// SERVER ONLY — one Claude call that must return a JSON object, with text and
// optional images. Same provider, model setting (ANTHROPIC_MODEL) and
// structured-output approach as the creative analysis pipeline.
import { AnalysisError } from "@/lib/analyzeCreative";

export type Schema = Record<string, unknown>;
export const S: Schema = { type: "string" };
export const strs: Schema = { type: "array", items: S };
export const obj = (properties: Record<string, Schema>): Schema => ({ type: "object", properties, required: Object.keys(properties), additionalProperties: false });
export const list = (items: Schema): Schema => ({ type: "array", items });

let schemaUnsupported = false;

export function claudeConfigured() {
  return !!process.env.ANTHROPIC_API_KEY;
}

export async function claudeJSON(opts: {
  prompt: string;
  images?: { mediaType: string; base64: string }[];
  schema: Schema;
  maxTokens: number;
  deadline: number;
  tag: string;
}): Promise<Record<string, unknown>> {
  let useSchema = !schemaUnsupported;
  for (let attempt = 1; ; attempt++) {
    const remaining = opts.deadline - Date.now();
    if (remaining < 1500) throw new AnalysisError("ai_timeout", `No time left for ${opts.tag}`, true);
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), remaining);
    let err: AnalysisError;
    try {
      const res = await fetch(process.env.ANTHROPIC_API_BASE || "https://api.anthropic.com/v1/messages", {
        method: "POST",
        signal: ctrl.signal,
        headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({
          model: process.env.ANTHROPIC_MODEL || "claude-haiku-5-5",
          max_tokens: opts.maxTokens,
          ...(useSchema ? { output_config: { format: { type: "json_schema", schema: opts.schema } } } : {}),
          messages: [
            {
              role: "user",
              content: [
                ...(opts.images ?? []).map((i) => ({ type: "image", source: { type: "base64", media_type: i.mediaType, data: i.base64 } })),
                { type: "text", text: useSchema ? opts.prompt : `${opts.prompt}\n\nReturn ONLY a JSON object matching this JSON Schema:\n${JSON.stringify(opts.schema)}` },
              ],
            },
          ],
        }),
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        if (useSchema && res.status === 400 && /output_config|json_schema|structured|schema/i.test(body)) {
          schemaUnsupported = true;
          useSchema = false;
          attempt--;
          continue;
        }
        const retryable = res.status === 429 || res.status >= 500;
        err = new AnalysisError(res.status === 429 ? "ai_rate_limited" : res.status === 401 || res.status === 403 || res.status === 404 ? "ai_auth" : "ai_unavailable", `${opts.tag} HTTP ${res.status}: ${body.slice(0, 200)}`, retryable);
      } else {
        const data = await res.json();
        const text: string = (data.content ?? []).filter((b: { type?: string }) => b.type === "text").map((b: { text?: string }) => b.text ?? "").join("");
        const a = text.indexOf("{");
        const b = text.lastIndexOf("}");
        if (data.stop_reason === "max_tokens") err = new AnalysisError("ai_bad_response", `${opts.tag} was cut off`, true);
        else if (data.stop_reason === "refusal") err = new AnalysisError("ai_rejected_image", `${opts.tag} was refused`, false);
        else if (a === -1 || b <= a) err = new AnalysisError("ai_bad_response", `${opts.tag} returned no JSON`, true);
        else {
          try {
            return JSON.parse(text.slice(a, b + 1));
          } catch {
            err = new AnalysisError("ai_bad_response", `${opts.tag} returned invalid JSON`, true);
          }
        }
      }
    } catch (e) {
      if (e instanceof AnalysisError) throw e;
      err = ctrl.signal.aborted
        ? new AnalysisError("ai_timeout", `${opts.tag} timed out`, true)
        : new AnalysisError("ai_unavailable", `${opts.tag} network error`, true);
    } finally {
      clearTimeout(timer);
    }
    if (attempt >= 2 || !err.retryable || err.code === "ai_timeout" || opts.deadline - Date.now() < 9000) throw err;
    await new Promise((r) => setTimeout(r, 800));
  }
}
