"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  FileText,
  Search,
  Calendar,
  ChevronDown,
  Loader2,
  AlertTriangle,
  Globe,
  BookOpen,
  Satellite,
  BarChart3,
  Beaker,
  Wrench,
  ClipboardList,
  Orbit,
  Activity,
  Rocket,
  Eye,
  ArrowUpRight,
  Anchor,
  Link2,
  Zap,
  Filter,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────────────

interface MatchedLaunch {
  id: string;
  name: string;
  date: string;
  match_type: string;
}

interface MatchedShip {
  id: string;
  name: string;
  type?: string;
  roles?: string[];
  image?: string;
}

interface MatchedDocking {
  docking_date: string;
  departure_date?: string;
  spacecraft?: string;
  station?: string;
  port?: string;
}

interface Report {
  id: number;
  title: string;
  authors: { name: string }[];
  url: string;
  image_url: string;
  news_site: string;
  summary: string;
  published_at: string;
  updated_at: string;
  content?: string | null;
  word_count?: number;
  featured: boolean;
  launches: { launch_id: string; provider: string }[];
  events: { event_id: number; provider: string }[];
  matched_launches?: MatchedLaunch[];
  matched_ships?: MatchedShip[];
  matched_dockings?: MatchedDocking[];
  dragon_mentions?: string[];
  activities?: string[];
  category?: string;
}

interface ParsedSection {
  heading: string;
  body: string;
  icon: "payload" | "system" | "task" | "plan" | "crew" | "general";
}

// ─── Helpers ────────────────────────────────────────────────────────────────

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

function formatShortDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}


function extractReportDate(title: string): string | null {
  const match = title.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  return match ? match[1] : null;
}

function categorizeSectionHeading(heading: string): ParsedSection["icon"] {
  const h = heading.toLowerCase();
  if (h.includes("payload") || h.includes("experiment") || h.includes("science")) return "payload";
  if (h.includes("system") || h.includes("maintenance") || h.includes("hardware")) return "system";
  if (h.includes("task") || h.includes("activit") || h.includes("completed")) return "task";
  if (h.includes("look ahead") || h.includes("plan") || h.includes("upcoming")) return "plan";
  if (h.includes("crew") || h.includes("eva") || h.includes("undock") || h.includes("dock")) return "crew";
  return "general";
}

const SECTION_STYLES: Record<ParsedSection["icon"], { color: string; bg: string; border: string; Icon: React.ElementType }> = {
  payload: { color: "text-emerald-300", bg: "bg-white/10", border: "border-white/20", Icon: Beaker },
  system: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", Icon: Wrench },
  task: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", Icon: ClipboardList },
  plan: { color: "text-amber-400", bg: "bg-white/10", border: "border-white/20", Icon: Calendar },
  crew: { color: "text-spacex-accent", bg: "bg-spacex-accent/10", border: "border-spacex-accent/20", Icon: Rocket },
  general: { color: "text-spacex-muted", bg: "bg-white/5", border: "border-spacex-border/20", Icon: FileText },
};

function parseReportSections(content: string): ParsedSection[] {
  const lines = content.split("\n");
  const sections: ParsedSection[] = [];
  let current: { heading: string; body: string } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const isHeading =
      /^[A-Z][A-Za-z\s&\-\/()]+:$/.test(trimmed) ||
      /^(Payloads|Systems|Completed Task List|Ground Activities|Look Ahead Plan|Three-Day Look Ahead|Today['']?s Activities|Upcoming Activities|EVA|ISS Status):?/.test(trimmed);

    if (isHeading) {
      if (current) sections.push({ ...current, icon: categorizeSectionHeading(current.heading) });
      current = { heading: trimmed.replace(/:$/, ""), body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + trimmed;
    } else {
      current = { heading: "Summary", body: trimmed };
    }
  }
  if (current) sections.push({ ...current, icon: categorizeSectionHeading(current.heading) });
  return sections;
}

