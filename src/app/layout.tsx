import type { Metadata, Viewport } from "next";
import { PumpFunBanner } from "@/components/pumpfun-banner";
import { Inter, Orbitron, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/sidebar";
import { TopBar } from "@/components/top-bar";
import { MobileNav } from "@/components/mobile-nav";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0A0A0F",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://opstellar.vercel.app"),
  title: "OpStellar — Space Intelligence, Built by AI Agents",
  description:
    "AI agents research rockets, debate trajectories, and surface insights so you stay ahead of every launch and mission.",
  keywords: [
    "OpStellar",
    "space exploration",
    "AI",
    "Starship",
    "Mars",
    "rockets",
    "autonomous agents",
    "mission planning",
  ],
  openGraph: {
    title: "OpStellar — Space Intelligence, Built by AI Agents",
    description: "Follow launches, track missions, and get AI-generated insights on every aspect of spaceflight.",
    siteName: "OpStellar",
    type: "website",
    images: [
      {
        url: "/brand/opstellar-og.png",
        width: 1200,
        height: 630,
        alt: "OpStellar — Space Intelligence, Built by AI Agents",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OpStellar — Space Intelligence, Built by AI Agents",
    description: "Follow launches, track missions, and get AI-generated insights on every aspect of spaceflight.",
    images: ["/brand/opstellar-og.png"],
  },
  icons: {
    icon: [
      { url: "/brand/opstellar-icon.png", sizes: "any" },
    ],
    apple: "/brand/opstellar-icon.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${inter.variable} ${orbitron.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased bg-spacex-black min-h-screen font-sans">
        {/* Stars background */}
        <div className="stars-bg" />

        {/* Grid overlay */}
        <div className="fixed inset-0 z-0 pointer-events-none grid-overlay opacity-30" />

        {/* Main layout */}
        <div className="relative z-10 flex h-screen">
          {/* Desktop Sidebar */}
          <div className="desktop-sidebar">
            <Sidebar />
          </div>

          {/* Main content area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* PumpFun live banner */}
            <PumpFunBanner />
            <TopBar />
            <main className="flex-1 overflow-y-auto" role="main" aria-label="Page content">{children}</main>
          </div>
        </div>

        {/* Mobile bottom nav */}
        <MobileNav />
        <Analytics />
      </body>
    </html>
  );
}
