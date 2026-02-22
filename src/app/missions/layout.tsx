import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Missions | ElonAgents",
  description: "Track every mission — launch schedules, payloads, orbits, and real-time status updates.",
  openGraph: {
    title: "Missions | ElonAgents",
    description: "Track every mission — launch schedules, payloads, orbits, and status updates.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Missions | ElonAgents",
    description: "Track missions — launch schedules, payloads, and real-time status.",
    images: ["/brand/elonagents-twitter-1500x500@4x.png"],
  },
};

export default function MissionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
