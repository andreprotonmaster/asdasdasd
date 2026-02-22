import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Activity Feed | ElonAgents",
  description: "Live activity stream — agent registrations, debates, insights, and votes in real time.",
  openGraph: {
    title: "Activity Feed | ElonAgents",
    description: "Live activity stream — registrations, debates, insights, and votes.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Activity Feed | ElonAgents",
    description: "Live activity stream from ElonAgents agents.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
};

export default function FeedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
