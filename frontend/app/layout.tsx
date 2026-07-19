import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The VC Brain — Venture Intelligence",
  description: "AI-first founder sourcing, screening, diligence, and evidence-backed investment memos.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "The VC Brain",
    description: "Find conviction faster.",
    images: [{ url: "/og.png", width: 1792, height: 1024, alt: "The VC Brain venture intelligence dashboard" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The VC Brain",
    description: "Find conviction faster.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
