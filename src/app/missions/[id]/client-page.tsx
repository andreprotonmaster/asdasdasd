"use client";

import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Rocket,
  Globe,
  MapPin,
  Calendar,
  Package,
  Repeat,
  ArrowDown,
  Layers,
  Play,
  FileText,
  ExternalLink,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Image as ImageIcon,
  Info,
  ChevronRight,
  Newspaper,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Star,
  User,
  Anchor,
} from "lucide-react";
import { useSpaceXData } from "@/lib/spacex/hooks";
import type { Payload, Core, LaunchCore } from "@/lib/spacex/types";
import Link from "next/link";

// ─── Article Types ──────────────────────────────────────────────────────────

interface ArticleAuthor {
  name: string;
  socials: Record<string, string> | null;
}

interface ArticleLaunchRef {
  launch_id: string;
  provider: string;
}

interface NewsArticle {
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
  launches?: ArticleLaunchRef[];
  events?: Array<{ event_id: number; provider: string }>;
  content?: string | null;
  word_count?: number;
}

const SOURCE_COLORS: Record<string, string> = {
  SpaceNews: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  NASASpaceflight: "text-orange-400 border-orange-400/30 bg-orange-400/10",
  "Spaceflight Now": "text-emerald-300 border-white/30 bg-white/10",
  SpaceX: "text-white border-white/30 bg-white/10",
  NASA: "text-red-400 border-red-400/30 bg-red-400/10",
  Teslarati: "text-rose-400 border-rose-400/30 bg-rose-400/10",
  Arstechnica: "text-amber-400 border-amber-400/30 bg-amber-400/10",
  CNBC: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
  Reuters: "text-violet-400 border-violet-400/30 bg-violet-400/10",
  "Space.com": "text-amber-400 border-white/30 bg-white/10",
  "European Spaceflight": "text-amber-400 border-white/30 bg-white/10",
  ESA: "text-teal-400 border-teal-400/30 bg-teal-400/10",
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateUTC: string, precision?: string): string {
  const d = new Date(dateUTC);
  switch (precision) {
    case "month":
      return d.toLocaleDateString("en-US", { year: "numeric", month: "long" });
    case "quarter":
    case "half":
      return `Q${Math.ceil((d.getMonth() + 1) / 3)} ${d.getFullYear()}`;
    case "year":
      return d.getFullYear().toString();
    default:
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
  }
}

function formatFullDate(dateUTC: string): string {
  return new Date(dateUTC).toLocaleString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

function formatMass(kg: number | null): string {
  if (kg === null) return "N/A";
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)} t`;
  return `${kg.toLocaleString()} kg`;
}

function timeAgo(dateUTC: string): string {
  const diff = Date.now() - new Date(dateUTC).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0) {
    const abs = Math.abs(days);
    if (abs < 30) return `in ${abs} days`;
    if (abs < 365) return `in ${Math.floor(abs / 30)} months`;
    return `in ${Math.floor(abs / 365)} years`;
  }
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${(days / 365).toFixed(1)} years ago`;
}

function countdownTo(dateUTC: string): string {
  const diff = new Date(dateUTC).getTime() - Date.now();
  if (diff <= 0) return "Launched";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${hours}h`);
  parts.push(`${minutes}m`);
  return `T-${parts.join(" ")}`;
}

// ─── Section Component ──────────────────────────────────────────────────────

function Section({
  title,
  icon,
  color = "text-spacex-accent",
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ReactNode;
  color?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="glass-panel p-4 sm:p-5 hud-corners"
    >
      <div className="flex items-center gap-2 mb-4">
        <span className={color}>{icon}</span>
        <h2
          className={`text-xs font-mono font-bold tracking-wider uppercase ${color}`}
        >
          {title}
        </h2>
      </div>
      {children}
    </motion.div>
  );
}

function InfoRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 border-b border-spacex-border/30 last:border-0">
      <span className="text-[10px] font-mono text-spacex-muted shrink-0 uppercase tracking-wider">
        {label}
      </span>
      <span
        className={`text-[11px] text-white text-right ${mono ? "font-mono" : ""}`}
      >
        {value}
      </span>
    </div>
  );
}

function ExtLink({
  href,
  icon,
  label,
  color = "text-spacex-accent",
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  color?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 px-3 py-2 rounded-lg bg-spacex-dark/50 border border-spacex-border/30 text-xs font-mono ${color} hover:bg-white/5 hover:border-spacex-accent/30 transition-all`}
    >
      {icon}
      {label}
      <ExternalLink className="w-3 h-3 ml-auto opacity-40" />
    </a>
  );
}

// ─── Payload Card ───────────────────────────────────────────────────────────

