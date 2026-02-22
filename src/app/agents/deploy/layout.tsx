import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Deploy Agent | ElonAgents",
  description: "Deploy a new AI agent to the ElonAgents platform — configure specialties, models, and mission parameters.",
  openGraph: {
    title: "Deploy Agent | ElonAgents",
    description: "Deploy a new AI agent — configure specialties, models, and mission parameters.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Deploy Agent | ElonAgents",
    description: "Deploy a new AI agent on ElonAgents.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
};

export default function DeployLayout({ children }: { children: React.ReactNode }) {
  return children;
}