function extractTopics(summary: string): string[] {
  const keywords = [
    "EVA", "Crew Dragon", "Soyuz", "Cygnus", "HTV", "Progress", "SpaceX",
    "CRS", "undock", "docking", "reboost", "spacewalk", "Starliner",
    "COLBERT", "ARED", "CEVIS", "MARES", "payloads", "experiments",
    "robotics", "Canadarm", "airlock", "Node", "Columbus", "Destiny",
    "Kibo", "maintenance", "cargo", "transfer", "comm", "rendezvous",
  ];
  const found: string[] = [];
  const lower = summary.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw.toLowerCase()) && found.length < 4) {
      found.push(kw);
    }
  }
  return found;
}

function getCardAccent(index: number) {
  const accents = [
    { glow: "group-hover:shadow-red-500/20", border: "group-hover:border-red-500/40", dot: "bg-red-500", gradient: "from-red-500/20 via-transparent" },
    { glow: "group-hover:shadow-white/20", border: "group-hover:border-white/40", dot: "bg-amber-500", gradient: "from-emerald-500/20 via-transparent" },
    { glow: "group-hover:shadow-amber-500/20", border: "group-hover:border-amber-500/40", dot: "bg-amber-500", gradient: "from-amber-500/20 via-transparent" },
    { glow: "group-hover:shadow-white/20", border: "group-hover:border-white/40", dot: "bg-amber-500", gradient: "from-amber-500/20 via-transparent" },
    { glow: "group-hover:shadow-emerald-500/20", border: "group-hover:border-emerald-500/40", dot: "bg-emerald-500", gradient: "from-emerald-500/20 via-transparent" },
    { glow: "group-hover:shadow-amber-500/20", border: "group-hover:border-amber-500/40", dot: "bg-amber-500", gradient: "from-amber-500/20 via-transparent" },
  ];
  return accents[index % accents.length];
}

// ─── Grid Report Card ───────────────────────────────────────────────────────

