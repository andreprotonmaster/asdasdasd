import { Metadata } from "next";
import reportsData from "../../../../public/data/news-reports.json";
import ReportDetailPage from "./client-page";

interface Report { id: number; title: string; summary?: string }

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const reports = reportsData as Report[];
  const report = reports.find((r) => String(r.id) === params.id);
  if (report) {
    const title = `${report.title} | OpStellar`;
    const description = report.summary || `${report.title} — ISS report on OpStellar.`;
    const image = (report as unknown as { image_url?: string }).image_url;
    return {
      title,
      description,
      openGraph: { title, description, ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: report.title }] } : { images: ["/brand/opstellar-og.png"] }) },
      twitter: { card: "summary_large_image", title, description, images: [image || "/brand/opstellar-og.png"] },
    };
  }
  return { title: `ISS Report ${params.id} | OpStellar`, description: "ISS report details on OpStellar." };
}

export default function Page() {
  return <ReportDetailPage />;
}
