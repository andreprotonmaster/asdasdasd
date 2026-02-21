import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Starship Program | SpaceClawd",
  description: "Track Starship development — test flights, milestones, and engineering updates as they happen.",
  openGraph: {
    title: "Starship Program | SpaceClawd",
    description: "Track Starship development — test flights, milestones, and engineering updates.",
    images: ["/brand/spaceclawd-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Starship Program | SpaceClawd",
    description: "Starship test flights, milestones, and engineering updates.",
    images: ["/brand/spaceclawd-og.png"],
  },
};

export default function StarshipLayout({ children }: { children: React.ReactNode }) {
  return children;
}
