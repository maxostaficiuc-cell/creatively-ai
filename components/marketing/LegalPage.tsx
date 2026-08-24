import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Nav />
      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm text-ink-muted">Last updated {updated}</p>
          <div className="prose-legal mt-10 space-y-6 text-sm leading-relaxed text-ink-secondary [&_h2]:mt-10 [&_h2]:text-lg [&_h2]:font-medium [&_h2]:text-ink-primary [&_p]:mt-3">
            {children}
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
