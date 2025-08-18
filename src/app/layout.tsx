import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentry Content Aggregator",
  description: "Latest content from Sentry blog and YouTube channel from the last 90 days",
  keywords: ["Sentry", "monitoring", "error tracking", "performance", "blog", "youtube"],
  authors: [{ name: "Sentry Content Aggregator" }],
  openGraph: {
    title: "Sentry Content Aggregator",
    description: "Latest content from Sentry blog and YouTube channel from the last 90 days",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
