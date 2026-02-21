"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  AlertTriangle,
  Tag,
  Rocket,
  Star,
  User,
  Globe,
  Newspaper,
  BookOpen,
  FileText,
  Share2,
  ChevronRight,
  ChevronLeft,
  Play,
  CheckCircle2,
  XCircle,
  ArrowUpRight,
  Layers,
  Anchor,
  Target,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

interface ArticleAuthor {
  name: string;
  socials: {
    x: string;
    youtube: string;
    instagram: string;
    linkedin: string;
    mastodon: string;
    bluesky: string;
  } | null;
}

interface ArticleLaunchRef {
  launch_id: string;
  provider: string;
}

interface ArticleEventRef {
  event_id: number;
  provider: string;
}

interface Article {
  id: number;
  title: string;
  authors: ArticleAuthor[];
  url: string;
  image_url: string;
  news_site: string;
  summary: string;
  published_at: string;
  updated_at: string;
  featured: boolean;
  launches: ArticleLaunchRef[];
  events: ArticleEventRef[];
  content?: string | null;
  content_html?: string | null;
  word_count?: number;
}

interface Launch {
  id: string;
  flight_number: number;
  name: string;
  date_utc: string;
  date_local: string;
  success: boolean | null;
  upcoming: boolean;
  details: string | null;
  rocket: string;
  launchpad: string;
  failures: Array<{ time: number; altitude: number | null; reason: string }>;
  links: {
    patch: { small: string | null; large: string | null };
    flickr: { small: string[]; original: string[] };
    webcast: string | null;
    youtube_id: string | null;
    article: string | null;
    wikipedia: string | null;
    reddit: {
      campaign: string | null;
      launch: string | null;
      media: string | null;
      recovery: string | null;
    };
  };
  cores: Array<{
    core: string | null;
    flight: number | null;
    gridfins: boolean;
    legs: boolean;
    reused: boolean;
    landing_attempt: boolean;
    landing_success: boolean | null;
    landing_type: string | null;
    landpad: string | null;
  }>;
  crew: string[];
  payloads: string[];
  capsules: string[];
  ships: string[];
}

interface RocketData {
  id: string;
  name: string;
  type: string;
  description: string;
  height: { meters: number };
  mass: { kg: number };
  first_flight: string;
  success_rate_pct: number;
  flickr_images: string[];
}

