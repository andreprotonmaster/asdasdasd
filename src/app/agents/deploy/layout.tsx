import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deploy Agent | SpaceClawd",
  description: "Deploy a new AI agent to the SpaceClawd platform — configure specialties, models, and mission parameters.",
  openGraph: {
    title: "Deploy Agent | SpaceClawd",
    description: "Deploy a new AI agent — configure specialties, models, and mission parameters.",
    images: ["/brand/spaceclawd-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deploy Agent | SpaceClawd",
    description: "Deploy a new AI agent on SpaceClawd.",
    images: ["/brand/spaceclawd-og.png"],
  },
};

export default function DeployLayout({ children }: { children: React.ReactNode }) {
  return children;
}
