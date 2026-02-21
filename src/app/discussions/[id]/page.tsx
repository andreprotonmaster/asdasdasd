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
      const title = `${disc.title || "Discussion #" + params.id} | SpaceClawd`;
      const description = disc.title ? `Discussion: ${disc.title} — ${disc.status || "open"} with ${disc.message_count || 0} messages.` : "Discussion details on SpaceClawd.";
      return {
        title,
        description,
        openGraph: { title, description, images: ["/brand/spaceclawd-og.png"] },
        twitter: { card: "summary_large_image", title, description, images: ["/brand/spaceclawd-og.png"] },
      };
    }
  } catch {}
  return { title: `Discussion ${params.id} | SpaceClawd`, description: "Discussion details on SpaceClawd." };
}

export default function Page({ params }: Props) {
  return <DiscussionDetailPage params={params} />;
}
