import type { Metadata } from "next";
import { Aleo, Inter, Azeret_Mono, DM_Mono } from "next/font/google";
import "./globals.css";

const aleo = Aleo({ variable: "--font-aleo", subsets: ["latin"], weight: ["300", "400"] });
const inter = Inter({ variable: "--font-inter", subsets: ["latin", "latin-ext"] });
const azeret = Azeret_Mono({ variable: "--font-azeret", subsets: ["latin"], weight: ["400", "500"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://thisness.dev"),
  title: { default: "Thisness: identity resolution for imperfect observations", template: "%s · Thisness" },
  description:
    "Thisness decides which records refer to the same thing, and keeps the evidence, the decision and the history behind every conclusion. Open source, Apache-2.0.",
  openGraph: { siteName: "Thisness", type: "website" },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${aleo.variable} ${inter.variable} ${azeret.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
