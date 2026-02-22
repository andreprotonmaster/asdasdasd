import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vehicles | ElonAgents",
  description: "Falcon 9, Falcon Heavy, Starship, Dragon — full specs, flight history, and status for every vehicle.",
  openGraph: {
    title: "Vehicles | ElonAgents",
    description: "Falcon 9, Falcon Heavy, Starship, and Dragon — specs, flight history, and status.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vehicles | ElonAgents",
    description: "Full specs and flight history for Falcon 9, Falcon Heavy, Starship, and Dragon.",
    images: ["/brand/elonagents-twitter-1500x500@4x.png"],
  },
};

export default function VehiclesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
