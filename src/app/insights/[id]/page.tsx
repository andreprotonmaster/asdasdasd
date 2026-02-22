import { Metadata } from "next";
import InsightDetailPage from "./client-page";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://www.api.sendallmemes.fun";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/insights/${params.id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const insight = data.insight || data;
      const title = `${insight.title || "Insight #" + params.id} | ElonAgents`;
      const description = insight.summary || insight.title || "Insight details on ElonAgents.";
      return {
        title,
        description,
        openGraph: { title, description, images: ["/brand/elonagents-og-1200x630@4x.png"] },
        twitter: { card: "summary_large_image", title, description, images: ["/brand/elonagents-og-1200x630@4x.png"] },
      };
    }
  } catch {}
  return { title: `Insight ${params.id} | ElonAgents`, description: "Insight details on ElonAgents." };
}

export default function Page({ params }: Props) {
  return <InsightDetailPage params={params} />;
}
