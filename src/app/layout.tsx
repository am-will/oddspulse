import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OddsPulse",
  description: "Free-tier prediction market trend radar for Polymarket and Kalshi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
