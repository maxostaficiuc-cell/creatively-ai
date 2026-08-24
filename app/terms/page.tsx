import { LegalPage } from "@/components/marketing/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="August 2026">
      <p>
        These terms govern your use of Creatively.ai. By creating an account, you agree to them.
      </p>

      <h2>The service</h2>
      <p>
        Creatively.ai provides AI-powered analysis of advertising creatives and, where connected,
        visibility into your advertising account performance. Creative scores are a diagnostic
        signal, not a guarantee of advertising performance.
      </p>

      <h2>Accounts and credits</h2>
      <p>
        Each plan includes a weekly AI credit allowance that resets on a 7-day cycle. Credits are
        consumed when you analyze a creative and do not roll over. Additional credits can be
        purchased separately from your plan.
      </p>

      <h2>Subscriptions and billing</h2>
      <p>
        Paid plans are billed on a recurring basis through our payment processor. You can cancel at
        any time from your Billing page; your access continues until the end of the current billing
        period.
      </p>

      <h2>Acceptable use</h2>
      <p>
        You agree not to upload content you don&apos;t have the rights to, use the service to
        violate applicable law, or attempt to disrupt or reverse-engineer the platform.
      </p>

      <h2>Disclaimer</h2>
      <p>
        The service is provided &quot;as is.&quot; AI-generated analysis reflects our current
        model&apos;s assessment and may be imperfect or change over time as we improve it.
      </p>

      <h2>Changes</h2>
      <p>We may update these terms as the product evolves. Material changes will be reflected here.</p>
    </LegalPage>
  );
}
