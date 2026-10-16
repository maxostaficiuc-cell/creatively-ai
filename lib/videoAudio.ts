// SERVER ONLY — listens to a video ad's soundtrack with Gemini (the provider this
// app already uses for image generation; Claude can't take audio). Returns only
// what was actually heard, and says plainly when audio couldn't be analyzed —
// it never invents dialogue, music or timestamps.
//
// Needs GEMINI_API_KEY (server-side). Model: GEMINI_VIDEO_MODEL, default
// "gemini-flash-latest" (Google's alias for its current Flash model, which
// accepts video and audio input).
import type { VideoAudio, VideoTranscriptLine } from "@/lib/analyzeCreative";

export const GEMINI_VIDEO_DEFAULT_MODEL = "gemini-flash-latest";
/** Gemini's limit for a request with inline media is 20 MB; base64 adds a third. */
export const MAX_INLINE_VIDEO_BYTES = 14 * 1024 * 1024;

const PROMPT = (duration: number) => `Listen to the soundtrack of this video ad (it is ${duration.toFixed(1)} seconds long).

Return ONLY a JSON object:
{
  "has_audio": <true if the video has any audible sound at all, false if it is silent or has no audio track>,
  "speech": <true only if you can hear spoken words or sung lyrics>,
  "transcript": [ {"start": <seconds>, "end": <seconds>, "text": "<exactly the words you hear>"} ],
  "spoken_hook": "<the first words spoken, if any, else an empty string>",
  "sound": "<what the audio consists of: voiceover, dialogue, music, sound effects, silence; max 25 words>",
  "consistency": "<does what is said match what is shown on screen at the same moments? Name any mismatch. Max 30 words. Empty string if there is no speech>"
}
Rules: transcribe only words you can actually hear; if a word is unclear write [inaudible]. Never guess or invent dialogue, lyrics, music or timestamps. Timestamps must be within the video's length. If there is no speech, transcript is [] and spoken_hook is "".`;

const notAnalyzed = (note: string): VideoAudio => ({ status: "not_analyzed", note, speech: false, transcript: [], spoken_hook: "", sound: "", consistency: "" });

export function geminiVideoConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

export async function analyzeVideoAudio(input: { bytes: Uint8Array; mime: string; duration: number; deadline: number }): Promise<VideoAudio & { error?: string }> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { ...notAnalyzed("Audio was not analyzed: audio analysis isn't configured on the server."), error: "not_configured" };
  if (input.bytes.length > MAX_INLINE_VIDEO_BYTES) return { ...notAnalyzed("Audio was not analyzed: this video is too large for audio analysis."), error: "too_large" };
  const remaining = input.deadline - Date.now();
  if (remaining < 4000) return { ...notAnalyzed("Audio was not analyzed this time (it ran out of time)."), error: "timeout" };
  const model = process.env.GEMINI_VIDEO_MODEL || GEMINI_VIDEO_DEFAULT_MODEL;
  const base = process.env.GEMINI_API_BASE || "https://generativelanguage.googleapis.com/v1beta";
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), remaining);
  try {
    const res = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent`, {
      method: "POST",
      signal: ctrl.signal,
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: input.mime, data: Buffer.from(input.bytes).toString("base64") } }, { text: PROMPT(input.duration) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0 },
      }),
    });
    const body = await res.text();
    if (!res.ok) {
      console.error(JSON.stringify({ evt: "video_audio_failed", status: res.status, model, detail: body.slice(0, 300) }));
      return { ...notAnalyzed("Audio was not analyzed this time."), error: `http_${res.status}` };
    }
    const data = JSON.parse(body) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? "").join("");
    const a = text.indexOf("{");
    const b = text.lastIndexOf("}");
    if (a === -1 || b <= a) return { ...notAnalyzed("Audio was not analyzed this time."), error: "no_json" };
    const j = JSON.parse(text.slice(a, b + 1)) as Record<string, unknown>;
    return normalizeAudio(j, input.duration);
  } catch (e) {
    const timedOut = ctrl.signal.aborted;
    console.error(JSON.stringify({ evt: "video_audio_failed", timedOut, detail: e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200) }));
    return { ...notAnalyzed(timedOut ? "Audio was not analyzed this time (it ran out of time)." : "Audio was not analyzed this time."), error: timedOut ? "timeout" : "failed" };
  } finally {
    clearTimeout(timer);
  }
}

const s = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function normalizeAudio(j: Record<string, unknown>, duration: number): VideoAudio {
  const limit = duration + 1;
  const transcript: VideoTranscriptLine[] = (Array.isArray(j.transcript) ? (j.transcript as Record<string, unknown>[]) : [])
    .map((x) => ({ start: Number(x.start), end: Number(x.end), text: s(x.text) }))
    // Drop lines whose timing is impossible for this video rather than show made-up times.
    .filter((x) => x.text && Number.isFinite(x.start) && x.start >= 0 && x.start <= limit)
    .map((x) => ({ ...x, end: Number.isFinite(x.end) && x.end >= x.start && x.end <= limit ? x.end : x.start }))
    .sort((a, b) => a.start - b.start)
    .slice(0, 60);
  if (j.has_audio === false) {
    return { status: "no_audio", note: "This video has no audible sound, so only the visuals were analyzed.", speech: false, transcript: [], spoken_hook: "", sound: "", consistency: "" };
  }
  const speech = j.speech === true && transcript.length > 0;
  return {
    status: "analyzed",
    note: speech ? "The soundtrack was transcribed and checked against the visuals." : "The soundtrack was analyzed; no speech was heard.",
    speech,
    transcript: speech ? transcript : [],
    spoken_hook: speech ? s(j.spoken_hook) : "",
    sound: s(j.sound),
    consistency: speech ? s(j.consistency) : "",
  };
}
