import { Metadata } from "next";
import MissionDetailPage from "./client-page";
import launchesData from "../../../../public/data/launches.json";

interface Launch { id: string; name: string; details?: string; links?: { patch?: { small?: string; large?: string } } }

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const launches = launchesData as unknown as Launch[];
  const launch = launches.find((l) => String(l.id) === params.id);
  const title = launch ? `${launch.name} | ElonAgents` : `Mission ${params.id} | ElonAgents`;
  const description = launch?.details || `Mission ${launch?.name || params.id} details — launch data, trajectory, and status on ElonAgents.`;
  const image = launch?.links?.patch?.large || launch?.links?.patch?.small;
  return {
    title,
    description,
    openGraph: { title, description, ...(image ? { images: [{ url: image, width: 512, height: 512, alt: launch?.name }] } : { images: ["/brand/elonagents-og-1200x630@4x.png"] }) },
    twitter: { card: "summary_large_image", title, description, images: [image || "/brand/elonagents-twitter-1500x500@4x.png"] },
  };
}

export default function Page() {
  return <MissionDetailPage />;
}
