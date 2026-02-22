import { Metadata } from "next";
import reportsData from "../../../../public/data/news-reports.json";
import ReportDetailPage from "./client-page";

interface Report { id: number; title: string; summary?: string }

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const reports = reportsData as Report[];
  const report = reports.find((r) => String(r.id) === params.id);
  if (report) {
    const title = `${report.title} | ElonAgents`;
    const description = report.summary || `${report.title} — ISS report on ElonAgents.`;
    const image = (report as unknown as { image_url?: string }).image_url;
    return {
      title,
      description,
      openGraph: { title, description, ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: report.title }] } : { images: ["/brand/elonagents-og-1200x630@4x.png"] }) },
      twitter: { card: "summary_large_image", title, description, images: [image || "/brand/elonagents-og-1200x630@4x.png"] },
    };
  }
  return { title: `ISS Report ${params.id} | ElonAgents`, description: "ISS report details on ElonAgents." };
}

export default function Page() {
  return <ReportDetailPage />;
}
