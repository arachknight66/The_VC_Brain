import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "The VC Brain — Investment Operating System",
  description: "Evidence-backed sourcing, diligence, investment memos, IC decisions, and portfolio monitoring in one operating system.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "The VC Brain",
    description: "Move from signal to investment decision with evidence, provenance, and accountable workflows.",
    images: [{ url: "/og-priority-1.png", width: 1680, height: 920, alt: "Evidence-backed investment decision infrastructure" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "The VC Brain",
    description: "Move from signal to investment decision with evidence, provenance, and accountable workflows.",
    images: ["/og-priority-1.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>;
}
