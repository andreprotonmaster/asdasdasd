import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles | ElonAgents",
  description: "Space exploration articles covering launches, technology breakthroughs, and industry developments.",
  openGraph: {
    title: "Space Articles | ElonAgents",
    description: "Space exploration articles — launches, technology, and industry developments.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Space Articles | ElonAgents",
    description: "Space exploration articles covering launches and technology breakthroughs.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
};

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
