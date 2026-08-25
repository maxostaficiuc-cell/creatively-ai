// Optional Cloudflare Turnstile (CAPTCHA) verification. Entirely
// gracefully-degrading: if TURNSTILE_SECRET_KEY isn't set, verification
// always passes and the client widget simply doesn't render — the free
// report flow still works end-to-end without it, this is a layer you can
// turn on later, not a hard requirement.

export function isTurnstileConfigured(): boolean {
  return !!process.env.TURNSTILE_SECRET_KEY;
}

export async function verifyTurnstileToken(token: string | null): Promise<boolean> {
  if (!isTurnstileConfigured()) return true;
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET_KEY!,
        response: token,
      }),
    });
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error("Turnstile verification failed:", err);
    return false;
  }
}
