import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";
import { Mail } from "lucide-react";

export default function ContactPage() {
  return (
    <>
      <Nav />
      <section className="px-6 py-24">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light">Contact</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            Get in touch.
          </h1>
          <p className="mt-4 text-ink-secondary">
            Questions about the product, billing, or anything else — we&apos;re happy to help.
          </p>
          <a
            href="mailto:hello@creatively.ai"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-gradient-to-b from-brand-light to-brand px-6 py-3 text-sm font-medium text-white shadow-glow hover:brightness-110"
          >
            <Mail size={16} /> hello@creatively.ai
          </a>
        </div>
      </section>
      <Footer />
    </>
  );
}
