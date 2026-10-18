import Image from "next/image";
import { Logo } from "@/components/ui/Logo";

// Shared layout for the log-in and create-account pages: the form on the left,
// and on large screens an example ad being "read" on the right — the same thing
// the product does after sign-in. Purely presentational: no auth logic here.

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-base-bg lg:grid lg:grid-cols-[minmax(440px,1fr)_minmax(0,1.15fr)]">
      {/* soft glow behind the form (mostly visible on phones, where there is no side panel) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-[420px] w-[620px] -translate-x-1/2 rounded-full bg-brand/[0.13] blur-[110px] lg:left-[22%]"
      />

      <main className="relative flex min-h-screen flex-col px-6 py-7 sm:px-10 lg:px-14 xl:px-20">
        <Logo />
        <div className="flex flex-1 items-center py-12">
          <div className="auth-enter mx-auto w-full max-w-[400px] lg:mx-0">{children}</div>
        </div>
        <p className="text-xs text-ink-muted">
          Need help?{" "}
          <a href="mailto:trycreatively.ai@gmail.com" className="text-ink-secondary transition-colors hover:text-ink-primary">
            trycreatively.ai@gmail.com
          </a>
        </p>
      </main>

      <AuthStage />
    </div>
  );
}

// Where each note points on the example ad (percent of the ad's width/height),
// and when it appears — just after the scan line passes it.
const PINS = [
  { x: 93, y: 23.5, d: "1.0s", title: "Hook", body: "Does the first line stop the scroll?" },
  { x: 42, y: 45.5, d: "1.45s", title: "Message", body: "Are the benefits clear at a glance?" },
  { x: 70, y: 83, d: "2.25s", title: "Call to action", body: "Is the next step obvious?" },
];

function AuthStage() {
  return (
    <aside
      aria-hidden
      className="relative m-3 hidden overflow-hidden rounded-[28px] border border-base-border bg-base-surface lg:flex lg:flex-col lg:items-center lg:justify-center"
    >
      <div className="auth-grid pointer-events-none absolute inset-0" />
      <div className="pointer-events-none absolute left-1/2 top-[42%] h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand/[0.16] blur-[120px]" />

      <div className="auth-figure relative flex items-center">
        <div className="auth-ad relative overflow-hidden rounded-2xl ring-1 ring-white/10">
          <Image
            src="/images/buffy-ad-creative.png"
            alt=""
            fill
            priority
            sizes="320px"
            className="origin-top scale-[1.02] object-cover"
          />
          <div className="auth-scan" />
        </div>

        {/* notes column sits to the right of the ad; each line runs from its dot on the ad */}
        <div className="pointer-events-none absolute inset-y-0 left-0 right-0">
          {PINS.map((p) => (
            <div
              key={p.title}
              className="auth-pin absolute flex -translate-y-1/2 items-center"
              style={{ top: `${p.y}%`, left: `calc(var(--ad-w) * ${p.x / 100} - 5px)`, ["--d" as string]: p.d }}
            >
              <span className="relative h-2.5 w-2.5 shrink-0 rounded-full bg-brand-light shadow-[0_0_0_4px_rgba(139,92,246,0.28),0_0_14px_rgba(167,139,250,0.9)]" />
              <span
                className="auth-pin-line h-px bg-gradient-to-r from-brand-light to-brand-light/40"
                style={{ width: `calc(var(--ad-w) * ${(100 - p.x) / 100} + 18px)` }}
              />
              <span className="w-[178px] rounded-xl border border-white/10 bg-base-card/90 px-3 py-2.5 shadow-[0_12px_32px_-12px_rgba(0,0,0,0.8)] backdrop-blur">
                <span className="block text-[13px] font-medium text-ink-primary">{p.title}</span>
                <span className="mt-0.5 block text-xs leading-snug text-ink-secondary">{p.body}</span>
              </span>
            </div>
          ))}
        </div>
        {/* reserve room for the notes so the whole group centres correctly */}
        <div className="w-[196px] shrink-0" />
      </div>

      <div className="relative mt-12 max-w-[420px] px-8 text-center">
        <h2 className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-ink-primary">
          Know what&apos;s wrong with your ad before you spend.
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
          Upload an image or video ad. Creatively.ai reads the hook, the message and the call to action, then tells
          you what to fix and what to test next.
        </p>
      </div>
    </aside>
  );
}
