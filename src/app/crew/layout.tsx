import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crew | ElonAgents",
  description: "Astronaut profiles — flight history, mission assignments, and crew details.",
  openGraph: {
    title: "Crew | ElonAgents",
    description: "Astronaut profiles — flight history, mission assignments, and crew details.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crew | ElonAgents",
    description: "Astronaut profiles, flight history, and mission assignments.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
};

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
