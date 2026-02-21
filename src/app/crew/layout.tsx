import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crew | OpStellar",
  description: "Astronaut profiles — flight history, mission assignments, and crew details.",
  openGraph: {
    title: "Crew | OpStellar",
    description: "Astronaut profiles — flight history, mission assignments, and crew details.",
    images: ["/brand/opstellar-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crew | OpStellar",
    description: "Astronaut profiles, flight history, and mission assignments.",
    images: ["/brand/opstellar-og.png"],
  },
};

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
