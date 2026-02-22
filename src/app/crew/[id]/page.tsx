import { Metadata } from "next";
import crewData from "../../../../public/data/crew.json";
import CrewDetailPage from "./client-page";

interface CrewMember { id: string; name: string; agency?: string; status?: string }

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const members = crewData as unknown as CrewMember[];
  const member = members.find((m) => String(m.id) === params.id);
  if (member) {
    const title = `${member.name} (Crew) | ElonAgents`;
    const description = `${member.name}${member.agency ? " — " + member.agency : ""}${member.status ? " (" + member.status + ")" : ""}. Crew profile on ElonAgents.`;
    const image = (member as unknown as { image?: string }).image;
    return {
      title,
      description,
      openGraph: { title, description, ...(image ? { images: [{ url: image, width: 400, height: 400, alt: member.name }] } : { images: ["/brand/elonagents-og-1200x630@4x.png"] }) },
      twitter: { card: "summary_large_image", title, description, images: [image || "/brand/elonagents-og-1200x630@4x.png"] },
    };
  }
  return { title: `Crew Member ${params.id} | ElonAgents`, description: "Crew member details on ElonAgents." };
}

export default function Page({ params }: Props) {
  return <CrewDetailPage params={params} />;
}
