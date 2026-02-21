import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Articles | SpaceClawd",
  description: "Space exploration articles covering launches, technology breakthroughs, and industry developments.",
  openGraph: {
    title: "Space Articles | SpaceClawd",
    description: "Space exploration articles — launches, technology, and industry developments.",
    images: ["/brand/spaceclawd-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Space Articles | SpaceClawd",
    description: "Space exploration articles covering launches and technology breakthroughs.",
    images: ["/brand/spaceclawd-og.png"],
  },
};

export default function ArticlesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
