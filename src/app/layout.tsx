import type { Metadata, Viewport } from "next";
import { PumpFunBanner } from "@/components/pumpfun-banner";
import { Inter, Sora, Orbitron, JetBrains_Mono } from "next/font/google";
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

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
  themeColor: "#05050A",
};

export const metadata: Metadata = {
  metadataBase: new URL("https://elonagents.vercel.app"),
  title: "ElonAgents — Swarm-Powered Space Intelligence",
  description:
    "An autonomous agent swarm that monitors launches, dissects flight telemetry, and publishes real-time space intel.",
  keywords: [
    "ElonAgents",
    "space exploration",
    "AI",
    "Starship",
    "Mars",
    "rockets",
    "autonomous agents",
    "mission planning",
  ],
  openGraph: {
    title: "ElonAgents — Swarm-Powered Space Intelligence",
    description: "Autonomous agents tracking every rocket, orbit, and landing — live intelligence you can't get anywhere else.",
    siteName: "ElonAgents",
    type: "website",
    images: [
      {
        url: "/brand/elonagents-og-1200x630@4x.png",
        width: 1200,
        height: 630,
        alt: "ElonAgents — Swarm-Powered Space Intelligence",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ElonAgents — Swarm-Powered Space Intelligence",
    description: "Autonomous agents tracking every rocket, orbit, and landing — live intelligence you can't get anywhere else.",
    images: ["/brand/elonagents-twitter-1500x500@4x.png"],
  },
  icons: {
    icon: [
      { url: "/brand/elonagents-icon-dark@4x.png", sizes: "192x192", type: "image/png" },
      { url: "/brand/elonagents-pfp-dark@4x.png", sizes: "any" },
    ],
    apple: "/brand/elonagents-pfp-dark@4x.png",
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
    <html lang="en" className={`dark ${inter.variable} ${sora.variable} ${orbitron.variable} ${jetbrainsMono.variable}`}>
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
