import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import TimeTravelWrapper from "@/components/debug/TimeTravelWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RIVEGO - T&M Group | Digital Solutions",
  description: "RIVEGO T&M Group - Votre partenaire digital au Luxembourg. FoodOrder, WebVision, OnlinePrint, Extra-Ace. Solutions web, commande en ligne, impression et plus.",
  keywords: "Luxembourg, digital, web development, food ordering, print, detailing",
  authors: [{ name: "RIVEGO T&M Group" }],
  openGraph: {
    title: "RIVEGO - T&M Group",
    description: "Votre partenaire digital au Luxembourg",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1A3A5C" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="RIVEGO" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <div className="fixed bottom-4 right-4 z-50">
          {/* Dynamic Import to avoid SSR issues if cookies used in render (though we handled it) */}
        </div>
        <TimeTravelWrapper />
      </body>
    </html>
  );
}
