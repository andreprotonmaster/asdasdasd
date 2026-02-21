import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Starlink | OpStellar",
  description: "Track the Starlink constellation — deployments, coverage, and network stats updated live.",
  openGraph: {
    title: "Starlink | OpStellar",
    description: "Track the Starlink constellation — deployments, coverage, and network stats.",
    images: ["/brand/opstellar-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starlink | OpStellar",
    description: "Live Starlink satellite tracking — deployments, coverage, and statistics.",
    images: ["/brand/opstellar-og.png"],
  },
};

export default function StarlinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
