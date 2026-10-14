// SERVER ONLY — fetches a user-supplied URL without letting it reach private networks (SSRF-safe).
//
// - Only http/https on the default ports, no credentials in the URL.
// - Every hostname is resolved and EVERY resolved address is checked; the
//   connection is then pinned to the checked address (via a custom DNS lookup
//   on the socket), so a DNS answer can't change between check and connect.
// - Redirects are followed manually (max 4) and each hop is re-checked.
// - Response bodies are capped and requests time out.
import http from "node:http";
import https from "node:https";
import dns from "node:dns";
import net from "node:net";
import type { LookupFunction } from "node:net";

export class SafeFetchError extends Error {
  constructor(public code: "invalid_url" | "blocked_address" | "timeout" | "too_large" | "http_error" | "network" | "too_many_redirects" | "unsupported_type", message: string, public status?: number) {
    super(message);
  }
}

export type SafeResponse = { url: string; status: number; contentType: string; body: Buffer };

const BLOCKED_V4: [string, number][] = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4], ["255.255.255.255", 32],
];

function v4ToInt(ip: string) {
  return ip.split(".").reduce((n, o) => (n << 8) + Number(o), 0) >>> 0;
}

export function isPublicAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const n = v4ToInt(ip);
    return !BLOCKED_V4.some(([base, bits]) => {
      const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
      return (n & mask) === (v4ToInt(base) & mask);
    });
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    if (x === "::" || x === "::1") return false;
    const mapped = x.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPublicAddress(mapped[1]);
    if (/^::ffff:/.test(x)) return false;
    if (/^(fc|fd)/.test(x)) return false; // unique local
    if (/^fe[89ab]/.test(x)) return false; // link local
    if (/^ff/.test(x)) return false; // multicast
    if (/^2001:db8/.test(x) || /^64:ff9b/.test(x) || /^100::/.test(x)) return false;
    return true;
  }
  return false;
}

/** Parses and normalises a user-supplied URL; adds https:// when the scheme is missing. */
export function normalizePublicUrl(input: string): URL {
  let raw = (input ?? "").trim();
  if (!raw) throw new SafeFetchError("invalid_url", "Empty URL.");
  if (raw.length > 2000) throw new SafeFetchError("invalid_url", "URL is too long.");
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(raw)) raw = `https://${raw}`;
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    throw new SafeFetchError("invalid_url", "That doesn't look like a valid URL.");
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") throw new SafeFetchError("invalid_url", "Only http and https links are supported.");
  if (u.username || u.password) throw new SafeFetchError("invalid_url", "Links with a username or password aren't allowed.");
  if (u.port && u.port !== "80" && u.port !== "443") throw new SafeFetchError("invalid_url", "Only standard web ports are allowed.");
  const host = u.hostname.replace(/^\[|\]$/g, "");
  if (!host.includes(".") && !net.isIP(host)) throw new SafeFetchError("invalid_url", "Use a full public domain, like yourbrand.com.");
  if (/(^|\.)(localhost|local|internal|intranet|lan|home|corp)$/i.test(host)) throw new SafeFetchError("blocked_address", "That address isn't publicly reachable.");
  if (net.isIP(host) && !isPublicAddress(host)) throw new SafeFetchError("blocked_address", "That address isn't publicly reachable.");
  u.hash = "";
  return u;
}

/** DNS lookup that refuses to hand back any non-public address. Test hook: SAFE_FETCH_ALLOW_HOSTS (never set in production). */
const guardedLookup: LookupFunction = (hostname, options, callback) => {
  dns.lookup(hostname, { ...(typeof options === "object" ? options : {}), all: true }, (err, addresses) => {
    if (err) return (callback as (e: Error | null, a: string, f: number) => void)(err, "", 4);
    const list = (Array.isArray(addresses) ? addresses : []) as { address: string; family: number }[];
    const allowTest = (process.env.SAFE_FETCH_ALLOW_HOSTS ?? "").split(",").map((s) => s.trim()).filter(Boolean).includes(hostname);
    const bad = list.find((a) => !isPublicAddress(a.address));
    if (!list.length || (bad && !allowTest)) {
      return (callback as (e: Error | null, a: string, f: number) => void)(new SafeFetchError("blocked_address", "That address isn't publicly reachable."), "", 4);
    }
    const first = list[0];
    if (typeof options === "object" && options && (options as { all?: boolean }).all) {
      return (callback as unknown as (e: Error | null, a: { address: string; family: number }[]) => void)(null, list);
    }
    (callback as (e: Error | null, a: string, f: number) => void)(null, first.address, first.family);
  });
};

const UA = "Mozilla/5.0 (compatible; CreativelyAI-BrandReader/1.0; +https://trycreatively.space)";

function once(u: URL, opts: { timeoutMs: number; maxBytes: number; accept: string }): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  return new Promise((resolve, reject) => {
    const mod = u.protocol === "https:" ? https : http;
    const req = mod.request(
      u,
      {
        method: "GET",
        lookup: guardedLookup,
        headers: { "user-agent": UA, accept: opts.accept, "accept-language": "en;q=0.9,*;q=0.5" },
        timeout: opts.timeoutMs,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let size = 0;
        const declared = Number(res.headers["content-length"] ?? 0);
        if (declared && declared > opts.maxBytes && (res.statusCode ?? 0) < 300) {
          res.destroy();
          return reject(new SafeFetchError("too_large", "The page is too large to read."));
        }
        res.on("data", (c: Buffer) => {
          size += c.length;
          if (size > opts.maxBytes) {
            // Keep what we have (enough for HTML extraction) and stop reading.
            chunks.push(c.subarray(0, Math.max(0, c.length - (size - opts.maxBytes))));
            res.destroy();
            resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) });
            return;
          }
          chunks.push(c);
        });
        res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }));
        res.on("error", (e) => reject(new SafeFetchError("network", e.message)));
      }
    );
    req.on("timeout", () => req.destroy(new SafeFetchError("timeout", "The site took too long to respond.")));
    req.on("error", (e) => reject(e instanceof SafeFetchError ? e : new SafeFetchError("network", e.message)));
    req.end();
  });
}

export async function safeFetch(
  input: string | URL,
  opts: { timeoutMs?: number; maxBytes?: number; accept?: string; deadline?: number } = {}
): Promise<SafeResponse> {
  let u = typeof input === "string" ? normalizePublicUrl(input) : normalizePublicUrl(input.toString());
  const maxBytes = opts.maxBytes ?? 1_500_000;
  for (let hop = 0; hop <= 4; hop++) {
    const left = opts.deadline ? opts.deadline - Date.now() : Infinity;
    if (left < 500) throw new SafeFetchError("timeout", "Ran out of time reading the site.");
    const res = await once(u, { timeoutMs: Math.min(opts.timeoutMs ?? 8000, left), maxBytes, accept: opts.accept ?? "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5" });
    if (res.status >= 300 && res.status < 400 && res.headers.location) {
      u = normalizePublicUrl(new URL(String(res.headers.location), u).toString());
      continue;
    }
    if (res.status >= 400) throw new SafeFetchError("http_error", `The site answered with HTTP ${res.status}.`, res.status);
    return { url: u.toString(), status: res.status, contentType: String(res.headers["content-type"] ?? ""), body: res.body };
  }
  throw new SafeFetchError("too_many_redirects", "Too many redirects.");
}
