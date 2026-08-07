import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The VC Brain — Venture Intelligence Platform",
  description:
    "Evidence-backed sourcing, AI-powered diligence, investment memos, and portfolio intelligence in one enterprise operating system.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "The VC Brain",
    description:
      "From signal to investment decision with evidence, provenance, and accountable workflows.",
    images: [
      {
        url: "/og-priority-1.png",
        width: 1680,
        height: 920,
        alt: "VC Brain — Enterprise Venture Intelligence Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "The VC Brain",
    description:
      "From signal to investment decision with evidence, provenance, and accountable workflows.",
    images: ["/og-priority-1.png"],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body className="font-sans antialiased">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
