/** Ambient violet lighting behind the hero. Static — no animation cost. */
export function HeroAmbient({ className }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-0 ${className || ""}`}>
      {/* key light from above */}
      <div
        className="absolute inset-x-0 top-0 h-[70%]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 0%, rgba(139,92,246,0.22), rgba(139,92,246,0.06) 45%, transparent 75%)",
        }}
      />
      {/* halo behind the phone */}
      <div
        className="absolute left-1/2 top-[52%] h-[70vh] w-[70vh] -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.20), rgba(124,58,237,0.05) 45%, transparent 70%)" }}
      />
      {/* cool rim light on the sides */}
      <div
        className="absolute -left-[10%] top-[30%] h-[60vh] w-[40vw]"
        style={{ background: "radial-gradient(closest-side, rgba(99,102,241,0.08), transparent)" }}
      />
      <div
        className="absolute -right-[10%] top-[45%] h-[60vh] w-[40vw]"
        style={{ background: "radial-gradient(closest-side, rgba(168,85,247,0.07), transparent)" }}
      />
      {/* faint horizon line */}
      <div
        className="absolute inset-x-[10%] top-[64%] h-px"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }}
      />
    </div>
  );
}
