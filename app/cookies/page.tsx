import { LegalPage } from "@/components/marketing/LegalPage";

export default function CookiesPage() {
  return (
    <LegalPage title="Cookie Policy" updated="August 2026">
      <p>
        Creatively.ai uses a small number of cookies required to keep you securely logged in and to
        remember your session.
      </p>

      <h2>Essential cookies</h2>
      <p>
        Authentication cookies (set by our login system) are required for the product to function
        — without them, you wouldn&apos;t be able to stay logged in between page loads. These
        cannot be disabled while using the product.
      </p>

      <h2>What we don&apos;t do</h2>
      <p>
        We don&apos;t use third-party advertising or tracking cookies, and we don&apos;t sell
        cookie-derived data to advertisers.
      </p>
    </LegalPage>
  );
}
