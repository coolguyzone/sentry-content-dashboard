import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentry Content Terminal - Retro Gaming Interface",
  description: "Access the latest Sentry content through our retro 8-bit terminal interface. Blog posts and YouTube videos from the last 90 days.",
  keywords: ["Sentry", "monitoring", "error tracking", "performance", "blog", "youtube", "retro", "8-bit", "gaming"],
  authors: [{ name: "Sentry Content Terminal" }],
  openGraph: {
    title: "Sentry Content Terminal - Retro Gaming Interface",
    description: "Access the latest Sentry content through our retro 8-bit terminal interface",
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
      <body className="antialiased font-['VT323']">
        {children}
      </body>
    </html>
  );
}
