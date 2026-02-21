import { Metadata } from "next";
import dashboardData from "../../../../public/data/ll2-starship-dashboard.json";
import StarshipFlightDetailPage from "./client-page";

interface DashboardFlight {
  id: string;
  name?: string;
  mission?: { name?: string; description?: string };
}

interface DashboardData {
  results?: DashboardFlight[];
}

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = dashboardData as DashboardData;
  const flights: DashboardFlight[] = data.results || [];
  const flight = flights.find((f) => String(f.id) === params.id);
  if (flight) {
    const name = flight.name || flight.mission?.name || "Flight " + params.id;
    const title = `${name} | OpStellar`;
    const description = flight.mission?.description || `Starship flight ${name} details on OpStellar.`;
    const image = (flight as unknown as { image?: { image_url?: string } }).image?.image_url;
    return {
      title,
      description,
      openGraph: { title, description, ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: name }] } : { images: ["/brand/opstellar-og.png"] }) },
      twitter: { card: "summary_large_image", title, description, images: [image || "/brand/opstellar-og.png"] },
    };
  }
  return { title: `Starship Flight ${params.id} | OpStellar`, description: "Starship flight details on OpStellar." };
}

export default function Page({ params }: Props) {
  return <StarshipFlightDetailPage params={params} />;
}
