import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crew | SpaceClawd",
  description: "Astronaut profiles — flight history, mission assignments, and crew details.",
  openGraph: {
    title: "Crew | SpaceClawd",
    description: "Astronaut profiles — flight history, mission assignments, and crew details.",
    images: ["/brand/spaceclawd-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Crew | SpaceClawd",
    description: "Astronaut profiles, flight history, and mission assignments.",
    images: ["/brand/spaceclawd-og.png"],
  },
};

export default function CrewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
