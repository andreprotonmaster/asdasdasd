import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Starlink | SpaceClawd",
  description: "Track the Starlink constellation — deployments, coverage, and network stats updated live.",
  openGraph: {
    title: "Starlink | SpaceClawd",
    description: "Track the Starlink constellation — deployments, coverage, and network stats.",
    images: ["/brand/spaceclawd-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starlink | SpaceClawd",
    description: "Live Starlink satellite tracking — deployments, coverage, and statistics.",
    images: ["/brand/spaceclawd-og.png"],
  },
};

export default function StarlinkLayout({ children }: { children: React.ReactNode }) {
  return children;
}
