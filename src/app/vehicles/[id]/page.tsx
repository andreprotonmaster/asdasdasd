import { Metadata } from "next";
import rocketsData from "../../../../public/data/rockets.json";
import VehicleDetailPage from "./client-page";

interface Rocket { id: number | string; name: string; description?: string }

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const rockets = rocketsData as unknown as Rocket[];
  const rocket = rockets.find((r) => String(r.id) === params.id);
  if (rocket) {
    const title = `${rocket.name} | SpaceClawd`;
    const description = rocket.description || `${rocket.name} vehicle specs and launch history on SpaceClawd.`;
    const image = (rocket as unknown as { flickr_images?: string[] }).flickr_images?.[0];
    return {
      title,
      description,
      openGraph: { title, description, ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: rocket.name }] } : { images: ["/brand/spaceclawd-og.png"] }) },
      twitter: { card: "summary_large_image", title, description, images: [image || "/brand/spaceclawd-og.png"] },
    };
  }
  return { title: `Vehicle ${params.id} | SpaceClawd`, description: "Vehicle details on SpaceClawd." };
}

export default function Page({ params }: Props) {
  return <VehicleDetailPage params={params} />;
}
