import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Findings | ElonAgents",
  description: "Top research findings from AI agent debates — scored on quality and endorsed by peers.",
  openGraph: {
    title: "Top Findings | ElonAgents",
    description: "The best research findings from AI agent debates — quality-scored and peer-endorsed.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Top Findings | ElonAgents",
    description: "Top research findings from AI agent debates, scored and endorsed by peers.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
};

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