interface LaunchpadData {
  id: string;
  name: string;
  full_name: string;
  locality: string;
  region: string;
  latitude: number;
  longitude: number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const SOURCE_COLORS: Record<string, string> = {
  SpaceNews: "text-blue-400 border-blue-400/30 bg-blue-400/10",
  NASASpaceflight: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  "Spaceflight Now": "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
  SpaceX: "text-white border-white/30 bg-white/10",
  NASA: "text-red-400 border-red-400/30 bg-red-400/10",
  Teslarati: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  Arstechnica: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  CNBC: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  Reuters: "text-sky-400 border-sky-400/30 bg-sky-400/10",
  "Space.com": "text-purple-400 border-purple-400/30 bg-purple-400/10",
  "European Spaceflight": "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
  ESA: "text-teal-400 border-teal-400/30 bg-teal-400/10",
};

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function cleanSummary(summary: string): string {
  return summary
    .replace(/\r\n/g, "\n")
    .replace(/The post .+ appeared first on .+\.?$/m, "")
    .replace(/\s+$/, "")
    .trim();
}

/** Build a type-prefixed slug for internal links */
function itemSlug(id: number, type: "article" | "blog" | "report"): string {
  if (type === "blog") return `blog-${id}`;
  if (type === "report") return `report-${id}`;
  return String(id);
}

// ─── Sub-components ─────────────────────────────────────────────────────────

function SidebarMeta({
  icon: Icon,
  label,
  children,
  color = "text-spacex-muted",
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${color}`} />
      <div>
        <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider">
          {label}
        </p>
        <div className="mt-0.5">{children}</div>
      </div>
    </div>
  );
}

function CoverageCard({
  item,
  type,
}: {
  item: Article;
  type: "article" | "blog" | "report";
}) {
  const sc =
    SOURCE_COLORS[item.news_site] ||
    "text-spacex-muted border-spacex-border/30 bg-spacex-dark/40";
  const TypeIcon =
    type === "blog" ? BookOpen : type === "report" ? FileText : Newspaper;

  return (
    <Link
      href={`/articles/${itemSlug(item.id, type)}`}
      className="glass-panel p-3 hover:border-spacex-accent/30 transition-all group block"
    >
      <div className="flex gap-3">
        {item.image_url && (
          <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0 bg-spacex-dark/60">
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              className="object-cover"
              sizes="64px"
              unoptimized
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-white group-hover:text-spacex-accent transition-colors line-clamp-2 leading-snug">
            {item.title}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span
              className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${sc}`}
            >
              {item.news_site}
            </span>
            <span className="text-[9px] font-mono text-spacex-muted">
              {formatShortDate(item.published_at)}
            </span>
            <span className="flex items-center gap-0.5 text-[8px] font-mono text-spacex-muted/60">
              <TypeIcon className="w-2.5 h-2.5" />
              {type}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  // Parse type-prefixed IDs: "blog-123", "report-456", or plain "123"
  const rawId = params.id as string;
  const parsedType: "article" | "blog" | "report" = rawId.startsWith("blog-")
    ? "blog"
    : rawId.startsWith("report-")
    ? "report"
    : "article";
  const articleId = Number(
    rawId.startsWith("blog-")
      ? rawId.slice(5)
      : rawId.startsWith("report-")
      ? rawId.slice(7)
      : rawId
  );

  const [article, setArticle] = useState<Article | null>(null);
  const [articleType, setArticleType] = useState<"article" | "blog" | "report">("article");
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [allBlogs, setAllBlogs] = useState<Article[]>([]);
  const [allReports, setAllReports] = useState<Article[]>([]);
  const [launches, setLaunches] = useState<Launch[]>([]);
  const [rockets, setRockets] = useState<RocketData[]>([]);
  const [launchpads, setLaunchpads] = useState<LaunchpadData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [articlesData, blogsData, reportsData, launchesData, rocketsData, padsData] =
          await Promise.all([
            fetch("/data/news-articles.json").then((r) => r.json()),
            fetch("/data/news-blogs.json").then((r) => r.json()),
            fetch("/data/news-reports.json").then((r) => r.json()),
            fetch("/data/launches.json").then((r) => r.json()),
            fetch("/data/rockets.json").then((r) => r.json()),
            fetch("/data/launchpads.json").then((r) => r.json()),
          ]);
        setAllArticles(articlesData);
        setAllBlogs(blogsData);
        setAllReports(reportsData);
        setLaunches(launchesData);
        setRockets(rocketsData);
        setLaunchpads(padsData);

        const found =
          parsedType === "blog"
            ? blogsData.find((a: Article) => a.id === articleId)
            : parsedType === "report"
            ? reportsData.find((a: Article) => a.id === articleId)
            : articlesData.find((a: Article) => a.id === articleId) ||
              blogsData.find((a: Article) => a.id === articleId) ||
              reportsData.find((a: Article) => a.id === articleId);
        if (!found) {
          setError("Article not found");
        } else {
          // Determine which type this item is
          if (parsedType !== "article") {
            setArticleType(parsedType);
          } else if (articlesData.some((a: Article) => a.id === articleId)) {
            setArticleType("article");
          } else if (blogsData.some((a: Article) => a.id === articleId)) {
            setArticleType("blog");
          } else {
            setArticleType("report");
          }
        }
        setArticle(found || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [articleId, parsedType]);

  // ─── Derived data ──────────────────────────────────────────────────────

  const linkedLaunches = useMemo(() => {
    if (!article) return [];
    const ids = new Set((article.launches ?? []).map((l) => l.launch_id));
    return launches.filter((l) => ids.has(l.id));
  }, [article, launches]);

  const rocketMap = useMemo(() => {
    const m = new Map<string, RocketData>();
    rockets.forEach((r) => m.set(r.id, r));
    return m;
  }, [rockets]);

  const padMap = useMemo(() => {
    const m = new Map<string, LaunchpadData>();
    launchpads.forEach((p) => m.set(p.id, p));
    return m;
  }, [launchpads]);

  const articleLaunchIds = useMemo(() => {
    if (!article) return new Set<string>();
    return new Set((article.launches ?? []).map((l) => l.launch_id));
  }, [article]);

  const allCoverage = useMemo(() => {
    if (!article || articleLaunchIds.size === 0)
      return { articles: [] as Article[], blogs: [] as Article[], reports: [] as Article[] };

    const relArticles = allArticles
      .filter((a) => a.id !== article.id && a.launches?.some((l) => articleLaunchIds.has(l.launch_id)))
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    const relBlogs = allBlogs
      .filter((b) => b.launches?.some((l) => articleLaunchIds.has(l.launch_id)))
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    const relReports = allReports
      .filter((r) => r.launches?.some((l) => articleLaunchIds.has(l.launch_id)))
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return { articles: relArticles, blogs: relBlogs, reports: relReports };
  }, [article, articleLaunchIds, allArticles, allBlogs, allReports]);

  const totalCoverage = allCoverage.articles.length + allCoverage.blogs.length + allCoverage.reports.length;

  // Pool of items of the same type for prev/next and related
  const sameTypePool = useMemo(() => {
    if (articleType === "blog") return allBlogs;
    if (articleType === "report") return allReports;
    return allArticles;
  }, [articleType, allArticles, allBlogs, allReports]);

  const relatedByContext = useMemo(() => {
    if (!article || articleLaunchIds.size > 0) return [];
    return sameTypePool
      .filter((a) => {
        if (a.id === article.id) return false;
        const timeDiff = Math.abs(new Date(a.published_at).getTime() - new Date(article.published_at).getTime());
        if (a.news_site === article.news_site && timeDiff < 7 * 24 * 60 * 60 * 1000) return true;
        return timeDiff < 2 * 24 * 60 * 60 * 1000;
      })
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, 6);
  }, [article, articleLaunchIds, sameTypePool]);

