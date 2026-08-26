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
    <header className="sticky top-0 z-40 border-b border-white/5 bg-base-bg/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div onClick={(e) => { if (onHomepage) { e.preventDefault(); goToTop(); } }}>
          <Logo />
        </div>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <button
              key={l.id}
              onClick={() => goToSection(l.id)}
              className={`text-sm transition-colors ${
                active === l.id ? "text-ink-primary" : "text-ink-secondary hover:text-ink-primary"
              }`}
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ButtonLink href="/login" variant="ghost">
            Login
          </ButtonLink>
          <GetFreeReportButton />
        </div>

        <button
          className="text-ink-primary md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="border-t border-white/5 px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-4">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => goToSection(l.id)}
                className={`text-left text-sm ${active === l.id ? "text-ink-primary" : "text-ink-secondary"}`}
              >
                {l.label}
              </button>
            ))}
            <div className="mt-2 flex flex-col gap-3">
              <ButtonLink href="/login" variant="secondary">
                Login
              </ButtonLink>
              <GetFreeReportButton className="w-full" />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
