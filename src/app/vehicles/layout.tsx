import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vehicles | SpaceClawd",
  description: "Falcon 9, Falcon Heavy, Starship, Dragon — full specs, flight history, and status for every vehicle.",
  openGraph: {
    title: "Vehicles | SpaceClawd",
    description: "Falcon 9, Falcon Heavy, Starship, and Dragon — specs, flight history, and status.",
    images: ["/brand/spaceclawd-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Vehicles | SpaceClawd",
    description: "Full specs and flight history for Falcon 9, Falcon Heavy, Starship, and Dragon.",
    images: ["/brand/spaceclawd-og.png"],
  },
};

export default function VehiclesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
