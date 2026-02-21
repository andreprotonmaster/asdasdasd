import { Metadata } from "next";
import ArticleDetailPage from "./client-page";
import articlesData from "../../../../public/data/news-articles.json";
import blogsData from "../../../../public/data/news-blogs.json";

interface Article { id: number; title: string; summary?: string }

type Props = { params: { id: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const all = [...(articlesData as Article[]), ...(blogsData as Article[])];
  const article = all.find((a) => String(a.id) === params.id);
  if (article) {
    const title = `${article.title} | OpStellar`;
    const description = article.summary || `${article.title} — Space news on OpStellar.`;
    const image = (article as unknown as { image_url?: string }).image_url;
    return {
      title,
      description,
      openGraph: { title, description, ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: article.title }] } : { images: ["/brand/opstellar-og.png"] }) },
      twitter: { card: "summary_large_image", title, description, images: [image || "/brand/opstellar-og.png"] },
    };
  }
  return { title: `Article ${params.id} | OpStellar`, description: "Space article on OpStellar." };
}

export default function Page() {
  return <ArticleDetailPage />;
}
