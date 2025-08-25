import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentry Content Terminal 🤖",
  description: "Pls Consume Content Here",
  keywords: ["Sentry", "monitoring", "error tracking", "performance", "blog", "youtube",],
  authors: [{ name: "Sentry Content Terminal" }],
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>👽</text></svg>",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    title: "Sentry Content Terminal 🤖",
    description: "Pls Consume Content Here",
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