function PayloadCard({ payload }: { payload: Payload }) {
  return (
    <div className="p-3 rounded-xl bg-spacex-dark/50 border border-spacex-border/20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-mono font-semibold text-white truncate">
          {payload.name}
        </h4>
        {payload.mass_kg !== null && (
          <span className="text-[9px] font-mono text-spacex-muted shrink-0 ml-2 px-2 py-0.5 bg-spacex-dark/50 rounded">
            {formatMass(payload.mass_kg)}{payload.mass_lbs !== null ? ` (${payload.mass_lbs.toLocaleString()} lb)` : ""}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-emerald-300">
          {payload.type}
        </span>
        {payload.orbit && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-spacex-accent/10 text-spacex-accent">
            {payload.orbit}
          </span>
        )}
        {payload.regime && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-amber-400">
            {payload.regime}
          </span>
        )}
        {payload.reused && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-spacex-warning/10 text-spacex-warning">
            Reused
          </span>
        )}
      </div>
      <div className="space-y-1">
        {payload.customers.length > 0 && (
          <InfoRow label="Customers" value={payload.customers.join(", ")} mono={false} />
        )}
        {payload.nationalities.length > 0 && (
          <InfoRow
            label="Nationalities"
            value={payload.nationalities.join(", ")}
            mono={false}
          />
        )}
        {payload.manufacturers.length > 0 && (
          <InfoRow
            label="Manufacturers"
            value={payload.manufacturers.join(", ")}
            mono={false}
          />
        )}
        {payload.lifespan_years !== null && (
          <InfoRow label="Lifespan" value={`${payload.lifespan_years} years`} />
        )}
        {payload.reference_system && (
          <InfoRow label="Ref System" value={payload.reference_system} />
        )}
        {payload.longitude !== null && (
          <InfoRow label="Longitude" value={`${payload.longitude}°`} />
        )}
      </div>

      {/* Orbital parameters */}
      {payload.orbit && (payload.periapsis_km !== null || payload.apoapsis_km !== null) && (
        <div className="mt-3 pt-2 border-t border-spacex-border/30">
          <p className="text-[8px] font-mono text-spacex-muted tracking-wider uppercase mb-1.5">
            Orbital Parameters
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
            {payload.periapsis_km !== null && (
              <InfoRow label="Periapsis" value={`${payload.periapsis_km.toFixed(1)} km`} />
            )}
            {payload.apoapsis_km !== null && (
              <InfoRow label="Apoapsis" value={`${payload.apoapsis_km.toFixed(1)} km`} />
            )}
            {payload.inclination_deg !== null && (
              <InfoRow
                label="Inclination"
                value={`${payload.inclination_deg.toFixed(2)}°`}
              />
            )}
            {payload.period_min !== null && (
              <InfoRow label="Period" value={`${payload.period_min.toFixed(2)} min`} />
            )}
            {payload.semi_major_axis_km !== null && (
              <InfoRow
                label="Semi-Major"
                value={`${payload.semi_major_axis_km.toFixed(1)} km`}
              />
            )}
            {payload.eccentricity !== null && (
              <InfoRow
                label="Eccentricity"
                value={payload.eccentricity.toFixed(6)}
              />
            )}
            {payload.epoch !== null && (
              <InfoRow
                label="Epoch"
                value={formatDate(payload.epoch)}
              />
            )}
            {payload.mean_motion !== null && (
              <InfoRow
                label="Mean Motion"
                value={`${payload.mean_motion.toFixed(4)} rev/day`}
              />
            )}
            {payload.raan !== null && (
              <InfoRow label="RAAN" value={`${payload.raan.toFixed(2)}°`} />
            )}
            {payload.arg_of_pericenter !== null && (
              <InfoRow
                label="Arg of Pericenter"
                value={`${payload.arg_of_pericenter.toFixed(2)}°`}
              />
            )}
            {payload.mean_anomaly !== null && (
              <InfoRow
                label="Mean Anomaly"
                value={`${payload.mean_anomaly.toFixed(4)}°`}
              />
            )}
          </div>
        </div>
      )}

      {/* Dragon capsule data */}
      {payload.dragon && (payload.dragon.capsule || payload.dragon.mass_returned_kg !== null || payload.dragon.flight_time_sec !== null || payload.dragon.manifest || payload.dragon.water_landing !== null || payload.dragon.land_landing !== null) && (
        <div className="mt-3 pt-2 border-t border-spacex-border/30">
          <p className="text-[8px] font-mono text-emerald-300/80 tracking-wider uppercase mb-1.5">
            Dragon Data
          </p>
          <div className="space-y-0.5">
            {payload.dragon.capsule && (
              <InfoRow label="Capsule" value={payload.dragon.capsule} />
            )}
            {payload.dragon.mass_returned_kg !== null && (
              <InfoRow
                label="Mass Returned"
                value={`${formatMass(payload.dragon.mass_returned_kg)}${payload.dragon.mass_returned_lbs !== null ? ` (${payload.dragon.mass_returned_lbs.toLocaleString()} lb)` : ""}`}
              />
            )}
            {payload.dragon.flight_time_sec !== null && (
              <InfoRow
                label="Flight Time"
                value={`${(payload.dragon.flight_time_sec / 3600).toFixed(1)} hrs (${payload.dragon.flight_time_sec.toLocaleString()}s)`}
              />
            )}
            {payload.dragon.water_landing !== null && (
              <InfoRow label="Water Landing" value={payload.dragon.water_landing ? "Yes" : "No"} />
            )}
            {payload.dragon.land_landing !== null && (
              <InfoRow label="Land Landing" value={payload.dragon.land_landing ? "Yes" : "No"} />
            )}
            {payload.dragon.manifest && (
              <a
                href={payload.dragon.manifest}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-[9px] font-mono text-spacex-accent hover:text-spacex-accent/80 transition-colors mt-1"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                View Manifest
              </a>
            )}
          </div>
        </div>
      )}

      {/* NORAD IDs */}
      {payload.norad_ids.length > 0 && (
        <div className="mt-2 text-[8px] font-mono text-spacex-muted/50">
          NORAD: {payload.norad_ids.join(", ")}
        </div>
      )}
    </div>
  );
}

// ─── Core Card ──────────────────────────────────────────────────────────────

function CoreCard({
  core,
  coreRef,
}: {
  core: Core;
  coreRef: LaunchCore;
}) {
  return (
    <div className="p-3 rounded-xl bg-spacex-dark/50 border border-spacex-border/20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-mono font-bold text-white">
          {core.serial}
        </h4>
        <span
          className={`text-[8px] font-mono px-2 py-0.5 rounded ${
            core.status === "active"
              ? "bg-spacex-success/10 text-spacex-success"
              : core.status === "retired"
              ? "bg-spacex-muted/10 text-spacex-muted"
              : core.status === "lost"
              ? "bg-spacex-danger/10 text-spacex-danger"
              : core.status === "expended"
              ? "bg-orange-500/10 text-orange-400"
              : "bg-spacex-warning/10 text-spacex-warning"
          }`}
        >
          {core.status.toUpperCase()}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        {coreRef.reused && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-amber-400">
            Reused
          </span>
        )}
        {coreRef.gridfins && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-spacex-accent/10 text-spacex-accent">
            Grid Fins
          </span>
        )}
        {coreRef.legs && (
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-spacex-accent/10 text-spacex-accent">
            Landing Legs
          </span>
        )}
      </div>

      <div className="space-y-1">
        <InfoRow label="Flight #" value={coreRef.flight?.toString() || "N/A"} />
        <InfoRow label="Total Reuses" value={core.reuse_count.toString()} />
        {core.launches.length > 0 && (
          <InfoRow label="Total Launches" value={core.launches.length.toString()} />
        )}
        <InfoRow label="RTLS Landings" value={`${core.rtls_landings} / ${core.rtls_attempts}`} />
        <InfoRow label="ASDS Landings" value={`${core.asds_landings} / ${core.asds_attempts}`} />
        {core.block !== null && (
          <InfoRow label="Block" value={core.block.toString()} />
        )}
      </div>

      {/* Landing result for this flight */}
      {coreRef.landing_attempt && (
        <div
          className={`mt-3 p-2 rounded-lg text-xs font-mono flex items-center gap-2 ${
            coreRef.landing_success
              ? "bg-spacex-success/10 text-spacex-success"
              : coreRef.landing_success === false
              ? "bg-spacex-danger/10 text-spacex-danger"
              : "bg-spacex-muted/10 text-spacex-muted"
          }`}
        >
          <ArrowDown className="w-3.5 h-3.5" />
          <span>
            {coreRef.landing_success
              ? "LANDING SUCCESS"
              : coreRef.landing_success === false
              ? "LANDING FAILED"
              : "LANDING N/A"}
          </span>
          {coreRef.landing_type && (
            <span className="text-[9px] ml-auto opacity-70">
              {coreRef.landing_type}
            </span>
          )}
        </div>
      )}

      {core.last_update && (
        <p className="mt-2 text-[9px] text-spacex-text/40 leading-relaxed">
          {core.last_update}
        </p>
      )}
    </div>
  );
}

// ─── Article Card for Mission Coverage ──────────────────────────────────────

