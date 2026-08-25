"use client";

// A lightweight, dependency-free client-side device signal — combined with
// IP and email hashing server-side as one layer of the free-report
// eligibility system. Not a claim of uniqueness or unbeatability, just
// another signal that makes casual repeat use harder to pull off.
export function getDeviceFingerprint(): string {
  if (typeof window === "undefined") return "server";
  const parts = [
    navigator.userAgent,
    navigator.language,
    String(screen.width),
    String(screen.height),
    String(screen.colorDepth),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    String(navigator.hardwareConcurrency || ""),
  ];
  return parts.join("|");
}
