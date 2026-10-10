"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { ButtonLink } from "@/components/ui/Button";
import { GetFreeReportButton } from "@/components/marketing/GetFreeReportButton";

const SECTION_IDS = ["features", "winning-ads", "how-it-works", "pricing", "faq"];

const links = [
  { id: "features", label: "Features" },
  { id: "winning-ads", label: "Winning Ads" },
  { id: "how-it-works", label: "How It Works" },
  { id: "pricing", label: "Pricing" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const observerRef = useRef<IntersectionObserver | null>(null);

  const onHomepage = pathname === "/";

  // Scroll to a section, whether we're already on the homepage or need to
  // navigate there first. This is the one place that decides how every nav
  // link, footer link, and "View Analysis" back-link behaves — the bug
  // this fixes was these being inconsistent (some plain hash links, one a
  // real separate /pricing route) with no shared logic tying them together.
  function goToSection(id: string) {
    setOpen(false);
    if (onHomepage) {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", `#${id}`);
      }
    } else {
      router.push(`/#${id}`);
    }
  }

  function goToTop() {
    setOpen(false);
    if (onHomepage) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      history.pushState(null, "", "/");
    } else {
      router.push("/");
    }
  }

  // Edge case: landing directly on /#pricing (or any section hash) — the
  // browser's native anchor-scroll can be unreliable with a sticky header
  // and client-side rendered content, so handle it explicitly on mount.
  useEffect(() => {
    if (!onHomepage) return;
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      // Wait one tick for the homepage's sections to be in the DOM.
      requestAnimationFrame(() => {
        document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onHomepage]);

  // Active-section highlighting via IntersectionObserver — cheap, no
  // scroll-event listeners.
  useEffect(() => {
    if (!onHomepage) {
      setActive(null);
      return;
    }
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (el): el is HTMLElement => !!el
    );
    if (elements.length === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-100px 0px -70% 0px" }
    );
    elements.forEach((el) => observerRef.current?.observe(el));

    return () => observerRef.current?.disconnect();
  }, [onHomepage]);

  return (
    // The header keeps its original 64px slot in the page (sticky, same height),
    // so nothing below it moves; the bar itself is a floating glass pill inside it.
    <header className="sticky top-0 z-40 h-16">
      <div className="relative mx-auto flex h-full max-w-[1120px] items-center px-3 sm:px-4 lg:px-6">
        <div className="flex h-[52px] w-full items-center justify-between rounded-full border border-white/[0.08] bg-[#111115]/70 pl-4 pr-1.5 shadow-[0_10px_30px_-14px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-xl backdrop-saturate-150 lg:pl-5">
          <div onClick={(e) => { if (onHomepage) { e.preventDefault(); goToTop(); } }}>
            <Logo />
          </div>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => goToSection(l.id)}
                className={`rounded-full px-3.5 py-1.5 text-sm transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-white/60 ${
                  active === l.id
                    ? "bg-white/[0.06] text-ink-primary"
                    : "text-ink-secondary hover:bg-white/[0.05] hover:text-ink-primary"
                }`}
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="hidden items-center gap-1.5 lg:flex">
            <ButtonLink
              href="/login"
              variant="ghost"
              className="rounded-full !py-2 hover:bg-white/[0.05] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60"
            >
              Log In
            </ButtonLink>
            <GetFreeReportButton className="!py-2.5" />
          </div>

          <button
            className="flex h-10 w-10 items-center justify-center rounded-full text-ink-primary transition-colors hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/60 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {open && (
          <div className="absolute inset-x-3 top-[60px] rounded-[22px] border border-white/[0.08] bg-[#111115]/90 p-2 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl backdrop-saturate-150 sm:inset-x-4 lg:hidden">
            <nav className="flex flex-col">
              {links.map((l) => (
                <button
                  key={l.id}
                  onClick={() => goToSection(l.id)}
                  className={`rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                    active === l.id ? "bg-white/[0.06] text-ink-primary" : "text-ink-secondary hover:bg-white/[0.05] hover:text-ink-primary"
                  }`}
                >
                  {l.label}
                </button>
              ))}
              <div className="mt-2 flex flex-col gap-2 border-t border-white/[0.06] px-1 pb-1 pt-3">
                <ButtonLink href="/login" variant="secondary">
                  Log In
                </ButtonLink>
                <GetFreeReportButton className="w-full" />
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
