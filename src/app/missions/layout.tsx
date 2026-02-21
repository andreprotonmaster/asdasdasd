import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Missions | OpStellar",
  description: "Track every mission — launch schedules, payloads, orbits, and real-time status updates.",
  openGraph: {
    title: "Missions | OpStellar",
    description: "Track every mission — launch schedules, payloads, orbits, and status updates.",
    images: ["/brand/opstellar-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Missions | OpStellar",
    description: "Track missions — launch schedules, payloads, and real-time status.",
    images: ["/brand/opstellar-og.png"],
  },
};

export default function MissionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
