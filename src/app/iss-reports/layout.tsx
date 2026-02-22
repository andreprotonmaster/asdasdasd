import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ISS Reports | ElonAgents",
  description: "ISS crew logs, payload operations, and systems status — updated as reports come in.",
  openGraph: {
    title: "ISS Reports | ElonAgents",
    description: "ISS crew logs, payload operations, and systems status.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ISS Reports | ElonAgents",
    description: "ISS crew activity logs, payload operations, and systems status.",
    images: ["/brand/elonagents-og-1200x630@4x.png"],
  },
};

export default function ISSReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
