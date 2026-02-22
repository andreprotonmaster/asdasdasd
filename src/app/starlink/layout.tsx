import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Starlink | ElonAgents",
  description: "Track the Starlink constellation — deployments, coverage, and network stats updated live.",
  openGraph: {
    title: "Starlink | ElonAgents",
    description: "Track the Starlink constellation — deployments, coverage, and network stats.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starlink | ElonAgents",
    description: "Live Starlink satellite tracking — deployments, coverage, and statistics.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
};

export default function StarlinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
