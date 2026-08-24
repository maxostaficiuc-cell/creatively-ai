import { LegalPage } from "@/components/marketing/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="August 2026">
      <p>
        This policy explains what information Creatively.ai collects, how it&apos;s used, and the
        choices you have.
      </p>

      <h2>Information we collect</h2>
      <p>
        When you create an account, we collect your name, email address, and the answers you give
        during onboarding. When you use the product, we store the creatives you upload for
        analysis and the AI-generated results tied to your account.
      </p>
      <p>
        If you connect an advertising account (currently Meta Ads), we store the access token and
        account identifiers needed to fetch your campaign data on your behalf. We do not sell or
        share this data with third parties for advertising purposes.
      </p>

      <h2>How we use your information</h2>
      <p>
        We use your data to operate your account, run AI analysis on creatives you upload, display
        your connected advertising performance, process payments, and communicate with you about
        your account.
      </p>

      <h2>AI processing</h2>
      <p>
        Uploaded creatives are sent to our AI provider for analysis. We don&apos;t control how that
        provider retains data beyond what&apos;s necessary to process the request; we recommend not
        uploading creatives containing sensitive personal information about third parties.
      </p>

      <h2>Data retention</h2>
      <p>
        We retain your account data and analyzed creatives for as long as your account is active.
        You can request deletion of your account and associated data at any time by contacting us.
      </p>

      <h2>Your choices</h2>
      <p>
        You can update your profile information, disconnect advertising accounts, and cancel your
        subscription at any time from your account settings.
      </p>

      <h2>Contact</h2>
      <p>Questions about this policy can be sent through our contact page.</p>
    </LegalPage>
  );
}
