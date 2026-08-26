"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

// Links come in two kinds: a real "page" (its own route, plain navigation)
// or a "section" (an id on the homepage — needs the same smooth
// scroll-or-navigate logic as the header nav, not a plain anchor). Mixing
// these up (e.g. Pricing pointing at a separate /pricing route) was
// exactly the source of the original navigation bug.
type FooterLink = { label: string; id: string; kind: "section" } | { label: string; href: string; kind: "page" };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Product",
    links: [
      { label: "Creative Analysis", id: "creative-analysis", kind: "section" },
      { label: "Winning Ads", id: "winning-ads", kind: "section" },
      { label: "Creative Intelligence", id: "insights", kind: "section" },
      { label: "Integrations", id: "integrations", kind: "section" },
      { label: "Pricing", id: "pricing", kind: "section" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "How It Works", id: "how-it-works", kind: "section" },
      { label: "FAQ", id: "faq", kind: "section" },
      { label: "Creative Library", id: "winning-ads", kind: "section" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about", kind: "page" },
      { label: "Contact", href: "/contact", kind: "page" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy", kind: "page" },
      { label: "Terms of Service", href: "/terms", kind: "page" },
      { label: "Cookie Policy", href: "/cookies", kind: "page" },
      { label: "Refund Policy", href: "/refund-policy", kind: "page" },
      { label: "Data & Security", href: "/data-security", kind: "page" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const onHomepage = pathname === "/";

  function goToSection(id: string) {
    if (onHomepage) {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      history.pushState(null, "", `#${id}`);
    } else {
      router.push(`/#${id}`);
    }
  }

  return (
    <footer className="border-t border-white/5 px-6 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
          <div className="col-span-2 sm:col-span-4">
            <Logo />
            <p className="mt-3 max-w-xs text-sm text-ink-muted">
              AI creative intelligence for advertisers.
            </p>
          </div>
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) =>
                  l.kind === "section" ? (
                    <li key={l.label}>
                      <button
                        onClick={() => goToSection(l.id)}
                        className="text-sm text-ink-secondary hover:text-ink-primary"
                      >
                        {l.label}
                      </button>
                    </li>
                  ) : (
                    <li key={l.label}>
                      <Link href={l.href} className="text-sm text-ink-secondary hover:text-ink-primary">
                        {l.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-sm text-ink-muted">
            © {new Date().getFullYear()} Creatively.ai. All rights reserved.
          </p>
          <Link href="/login" className="text-sm text-ink-secondary hover:text-ink-primary">
            Login
          </Link>
        </div>
      </div>
    </footer>
  );
}
