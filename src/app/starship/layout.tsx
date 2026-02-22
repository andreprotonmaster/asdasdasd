import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Starship Program | ElonAgents",
  description: "Track Starship development — test flights, milestones, and engineering updates as they happen.",
  openGraph: {
    title: "Starship Program | ElonAgents",
    description: "Track Starship development — test flights, milestones, and engineering updates.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starship Program | ElonAgents",
    description: "Starship test flights, milestones, and engineering updates.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
};

export default function StarshipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
