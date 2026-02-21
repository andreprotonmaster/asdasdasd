"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  Newspaper,
  Search,
  Calendar,
  ChevronRight,
  ChevronDown,
  Filter,
  TrendingUp,
  Clock,
  Tag,
  Image as ImageIcon,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Rss,
  Star,
  BookOpen,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
}

// ─── Data Hook ──────────────────────────────────────────────────────────────

function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [blogs, setBlogs] = useState<Article[]>([]);
  const [reports, setReports] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, b, r] = await Promise.all([
        fetch("/data/news-articles.json").then((res) => res.json()),
        fetch("/data/news-blogs.json").then((res) => res.json()),
        fetch("/data/news-reports.json").then((res) => res.json()),
      ]);
      setArticles(a);
      setBlogs(b);
      setReports(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load articles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  return { articles, blogs, reports, loading, error, refetch: fetchAll };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function cleanSummary(summary: string): string {
  return summary
    .replace(/\n/g, " ")
    .replace(/The post .+ appeared first on .+\.?$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

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

type ContentType = "articles" | "blogs";
type SortField = "date" | "source";
type SortDir = "desc" | "asc";

// ─── Article Card ───────────────────────────────────────────────────────────

function ArticleCard({
  article,
  featured = false,
  type = "articles",
}: {
  article: Article;
  featured?: boolean;
  type?: ContentType;
}) {
  const sourceClass =
    SOURCE_COLORS[article.news_site] ||
    "text-spacex-muted border-spacex-border/30 bg-spacex-dark/40";

  // Prefix IDs for blogs to avoid collisions
  const slug = type === "blogs" ? `blog-${article.id}` : String(article.id);

  return (
    <Link
      href={`/articles/${slug}`}
      className={`group block glass-panel overflow-hidden transition-all duration-300 hover:border-spacex-accent/40 hover:bg-white/[0.02] ${
        featured ? "hud-corners" : ""
      }`}
    >
      {/* Image */}
      {article.image_url && (
        <div
          className={`relative w-full overflow-hidden bg-spacex-dark/60 ${
            featured ? "h-48 sm:h-56" : "h-36 sm:h-40"
          }`}
        >
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes={featured ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-spacex-black/80 via-transparent to-transparent" />

          {/* Source badge on image */}
          <div className="absolute top-2.5 left-2.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider border ${sourceClass}`}
            >
              {article.news_site}
            </span>
          </div>

          {/* Featured badge */}
          {article.featured && (
            <div className="absolute top-2.5 right-2.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider text-spacex-warning border border-spacex-warning/30 bg-spacex-warning/10">
                <Star className="w-2.5 h-2.5" />
                Featured
              </span>
            </div>
          )}

          {/* Time ago */}
          <div className="absolute bottom-2.5 right-2.5">
            <span className="text-[9px] font-mono text-white/70 bg-black/50 px-1.5 py-0.5 rounded">
              {timeAgo(article.published_at)}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-3.5 sm:p-4">
        <h3
          className={`font-semibold text-white group-hover:text-spacex-accent transition-colors leading-snug ${
            featured ? "text-sm sm:text-base" : "text-xs sm:text-sm"
          }`}
        >
          {article.title}
        </h3>

        {article.summary && (
          <p
            className={`text-spacex-muted leading-relaxed mt-2 ${
              featured ? "text-xs line-clamp-3" : "text-[11px] line-clamp-2"
            }`}
          >
            {cleanSummary(article.summary)}
          </p>
        )}

        {/* Meta row */}
        <div className="flex items-center gap-3 mt-3 text-[9px] font-mono text-spacex-muted">
          <span className="flex items-center gap-1">
            <Calendar className="w-2.5 h-2.5" />
            {formatDate(article.published_at)}
          </span>
          {article.authors.length > 0 && (
            <span className="truncate max-w-[140px]">
              by {article.authors.map((a) => a.name).join(", ")}
            </span>
          )}
          {(article.launches?.length ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-spacex-accent">
              <Tag className="w-2.5 h-2.5" />
              {article.launches!.length} launch{article.launches!.length > 1 ? "es" : ""}
            </span>
          )}
          <ChevronRight className="w-2.5 h-2.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-spacex-accent" />
        </div>
      </div>
    </Link>
  );
}

// ─── Stats Bar ──────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="glass-panel p-3 flex items-center gap-3">
      <div className={`p-2 rounded-lg bg-spacex-dark/60 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <div>
        <p className="text-lg font-mono font-bold text-white">{value}</p>
        <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider">
          {label}
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 24;

export default function ArticlesPage() {
  const { articles, blogs, loading, error, refetch } = useArticles();

  const [search, setSearch] = useState("");
  const [contentType, setContentType] = useState<ContentType>("articles");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [sortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showCount, setShowCount] = useState(ITEMS_PER_PAGE);
  const [yearFilter, setYearFilter] = useState("all");

  // Current dataset based on content type
  const currentData = useMemo(() => {
    switch (contentType) {
      case "blogs":
        return blogs;
      default:
        return articles;
    }
  }, [contentType, articles, blogs]);

  // Unique sources
  const sources = useMemo(() => {
    const s = new Set<string>();
    currentData.forEach((a) => s.add(a.news_site));
    return Array.from(s).sort();
  }, [currentData]);

  // Unique years
  const years = useMemo(() => {
    const y = new Set<string>();
    currentData.forEach((a) => {
      const yr = a.published_at?.slice(0, 4);
      if (yr && yr !== "1970") y.add(yr);
    });
    return Array.from(y).sort().reverse();
  }, [currentData]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...currentData];

    // Filter out bad dates
    result = result.filter((a) => a.published_at && !a.published_at.startsWith("1970"));

    // Source filter
    if (sourceFilter !== "all") {
      result = result.filter((a) => a.news_site === sourceFilter);
    }

    // Year filter
    if (yearFilter !== "all") {
      result = result.filter((a) => a.published_at.startsWith(yearFilter));
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.summary?.toLowerCase().includes(q) ||
          a.news_site.toLowerCase().includes(q) ||
          a.authors.some((au) => au.name.toLowerCase().includes(q))
      );
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === "source") {
        const cmp = a.news_site.localeCompare(b.news_site);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const cmp =
        new Date(a.published_at).getTime() -
        new Date(b.published_at).getTime();
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [currentData, sourceFilter, yearFilter, search, sortField, sortDir]);

  // Reset show count when filters change
  useEffect(() => {
    setShowCount(ITEMS_PER_PAGE);
  }, [search, sourceFilter, yearFilter, contentType]);

  const visible = filtered.slice(0, showCount);
  const hasMore = showCount < filtered.length;

  // Stats
  const stats = useMemo(() => {
    const launchLinked = articles.filter((a) => (a.launches?.length ?? 0) > 0).length;
    const featuredCount = articles.filter((a) => a.featured).length;
    return {
      totalArticles: articles.length,
      totalBlogs: blogs.length,
      launchLinked,
      featuredCount,
      sources: new Set(articles.map((a) => a.news_site)).size,
    };
  }, [articles, blogs]);

  // Featured articles (latest 2 featured or latest 2 overall)
  const featuredArticles = useMemo(() => {
    const featured = articles
      .filter((a) => a.featured && a.published_at && !a.published_at.startsWith("1970"))
      .sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
      )
      .slice(0, 2);
    if (featured.length >= 2) return featured;
    // Fallback: latest articles
    return articles
      .filter((a) => a.published_at && !a.published_at.startsWith("1970"))
      .sort(
        (a, b) =>
          new Date(b.published_at).getTime() -
          new Date(a.published_at).getTime()
      )
      .slice(0, 2);
  }, [articles]);

  // ─── Loading / Error states ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-spacex-accent animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-spacex-muted">
            Loading SpaceX news archive...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <AlertTriangle className="w-8 h-8 text-spacex-danger mx-auto mb-4" />
          <p className="text-sm font-mono text-spacex-danger mb-2">
            Failed to load news data
          </p>
          <p className="text-xs text-spacex-muted mb-4">{error}</p>
          <button
            onClick={refetch}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-spacex-accent/10 border border-spacex-accent/30 text-xs font-mono text-spacex-accent hover:bg-spacex-accent/20 transition-all mx-auto"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            TRY AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-lg sm:text-xl font-bold text-white">
            SPACEX NEWS ARCHIVE
          </h1>
          <p className="text-xs sm:text-sm text-spacex-muted mt-1">
            {stats.totalArticles.toLocaleString()} articles from {stats.sources} sources
          </p>
        </div>
        <div className="glass-panel px-3 py-2 flex items-center gap-2 w-fit">
          <Rss className="w-4 h-4 text-spacex-accent" />
          <span className="text-xs font-mono text-spacex-muted">
            Latest: {articles[0] && timeAgo(articles[0].published_at)}
          </span>
          <div className="w-2 h-2 rounded-full bg-spacex-success animate-pulse" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        <StatCard
          label="Articles"
          value={stats.totalArticles.toLocaleString()}
          icon={Newspaper}
          color="text-spacex-accent"
        />
        <StatCard
          label="Blogs"
          value={stats.totalBlogs}
          icon={BookOpen}
          color="text-purple-400"
        />
        <StatCard
          label="Sources"
          value={stats.sources}
          icon={Rss}
          color="text-cyan-400"
        />
        <StatCard
          label="Launch Linked"
          value={stats.launchLinked.toLocaleString()}
          icon={Tag}
          color="text-spacex-thrust"
        />
        <StatCard
          label="Featured"
          value={stats.featuredCount}
          icon={Star}
          color="text-spacex-warning"
        />
      </div>

      {/* Featured articles (only show on articles tab, no filters) */}
      {contentType === "articles" &&
        !search &&
        sourceFilter === "all" &&
        yearFilter === "all" &&
        featuredArticles.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-spacex-accent" />
              <h2 className="text-xs font-mono font-semibold text-spacex-accent tracking-wider uppercase">
                Latest Headlines
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {featuredArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  featured
                />
              ))}
            </div>
          </div>
        )}

      {/* Content type tabs + Filters */}
      <div className="space-y-3">
        {/* Tabs */}
        <div className="flex items-center gap-1 glass-panel p-1 w-fit rounded-lg">
          {(
            [
              { key: "articles" as ContentType, label: "Articles", icon: Newspaper, count: articles.length },
              { key: "blogs" as ContentType, label: "Blogs", icon: BookOpen, count: blogs.length },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setContentType(tab.key);
                setSourceFilter("all");
                setYearFilter("all");
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
                contentType === tab.key
                  ? "bg-spacex-accent/20 text-spacex-accent border border-spacex-accent/30"
                  : "text-spacex-muted hover:text-white hover:bg-white/5 border border-transparent"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
              <span className="text-[9px] opacity-60">
                ({tab.count.toLocaleString()})
              </span>
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-spacex-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-spacex-dark/60 border border-spacex-border/30 text-xs font-mono text-white placeholder:text-spacex-muted/50 focus:border-spacex-accent/50 focus:outline-none transition-all"
            />
          </div>

          {/* Source filter */}
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-spacex-muted pointer-events-none" />
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="pl-7 pr-6 py-2 rounded-lg bg-spacex-dark/60 border border-spacex-border/30 text-xs font-mono text-white appearance-none cursor-pointer focus:border-spacex-accent/50 focus:outline-none"
            >
              <option value="all">All Sources</option>
              {sources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-spacex-muted pointer-events-none" />
          </div>

          {/* Year filter */}
          <div className="relative">
            <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-spacex-muted pointer-events-none" />
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="pl-7 pr-6 py-2 rounded-lg bg-spacex-dark/60 border border-spacex-border/30 text-xs font-mono text-white appearance-none cursor-pointer focus:border-spacex-accent/50 focus:outline-none"
            >
              <option value="all">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-spacex-muted pointer-events-none" />
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-spacex-dark/60 border border-spacex-border/30 text-xs font-mono text-spacex-muted hover:text-white hover:border-spacex-accent/30 transition-all"
          >
            <Clock className="w-3 h-3" />
            {sortDir === "desc" ? "Newest" : "Oldest"}
          </button>

          {/* Result count */}
          <span className="text-[10px] font-mono text-spacex-muted ml-auto hidden sm:block">
            {filtered.length.toLocaleString()} result{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Articles Grid */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <ImageIcon className="w-8 h-8 text-spacex-muted/30 mx-auto mb-3" />
          <p className="text-sm font-mono text-spacex-muted">
            No articles match your filters
          </p>
          <button
            onClick={() => {
              setSearch("");
              setSourceFilter("all");
              setYearFilter("all");
            }}
            className="mt-3 text-xs font-mono text-spacex-accent hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((article) => (
              <ArticleCard key={article.id} article={article} type={contentType} />
            ))}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowCount((c) => c + ITEMS_PER_PAGE)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-spacex-accent/10 border border-spacex-accent/30 text-xs font-mono text-spacex-accent hover:bg-spacex-accent/20 transition-all"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                LOAD MORE ({Math.min(ITEMS_PER_PAGE, filtered.length - showCount)} of{" "}
                {(filtered.length - showCount).toLocaleString()} remaining)
              </button>
            </div>
          )}
        </>
      )}

      {/* Disclaimer */}
      <p className="text-[9px] font-mono text-white/15 text-center mt-8 pb-2">
        All data sourced from public APIs and publicly available sources. Not affiliated with SpaceX or any other agency.
      </p>
    </div>
  );
}
