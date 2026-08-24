import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Creatively.ai — Know What's Wrong With Your Ad Before You Spend",
  description:
    "AI creative intelligence for advertisers. Analyze your ads, understand what's working, identify what needs improvement, and know what to test next.",
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
