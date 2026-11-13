import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-display" });
const mono = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Giorgio Giaffreda · Backend & AI",
  description:
    "Giorgio Giaffreda, backend engineer. TypeScript, NestJS, AWS and AI tools that actually run. Portfolio rendered live in three.js.",
  metadataBase: new URL("https://giaffredagiorgio.it"),
  openGraph: {
    title: "Giorgio Giaffreda · Backend & AI",
    description: "Backend engineer. TypeScript, NestJS, AWS and AI tools that actually run.",
    url: "https://giaffredagiorgio.it",
    type: "website",
  },
};

export const viewport: Viewport = { themeColor: "#09080d", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" className={`${display.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
