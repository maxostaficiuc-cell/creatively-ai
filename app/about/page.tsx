import { Nav } from "@/components/marketing/Nav";
import { Footer } from "@/components/marketing/Footer";

export default function AboutPage() {
  return (
    <>
      <Nav />
      <section className="px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium uppercase tracking-wide text-brand-light">About</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink-primary sm:text-4xl">
            Built for advertisers who&apos;d rather know than guess.
          </h1>
          <p className="mt-6 text-ink-secondary">
            Creatively.ai exists to answer one question before you spend another dollar on an ad:
            is this creative actually good? We built an AI creative analysis workspace that gives
            advertisers a real, honest diagnostic — what&apos;s working, what&apos;s not, and what
            to test next — instead of vague encouragement.
          </p>
          <p className="mt-4 text-ink-secondary">
            The product is still growing. Right now it covers image creative analysis and Meta Ads
            performance, with more platforms and capabilities on the way.
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
}
