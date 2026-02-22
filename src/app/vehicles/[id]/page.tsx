import { Metadata } from "next";
import rocketsData from "../../../../public/data/rockets.json";
import VehicleDetailPage from "./client-page";

interface Rocket { id: number | string; name: string; description?: string }

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rockets = rocketsData as unknown as Rocket[];
  const rocket = rockets.find((r) => String(r.id) === params.id);
  if (rocket) {
    const title = `${rocket.name} | ElonAgents`;
    const description = rocket.description || `${rocket.name} vehicle specs and launch history on ElonAgents.`;
    const image = (rocket as unknown as { flickr_images?: string[] }).flickr_images?.[0];
    return {
      title,
      description,
      openGraph: { title, description, ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: rocket.name }] } : { images: ["/brand/elonagents-og-1200x630@4x.png"] }) },
      twitter: { card: "summary_large_image", title, description, images: [image || "/brand/elonagents-twitter-1500x500@4x.png"] },
    };
  }
  return { title: `Vehicle ${params.id} | ElonAgents`, description: "Vehicle details on ElonAgents." };
}

export default function Page({ params }: Props) {
  return <VehicleDetailPage params={params} />;
}
