import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creatively.ai — Create Better Ads. Backed by Data. Powered by AI.",
  description:
    "Creatively.ai analyzes your advertising creatives, surfaces winning ads, and tells you exactly what to test next.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-base-bg text-ink-primary">
        {children}
      </body>
    </html>
  );
}