function ArticleContentCard({
  article,
  type,
}: {
  article: NewsArticle;
  type: "article" | "blog" | "report";
}) {
  const [expanded, setExpanded] = useState(false);
  const sc =
    SOURCE_COLORS[article.news_site] ||
    "text-spacex-muted border-spacex-border/30 bg-spacex-dark/40";
  const TypeIcon =
    type === "blog" ? BookOpen : type === "report" ? FileText : Newspaper;
  const hasContent = !!article.content;
  const wordCount = article.word_count || 0;
  const readTime = Math.max(1, Math.ceil(wordCount / 230));

  return (
    <motion.div
      layout
      className="glass-panel hud-corners overflow-hidden"
    >
      {/* Header with image */}
      <div className="flex gap-0">
        {article.image_url && (
          <div className="relative w-28 sm:w-36 shrink-0 bg-spacex-dark/60">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover"
              sizes="144px"
              unoptimized
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-spacex-dark/60" />
          </div>
        )}
        <div className="flex-1 p-3 sm:p-4 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <Link
              href={`/articles/${type === "blog" ? `blog-${article.id}` : type === "report" ? `report-${article.id}` : article.id}`}
              className="text-[13px] font-semibold text-white hover:text-spacex-accent transition-colors line-clamp-2 leading-snug flex-1"
            >
              {article.title}
            </Link>
            {article.featured && (
              <Star className="w-3.5 h-3.5 text-spacex-warning fill-spacex-warning shrink-0 mt-0.5" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${sc}`}>
              {article.news_site}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-spacex-muted">
              <TypeIcon className="w-2.5 h-2.5" />
              {type}
            </span>
            <span className="flex items-center gap-1 text-[9px] font-mono text-spacex-muted">
              <Calendar className="w-2.5 h-2.5" />
              {new Date(article.published_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
            {article.authors.length > 0 && (
              <span className="flex items-center gap-1 text-[9px] font-mono text-spacex-muted">
                <User className="w-2.5 h-2.5" />
                {article.authors.map((a) => a.name).join(", ")}
              </span>
            )}
            {hasContent && (
              <span className="flex items-center gap-1 text-[8px] font-mono px-1.5 py-0.5 rounded bg-spacex-success/10 text-spacex-success">
                <FileText className="w-2.5 h-2.5" />
                {wordCount.toLocaleString()} words · {readTime} min
              </span>
            )}
          </div>

          {/* Summary (always shown) */}
          {!expanded && (
            <p className="text-[11px] text-spacex-text/50 leading-relaxed line-clamp-2">
              {article.summary}
            </p>
          )}
        </div>
      </div>

      {/* Expandable full content */}
      <AnimatePresence>
        {expanded && hasContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-spacex-border/30">
              <div className="mt-4 prose prose-invert prose-sm max-w-none">
                {article.content!.split("\n").filter((p) => p.trim()).map((paragraph, i) => (
                  <p
                    key={i}
                    className="text-[12px] text-spacex-text/60 leading-relaxed mb-3 last:mb-0"
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
        {expanded && !hasContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 border-t border-spacex-border/30">
              <p className="mt-3 text-xs text-spacex-text/50 leading-relaxed">
                {article.summary}
              </p>
              <p className="text-[10px] text-spacex-muted/50 italic mt-2">
                Full article content not available. Read the complete article at the source.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-spacex-border/30 bg-spacex-dark/30">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-[10px] font-mono text-spacex-accent hover:text-spacex-accent/80 transition-colors"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-3 h-3" />
              COLLAPSE
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              {hasContent ? "READ FULL ARTICLE" : "READ SUMMARY"}
            </>
          )}
        </button>
        <div className="flex-1" />
        <Link
          href={`/articles/${type === "blog" ? `blog-${article.id}` : type === "report" ? `report-${article.id}` : article.id}`}
          className="flex items-center gap-1 text-[10px] font-mono text-spacex-muted hover:text-spacex-accent transition-colors"
        >
          <Newspaper className="w-3 h-3" />
          INTEL
        </Link>
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] font-mono text-spacex-muted hover:text-white transition-colors"
        >
          <ExternalLink className="w-3 h-3" />
          SOURCE
        </a>
      </div>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function MissionDetailPage() {
  const params = useParams<{ id: string }>();
  const { enrichedLaunches, loading, error, refetch } = useSpaceXData();

  const launch = useMemo(() => {
    if (!params.id || enrichedLaunches.length === 0) return null;
    return enrichedLaunches.find((l) => l.id === params.id) ?? null;
  }, [params.id, enrichedLaunches]);

  // Adjacent launches for prev/next navigation
  const adjacentLaunches = useMemo(() => {
    if (!launch || enrichedLaunches.length === 0) return { prev: null, next: null };
    const idx = enrichedLaunches.findIndex((l) => l.id === launch.id);
    return {
      prev: idx > 0 ? enrichedLaunches[idx - 1] : null,
      next: idx < enrichedLaunches.length - 1 ? enrichedLaunches[idx + 1] : null,
    };
  }, [launch, enrichedLaunches]);

  // ─── News Coverage Data ─────────────────────────────────────────────────
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [newsBlogs, setNewsBlogs] = useState<NewsArticle[]>([]);
  const [newsReports, setNewsReports] = useState<NewsArticle[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);

  // ─── Ship & Docking Data ────────────────────────────────────────────────
  interface ShipData {
    id: string;
    name: string;
    type?: string;
    roles?: string[];
    image?: string;
    home_port?: string;
    year_built?: number;
    mass_kg?: number;
    link?: string;
    active?: boolean;
    launches?: string[];
  }
  interface DockingSummary {
    id: number;
    launch_id: string;
    docking: string;
    departure: string;
    spacecraft_name: string;
    spacecraft_type: string;
    destination: string;
    docking_location: string;
    station: string;
    description?: string;
    image?: string;
  }
  const [allShips, setAllShips] = useState<ShipData[]>([]);
  const [dockingSummary, setDockingSummary] = useState<DockingSummary[]>([]);
  const [modalImage, setModalImage] = useState<string | null>(null);

  // Close modal on ESC key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalImage(null);
    };
    if (modalImage) {
      document.addEventListener("keydown", handleKey);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [modalImage]);

  useEffect(() => {
    let cancelled = false;
    async function loadNews() {
      setNewsLoading(true);
      try {
        const [articles, blogs, reports, ships, docking] = await Promise.all([
          fetch("/data/news-articles.json").then((r) => r.json()),
          fetch("/data/news-blogs.json").then((r) => r.json()),
          fetch("/data/news-reports.json").then((r) => r.json()),
          fetch("/data/ships.json").then((r) => r.json()).catch(() => []),
          fetch("/data/ll2-docking-summary.json").then((r) => r.json()).catch(() => []),
        ]);
        if (!cancelled) {
          setNewsArticles(articles);
          setNewsBlogs(blogs);
          setNewsReports(reports);
          setAllShips(ships);
          setDockingSummary(docking);
        }
      } catch {
        // silently fail — news coverage is supplementary
      } finally {
        if (!cancelled) setNewsLoading(false);
      }
    }
    loadNews();
    return () => { cancelled = true; };
  }, []);

  // Match coverage to this launch
  const missionCoverage = useMemo(() => {
    if (!launch) return { articles: [], blogs: [], reports: [], total: 0 };
    const launchId = launch.id;

    // ── Articles: match by launch_id (SNAPI provides these) ──
    const matchArticles = newsArticles.filter((a) =>
      a.launches?.some((l) => l.launch_id === launchId)
    ).sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    // ── Blogs & Reports: fuzzy text match (they don't have launch refs) ──
    // Build search keywords from mission name, payload names, etc.
    const searchTerms: string[] = [];

    // Full mission name (e.g. "Starlink Group 6-22", "CRS-20", "Crew-6")
    searchTerms.push(launch.name.toLowerCase());

    // Split into tokens — e.g. "Starlink Group 6-22" → ["starlink", "group", "6-22"]
    // Keep compound names like "CRS-20", "Crew-6", "NROL-87"
    const tokens = launch.name
      .split(/[\s\/\|]+/)
      .map((t) => t.toLowerCase())
      .filter((t) => t.length >= 2);

    // Add mission designator patterns like "CRS-20", "Crew-6", "SES-18"
    for (const t of tokens) {
      if (/^[a-z]+-\d+/i.test(t) || /^\d+-\d+/.test(t)) {
        searchTerms.push(t);
      }
    }

    // Add meaningful name parts (skip generic words)
    const skipWords = new Set(["group", "mission", "flight", "test", "block", "v1.0", "v1"]);
    for (const t of tokens) {
      if (!skipWords.has(t) && t.length >= 3 && !/^\d+$/.test(t)) {
        searchTerms.push(t);
      }
    }

    // Deduplicate
    const uniqueTerms = Array.from(new Set(searchTerms));

    // Build launch date window (± 30 days) for relevance filtering
    const launchDate = new Date(launch.date_utc).getTime();
    const windowMs = 30 * 24 * 60 * 60 * 1000; // 30 days

    function textMatches(item: NewsArticle): boolean {
      const haystack = `${item.title} ${item.summary} ${item.content || ""}`.toLowerCase();
      // Must match the full mission name OR at least 2 significant terms
      if (haystack.includes(uniqueTerms[0])) return true; // full name match
      // For compound names (e.g. "CRS-20", "Crew-6"), direct match
      const compoundHits = uniqueTerms.filter((t) => /^[a-z]+-\d/i.test(t) && haystack.includes(t));
      if (compoundHits.length > 0) return true;
      // Multi-term matching for generic names — need 2+ meaningful matches
      const hits = uniqueTerms.slice(1).filter((t) => haystack.includes(t));
      return hits.length >= 2;
    }

    function isInTimeWindow(item: NewsArticle): boolean {
      const pubDate = new Date(item.published_at).getTime();
      return Math.abs(pubDate - launchDate) <= windowMs;
    }

    const matchBlogs = newsBlogs.filter((b) => {
      // First try launch ID (in case it gets populated in the future)
      if (b.launches?.some((l) => l.launch_id === launchId)) return true;
      // Fuzzy text match within time window
      return textMatches(b) && isInTimeWindow(b);
    }).sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    const matchReports = newsReports.filter((r) => {
      if (r.launches?.some((l) => l.launch_id === launchId)) return true;
      return textMatches(r) && isInTimeWindow(r);
    }).sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    return {
      articles: matchArticles,
      blogs: matchBlogs,
      reports: matchReports,
      total: matchArticles.length + matchBlogs.length + matchReports.length,
    };
  }, [launch, newsArticles, newsBlogs, newsReports]);

  const coverageWithContent = useMemo(() => {
    const all = [
      ...missionCoverage.articles,
      ...missionCoverage.blogs,
      ...missionCoverage.reports,
    ];
    return all.filter((a) => a.content).length;
  }, [missionCoverage]);

  const totalCoverageWords = useMemo(() => {
    const all = [
      ...missionCoverage.articles,
      ...missionCoverage.blogs,
      ...missionCoverage.reports,
    ];
    return all.reduce((sum, a) => sum + (a.word_count || 0), 0);
  }, [missionCoverage]);

  // Resolve ship details for this launch
  const resolvedShips = useMemo(() => {
    if (!launch || launch.ships.length === 0 || allShips.length === 0) return [];
    return launch.ships.map(shipId => allShips.find(s => s.id === shipId)).filter(Boolean) as ShipData[];
  }, [launch, allShips]);

  // Find docking events for this launch
  const launchDockings = useMemo(() => {
    if (!launch || dockingSummary.length === 0) return [];
    return dockingSummary.filter(d => d.launch_id === launch.id);
  }, [launch, dockingSummary]);

  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-spacex-accent animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-spacex-muted">
            Loading mission data...
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
            Failed to load mission data
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

  if (!launch) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Rocket className="w-8 h-8 text-spacex-muted/30 mx-auto mb-4" />
          <p className="text-sm font-mono text-spacex-muted mb-2">
            Mission not found
          </p>
          <Link
            href="/missions"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-spacex-accent/10 border border-spacex-accent/30 text-xs font-mono text-spacex-accent hover:bg-spacex-accent/20 transition-all mx-auto w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            BACK TO MISSIONS
          </Link>
        </div>
      </div>
    );
  }

  const isSuccess = launch.success === true;
  const isFailed = launch.success === false;
  // Only treat as upcoming if the date is actually in the future
  const isUpcoming = launch.upcoming && new Date(launch.date_utc) > new Date();

  const statusLabel = isUpcoming
    ? "UPCOMING"
    : isSuccess
    ? "SUCCESS"
    : isFailed
    ? "FAILED"
    : "UNKNOWN";
  const statusColor = isUpcoming
    ? "text-spacex-warning"
    : isSuccess
    ? "text-spacex-success"
    : isFailed
    ? "text-spacex-danger"
    : "text-spacex-muted";
  const statusBg = isUpcoming
    ? "bg-spacex-warning/10 border-spacex-warning/30"
    : isSuccess
    ? "bg-spacex-success/10 border-spacex-success/30"
    : isFailed
    ? "bg-spacex-danger/10 border-spacex-danger/30"
    : "bg-spacex-muted/10 border-spacex-muted/30";
  const statusDot = isUpcoming
    ? "bg-spacex-warning animate-pulse"
    : isSuccess
    ? "bg-spacex-success"
    : isFailed
    ? "bg-spacex-danger"
    : "bg-spacex-muted";

  const totalPayloadMass = launch.payloadData.reduce(
    (sum, p) => sum + (p.mass_kg || 0),
    0
  );

  const hasPhotos = launch.links.flickr.original.length > 0;
  const hasLinks =
    launch.links.webcast ||
    launch.links.article ||
    launch.links.wikipedia ||
    launch.links.presskit ||
    launch.links.reddit.launch ||
    launch.links.reddit.campaign;

  return (
    <div className="p-4 lg:p-6 xl:p-8 space-y-4">
      {/* Back nav */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3"
      >
        <Link
          href="/missions"
          className="flex items-center gap-2 text-xs font-mono text-spacex-muted hover:text-spacex-accent transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          ALL MISSIONS
        </Link>
        <ChevronRight className="w-3 h-3 text-spacex-border" />
        <span className="text-xs font-mono text-spacex-accent truncate">
          {launch.name}
        </span>
      </motion.div>

      {/* ── Hero Section ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="glass-panel p-5 sm:p-8 hud-corners"
      >
        <div className="flex flex-col sm:flex-row items-start gap-5 sm:gap-8">
          {/* Patch */}
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-2xl bg-spacex-dark/60 border border-spacex-border/40 flex items-center justify-center shrink-0 overflow-hidden mx-auto sm:mx-0 relative">
            {launch.links.patch.large || launch.links.patch.small ? (
              <Image
                src={launch.links.patch.large || launch.links.patch.small || ""}
                alt={`${launch.name} mission patch`}
                fill
                sizes="128px"
                className="object-contain"
              />
            ) : (
              <Rocket className="w-10 h-10 text-spacex-muted/30" />
            )}
          </div>

          {/* Title + meta */}
          <div className="flex-1 min-w-0 text-center sm:text-left">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
              <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                {launch.name}
              </h1>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <span className="text-xs font-mono text-spacex-accent bg-spacex-accent/10 px-2 py-0.5 rounded">
                  #{launch.flight_number}
                </span>
                <span
                  className={`text-[10px] font-mono px-2.5 py-1 rounded border flex items-center gap-1.5 ${statusBg} ${statusColor}`}
                >
                  <div className={`w-2 h-2 rounded-full ${statusDot}`} />
                  {statusLabel}
                </span>
              </div>
            </div>

            {launch.details && (
              <p className="text-sm text-spacex-text/60 leading-relaxed mb-3 max-w-2xl">
                {launch.details}
              </p>
            )}

            {/* Quick stats row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-mono text-spacex-muted">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-spacex-accent/60" />
                {formatDate(launch.date_utc, launch.date_precision)}
              </span>
              {launch.rocketData && (
                <span className="flex items-center gap-1.5">
                  <Rocket className="w-3.5 h-3.5 text-spacex-thrust/60" />
                  {launch.rocketData.name}
                </span>
              )}
              {launch.launchpadData && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-spacex-success/60" />
                  {launch.launchpadData.name}
                </span>
              )}
              {totalPayloadMass > 0 && (
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-300/60" />
                  {formatMass(totalPayloadMass)}
                </span>
              )}
              <span className="text-spacex-muted/40">
                {timeAgo(launch.date_utc)}
              </span>
            </div>

            {/* Countdown for upcoming */}
            {isUpcoming && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-spacex-warning/10 border border-spacex-warning/20">
                <Clock className="w-4 h-4 text-spacex-warning" />
                <span className="text-sm font-mono font-bold text-spacex-warning">
                  {countdownTo(launch.date_utc)}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Mission Details + Launch Site (left column) */}
        <div className="space-y-4">
          <Section
            title="Mission Details"
            icon={<Info className="w-4 h-4" />}
            color="text-spacex-accent"
            delay={0.1}
          >
            <div className="space-y-1">
              <InfoRow label="Date (UTC)" value={formatFullDate(launch.date_utc)} />
              <InfoRow
                label="Date (Local)"
                value={formatFullDate(launch.date_local)}
              />
              <InfoRow label="Flight Number" value={`#${launch.flight_number}`} />
              {launch.window !== null && launch.window > 0 && (
                <InfoRow
                  label="Launch Window"
                  value={`${launch.window.toLocaleString()} seconds`}
                />
              )}
              {launch.static_fire_date_utc && (
                <InfoRow
                  label="Static Fire"
                  value={formatDate(launch.static_fire_date_utc)}
                />
              )}
              {launch.crew.length > 0 && (
                <InfoRow
                  label="Crew"
                  value={`${launch.crew.length} member${launch.crew.length > 1 ? "s" : ""}`}
                />
              )}
              {launch.ships.length > 0 && (
                <InfoRow
                  label="Support Ships"
                  value={resolvedShips.length > 0 ? resolvedShips.map(s => s.name).join(', ') : `${launch.ships.length} ship${launch.ships.length > 1 ? "s" : ""}`}
                />
              )}
              {launch.capsules.length > 0 && (
                <InfoRow
                  label="Capsules"
                  value={`${launch.capsules.length} capsule${launch.capsules.length > 1 ? "s" : ""}`}
                />
              )}
            </div>

            {/* Failure info */}
            {(launch.failures.length > 0 || launch.success === false) && (
              <div className="mt-4 p-3 rounded-xl bg-spacex-danger/5 border border-spacex-danger/15">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-spacex-danger" />
                  <p className="text-[10px] font-mono text-spacex-danger tracking-wider uppercase font-bold">
                    Failure Details
                  </p>
                </div>
                {launch.failures.length > 0 ? (
                  launch.failures.map((f, i) => (
                    <div key={i} className="text-xs text-spacex-text/60 mb-1 last:mb-0">
                      <span className="text-spacex-danger font-mono font-bold">
                        T+{f.time}s
                      </span>
                      {f.altitude !== null && (
                        <span className="text-spacex-muted ml-2">
                          Altitude: {f.altitude} km
                        </span>
                      )}
                      <p className="text-spacex-text/50 mt-0.5 ml-0 leading-relaxed">
                        {f.reason}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-spacex-text/60">
                    <p className="text-spacex-text/50 leading-relaxed">
                      {launch.details || "Mission ended in failure. Detailed failure analysis not yet available."}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Fairings */}
            {launch.fairings && (
              <div className="mt-4 p-3 rounded-xl bg-spacex-dark/40 border border-spacex-border/15">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="w-3.5 h-3.5 text-spacex-muted" />
                  <p className="text-[10px] font-mono text-spacex-muted tracking-wider uppercase">
                    Fairings
                  </p>
                </div>
                <div className="space-y-1">
                  <InfoRow
                    label="Reused"
                    value={
                      launch.fairings.reused === null
                        ? "Unknown"
                        : launch.fairings.reused
                        ? "Yes"
                        : "No"
                    }
                  />
                  <InfoRow
                    label="Recovery Attempt"
                    value={
                      launch.fairings.recovery_attempt === null
                        ? "Unknown"
                        : launch.fairings.recovery_attempt
                        ? "Yes"
                        : "No"
                    }
                  />
                  <InfoRow
                    label="Recovered"
                    value={
                      launch.fairings.recovered === null
                        ? "Unknown"
                        : launch.fairings.recovered
                        ? "Yes"
                        : "No"
                    }
                  />
                  {launch.fairings.ships.length > 0 && (
                    <InfoRow
                      label="Recovery Ships"
                      value={launch.fairings.ships.length.toString()}
                    />
                  )}
                </div>
              </div>
            )}
          </Section>

          {/* Launch Site — in left column to balance */}
          {launch.launchpadData && (
            <Section
              title="Launch Site"
              icon={<MapPin className="w-4 h-4" />}
              color="text-spacex-success"
              delay={0.2}
            >
              {launch.launchpadData.images.large.length > 0 && (
                <button
                  onClick={() => setModalImage(launch.launchpadData!.images.large[0])}
                  className="mb-4 w-full rounded-xl overflow-hidden border border-spacex-border/20 bg-spacex-dark/80 cursor-zoom-in hover:border-spacex-accent/40 transition-colors"
                >
                  <Image
                    src={launch.launchpadData.images.large[0]}
                    alt={launch.launchpadData.name}
                    width={800}
                    height={400}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="w-full h-auto max-h-56 object-contain mx-auto"
                  />
                </button>
              )}

              <div className="space-y-1">
                <InfoRow label="Name" value={launch.launchpadData.full_name} />
                <InfoRow
                  label="Location"
                  value={`${launch.launchpadData.locality}, ${launch.launchpadData.region}`}
                />
                <InfoRow label="Timezone" value={launch.launchpadData.timezone} />
                <InfoRow
                  label="Coordinates"
                  value={`${launch.launchpadData.latitude.toFixed(4)}° N, ${launch.launchpadData.longitude.toFixed(4)}° W`}
                />
                <InfoRow
                  label="Status"
                  value={
                    <span
                      className={
                        launch.launchpadData.status === "active"
                          ? "text-spacex-success"
                          : launch.launchpadData.status === "retired"
                          ? "text-spacex-muted"
                          : "text-spacex-warning"
                      }
                    >
                      {launch.launchpadData.status.toUpperCase()}
                    </span>
                  }
                  mono={false}
                />
                <InfoRow
                  label="Launch Record"
                  value={`${launch.launchpadData.launch_successes} / ${launch.launchpadData.launch_attempts} successful`}
                />
              </div>

              {launch.launchpadData.details && (
                <p className="mt-3 text-xs text-spacex-text/40 leading-relaxed">
                  {launch.launchpadData.details}
                </p>
              )}
            </Section>
          )}
        </div>

        {/* Vehicle */}
        {launch.rocketData && (
          <Section
            title={`Vehicle — ${launch.rocketData.name}`}
            icon={<Rocket className="w-4 h-4" />}
            color="text-spacex-thrust"
            delay={0.15}
          >
            {/* Rocket images gallery */}
            {launch.rocketData.flickr_images.length > 0 && (
              <div className="mb-4 space-y-2">
                <button
                  onClick={() => setModalImage(launch.rocketData!.flickr_images[0])}
                  className="w-full rounded-xl overflow-hidden border border-spacex-border/20 bg-spacex-dark/80 cursor-zoom-in hover:border-spacex-accent/40 transition-colors"
                >
                  <Image
                    src={launch.rocketData.flickr_images[0]}
                    alt={launch.rocketData.name}
                    width={800}
                    height={400}
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="w-full h-auto max-h-64 object-contain mx-auto"
                  />
                </button>
                {launch.rocketData.flickr_images.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {launch.rocketData.flickr_images.slice(1).map((img, i) => (
                      <button
                        key={i}
                        onClick={() => setModalImage(img)}
                        className="rounded-lg overflow-hidden border border-spacex-border/15 hover:border-spacex-accent/30 transition-all bg-spacex-dark/60 cursor-zoom-in"
                      >
                        <Image
                          src={img}
                          alt={`${launch.rocketData!.name} ${i + 2}`}
                          width={400}
                          height={200}
                          sizes="33vw"
                          className="w-full h-auto max-h-28 object-contain mx-auto"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-xs text-spacex-text/50 leading-relaxed mb-3">
              {launch.rocketData.description}
            </p>

            <div className="space-y-1">
              <InfoRow
                label="Height"
                value={`${launch.rocketData.height.meters} m (${launch.rocketData.height.feet} ft)`}
              />
              <InfoRow
                label="Diameter"
                value={`${launch.rocketData.diameter.meters} m (${launch.rocketData.diameter.feet} ft)`}
              />
              <InfoRow
                label="Mass"
                value={formatMass(launch.rocketData.mass.kg)}
              />
              <InfoRow
                label="Stages"
                value={launch.rocketData.stages.toString()}
              />
              {launch.rocketData.boosters > 0 && (
                <InfoRow
                  label="Boosters"
                  value={launch.rocketData.boosters.toString()}
                />
              )}
              <InfoRow
                label="Cost / Launch"
                value={`$${(launch.rocketData.cost_per_launch / 1e6).toFixed(1)}M`}
              />
              <InfoRow
                label="Success Rate"
                value={`${launch.rocketData.success_rate_pct}%`}
              />
              <InfoRow
                label="First Flight"
                value={formatDate(launch.rocketData.first_flight)}
              />
              <InfoRow label="Active" value={launch.rocketData.active ? "Yes" : "No"} />
            </div>

            {/* Engine details */}
            <div className="mt-4 p-3 rounded-xl bg-spacex-dark/40 border border-spacex-border/15">
              <p className="text-[10px] font-mono text-spacex-thrust tracking-wider uppercase mb-2">
                Engines
              </p>
              <div className="space-y-1">
                <InfoRow
                  label="Count"
                  value={launch.rocketData.engines.number.toString()}
                />
                <InfoRow
                  label="Type"
                  value={`${launch.rocketData.engines.type} ${launch.rocketData.engines.version}`}
                />
                {launch.rocketData.engines.layout && (
                  <InfoRow
                    label="Layout"
                    value={launch.rocketData.engines.layout}
                  />
                )}
                <InfoRow
                  label="Propellants"
                  value={`${launch.rocketData.engines.propellant_1} / ${launch.rocketData.engines.propellant_2}`}
                />
                <InfoRow
                  label="Thrust (SL)"
                  value={`${launch.rocketData.engines.thrust_sea_level.kN} kN (${launch.rocketData.engines.thrust_sea_level.lbf.toLocaleString()} lbf)`}
                />
                <InfoRow
                  label="Thrust (Vac)"
                  value={`${launch.rocketData.engines.thrust_vacuum.kN} kN (${launch.rocketData.engines.thrust_vacuum.lbf.toLocaleString()} lbf)`}
                />
                <InfoRow
                  label="ISP"
                  value={`${launch.rocketData.engines.isp.sea_level}s (SL) / ${launch.rocketData.engines.isp.vacuum}s (Vac)`}
                />
              </div>
            </div>

            {/* Stage details */}
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-spacex-dark/40 border border-spacex-border/15">
                <p className="text-[10px] font-mono text-spacex-thrust/70 tracking-wider uppercase mb-2">
                  First Stage
                </p>
                <div className="space-y-1">
                  <InfoRow
                    label="Engines"
                    value={launch.rocketData.first_stage.engines.toString()}
                  />
                  <InfoRow
                    label="Reusable"
                    value={launch.rocketData.first_stage.reusable ? "Yes" : "No"}
                  />
                  <InfoRow
                    label="Fuel"
                    value={`${launch.rocketData.first_stage.fuel_amount_tons}t`}
                  />
                  {launch.rocketData.first_stage.burn_time_sec !== null && (
                    <InfoRow
                      label="Burn Time"
                      value={`${launch.rocketData.first_stage.burn_time_sec}s`}
                    />
                  )}
                  <InfoRow
                    label="Thrust (SL)"
                    value={`${launch.rocketData.first_stage.thrust_sea_level.kN} kN`}
                  />
                  <InfoRow
                    label="Thrust (Vac)"
                    value={`${launch.rocketData.first_stage.thrust_vacuum.kN} kN`}
                  />
                </div>
              </div>
              <div className="p-3 rounded-xl bg-spacex-dark/40 border border-spacex-border/15">
                <p className="text-[10px] font-mono text-spacex-thrust/70 tracking-wider uppercase mb-2">
                  Second Stage
                </p>
                <div className="space-y-1">
                  <InfoRow
                    label="Engines"
                    value={launch.rocketData.second_stage.engines.toString()}
                  />
                  <InfoRow
                    label="Reusable"
                    value={launch.rocketData.second_stage.reusable ? "Yes" : "No"}
                  />
                  <InfoRow
                    label="Fuel"
                    value={`${launch.rocketData.second_stage.fuel_amount_tons}t`}
                  />
                  {launch.rocketData.second_stage.burn_time_sec !== null && (
                    <InfoRow
                      label="Burn Time"
                      value={`${launch.rocketData.second_stage.burn_time_sec}s`}
                    />
                  )}
                  <InfoRow
                    label="Thrust"
                    value={`${launch.rocketData.second_stage.thrust.kN} kN (${launch.rocketData.second_stage.thrust.lbf.toLocaleString()} lbf)`}
                  />
                </div>
              </div>
            </div>

            {launch.rocketData.wikipedia && (
              <a
                href={launch.rocketData.wikipedia}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 flex items-center gap-2 text-[10px] font-mono text-spacex-muted hover:text-spacex-accent transition-colors"
              >
                <Globe className="w-3 h-3" />
                Wikipedia — {launch.rocketData.name}
                <ExternalLink className="w-2.5 h-2.5 ml-auto opacity-40" />
              </a>
            )}
          </Section>
        )}
      </div>

      {/* ── Payloads & Boosters (full-width) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payloads */}
        {launch.payloadData.length > 0 && (
          <Section
            title={`Payloads (${launch.payloadData.length})`}
            icon={<Package className="w-4 h-4" />}
            color="text-emerald-300"
            delay={0.25}
          >
            <div className="space-y-3">
              {launch.payloadData.map((payload) => (
                <PayloadCard key={payload.id} payload={payload} />
              ))}
            </div>
          </Section>
        )}

        {/* Cores / Boosters */}
        {launch.coreData.some(Boolean) && (
          <Section
            title={`Boosters (${launch.cores.length})`}
            icon={<Repeat className="w-4 h-4" />}
            color="text-amber-400"
            delay={0.3}
          >
            <div className="space-y-3">
              {launch.cores.map((coreRef, i) => {
                const core = launch.coreData[i];
                if (!core) return null;
                return (
                  <CoreCard key={core.id} core={core} coreRef={coreRef} />
                );
              })}
            </div>
          </Section>
        )}
      </div>

      {/* ── Photo Gallery ── */}
      {hasPhotos && (
        <Section
          title={`Mission Photos (${launch.links.flickr.original.length})`}
          icon={<ImageIcon className="w-4 h-4" />}
          color="text-spacex-accent"
          delay={0.35}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {launch.links.flickr.original.map((url, i) => (
              <button
                key={i}
                onClick={() => setModalImage(url)}
                className="rounded-xl overflow-hidden border border-spacex-border/20 hover:border-spacex-accent/40 transition-all group bg-spacex-dark/60 cursor-zoom-in"
              >
                <Image
                  src={url}
                  alt={`${launch.name} photo ${i + 1}`}
                  width={800}
                  height={500}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="w-full h-auto max-h-72 object-contain mx-auto group-hover:scale-[1.02] transition-transform duration-500"
                />
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* ── External Links ── */}
      {hasLinks && (
        <Section
          title="External Links"
          icon={<ExternalLink className="w-4 h-4" />}
          color="text-spacex-accent"
          delay={0.4}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {launch.links.webcast && (
              <ExtLink
                href={launch.links.webcast}
                icon={<Play className="w-4 h-4" />}
                label="Watch Webcast"
                color="text-red-400"
              />
            )}
            {launch.links.article && (
              <ExtLink
                href={launch.links.article}
                icon={<FileText className="w-4 h-4" />}
                label="Read Article"
                color="text-spacex-accent"
              />
            )}
            {launch.links.wikipedia && (
              <ExtLink
                href={launch.links.wikipedia}
                icon={<Globe className="w-4 h-4" />}
                label="Wikipedia"
                color="text-spacex-muted"
              />
            )}
            {launch.links.presskit && (
              <ExtLink
                href={launch.links.presskit}
                icon={<FileText className="w-4 h-4" />}
                label="Press Kit"
                color="text-spacex-warning"
              />
            )}
            {launch.links.reddit.launch && (
              <ExtLink
                href={launch.links.reddit.launch}
                icon={<ExternalLink className="w-4 h-4" />}
                label="Reddit — Launch"
                color="text-spacex-thrust"
              />
            )}
            {launch.links.reddit.campaign && (
              <ExtLink
                href={launch.links.reddit.campaign}
                icon={<ExternalLink className="w-4 h-4" />}
                label="Reddit — Campaign"
                color="text-spacex-thrust"
              />
            )}
            {launch.links.reddit.recovery && (
              <ExtLink
                href={launch.links.reddit.recovery}
                icon={<ExternalLink className="w-4 h-4" />}
                label="Reddit — Recovery"
                color="text-spacex-thrust"
              />
            )}
            {launch.links.reddit.media && (
              <ExtLink
                href={launch.links.reddit.media}
                icon={<ExternalLink className="w-4 h-4" />}
                label="Reddit — Media"
                color="text-spacex-thrust"
              />
            )}
          </div>
        </Section>
      )}

      {/* ── Recovery Fleet & Docking ── */}
      {(resolvedShips.length > 0 || launchDockings.length > 0) && (
        <Section
          title={`Recovery & Docking${resolvedShips.length > 0 ? ` (${resolvedShips.length} ships)` : ''}${launchDockings.length > 0 ? ` · ${launchDockings.length} docking event${launchDockings.length > 1 ? 's' : ''}` : ''}`}
          icon={<Anchor className="w-4 h-4" />}
          color="text-emerald-400"
          delay={0.3}
        >
          {/* Ships Grid */}
          {resolvedShips.length > 0 && (
            <div className="space-y-3 mb-4">
              <p className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-semibold">
                Recovery Fleet
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {resolvedShips.map((ship) => (
                  <div
                    key={ship.id}
                    className="glass-panel p-3 hud-corners hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="flex gap-3">
                      {ship.image && (
                        <div className="relative w-20 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-spacex-border/20">
                          <Image
                            src={ship.image}
                            alt={ship.name}
                            fill
                            sizes="80px"
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">
                            {ship.name}
                          </h4>
                          {ship.active && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                        </div>
                        {ship.roles && ship.roles.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ship.roles.map((role) => (
                              <span key={role} className="text-[8px] font-mono text-emerald-400/70 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/15 uppercase">
                                {role}
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-3 mt-1.5 text-[9px] font-mono text-spacex-muted">
                          {ship.home_port && <span>{ship.home_port}</span>}
                          {ship.year_built && <span>Built {ship.year_built}</span>}
                          {ship.mass_kg && <span>{(ship.mass_kg / 1000).toFixed(0)}t</span>}
                        </div>
                      </div>
                    </div>
                    {ship.link && (
                      <a
                        href={ship.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 mt-2 text-[9px] font-mono text-spacex-muted hover:text-emerald-400 transition-colors"
                      >
                        <ExternalLink className="w-2.5 h-2.5" />
                        MarineTraffic
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Docking Events */}
          {launchDockings.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-mono text-amber-400 uppercase tracking-wider font-semibold">
                Docking Events
              </p>
              {launchDockings.map((dock) => (
                <div
                  key={dock.id}
                  className="glass-panel p-4 hud-corners border-white/10 hover:border-white/30 transition-all"
                >
                  <div className="flex items-start gap-3">
                    {dock.image && (
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border border-spacex-border/20">
                        <Image
                          src={dock.image}
                          alt={dock.spacecraft_name}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-white">
                        {dock.spacecraft_name}
                      </h4>
                      <p className="text-[10px] font-mono text-amber-400/80 mt-0.5">
                        {dock.spacecraft_type} → {dock.destination}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-[10px] font-mono">
                        <div>
                          <span className="text-amber-400">DOCK </span>
                          <span className="text-white">{new Date(dock.docking).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        {dock.departure && (
                          <div>
                            <span className="text-amber-400">UNDOCK </span>
                            <span className="text-white">{new Date(dock.departure).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[9px] font-mono text-spacex-muted mt-1">
                        Port: {dock.docking_location} · {dock.station}
                      </p>
                      {dock.description && (
                        <p className="text-[11px] text-spacex-muted/80 mt-2 leading-relaxed line-clamp-3">
                          {dock.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      )}

      {/* ── News Coverage ── */}
      {missionCoverage.total > 0 && (
        <Section
          title={`News Coverage (${missionCoverage.total})`}
          icon={<Newspaper className="w-4 h-4" />}
          color="text-amber-400"
          delay={0.42}
        >
          {/* Coverage stats bar */}
          <div className="flex flex-wrap items-center gap-3 mb-4 p-3 rounded-xl bg-spacex-dark/40 border border-spacex-border/15">
            <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
              <Newspaper className="w-3.5 h-3.5" />
              <span>{missionCoverage.articles.length} article{missionCoverage.articles.length !== 1 ? "s" : ""}</span>
            </div>
            {missionCoverage.blogs.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{missionCoverage.blogs.length} blog{missionCoverage.blogs.length !== 1 ? "s" : ""}</span>
              </div>
            )}
            {missionCoverage.reports.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
                <FileText className="w-3.5 h-3.5" />
                <span>{missionCoverage.reports.length} report{missionCoverage.reports.length !== 1 ? "s" : ""}</span>
              </div>
            )}
            <div className="h-3 w-px bg-spacex-border/20" />
            {coverageWithContent > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-spacex-success">
                <FileText className="w-3 h-3" />
                {coverageWithContent} with full text
              </div>
            )}
            {totalCoverageWords > 0 && (
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-spacex-muted">
                <Clock className="w-3 h-3" />
                {totalCoverageWords.toLocaleString()} total words · {Math.max(1, Math.ceil(totalCoverageWords / 230))} min read
              </div>
            )}
          </div>

          {/* Unique news sources */}
          {(() => {
            const sources = new Set([
              ...missionCoverage.articles.map((a) => a.news_site),
              ...missionCoverage.blogs.map((b) => b.news_site),
              ...missionCoverage.reports.map((r) => r.news_site),
            ]);
            return sources.size > 1 ? (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {Array.from(sources).map((site) => {
                  const sc = SOURCE_COLORS[site] || "text-spacex-muted border-spacex-border/30 bg-spacex-dark/40";
                  return (
                    <span key={site} className={`text-[8px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border ${sc}`}>
                      {site}
                    </span>
                  );
                })}
              </div>
            ) : null;
          })()}

          {/* Articles */}
          {missionCoverage.articles.length > 0 && (
            <div className="space-y-3 mb-4">
              {missionCoverage.articles.length > 1 && (
                <h3 className="text-[10px] font-mono text-amber-400/70 uppercase tracking-wider flex items-center gap-1.5">
                  <Newspaper className="w-3 h-3" />
                  Articles
                </h3>
              )}
              {missionCoverage.articles.map((article) => (
                <ArticleContentCard key={`a-${article.id}`} article={article} type="article" />
              ))}
            </div>
          )}

          {/* Blogs */}
          {missionCoverage.blogs.length > 0 && (
            <div className="space-y-3 mb-4">
              <h3 className="text-[10px] font-mono text-amber-400/70 uppercase tracking-wider flex items-center gap-1.5">
                <BookOpen className="w-3 h-3" />
                Blogs
              </h3>
              {missionCoverage.blogs.map((blog) => (
                <ArticleContentCard key={`b-${blog.id}`} article={blog} type="blog" />
              ))}
            </div>
          )}

          {/* Reports */}
          {missionCoverage.reports.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-mono text-amber-400/70 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3 h-3" />
                Reports
              </h3>
              {missionCoverage.reports.map((report) => (
                <ArticleContentCard key={`r-${report.id}`} article={report} type="report" />
              ))}
            </div>
          )}
        </Section>
      )}
      {newsLoading && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel p-4 hud-corners flex items-center gap-3"
        >
          <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
          <span className="text-xs font-mono text-spacex-muted">Loading news coverage...</span>
        </motion.div>
      )}

      {/* ── YouTube Embed ── */}
      {launch.links.youtube_id && (
        <Section
          title="Webcast"
          icon={<Play className="w-4 h-4" />}
          color="text-red-400"
          delay={0.45}
        >
          <div className="aspect-video rounded-xl overflow-hidden border border-spacex-border/20">
            <iframe
              src={`https://www.youtube.com/embed/${launch.links.youtube_id}`}
              title={`${launch.name} webcast`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
        </Section>
      )}

      {/* ── Prev / Next Navigation ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-stretch gap-3"
      >
        {adjacentLaunches.next ? (
          <Link
            href={`/missions/${adjacentLaunches.next.id}`}
            className="flex-1 glass-panel p-4 hud-corners hover:border-spacex-accent/20 transition-all group"
          >
            <p className="text-[9px] font-mono text-spacex-muted tracking-wider uppercase mb-1">
              ← PREVIOUS LAUNCH
            </p>
            <p className="text-sm font-semibold text-white group-hover:text-spacex-accent transition-colors truncate">
              {adjacentLaunches.next.name}
            </p>
            <p className="text-[10px] font-mono text-spacex-muted mt-0.5">
              #{adjacentLaunches.next.flight_number} —{" "}
              {formatDate(adjacentLaunches.next.date_utc, adjacentLaunches.next.date_precision)}
            </p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}

        {adjacentLaunches.prev ? (
          <Link
            href={`/missions/${adjacentLaunches.prev.id}`}
            className="flex-1 glass-panel p-4 hud-corners hover:border-spacex-accent/20 transition-all group text-right"
          >
            <p className="text-[9px] font-mono text-spacex-muted tracking-wider uppercase mb-1">
              NEXT LAUNCH →
            </p>
            <p className="text-sm font-semibold text-white group-hover:text-spacex-accent transition-colors truncate">
              {adjacentLaunches.prev.name}
            </p>
            <p className="text-[10px] font-mono text-spacex-muted mt-0.5">
              #{adjacentLaunches.prev.flight_number} —{" "}
              {formatDate(adjacentLaunches.prev.date_utc, adjacentLaunches.prev.date_precision)}
            </p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </motion.div>

      {/* Disclaimer */}
      <p className="text-[9px] font-mono text-white/15 text-center mt-8 pb-2">
        All data sourced from public APIs and publicly available sources. Not affiliated with SpaceX or any other agency.
      </p>

      {/* ── Image Modal ── */}
      <AnimatePresence>
        {modalImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 cursor-zoom-out"
            onClick={() => setModalImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative max-w-5xl w-full max-h-[90vh]"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              <button
                onClick={() => setModalImage(null)}
                className="absolute -top-10 right-0 text-white/60 hover:text-white text-sm font-mono tracking-wider transition-colors"
              >
                ESC TO CLOSE
              </button>
              <div className="rounded-2xl overflow-hidden border border-spacex-border/30 bg-spacex-dark/90 shadow-2xl">
                <Image
                  src={modalImage}
                  alt="Enlarged view"
                  width={1600}
                  height={1000}
                  sizes="90vw"
                  className="w-full h-auto max-h-[85vh] object-contain"
                  priority
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
