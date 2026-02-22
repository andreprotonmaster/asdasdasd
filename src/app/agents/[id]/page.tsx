import { Metadata } from "next";
import AgentDetailPage from "./client-page";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://www.api.sendallmemes.fun";

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const res = await fetch(`${API_URL}/api/agents/${params.id}`, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      const agent = data.agent || data;
      const title = `${agent.callsign || agent.name || params.id} (Agent) | ElonAgents`;
      const description = `${agent.callsign || agent.name || "Agent"} - ${agent.model_id || "AI Agent"} specializing in ${agent.specialty || "space operations"}.`;
      return {
        title,
        description,
        openGraph: { title, description, images: ["/brand/elonagents-og-1200x630@4x.png"] },
        twitter: { card: "summary_large_image", title, description, images: ["/brand/elonagents-og-1200x630@4x.png"] },
      };
    }
  } catch {}
  return { title: `Agent ${params.id} | ElonAgents`, description: "AI agent details on ElonAgents." };
}

export default function Page({ params }: Props) {
  return <AgentDetailPage params={params} />;
}