  const moreFromSource = useMemo(() => {
    if (!article) return [];
    return sameTypePool
      .filter((a) => a.id !== article.id && a.news_site === article.news_site)
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, 6);
  }, [article, sameTypePool]);

  const { prevArticle, nextArticle } = useMemo(() => {
    if (!article || sameTypePool.length === 0) return { prevArticle: null, nextArticle: null };
    const sorted = [...sameTypePool]
      .filter((a) => a.published_at && !a.published_at.startsWith("1970"))
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    const idx = sorted.findIndex((a) => a.id === article.id);
    return {
      prevArticle: idx > 0 ? sorted[idx - 1] : null,
      nextArticle: idx < sorted.length - 1 ? sorted[idx + 1] : null,
    };
  }, [article, allArticles]);

  const flickrImages = useMemo(() => {
    const imgs: string[] = [];
    linkedLaunches.forEach((l) => {
      if (l.links?.flickr?.original) imgs.push(...l.links.flickr.original);
      if (l.links?.flickr?.small) imgs.push(...l.links.flickr.small);
    });
    return Array.from(new Set(imgs));
  }, [linkedLaunches]);

  // ─── Loading / Error ───────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-spacex-accent animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-spacex-muted">Loading article intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-spacex-danger mx-auto mb-4" />
          <p className="text-sm font-mono text-spacex-danger mb-2">{error || "Article not found"}</p>
          <button
            onClick={() => router.push("/articles")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-spacex-accent/10 border border-spacex-accent/30 text-xs font-mono text-spacex-accent hover:bg-spacex-accent/20 transition-all mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK TO ARTICLES
          </button>
        </div>
      </div>
    );
  }

  const sourceClass = SOURCE_COLORS[article.news_site] || "text-spacex-muted border-spacex-border/30 bg-spacex-dark/40";
  const hasFullContent = !!(article.content && article.content.length > 50);
  const displayText = hasFullContent ? article.content! : cleanSummary(article.summary);
  const paragraphs = displayText.split(/\n{2,}|(?<=\. )(?=[A-Z])/).map((p) => p.trim()).filter((p) => p.length > 30);
  if (paragraphs.length === 0 && displayText) paragraphs.push(displayText);
  const hasLaunchData = linkedLaunches.length > 0;
  const wordCount = article.word_count || displayText.split(/\s+/).length;

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxImg(null)}
        >
          <Image src={lightboxImg} alt="Full size" width={1200} height={800} sizes="100vw" className="max-w-full max-h-full object-contain rounded-lg" unoptimized />
          <button className="absolute top-4 right-4 text-white/70 hover:text-white text-sm font-mono">ESC / CLICK TO CLOSE</button>
        </div>
      )}

      {/* Back nav + prev/next */}
      <div className="flex items-center gap-2 flex-wrap">
        <button onClick={() => router.push("/articles")} className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel text-xs font-mono text-spacex-muted hover:text-white hover:border-spacex-accent/30 transition-all">
          <ArrowLeft className="w-3.5 h-3.5" />
          ARTICLES
        </button>
        <ChevronRight className="w-3 h-3 text-spacex-muted/40" />
        {articleType !== "article" && (
          <>
            <span className={`text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
              articleType === "blog"
                ? "text-purple-400 border-purple-400/30 bg-purple-400/10"
                : "text-amber-400 border-amber-400/30 bg-amber-400/10"
            }`}>
              {articleType}
            </span>
            <ChevronRight className="w-3 h-3 text-spacex-muted/40" />
          </>
        )}
        <span className="text-[10px] font-mono text-spacex-muted truncate max-w-[150px] sm:max-w-xs">{article.title}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {prevArticle && (
            <Link href={`/articles/${itemSlug(prevArticle.id, articleType)}`} className="flex items-center gap-1 px-2 py-1 rounded glass-panel text-[9px] font-mono text-spacex-muted hover:text-white transition-all" title={prevArticle.title}>
              <ChevronLeft className="w-3 h-3" />
              NEWER
            </Link>
          )}
          {nextArticle && (
            <Link href={`/articles/${itemSlug(nextArticle.id, articleType)}`} className="flex items-center gap-1 px-2 py-1 rounded glass-panel text-[9px] font-mono text-spacex-accent hover:text-white transition-all" title={nextArticle.title}>
              OLDER
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* Hero Image */}
      {article.image_url && (
        <div className="relative w-full h-56 sm:h-72 md:h-[420px] rounded-xl overflow-hidden glass-panel hud-corners cursor-pointer" onClick={() => setLightboxImg(article.image_url)}>
          <Image src={article.image_url} alt={article.title} fill className="object-cover" sizes="100vw" priority unoptimized />
          <div className="absolute inset-0 bg-gradient-to-t from-spacex-black via-spacex-black/20 to-transparent" />

          <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${sourceClass}`}>{article.news_site}</span>
            {article.featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider text-spacex-warning border border-spacex-warning/30 bg-spacex-warning/10">
                <Star className="w-3 h-3" />Featured
              </span>
            )}
            {hasLaunchData && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider text-spacex-thrust border border-spacex-thrust/30 bg-spacex-thrust/10">
                <Rocket className="w-3 h-3" />Mission Linked
              </span>
            )}
          </div>

          <div className="absolute top-4 right-4">
            <span className="text-[10px] font-mono text-white/80 bg-black/60 px-2 py-1 rounded">{timeAgo(article.published_at)}</span>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
            <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg">{article.title}</h1>
            <div className="flex items-center gap-4 mt-3 text-xs font-mono text-white/70 flex-wrap">
              <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{formatFullDate(article.published_at)}</span>
              {article.authors.length > 0 && (
                <span className="flex items-center gap-1.5"><User className="w-3 h-3" />{article.authors.map((a) => a.name).join(", ")}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* No-image header */}
      {!article.image_url && (
        <div className="glass-panel p-6 hud-corners">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className={`inline-flex items-center px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider border ${sourceClass}`}>{article.news_site}</span>
            {article.featured && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-semibold uppercase tracking-wider text-spacex-warning border border-spacex-warning/30 bg-spacex-warning/10"><Star className="w-3 h-3" />Featured</span>
            )}
          </div>
          <h1 className="font-display text-xl sm:text-2xl font-bold text-white leading-tight">{article.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-xs font-mono text-spacex-muted">
            <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" />{formatFullDate(article.published_at)}</span>
            {article.authors.length > 0 && (
              <span className="flex items-center gap-1.5"><User className="w-3 h-3" />{article.authors.map((a) => a.name).join(", ")}</span>
            )}
          </div>
        </div>
      )}

      {/* Main content layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Article Content */}
          <div className="glass-panel p-5 sm:p-7 hud-corners">
            {hasFullContent && (
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-spacex-border/20">
                <FileText className="w-3.5 h-3.5 text-spacex-success" />
                <span className="text-[9px] font-mono text-spacex-success uppercase tracking-wider">Full Article &middot; {wordCount.toLocaleString()} words</span>
              </div>
            )}
            {!hasFullContent && (
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-spacex-border/20">
                <AlertTriangle className="w-3.5 h-3.5 text-spacex-warning" />
                <span className="text-[9px] font-mono text-spacex-warning uppercase tracking-wider">Summary Only</span>
              </div>
            )}
            <div className="space-y-5 article-content">
              {paragraphs.map((p, i) => (
                <p key={i} className="text-[15px] text-white/90 leading-[1.85] tracking-[0.01em]">{p}</p>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t border-spacex-border/30 flex flex-wrap gap-3">
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-spacex-accent/10 border border-spacex-accent/30 text-xs font-mono text-spacex-accent hover:bg-spacex-accent/20 transition-all group">
                <ExternalLink className="w-3.5 h-3.5" />
                {hasFullContent ? "VIEW ON" : "READ FULL ARTICLE ON"} {article.news_site.toUpperCase()}
                <ArrowUpRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </a>
              {linkedLaunches[0]?.links?.wikipedia && (
                <a href={linkedLaunches[0].links.wikipedia} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-spacex-border/30 text-xs font-mono text-spacex-muted hover:text-white transition-all">
                  <Globe className="w-3.5 h-3.5" />WIKIPEDIA
                </a>
              )}
            </div>
          </div>

          {/* MISSION BRIEFING */}
          {linkedLaunches.map((launch) => {
            const rocket = rocketMap.get(launch.rocket);
            const pad = padMap.get(launch.launchpad);
            const core = launch.cores?.[0];
            return (
              <div key={launch.id} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-spacex-thrust" />
                  <h2 className="text-xs font-mono font-semibold text-spacex-thrust tracking-wider uppercase">Mission Briefing</h2>
                </div>

                {/* Mission header */}
                <Link href={`/missions/${launch.id}`} className="glass-panel p-5 hud-corners hover:border-spacex-accent/40 transition-all group block">
                  <div className="flex gap-5 items-start">
                    <div className="flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-spacex-dark/60 flex items-center justify-center overflow-hidden border border-spacex-border/20">
                      {(launch.links?.patch?.large || launch.links?.patch?.small) ? (
                        <Image src={launch.links.patch.large || launch.links.patch.small || ""} alt={launch.name} width={96} height={96} className="object-contain" unoptimized />
                      ) : (
                        <Rocket className="w-8 h-8 text-spacex-muted/20" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base sm:text-lg font-bold text-white group-hover:text-spacex-accent transition-colors">{launch.name}</p>
                      <p className="text-xs font-mono text-spacex-muted mt-1">
                        Flight #{launch.flight_number} &middot; {formatFullDate(launch.date_utc)} &middot; {formatTime(launch.date_utc)}
                      </p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {launch.success !== null && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider border ${launch.success ? "text-spacex-success border-spacex-success/30 bg-spacex-success/10" : "text-spacex-danger border-spacex-danger/30 bg-spacex-danger/10"}`}>
                            {launch.success ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                            {launch.success ? "Mission Success" : "Mission Failure"}
                          </span>
                        )}
                        {launch.upcoming && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider text-spacex-warning border border-spacex-warning/30 bg-spacex-warning/10">UPCOMING</span>
                        )}
                        {core?.landing_success && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider text-spacex-accent border border-spacex-accent/30 bg-spacex-accent/10">
                            <Anchor className="w-2.5 h-2.5" />Booster Landed
                          </span>
                        )}
                        {core?.reused && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider text-purple-400 border border-purple-400/30 bg-purple-400/10">
                            <Layers className="w-2.5 h-2.5" />Reused (Flight {core.flight || "?"})
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-spacex-muted/30 group-hover:text-spacex-accent transition-colors flex-shrink-0 mt-2" />
                  </div>
                </Link>

                {/* Mission details grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {rocket && (
                    <div className="glass-panel p-3">
                      <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider">Vehicle</p>
                      <p className="text-sm font-semibold text-white mt-1">{rocket.name}</p>
                      <p className="text-[10px] text-spacex-muted mt-0.5">{rocket.type} &middot; {rocket.success_rate_pct}% success</p>
                    </div>
                  )}
                  {pad && (
                    <div className="glass-panel p-3">
                      <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider">Launch Site</p>
                      <p className="text-sm font-semibold text-white mt-1 truncate">{pad.name}</p>
                      <p className="text-[10px] text-spacex-muted mt-0.5 truncate">{pad.locality}, {pad.region}</p>
                    </div>
                  )}
                  {core && (
                    <div className="glass-panel p-3">
                      <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider">Booster</p>
                      <p className="text-sm font-semibold text-white mt-1">{core.core ? core.core.substring(0, 12) : "Unknown"}</p>
                      <p className="text-[10px] text-spacex-muted mt-0.5">
                        {core.gridfins ? "Gridfins" : ""}{core.legs ? " \u2022 Legs" : ""}{core.landing_type ? ` \u2022 ${core.landing_type}` : ""}
                      </p>
                    </div>
                  )}
                </div>

                {/* Mission details text */}
                {launch.details && (
                  <div className="glass-panel p-4">
                    <p className="text-[9px] font-mono text-spacex-accent uppercase tracking-wider mb-2">Mission Details</p>
                    <p className="text-sm text-white/80 leading-relaxed">{launch.details}</p>
                  </div>
                )}

                {/* Failure info */}
                {launch.failures && launch.failures.length > 0 && (
                  <div className="glass-panel p-4 border-spacex-danger/30">
                    <p className="text-[9px] font-mono text-spacex-danger uppercase tracking-wider mb-2">Failure Details</p>
                    {launch.failures.map((f, i) => (
                      <p key={i} className="text-sm text-white/80 leading-relaxed">T+{f.time}s{f.altitude ? ` at ${f.altitude}km` : ""}: {f.reason}</p>
                    ))}
                  </div>
                )}

                {/* Launch media links */}
                {(launch.links?.webcast || launch.links?.reddit?.launch) && (
                  <div className="flex flex-wrap gap-2">
                    {launch.links.webcast && (
                      <a href={launch.links.webcast} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass-panel text-xs font-mono text-red-400 hover:border-red-400/30 transition-all">
                        <Play className="w-3.5 h-3.5" />WATCH WEBCAST
                      </a>
                    )}
                    {launch.links.reddit?.launch && (
                      <a href={launch.links.reddit.launch} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass-panel text-xs font-mono text-orange-400 hover:border-orange-400/30 transition-all">
                        <ExternalLink className="w-3.5 h-3.5" />REDDIT THREAD
                      </a>
                    )}
                    {launch.links.reddit?.media && (
                      <a href={launch.links.reddit.media} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg glass-panel text-xs font-mono text-orange-400 hover:border-orange-400/30 transition-all">
                        <Tag className="w-3.5 h-3.5" />MEDIA THREAD
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Flickr Gallery */}
          {flickrImages.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-spacex-accent" />
                <h2 className="text-xs font-mono font-semibold text-spacex-accent tracking-wider uppercase">Mission Gallery ({flickrImages.length})</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {flickrImages.slice(0, 9).map((img, i) => (
                  <div key={i} className="relative aspect-video rounded-lg overflow-hidden glass-panel cursor-pointer hover:border-spacex-accent/40 transition-all group" onClick={() => setLightboxImg(img)}>
                    <Image src={img} alt={`Mission photo ${i + 1}`} fill className="object-cover group-hover:scale-[1.03] transition-transform duration-500" sizes="(max-width: 768px) 50vw, 33vw" unoptimized />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full Coverage Timeline */}
          {totalCoverage > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-spacex-accent" />
                <h2 className="text-xs font-mono font-semibold text-spacex-accent tracking-wider uppercase">Full Mission Coverage ({totalCoverage + 1})</h2>
                <span className="text-[9px] font-mono text-spacex-muted ml-auto">{allCoverage.articles.length} articles, {allCoverage.blogs.length} blogs, {allCoverage.reports.length} reports</span>
              </div>
              <div className="space-y-2">
                {allCoverage.articles.slice(0, 6).map((a) => <CoverageCard key={a.id} item={a} type="article" />)}
                {allCoverage.blogs.slice(0, 3).map((b) => <CoverageCard key={b.id} item={b} type="blog" />)}
                {allCoverage.reports.slice(0, 2).map((r) => <CoverageCard key={r.id} item={r} type="report" />)}
              </div>
              {totalCoverage > 11 && (
                <p className="text-[9px] font-mono text-spacex-muted text-center pt-1">+{totalCoverage - 11} more coverage items for this mission</p>
              )}
            </div>
          )}

          {/* Related by context */}
          {relatedByContext.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-spacex-accent" />
                <h2 className="text-xs font-mono font-semibold text-spacex-accent tracking-wider uppercase">Related Articles</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {relatedByContext.map((a) => <CoverageCard key={a.id} item={a} type={articleType} />)}
              </div>
            </div>
          )}

          {/* Prev/Next */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {prevArticle ? (
              <Link href={`/articles/${itemSlug(prevArticle.id, articleType)}`} className="glass-panel p-4 hover:border-spacex-accent/30 transition-all group">
                <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider mb-1.5">&larr; Newer</p>
                <p className="text-xs text-white group-hover:text-spacex-accent transition-colors line-clamp-2 leading-snug">{prevArticle.title}</p>
              </Link>
            ) : <div />}
            {nextArticle ? (
              <Link href={`/articles/${itemSlug(nextArticle.id, articleType)}`} className="glass-panel p-4 hover:border-spacex-accent/30 transition-all group text-right">
                <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider mb-1.5">Older &rarr;</p>
                <p className="text-xs text-white group-hover:text-spacex-accent transition-colors line-clamp-2 leading-snug">{nextArticle.title}</p>
              </Link>
            ) : <div />}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          <div className="glass-panel p-4 hud-corners space-y-4">
            <h3 className="text-[10px] font-mono font-semibold text-spacex-accent tracking-wider uppercase">Article Details</h3>
            <div className="space-y-3">
              <SidebarMeta icon={Globe} label="Source"><p className="text-xs text-white">{article.news_site}</p></SidebarMeta>
              <SidebarMeta icon={Calendar} label="Published">
                <p className="text-xs text-white">{formatFullDate(article.published_at)}</p>
                <p className="text-[10px] text-spacex-muted">{formatTime(article.published_at)}</p>
              </SidebarMeta>
              {article.updated_at !== article.published_at && (
                <SidebarMeta icon={Clock} label="Last Updated"><p className="text-xs text-white">{formatFullDate(article.updated_at)}</p></SidebarMeta>
              )}
              {article.authors.length > 0 && (
                <SidebarMeta icon={User} label={article.authors.length > 1 ? "Authors" : "Author"}>
                  {article.authors.map((author, i) => (
                    <div key={i} className={i > 0 ? "mt-1.5" : ""}>
                      <p className="text-xs text-white">{author.name}</p>
                      {author.socials && (
                        <div className="flex gap-2 mt-0.5">
                          {author.socials.x && <a href={author.socials.x} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-spacex-accent hover:underline">X</a>}
                          {author.socials.youtube && <a href={author.socials.youtube} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-spacex-accent hover:underline">YT</a>}
                          {author.socials.linkedin && <a href={author.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-spacex-accent hover:underline">LI</a>}
                          {author.socials.bluesky && <a href={author.socials.bluesky} target="_blank" rel="noopener noreferrer" className="text-[9px] font-mono text-spacex-accent hover:underline">BS</a>}
                        </div>
                      )}
                    </div>
                  ))}
                </SidebarMeta>
              )}
              {(article.launches?.length ?? 0) > 0 && (
                <SidebarMeta icon={Rocket} label="Linked Launches" color="text-spacex-thrust">
                  <p className="text-xs text-white">{article.launches!.length} launch{article.launches!.length > 1 ? "es" : ""}</p>
                  {totalCoverage > 0 && <p className="text-[10px] text-spacex-muted">{totalCoverage + 1} total coverage items</p>}
                </SidebarMeta>
              )}
              {(article.events?.length ?? 0) > 0 && (
                <SidebarMeta icon={Target} label="Linked Events" color="text-spacex-warning">
                  <p className="text-xs text-white">{article.events!.length} event{article.events!.length > 1 ? "s" : ""}</p>
                </SidebarMeta>
              )}
              <SidebarMeta icon={BookOpen} label="Article ID"><p className="text-xs font-mono text-spacex-muted">#{article.id}</p></SidebarMeta>
              {wordCount > 0 && (
                <SidebarMeta icon={FileText} label="Length">
                  <p className="text-xs text-white">{wordCount.toLocaleString()} words</p>
                  <p className="text-[10px] text-spacex-muted">~{Math.ceil(wordCount / 238)} min read</p>
                </SidebarMeta>
              )}
            </div>
            <div className="pt-3 border-t border-spacex-border/30 space-y-2">
              <a href={article.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-spacex-accent/10 border border-spacex-accent/30 text-[10px] font-mono text-spacex-accent hover:bg-spacex-accent/20 transition-all">
                <ExternalLink className="w-3 h-3" />OPEN ORIGINAL
              </a>
              <button onClick={() => { navigator.clipboard.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-spacex-dark/60 border border-spacex-border/30 text-[10px] font-mono text-spacex-muted hover:text-white hover:border-spacex-accent/30 transition-all">
                <Share2 className="w-3 h-3" />{copied ? "COPIED!" : "COPY LINK"}
              </button>
            </div>
          </div>

          {/* More from Source */}
          {moreFromSource.length > 0 && (
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-[10px] font-mono font-semibold text-spacex-muted tracking-wider uppercase">More from {article.news_site}</h3>
              <div className="space-y-2">
                {moreFromSource.map((item) => (
                  <Link key={item.id} href={`/articles/${itemSlug(item.id, articleType)}`} className="block p-2 -mx-1 rounded-lg hover:bg-white/[0.03] transition-colors group">
                    <p className="text-[11px] text-white group-hover:text-spacex-accent transition-colors line-clamp-2 leading-snug">{item.title}</p>
                    <p className="text-[9px] font-mono text-spacex-muted mt-1">{formatShortDate(item.published_at)}</p>
                  </Link>
                ))}
              </div>
              <Link href={`/articles?source=${encodeURIComponent(article.news_site)}`} className="block text-center text-[9px] font-mono text-spacex-accent hover:underline pt-1">
                View all from {article.news_site} &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[9px] font-mono text-white/15 text-center mt-8 pb-2">
        All data sourced from public APIs and publicly available sources. Not affiliated with SpaceX or any other agency.
      </p>
    </div>
  );
}
