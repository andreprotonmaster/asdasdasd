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
  Globe,
  BookOpen,
  FileText,
  Share2,
  ChevronRight,
  ChevronLeft,
  Beaker,
  Wrench,
  ClipboardList,
  Rocket,
  ArrowUpRight,
  BarChart3,
  Satellite,
  Link2,
  Anchor,
  Zap,
} from "lucide-react";

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

const SECTION_STYLES: Record<
  ParsedSection["icon"],
  { color: string; bg: string; border: string; Icon: React.ElementType; label: string }
> = {
  payload: { color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/20", Icon: Beaker, label: "Payload Operations" },
  system: { color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20", Icon: Wrench, label: "Systems & Maintenance" },
  task: { color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", Icon: ClipboardList, label: "Completed Tasks" },
  plan: { color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20", Icon: Calendar, label: "Look Ahead Plan" },
  crew: { color: "text-spacex-accent", bg: "bg-spacex-accent/10", border: "border-spacex-accent/20", Icon: Rocket, label: "Crew Operations" },
  general: { color: "text-spacex-muted", bg: "bg-white/5", border: "border-spacex-border/20", Icon: FileText, label: "General" },
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

  // If we only got one big "General" section, try to split it by experiment/topic names
  if (sections.length === 1 && sections[0].body.length > 400) {
    const body = sections[0].body;
    // Split on known experiment/topic patterns that start a new paragraph
    const splitPattern = /(?<=\. )(?=[A-Z][a-z]+ [A-Z]|Crew-\d|SpaceX |Soyuz |Progress |Cygnus |Boeing |Combustion |Complement |Flawless |Advanced |Human |Electrostatic |Vascular |Standard |Payloads:|Systems:|Ground |Look Ahead|Three-Day)/g;
    const paragraphs = body.split(splitPattern).filter(p => p.trim().length > 0);
    if (paragraphs.length > 1) {
      sections.length = 0;
      for (const para of paragraphs) {
        const trimmedPara = para.trim();
        // Try to extract a heading from the first few words
        const colonMatch = trimmedPara.match(/^([A-Z][A-Za-z\s\-\/()]+?)(?::|(?= \())/);
        if (colonMatch && colonMatch[1].length < 80) {
          const heading = colonMatch[1].trim();
          const restBody = trimmedPara.slice(colonMatch[0].length).replace(/^:\s*/, "").trim();
          sections.push({ heading, body: restBody || trimmedPara, icon: categorizeSectionHeading(heading) });
        } else {
          // Use first sentence as a short heading
          const firstSentence = trimmedPara.match(/^(.{15,60}?)(?:\.|:)/);
          const heading = firstSentence ? firstSentence[1].trim() : trimmedPara.slice(0, 50).trim() + "...";
          sections.push({ heading, body: trimmedPara, icon: categorizeSectionHeading(trimmedPara) });
        }
      }
    }
  }

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
    if (lower.includes(kw.toLowerCase()) && found.length < 8) {
      found.push(kw);
    }
  }
  return found;
}

// ─── SidebarMeta helper ─────────────────────────────────────────────────────

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

// ─── Neighbor Report Card ───────────────────────────────────────────────────

function NeighborCard({ report, direction }: { report: Report; direction: "newer" | "older" }) {
  const reportDate = extractReportDate(report.title);
  const isOlder = direction === "older";
  return (
    <Link
      href={`/iss-reports/${report.id}`}
      className={`glass-panel p-4 hover:border-spacex-accent/30 transition-all group block ${isOlder ? "text-right" : ""}`}
    >
      <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider mb-1.5">
        {isOlder ? "Older Report \u2192" : "\u2190 Newer Report"}
      </p>
      {reportDate && (
        <p className="text-sm font-mono font-bold text-white group-hover:text-spacex-accent transition-colors mb-1">
          {reportDate}
        </p>
      )}
      <p className={`text-xs text-spacex-muted line-clamp-2 leading-snug ${isOlder ? "ml-auto" : ""}`}>
        {report.summary?.slice(0, 120)}...
      </p>
    </Link>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = Number(params.id);

  const [report, setReport] = useState<Report | null>(null);
  const [allReports, setAllReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data: Report[] = await fetch("/data/news-reports.json").then((r) => r.json());
        setAllReports(data);
        const found = data.find((r) => r.id === reportId);
        if (!found) {
          setError("Report not found");
        }
        setReport(found || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report data");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reportId]);

  // ─── Parsed data ──────────────────────────────────────────────────────

  const sections = useMemo(
    () => (report?.content ? parseReportSections(report.content) : []),
    [report]
  );

  const topics = useMemo(
    () => extractTopics((report?.summary || "") + " " + (report?.content || "")),
    [report]
  );

  const sectionStats = useMemo(() => {
    const counts: Record<string, number> = {};
    sections.forEach((s) => {
      counts[s.icon] = (counts[s.icon] || 0) + 1;
    });
    return counts;
  }, [sections]);

  const { prevReport, nextReport } = useMemo(() => {
    if (!report || allReports.length === 0) return { prevReport: null, nextReport: null };
    const sorted = [...allReports]
      .filter((r) => r.published_at && !r.published_at.startsWith("1970"))
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());
    const idx = sorted.findIndex((r) => r.id === report.id);
    return {
      prevReport: idx > 0 ? sorted[idx - 1] : null,
      nextReport: idx < sorted.length - 1 ? sorted[idx + 1] : null,
    };
  }, [report, allReports]);

  const reportDate = report ? extractReportDate(report.title) : null;
  const hasFullContent = !!(report?.content && report.content.length > 50);
  const wordCount = report?.word_count || (report?.content?.split(/\s+/).length ?? 0);

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
              RETRIEVING STATION LOG...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-[60vh]">
        <div className="glass-panel p-8 max-w-md text-center space-y-4 hud-corners">
          <div className="w-12 h-12 rounded-full bg-spacex-warning/10 border border-spacex-warning/30 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6 text-spacex-warning" />
          </div>
          <p className="text-sm text-white font-semibold font-display">REPORT NOT FOUND</p>
          <p className="text-xs text-spacex-muted">{error || "The requested ISS report could not be located."}</p>
          <button
            onClick={() => router.push("/iss-reports")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-spacex-accent/10 border border-spacex-accent/30 text-xs font-mono text-spacex-accent hover:bg-spacex-accent/20 transition-all mx-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK TO REPORTS
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-7xl mx-auto">
      {/* ─── Breadcrumb + nav ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => router.push("/iss-reports")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel text-xs font-mono text-spacex-muted hover:text-white hover:border-spacex-accent/30 transition-all"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          ISS REPORTS
        </button>
        <ChevronRight className="w-3 h-3 text-spacex-muted/40" />
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase tracking-wider text-red-400 border border-red-400/30 bg-red-400/10">
          <Globe className="w-2.5 h-2.5 mr-1" />
          NASA
        </span>
        <ChevronRight className="w-3 h-3 text-spacex-muted/40" />
        <span className="text-[10px] font-mono text-spacex-muted truncate max-w-[200px] sm:max-w-xs">
          {reportDate || formatShortDate(report.published_at)}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {prevReport && (
            <Link
              href={`/iss-reports/${prevReport.id}`}
              className="flex items-center gap-1 px-2 py-1 rounded glass-panel text-[9px] font-mono text-spacex-muted hover:text-white transition-all"
              title={prevReport.title}
            >
              <ChevronLeft className="w-3 h-3" />
              NEWER
            </Link>
          )}
          {nextReport && (
            <Link
              href={`/iss-reports/${nextReport.id}`}
              className="flex items-center gap-1 px-2 py-1 rounded glass-panel text-[9px] font-mono text-spacex-accent hover:text-white transition-all"
              title={nextReport.title}
            >
              OLDER
              <ChevronRight className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {/* ─── Hero Banner ────────────────────────────────────────────── */}
      <div className="relative w-full h-48 sm:h-64 md:h-72 rounded-xl overflow-hidden glass-panel hud-corners">
        <Image
          src={report.image_url || "/images/misc/iss_completion.jpg"}
          alt="ISS"
          fill
          className="object-cover opacity-40"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-spacex-black via-spacex-black/60 to-transparent" />

        {/* Orbital decoration */}
        <div className="absolute top-6 right-6">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border border-dashed border-red-500/20 animate-[spin_20s_linear_infinite]" />
            <div className="absolute inset-3 rounded-full border border-red-500/10" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-red-500/60 shadow-lg shadow-red-500/40" />
          </div>
        </div>

        {/* Station status indicator */}
        <div className="absolute top-5 left-5 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-red-500/20">
            <div className="relative">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="absolute inset-0 w-2 h-2 rounded-full bg-red-500 animate-ping opacity-50" />
            </div>
            <span className="text-[9px] font-mono text-red-400 uppercase tracking-wider">
              {report.category === 'starliner' ? 'Starliner Report' :
               report.category === 'boeing' ? 'Boeing Report' :
               'ISS Daily Summary'}
            </span>
          </div>
          {report.activities?.includes('spacex') && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-spacex-accent/20">
              <Zap className="w-2.5 h-2.5 text-spacex-accent" />
              <span className="text-[9px] font-mono text-spacex-accent uppercase tracking-wider">
                SpaceX
              </span>
            </div>
          )}
          {(report.matched_launches?.length ?? 0) > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/40 backdrop-blur-sm border border-purple-500/20">
              <Rocket className="w-2.5 h-2.5 text-purple-400" />
              <span className="text-[9px] font-mono text-purple-400 uppercase tracking-wider">
                {report.matched_launches!.length} Launch{report.matched_launches!.length > 1 ? 'es' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-7">
          <h1 className="font-display text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight drop-shadow-lg">
            {report.title}
          </h1>
          <div className="flex items-center gap-4 mt-3 text-xs font-mono text-white/70 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {formatFullDate(report.published_at)}
            </span>
            <span className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {formatTime(report.published_at)}
            </span>
            <span className="flex items-center gap-1.5 text-white/50">
              {timeAgo(report.published_at)}
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main 2-col layout ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3) — Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Content status */}
          <div className="glass-panel p-5 sm:p-7 hud-corners">
            {hasFullContent ? (
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-spacex-border/20">
                <FileText className="w-3.5 h-3.5 text-spacex-success" />
                <span className="text-[9px] font-mono text-spacex-success uppercase tracking-wider">
                  Full Report &middot; {wordCount.toLocaleString()} words &middot; {sections.length} sections
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-spacex-border/20">
                <AlertTriangle className="w-3.5 h-3.5 text-spacex-warning" />
                <span className="text-[9px] font-mono text-spacex-warning uppercase tracking-wider">Summary Only</span>
              </div>
            )}

            {/* Sections grid */}
            {sections.length > 0 ? (
              <div className="space-y-4">
                {sections.map((section, i) => {
                  const style = SECTION_STYLES[section.icon];
                  return (
                    <div
                      key={i}
                      className={`rounded-lg border p-5 ${style.bg} ${style.border} transition-colors`}
                    >
                      <div className="flex items-center gap-2.5 mb-4">
                        <div className={`w-8 h-8 rounded-lg ${style.bg} border ${style.border} flex items-center justify-center`}>
                          <style.Icon className={`w-4 h-4 ${style.color}`} />
                        </div>
                        <div>
                          <h3 className={`text-sm font-semibold ${style.color}`}>
                            {section.heading}
                          </h3>
                          <p className="text-[9px] font-mono text-spacex-muted/60 uppercase tracking-wider">
                            {style.label}
                          </p>
                        </div>
                      </div>
                      <div className="text-[15px] text-white/90 leading-[1.8] whitespace-pre-wrap pl-10">
                        {section.body.split(/(?<=\. )(?=[A-Z])/).map((para, pi) => (
                          <p key={pi} className={pi > 0 ? "mt-3" : ""}>{para}</p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-4 article-content">
                <p className="text-[15px] text-white/90 leading-[1.8]">
                  {(report.content || report.summary).split(/(?<=\. )(?=[A-Z])/).map((para, i) => (
                    <span key={i} className={i > 0 ? "block mt-3" : ""}>{para}</span>
                  ))}
                </p>
              </div>
            )}

            {/* External link */}
            <div className="mt-6 pt-4 border-t border-spacex-border/30 flex flex-wrap gap-3">
              <a
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400 hover:bg-red-500/20 transition-all group"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                VIEW ON NASA.GOV
                <ArrowUpRight className="w-3 h-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
              </a>
              {/* Also link to the article-detail version */}
              <Link
                href={`/articles/report-${report.id}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 border border-spacex-border/30 text-xs font-mono text-spacex-muted hover:text-white transition-all"
              >
                <BookOpen className="w-3.5 h-3.5" />
                ARTICLE VIEW
              </Link>
            </div>
          </div>

          {/* Prev / Next reports */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {prevReport ? <NeighborCard report={prevReport} direction="newer" /> : <div />}
            {nextReport ? <NeighborCard report={nextReport} direction="older" /> : <div />}
          </div>
        </div>

        {/* Right sidebar (1/3) */}
        <div className="space-y-5">
          {/* Report Metadata */}
          <div className="glass-panel p-4 hud-corners space-y-4">
            <h3 className="text-[10px] font-mono font-semibold text-red-400 tracking-wider uppercase">
              Report Details
            </h3>
            <div className="space-y-3">
              <SidebarMeta icon={Globe} label="Source">
                <p className="text-xs text-white">{report.news_site}</p>
              </SidebarMeta>
              <SidebarMeta icon={Calendar} label="Published">
                <p className="text-xs text-white">{formatFullDate(report.published_at)}</p>
                <p className="text-[10px] text-spacex-muted">{formatTime(report.published_at)}</p>
              </SidebarMeta>
              {report.updated_at !== report.published_at && (
                <SidebarMeta icon={Clock} label="Last Updated">
                  <p className="text-xs text-white">{formatFullDate(report.updated_at)}</p>
                </SidebarMeta>
              )}
              {reportDate && (
                <SidebarMeta icon={Satellite} label="Report Date" color="text-red-400">
                  <p className="text-xs text-white font-mono">{reportDate}</p>
                </SidebarMeta>
              )}
              <SidebarMeta icon={FileText} label="Report ID">
                <p className="text-xs font-mono text-spacex-muted">#{report.id}</p>
              </SidebarMeta>
              {wordCount > 0 && (
                <SidebarMeta icon={BookOpen} label="Length">
                  <p className="text-xs text-white">{wordCount.toLocaleString()} words</p>
                  <p className="text-[10px] text-spacex-muted">~{Math.ceil(wordCount / 238)} min read</p>
                </SidebarMeta>
              )}
              {sections.length > 0 && (
                <SidebarMeta icon={BarChart3} label="Sections">
                  <p className="text-xs text-white">{sections.length} sections</p>
                </SidebarMeta>
              )}
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-spacex-border/30 space-y-2">
              <a
                href={report.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-[10px] font-mono text-red-400 hover:bg-red-500/20 transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                OPEN ON NASA
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center justify-center gap-2 w-full px-3 py-2 rounded-lg bg-spacex-dark/60 border border-spacex-border/30 text-[10px] font-mono text-spacex-muted hover:text-white hover:border-spacex-accent/30 transition-all"
              >
                <Share2 className="w-3 h-3" />
                {copied ? "COPIED!" : "COPY LINK"}
              </button>
            </div>
          </div>

          {/* Section breakdown */}
          {sections.length > 0 && (
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-[10px] font-mono font-semibold text-spacex-muted tracking-wider uppercase">
                Section Breakdown
              </h3>
              <div className="space-y-2">
                {Object.entries(sectionStats).map(([type, count]) => {
                  const style = SECTION_STYLES[type as ParsedSection["icon"]];
                  return (
                    <div key={type} className="flex items-center gap-2.5">
                      <div className={`w-5 h-5 rounded ${style.bg} border ${style.border} flex items-center justify-center`}>
                        <style.Icon className={`w-2.5 h-2.5 ${style.color}`} />
                      </div>
                      <span className="text-[10px] font-mono text-spacex-muted capitalize flex-1">{type}</span>
                      <span className="text-[10px] font-mono text-white">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Linked Launches */}
          {report.matched_launches && report.matched_launches.length > 0 && (
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-[10px] font-mono font-semibold text-spacex-accent tracking-wider uppercase flex items-center gap-1.5">
                <Rocket className="w-3 h-3" />
                Linked Launches ({report.matched_launches.length})
              </h3>
              <div className="space-y-2">
                {report.matched_launches.map((launch, i) => (
                  <Link
                    key={i}
                    href={`/missions/${launch.id}`}
                    className="block p-2.5 -mx-1 rounded-lg hover:bg-white/[0.04] transition-colors group border border-spacex-border/5 hover:border-spacex-accent/20"
                  >
                    <p className="text-[11px] text-white group-hover:text-spacex-accent transition-colors font-medium leading-snug">
                      {launch.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {launch.date && (
                        <span className="text-[9px] font-mono text-spacex-muted">
                          {new Date(launch.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      <span className="text-[8px] font-mono text-spacex-accent/50 uppercase">
                        {launch.match_type}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Docking Events */}
          {report.matched_dockings && report.matched_dockings.length > 0 && (
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-[10px] font-mono font-semibold text-purple-400 tracking-wider uppercase flex items-center gap-1.5">
                <Link2 className="w-3 h-3" />
                Docking Events ({report.matched_dockings.length})
              </h3>
              <div className="space-y-2">
                {report.matched_dockings.map((dock, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-purple-500/5 border border-purple-500/10">
                    <p className="text-[11px] text-white font-medium">
                      {dock.spacecraft || 'Unknown Spacecraft'}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-spacex-muted">
                      <span className="text-purple-400">DOCK</span>
                      <span>{dock.docking_date ? new Date(dock.docking_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</span>
                      {dock.departure_date && (
                        <>
                          <span className="text-spacex-muted/40">→</span>
                          <span className="text-amber-400">UNDOCK</span>
                          <span>{new Date(dock.departure_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        </>
                      )}
                    </div>
                    {dock.port && (
                      <p className="text-[8px] font-mono text-spacex-muted/60 mt-1">
                        Port: {dock.port}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Matched Ships */}
          {report.matched_ships && report.matched_ships.length > 0 && (
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-[10px] font-mono font-semibold text-emerald-400 tracking-wider uppercase flex items-center gap-1.5">
                <Anchor className="w-3 h-3" />
                Recovery Ships ({report.matched_ships.length})
              </h3>
              <div className="space-y-2">
                {report.matched_ships.map((ship, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="flex items-center gap-2">
                      {ship.image && (
                        <div className="relative w-10 h-10 rounded overflow-hidden flex-shrink-0">
                          <Image
                            src={ship.image}
                            alt={ship.name}
                            fill
                            className="object-cover"
                            sizes="40px"
                            unoptimized
                          />
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] text-white font-medium">{ship.name}</p>
                        {ship.roles && ship.roles.length > 0 && (
                          <p className="text-[8px] font-mono text-emerald-400/70 mt-0.5">
                            {ship.roles.join(' · ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dragon Mentions & Activities */}
          {((report.dragon_mentions?.length ?? 0) > 0 || (report.activities?.length ?? 0) > 0) && (
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-[10px] font-mono font-semibold text-spacex-muted tracking-wider uppercase">
                Activities & Vehicles
              </h3>
              {report.dragon_mentions && report.dragon_mentions.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-mono text-spacex-muted/60 uppercase">Dragon Capsules</p>
                  <div className="flex flex-wrap gap-1">
                    {report.dragon_mentions.map((dm, i) => (
                      <span key={i} className="text-[9px] font-mono text-spacex-accent bg-spacex-accent/10 px-2 py-0.5 rounded border border-spacex-accent/20 capitalize">
                        {dm}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {report.activities && report.activities.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[9px] font-mono text-spacex-muted/60 uppercase">Activities</p>
                  <div className="flex flex-wrap gap-1">
                    {report.activities.map((act) => (
                      <span
                        key={act}
                        className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                          act === 'spacex' ? 'text-spacex-accent bg-spacex-accent/10 border-spacex-accent/20' :
                          act === 'eva' ? 'text-red-400 bg-red-500/10 border-red-500/20' :
                          act === 'dock' || act === 'undock' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' :
                          'text-spacex-muted bg-white/5 border-spacex-border/15'
                        } uppercase`}
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Topics */}
          {topics.length > 0 && (
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-[10px] font-mono font-semibold text-spacex-muted tracking-wider uppercase">
                Topics Mentioned
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {topics.map((topic) => (
                  <span
                    key={topic}
                    className="text-[9px] font-mono text-spacex-muted/70 bg-white/[0.04] px-2 py-1 rounded border border-spacex-border/10 hover:border-spacex-accent/20 hover:text-spacex-accent transition-colors"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Quick nav to nearby reports */}
          {(prevReport || nextReport) && (
            <div className="glass-panel p-4 space-y-3">
              <h3 className="text-[10px] font-mono font-semibold text-spacex-muted tracking-wider uppercase">
                Nearby Reports
              </h3>
              <div className="space-y-2">
                {prevReport && (
                  <Link
                    href={`/iss-reports/${prevReport.id}`}
                    className="block p-2 -mx-1 rounded-lg hover:bg-white/[0.03] transition-colors group"
                  >
                    <p className="text-[11px] text-white group-hover:text-spacex-accent transition-colors line-clamp-2 leading-snug">
                      {extractReportDate(prevReport.title) || prevReport.title}
                    </p>
                    <p className="text-[9px] font-mono text-spacex-muted mt-1">
                      {formatShortDate(prevReport.published_at)} &middot; Newer
                    </p>
                  </Link>
                )}
                {nextReport && (
                  <Link
                    href={`/iss-reports/${nextReport.id}`}
                    className="block p-2 -mx-1 rounded-lg hover:bg-white/[0.03] transition-colors group"
                  >
                    <p className="text-[11px] text-white group-hover:text-spacex-accent transition-colors line-clamp-2 leading-snug">
                      {extractReportDate(nextReport.title) || nextReport.title}
                    </p>
                    <p className="text-[9px] font-mono text-spacex-muted mt-1">
                      {formatShortDate(nextReport.published_at)} &middot; Older
                    </p>
                  </Link>
                )}
              </div>
              <Link
                href="/iss-reports"
                className="block text-center text-[9px] font-mono text-spacex-accent hover:underline pt-1"
              >
                View all ISS reports &rarr;
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