function ReportGridCard({
  report,
  index,
}: {
  report: Report;
  index: number;
}) {
  const reportDate = extractReportDate(report.title);
  const topics = useMemo(() => extractTopics(report.summary || ""), [report.summary]);
  const accent = getCardAccent(index);
  const sections = useMemo(
    () => (report.content ? parseReportSections(report.content) : []),
    [report.content]
  );
  const sectionTypes = useMemo(
    () => Array.from(new Set(sections.map((s) => s.icon))).slice(0, 4),
    [sections]
  );

  const shortTitle = reportDate || formatShortDate(report.published_at);

  return (
    <Link
      href={`/iss-reports/${report.id}`}
      className={`group relative glass-panel overflow-hidden text-left transition-all duration-300 block
        ${accent.border} ${accent.glow} hover:shadow-lg hover:scale-[1.02] hover:bg-white/[0.04]
        focus:outline-none focus:ring-1 focus:ring-spacex-accent/40`}
    >
      {/* Top gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${accent.gradient} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      {/* ISS thumbnail with overlay */}
      <div className="relative h-28 overflow-hidden bg-spacex-dark/60">
        <Image
          src={report.image_url || "/images/misc/iss_completion.jpg"}
          alt="ISS"
          fill
          className="object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-[#05050A]/60 to-transparent" />

        {/* Orbital ring decoration */}
        <div className="absolute top-3 right-3 w-8 h-8 rounded-full border border-dashed border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:rotate-45">
          <Orbit className="w-3.5 h-3.5 text-white/30" />
        </div>

        {/* Date badge */}
        <div className="absolute bottom-3 left-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${accent.dot} animate-pulse`} />
            <span className="text-base font-mono font-bold text-white tracking-tight drop-shadow-lg">
              {shortTitle}
            </span>
          </div>
        </div>

        {/* Word count top-left */}
        {report.word_count && report.word_count > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 backdrop-blur-sm">
            <BookOpen className="w-2.5 h-2.5 text-white/50" />
            <span className="text-[8px] font-mono text-white/60">
              {report.word_count.toLocaleString()}w
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-2.5">
        {/* NASA badge + time */}
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-mono font-semibold uppercase tracking-wider text-red-400 border border-red-400/20 bg-red-400/5">
            <Globe className="w-2 h-2 mr-0.5" />
            NASA ISS
          </span>
          <span className="text-[9px] font-mono text-spacex-muted/60">
            {timeAgo(report.published_at)}
          </span>
        </div>

        {/* Summary */}
        <p className="text-[11px] text-spacex-muted leading-relaxed line-clamp-3">
          {report.summary}
        </p>

        {/* Section type indicators */}
        {sectionTypes.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {sectionTypes.map((type) => {
              const style = SECTION_STYLES[type];
              return (
                <span
                  key={type}
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-mono uppercase tracking-wider ${style.color} ${style.bg} border ${style.border}`}
                >
                  <style.Icon className="w-2 h-2" />
                  {type}
                </span>
              );
            })}
          </div>
        )}

        {/* Topic tags */}
        {topics.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap pt-0.5">
            {topics.map((t) => (
              <span
                key={t}
                className="text-[8px] font-mono text-spacex-muted/50 bg-white/[0.05] px-1.5 py-0.5 rounded"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Launch/Ship/Docking indicators */}
        {((report.matched_launches?.length ?? 0) > 0 || (report.matched_ships?.length ?? 0) > 0 || (report.matched_dockings?.length ?? 0) > 0) && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {(report.matched_launches?.length ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-mono uppercase tracking-wider text-spacex-accent bg-spacex-accent/10 border border-spacex-accent/20">
                <Rocket className="w-2 h-2" />
                {report.matched_launches!.length} launch{report.matched_launches!.length > 1 ? 'es' : ''}
              </span>
            )}
            {(report.matched_dockings?.length ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-mono uppercase tracking-wider text-amber-400 bg-white/10 border border-white/20">
                <Link2 className="w-2 h-2" />
                dock
              </span>
            )}
            {(report.matched_ships?.length ?? 0) > 0 && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[7px] font-mono uppercase tracking-wider text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
                <Anchor className="w-2 h-2" />
                {report.matched_ships![0].name}
              </span>
            )}
          </div>
        )}

        {/* Activity badges */}
        {report.activities && report.activities.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {report.activities.slice(0, 3).map((act) => (
              <span
                key={act}
                className={`text-[7px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                  act === 'spacex' ? 'text-spacex-accent bg-spacex-accent/5 border-spacex-accent/15' :
                  act === 'eva' ? 'text-red-400 bg-red-500/5 border-red-500/15' :
                  act === 'dock' || act === 'undock' ? 'text-amber-400 bg-white/5 border-white/15' :
                  'text-spacex-muted/60 bg-white/[0.04] border-spacex-border/30'
                }`}
              >
                {act === 'spacex' ? '⚡ SpaceX' : act === 'eva' ? '🚶 EVA' : act}
              </span>
            ))}
          </div>
        )}

        {/* Bottom action hint */}
        <div className="flex items-center justify-between pt-1.5 border-t border-spacex-border/5">
          <span className="flex items-center gap-1 text-[9px] font-mono text-spacex-muted/40 group-hover:text-spacex-accent transition-colors">
            <Eye className="w-3 h-3" />
            View Report
          </span>
          <span className="text-[8px] font-mono text-spacex-muted/30">
            #{report.id}
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─── Hero / Featured Report ─────────────────────────────────────────────────

function HeroReport({ report }: { report: Report }) {
  const reportDate = extractReportDate(report.title);
  const topics = useMemo(() => extractTopics(report.summary || ""), [report.summary]);

  return (
    <Link
      href={`/iss-reports/${report.id}`}
      className="group relative glass-panel hud-corners overflow-hidden text-left w-full transition-all duration-300 block hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10 focus:outline-none"
    >
      <div className="flex flex-col sm:flex-row">
        {/* Large ISS image */}
        <div className="relative sm:w-1/3 h-48 sm:h-auto overflow-hidden bg-spacex-dark/60">
          <Image
            src="/images/misc/iss_completion.jpg"
            alt="ISS"
            fill
            className="object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700"
            sizes="(max-width: 640px) 100vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#05050A]/40 to-[#05050A] hidden sm:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#05050A] via-transparent to-transparent sm:hidden" />

          {/* Orbital animation */}
          <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
            <div className="relative w-14 h-14">
              <div className="absolute inset-0 rounded-full border border-dashed border-red-500/20 animate-[spin_20s_linear_infinite]" />
              <div className="absolute inset-2 rounded-full border border-red-500/10" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-red-500/60 shadow-lg shadow-red-500/40" />
            </div>
          </div>

          {/* LATEST badge */}
          <div className="absolute top-4 left-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/30 backdrop-blur-sm">
              <Activity className="w-3 h-3 animate-pulse" />
              LATEST REPORT
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider text-red-400 border border-red-400/20 bg-red-400/5">
              <Globe className="w-2.5 h-2.5 mr-1" />
              NASA
            </span>
            {reportDate && (
              <span className="text-sm font-mono text-spacex-accent font-bold">
                {reportDate}
              </span>
            )}
            <span className="text-[9px] font-mono text-spacex-muted">
              {timeAgo(report.published_at)}
            </span>
          </div>

          <h2 className="text-lg font-bold text-white group-hover:text-spacex-accent transition-colors leading-snug">
            {report.title}
          </h2>

          <p className="text-xs text-spacex-muted leading-relaxed line-clamp-4">
            {report.summary}
          </p>

          {topics.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {topics.map((t) => (
                <span
                  key={t}
                  className="text-[9px] font-mono text-spacex-muted/60 bg-white/[0.04] px-2 py-0.5 rounded border border-spacex-border/30"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-4 pt-2">
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-spacex-accent group-hover:text-white transition-colors">
              <Eye className="w-3.5 h-3.5" />
              READ FULL REPORT
              <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            {report.word_count && (
              <span className="flex items-center gap-1 text-[9px] font-mono text-spacex-muted/50">
                <BookOpen className="w-3 h-3" />
                {report.word_count.toLocaleString()} words
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Stat Orb ───────────────────────────────────────────────────────────────

function StatOrb({
  label,
  value,
  icon: Icon,
  color,
  ringColor,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  ringColor: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 group">
      <div className={`relative w-16 h-16 rounded-full border-2 ${ringColor} flex items-center justify-center bg-spacex-dark/40 group-hover:scale-110 transition-transform`}>
        <div className="text-center z-10">
          <p className="text-sm font-mono font-bold text-white leading-none">{value}</p>
        </div>
        <Icon className={`absolute -top-1 -right-1 w-4 h-4 ${color} bg-[#05050A] rounded-full p-0.5`} />
      </div>
      <p className="text-[8px] font-mono text-spacex-muted uppercase tracking-wider text-center">
        {label}
      </p>
    </div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 24;

export default function ISSReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showCount, setShowCount] = useState(ITEMS_PER_PAGE);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetch("/data/news-reports.json").then((r) => r.json());
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ISS reports");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const years = useMemo(() => {
    const y = new Set<string>();
    reports.forEach((r) => {
      const yr = r.published_at?.slice(0, 4);
      if (yr && yr !== "1970") y.add(yr);
    });
    return Array.from(y).sort().reverse();
  }, [reports]);

  const filtered = useMemo(() => {
    let result = [...reports].filter(
      (r) => r.published_at && !r.published_at.startsWith("1970")
    );

    if (yearFilter !== "all") {
      result = result.filter((r) => r.published_at.startsWith(yearFilter));
    }

    if (categoryFilter !== "all") {
      if (categoryFilter === "spacex") {
        result = result.filter((r) => r.activities?.includes("spacex") || (r.matched_launches?.length ?? 0) > 0);
      } else if (categoryFilter === "docking") {
        result = result.filter((r) => (r.matched_dockings?.length ?? 0) > 0 || r.activities?.includes("dock") || r.activities?.includes("undock"));
      } else if (categoryFilter === "ships") {
        result = result.filter((r) => (r.matched_ships?.length ?? 0) > 0);
      } else if (categoryFilter === "eva") {
        result = result.filter((r) => r.activities?.includes("eva"));
      } else if (categoryFilter === "launches") {
        result = result.filter((r) => (r.matched_launches?.length ?? 0) > 0);
      } else {
        result = result.filter((r) => r.category === categoryFilter);
      }
    }

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.summary?.toLowerCase().includes(q) ||
          r.content?.toLowerCase().includes(q) ||
          r.matched_launches?.some(l => l.name.toLowerCase().includes(q)) ||
          r.matched_ships?.some(s => s.name.toLowerCase().includes(q)) ||
          r.dragon_mentions?.some(d => d.toLowerCase().includes(q))
      );
    }

    result.sort(
      (a, b) =>
        new Date(b.published_at).getTime() - new Date(a.published_at).getTime()
    );

    return result;
  }, [reports, yearFilter, categoryFilter, search]);

  useEffect(() => {
    setShowCount(ITEMS_PER_PAGE);
  }, [search, yearFilter, categoryFilter]);

  const stats = useMemo(() => {
    const withContent = reports.filter((r) => r.content).length;
    const totalWords = reports.reduce((s, r) => s + (r.word_count || 0), 0);
    const withLaunches = reports.filter((r) => (r.matched_launches?.length ?? 0) > 0).length;
    const withDockings = reports.filter((r) => (r.matched_dockings?.length ?? 0) > 0).length;
    const spacexRelated = reports.filter((r) => r.activities?.includes("spacex")).length;
    const dateRange =
      reports.length > 0
        ? {
            earliest: reports.reduce((a, b) =>
              new Date(a.published_at) < new Date(b.published_at) ? a : b
            ).published_at,
            latest: reports.reduce((a, b) =>
              new Date(a.published_at) > new Date(b.published_at) ? a : b
            ).published_at,
          }
        : null;
    return { total: reports.length, withContent, totalWords, withLaunches, withDockings, spacexRelated, dateRange };
  }, [reports]);

  // Hero = latest, grid = the rest
  const isDefaultView = !search && yearFilter === "all" && categoryFilter === "all";
  const latestReport = filtered[0] || null;
  const gridReports = isDefaultView ? filtered.slice(1) : filtered;
  const gridVisible = gridReports.slice(0, showCount);
  const gridHasMore = showCount < gridReports.length;

  // ─── Loading / Error ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-red-500/30 animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-3 rounded-full border border-spacex-accent/20 animate-[spin_6s_linear_reverse_infinite]" />
            <Loader2 className="absolute inset-0 m-auto w-6 h-6 text-spacex-accent animate-spin" />
          </div>
          <div className="text-center">
            <p className="text-xs font-mono text-spacex-muted animate-pulse">
              CONNECTING TO ISS TELEMETRY...
            </p>
            <p className="text-[9px] font-mono text-spacex-muted/40 mt-1">
              Retrieving crew activity logs
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-[60vh]">
        <div className="glass-panel p-8 max-w-md text-center space-y-4 hud-corners">
          <div className="w-12 h-12 rounded-full bg-spacex-warning/10 border border-spacex-warning/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-spacex-warning" />
          </div>
          <p className="text-sm text-white font-semibold font-display">TELEMETRY LINK LOST</p>
          <p className="text-xs text-spacex-muted">{error}</p>
          <button
            onClick={fetchReports}
            className="px-5 py-2.5 rounded-lg bg-spacex-accent/10 border border-spacex-accent/30 text-xs font-mono text-spacex-accent hover:bg-spacex-accent/20 transition-all"
          >
            RECONNECT
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* ─── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-red-500 animate-ping opacity-50" />
            </div>
            <span className="text-[10px] font-mono text-red-400 uppercase tracking-[0.2em]">
              International Space Station
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white font-display tracking-tight">
            ISS Daily Reports
          </h1>
          <p className="text-xs text-spacex-muted mt-1.5 max-w-md leading-relaxed">
            Crew activity logs, payload operations & systems status — direct from NASA mission control.
          </p>
        </div>

        {/* Stat orbs */}
        <div className="flex items-end gap-4 flex-wrap">
          <StatOrb
            label="Reports"
            value={stats.total}
            icon={FileText}
            color="text-red-400"
            ringColor="border-red-500/40"
          />
          <StatOrb
            label="Launches"
            value={stats.withLaunches}
            icon={Rocket}
            color="text-spacex-accent"
            ringColor="border-spacex-accent/40"
          />
          <StatOrb
            label="Dockings"
            value={stats.withDockings}
            icon={Link2}
            color="text-amber-400"
            ringColor="border-white/40"
          />
          <StatOrb
            label="SpaceX"
            value={stats.spacexRelated}
            icon={Zap}
            color="text-emerald-400"
            ringColor="border-emerald-500/40"
          />
          <StatOrb
            label="Words"
            value={(stats.totalWords / 1000).toFixed(0) + "k"}
            icon={BarChart3}
            color="text-amber-400"
            ringColor="border-amber-500/40"
          />
        </div>
      </div>

      {/* ─── Filters ────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-spacex-muted pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reports, launches, ships, crews..."
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-spacex-dark/60 border border-spacex-border/30 text-xs font-mono text-white placeholder-spacex-muted/50 focus:outline-none focus:border-spacex-accent/50 focus:ring-1 focus:ring-spacex-accent/20 transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-spacex-muted hover:text-white text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Year pills */}
          <div className="flex items-center gap-1 glass-panel p-1 rounded-lg overflow-x-auto">
            <button
              onClick={() => setYearFilter("all")}
              className={`px-3 py-1.5 rounded text-[10px] font-mono transition-all whitespace-nowrap ${
                yearFilter === "all"
                  ? "bg-spacex-accent/20 text-spacex-accent border border-spacex-accent/30"
                  : "text-spacex-muted hover:text-white border border-transparent"
              }`}
            >
              ALL
            </button>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYearFilter(y)}
                className={`px-3 py-1.5 rounded text-[10px] font-mono transition-all whitespace-nowrap ${
                  yearFilter === y
                    ? "bg-spacex-accent/20 text-spacex-accent border border-spacex-accent/30"
                    : "text-spacex-muted hover:text-white border border-transparent"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Category + Activity filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-3 h-3 text-spacex-muted flex-shrink-0" />
          {[
            { key: "all", label: "All Reports", icon: FileText },
            { key: "spacex", label: "SpaceX", icon: Rocket },
            { key: "launches", label: "Launches", icon: Zap },
            { key: "docking", label: "Docking", icon: Link2 },
            { key: "eva", label: "EVA", icon: Activity },
            { key: "ships", label: "Ships", icon: Anchor },
            { key: "starliner", label: "Starliner", icon: Globe },
          ].map((cat) => (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-mono transition-all whitespace-nowrap ${
                categoryFilter === cat.key
                  ? "bg-spacex-accent/15 text-spacex-accent border border-spacex-accent/30"
                  : "text-spacex-muted hover:text-white bg-white/[0.04] border border-spacex-border/30 hover:border-spacex-border/30"
              }`}
            >
              <cat.icon className="w-2.5 h-2.5" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-spacex-muted">
          {filtered.length === reports.length
            ? `${reports.length} STATION REPORTS`
            : `${filtered.length} OF ${reports.length} REPORTS`}
          {stats.dateRange &&
            ` · ${new Date(stats.dateRange.earliest).getFullYear()}–${new Date(stats.dateRange.latest).getFullYear()}`}
        </p>
      </div>

      {/* ─── Content ────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3 hud-corners">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-spacex-muted/20" />
            <Satellite className="absolute inset-0 m-auto w-7 h-7 text-spacex-muted/30" />
          </div>
          <p className="text-sm font-mono text-spacex-muted">NO REPORTS MATCH QUERY</p>
          <p className="text-[10px] text-spacex-muted/50">Try adjusting your search or year filter</p>
          <button
            onClick={() => { setSearch(""); setYearFilter("all"); }}
            className="mt-2 text-xs font-mono text-spacex-accent hover:underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Hero Card */}
          {isDefaultView && latestReport && (
            <HeroReport report={latestReport} />
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {gridVisible.map((report, i) => (
              <ReportGridCard
                key={report.id}
                report={report}
                index={i}
              />
            ))}
          </div>

          {/* Load more */}
          {gridHasMore && (
            <div className="flex justify-center pt-2">
              <button
                onClick={() => setShowCount((c) => c + ITEMS_PER_PAGE)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-spacex-accent/10 border border-spacex-accent/30 text-xs font-mono text-spacex-accent hover:bg-spacex-accent/20 transition-all group"
              >
                <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                LOAD MORE ({gridReports.length - showCount} remaining)
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
