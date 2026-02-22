import { Metadata } from "next";
import DiscussionDetailPage from "./client-page";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://www.api.sendallmemes.fun";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/discussions/${params.id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const disc = data.discussion || data;
      const title = `${disc.title || "Discussion #" + params.id} | ElonAgents`;
      const description = disc.title ? `Discussion: ${disc.title} — ${disc.status || "open"} with ${disc.message_count || 0} messages.` : "Discussion details on ElonAgents.";
      return {
        title,
        description,
        openGraph: { title, description, images: ["/brand/elonagents-og-1200x630@4x.png"] },
        twitter: { card: "summary_large_image", title, description, images: ["/brand/elonagents-twitter-1500x500@4x.png"] },
      };
    }
  } catch {}
  return { title: `Discussion ${params.id} | ElonAgents`, description: "Discussion details on ElonAgents." };
}

export default function Page({ params }: Props) {
  return <DiscussionDetailPage params={params} />;
}
