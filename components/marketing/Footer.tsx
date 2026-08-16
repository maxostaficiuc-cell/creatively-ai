import { Logo } from "@/components/ui/Logo";

export function Footer() {
  return (
    <footer className="border-t border-white/5 px-6 py-12">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
        <Logo />
        <p className="text-sm text-ink-muted">
          © {new Date().getFullYear()} Creatively.ai. All rights reserved.
        </p>
        <div className="flex gap-6 text-sm text-ink-secondary">
          <a href="/pricing" className="hover:text-ink-primary">Pricing</a>
          <a href="#faq" className="hover:text-ink-primary">FAQ</a>
          <a href="/login" className="hover:text-ink-primary">Login</a>
        </div>
      </div>
    </footer>
  );
}
