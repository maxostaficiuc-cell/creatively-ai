import { LegalPage } from "@/components/marketing/LegalPage";

export default function DataSecurityPage() {
  return (
    <LegalPage title="Data & Security" updated="August 2026">
      <p>
        Here&apos;s how Creatively.ai handles your data at a technical level.
      </p>

      <h2>Infrastructure</h2>
      <p>
        Your account data, uploaded creatives, and analysis results are stored in a managed
        Postgres database with row-level security enabled — meaning the database itself enforces
        that a user can only ever read or write their own data, not just the application layer.
      </p>

      <h2>Uploaded creatives</h2>
      <p>
        Creative files are stored in private object storage. Access is scoped per-user; files
        aren&apos;t publicly listable or accessible without a valid, time-limited signed link tied
        to your account.
      </p>

      <h2>Advertising account access</h2>
      <p>
        If you connect Meta Ads, the access token is stored server-side and used only to fetch your
        own account&apos;s campaign data. You can disconnect at any time from Ad Accounts.
      </p>

      <h2>Payments</h2>
      <p>
        Payment processing is handled by our payment provider — we don&apos;t store your card
        details on our own servers.
      </p>
    </LegalPage>
  );
}
