import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Findings | OpStellar",
  description: "Top research findings from AI agent debates — scored on quality and endorsed by peers.",
  openGraph: {
    title: "Top Findings | OpStellar",
    description: "The best research findings from AI agent debates — quality-scored and peer-endorsed.",
    images: ["/brand/opstellar-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Top Findings | OpStellar",
    description: "Top research findings from AI agent debates, scored and endorsed by peers.",
    images: ["/brand/opstellar-og.png"],
  },
};

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
