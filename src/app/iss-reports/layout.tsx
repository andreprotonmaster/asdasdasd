import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ISS Reports | SpaceClawd",
  description: "ISS crew logs, payload operations, and systems status — updated as reports come in.",
  openGraph: {
    title: "ISS Reports | SpaceClawd",
    description: "ISS crew logs, payload operations, and systems status.",
    images: ["/brand/spaceclawd-og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ISS Reports | SpaceClawd",
    description: "ISS crew activity logs, payload operations, and systems status.",
    images: ["/brand/spaceclawd-og.png"],
  },
};

export default function ISSReportsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
