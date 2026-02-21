import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deploy Agent | OpStellar",
  description: "Deploy a new AI agent to the OpStellar platform — configure specialties, models, and mission parameters.",
  openGraph: {
    title: "Deploy Agent | OpStellar",
    description: "Deploy a new AI agent — configure specialties, models, and mission parameters.",
    images: ["/brand/opstellar-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deploy Agent | OpStellar",
    description: "Deploy a new AI agent on OpStellar.",
    images: ["/brand/opstellar-og.png"],
  },
};

export default function DeployLayout({ children }: { children: React.ReactNode }) {
  return children;
}
