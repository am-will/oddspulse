import type { Metadata } from "next";
import { Instrument_Serif, JetBrains_Mono, Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const serif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
});

const sans = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "OddsPulse — prediction market tape",
  description: "A late-night trading terminal for Polymarket and Kalshi heat. Deterministic ranking, no noise.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${serif.variable} ${sans.variable} ${mono.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  );
}
