import { NextResponse } from "next/server";
import { getShowcaseAdmin } from "@/lib/showcaseServer";
import { analyzeWithClaude } from "@/lib/analyzeCreative";

// Admin-only AI health check: https://trycreatively.space/api/admin/ai-check
// Sends one tiny request to Anthropic (a few tokens — costs a tiny fraction
// of a cent) and explains in plain English whether real analyses will work.
// Only accounts in SHOWCASE_ADMIN_EMAILS can open it; the key is never shown.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const HINTS: { match: RegExp; fix: string }[] = [
  { match: /credit balance|billing|purchase credits/i, fix: "Your Anthropic account has no credit. platform.claude.com → Settings → Billing → Buy credits (and turn on Auto-reload)." },
  { match: /invalid x-api-key|authentication|api key/i, fix: "The API key is wrong or was deleted. Create a new key at platform.claude.com → API keys, paste it into Netlify as ANTHROPIC_API_KEY, then redeploy." },
  { match: /model/i, fix: "The model name isn't available to your account. Remove ANTHROPIC_MODEL in Netlify (or set it to claude-haiku-5-5) and redeploy." },
  { match: /rate limit|overloaded/i, fix: "Anthropic is rate-limiting or busy. Wait a minute and try again; if it keeps happening, check your usage limits in the Console." },
  { match: /permission|disabled|organization/i, fix: "The key's workspace or organisation is disabled or lacks access. Check platform.claude.com → Settings." },
];

function page(title: string, ok: boolean, lines: string[]) {
  const body = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>AI check</title>
<body style="margin:0;min-height:100vh;display:grid;place-items:center;background:#08080b;color:#e4e4e7;font:15px/1.55 system-ui,sans-serif;padding:24px">
<div style="max-width:560px;width:100%;border:1px solid ${ok ? "#14532d" : "#7f1d1d"};border-radius:16px;padding:24px;background:#111116">
<p style="margin:0;font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:#a78bfa">Creatively.ai · AI check</p>
<h1 style="margin:8px 0 14px;font-size:22px;color:${ok ? "#4ade80" : "#f87171"}">${title}</h1>
${lines.map((l) => `<p style="margin:8px 0;color:#c4c4cc">${l}</p>`).join("")}
</div></body>`;
  return new NextResponse(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

export async function GET(request: Request) {
  const full = new URL(request.url).searchParams.get("full") === "1";
  const admin = await getShowcaseAdmin();
  if (!admin.ok) {
    return NextResponse.json(
      { error: admin.reason === "not-signed-in" ? "Log in with your admin account first." : "Not allowed." },
      { status: admin.reason === "not-signed-in" ? 401 : 403 }
    );
  }

  const key = process.env.ANTHROPIC_API_KEY || "";
  const model = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

  if (!key) {
    return page("No API key found", false, [
      "The site can't see <b>ANTHROPIC_API_KEY</b> at runtime.",
      "In Netlify → Site configuration → Environment variables, check the key exists, its scopes include <b>Functions</b>, and <b>Production</b> is one of its deploy contexts. Then redeploy.",
    ]);
  }
  const shape = key.startsWith("sk-ant-") ? "looks like an Anthropic key" : "does NOT start with sk-ant- — probably pasted wrong (spaces or quote marks?)";

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model, max_tokens: 5, messages: [{ role: "user", content: "Reply with OK." }] }),
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok && full) {
      // Full test: one real analysis of the sample ad, exactly like a customer's.
      const site = (process.env.SITE_URL || process.env.URL || new URL(request.url).origin).replace(/\/+$/, "");
      try {
        const img = await fetch(`${site}/images/buffy-ad-creative.png`);
        if (!img.ok) throw new Error(`couldn't load the sample image (${img.status})`);
        const bytes = new Uint8Array(await img.arrayBuffer());
        const t0 = Date.now();
        const report = await analyzeWithClaude(bytes, "image/png");
        return page("Full analysis works ✓", true, [
          `A real analysis of the sample ad finished in ${((Date.now() - t0) / 1000).toFixed(1)}s with score <b>${report.score}/100</b>.`,
          "Customers' analyses will now be real. Old reports stay “Simulated” — run a new one.",
        ]);
      } catch (e) {
        return page("Key works, but the full analysis failed", false, [
          `<b>Reason:</b> ${esc(e instanceof Error ? e.message : String(e))}`,
          "Send this line to your developer — it pinpoints the problem.",
        ]);
      }
    }
    if (res.ok) {
      return page("AI is working ✓", true, [
        `Model <b>${esc(model)}</b> answered. Real analyses will run.`,
        `For a complete end-to-end test, open <a style="color:#a78bfa" href="?full=1">?full=1</a> (runs one real analysis of the sample ad, about a cent).`,
      ]);
    }
    const text = await res.text().catch(() => "");
    let message = text.slice(0, 400);
    try {
      message = (JSON.parse(text) as { error?: { message?: string } }).error?.message || message;
    } catch {
      /* not JSON */
    }
    const fix = HINTS.find((h) => h.match.test(message))?.fix ?? "Copy the error above and send it to support or your developer.";
    return page(`Anthropic refused the request (${res.status})`, false, [
      `<b>Anthropic says:</b> ${esc(message)}`,
      `<b>How to fix:</b> ${esc(fix)}`,
      `Key ${shape}. Model: <b>${esc(model)}</b>.`,
    ]);
  } catch (err) {
    return page("Couldn't reach Anthropic", false, [
      esc(err instanceof Error ? err.message : String(err)),
      "This is usually temporary — try again in a minute.",
    ]);
  }
}
