"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Rocket,
  ExternalLink,
  Search,
  Filter,
  ArrowUpDown,
  MapPin,
  Calendar,
  Repeat,
  ArrowDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { useSpaceXData } from "@/lib/spacex/hooks";
import type { EnrichedLaunch, LaunchStats } from "@/lib/spacex/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(dateUTC: string, precision: string): string {
  const d = new Date(dateUTC);
  switch (precision) {
    case "hour":
    case "day":
      return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
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
        month: "short",
        day: "numeric",
      });
  }
}



function timeAgo(dateUTC: string): string {
  const diff = Date.now() - new Date(dateUTC).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days < 0) {
    const absDays = Math.abs(days);
    if (absDays < 30) return `in ${absDays}d`;
    if (absDays < 365) return `in ${Math.floor(absDays / 30)}mo`;
    return `in ${Math.floor(absDays / 365)}yr`;
  }
  if (days === 0) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}yr ago`;
}

type SortField = "date" | "name" | "flight_number";
type SortDir = "asc" | "desc";
type StatusFilter = "all" | "success" | "failed" | "upcoming";

// ─── Stats Banner ───────────────────────────────────────────────────────────

function StatsBanner({ stats }: { stats: LaunchStats }) {
  const statItems = [
    {
      label: "Launches",
      value: stats.totalLaunches.toLocaleString(),
      sub: stats.upcomingLaunches > 0 ? `${stats.upcomingLaunches} scheduled` : "completed",
      color: "text-spacex-accent",
    },
    {
      label: "Success Rate",
      value: `${stats.successRate}%`,
      sub: `${stats.failedLaunches} failed out of ${stats.totalLaunches}`,
      color: "text-spacex-success",
    },
    {
      label: "Rockets Landed",
      value: stats.totalLandingSuccesses.toLocaleString(),
      sub: `${stats.landingSuccessRate}% of attempts`,
      color: "text-spacex-thrust",
    },
    {
      label: "Sent to Space",
      value: `${(stats.totalPayloadMassKg / 1000).toFixed(0)}+ tons`,
      sub: "total cargo to orbit",
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {statItems.map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-panel p-3 hud-corners"
        >
          <p className="text-[9px] font-mono text-spacex-muted tracking-wider uppercase">
            {item.label}
          </p>
          <p className={`text-xl font-mono font-bold ${item.color} mt-1`}>
            {item.value}
          </p>
          <p className="text-[9px] font-mono text-spacex-muted mt-0.5">
            {item.sub}
          </p>
        </motion.div>
      ))}
    </div>
  );
}

// ─── Launch Outcomes ──────────────────────────────────────────────────────

function LaunchOutcomes({ stats }: { stats: LaunchStats }) {
  const items = [
    { label: "Successful", count: stats.successfulLaunches, color: "bg-spacex-success", textColor: "text-spacex-success" },
    { label: "Failed", count: stats.failedLaunches, color: "bg-red-500", textColor: "text-red-400" },
    { label: "Upcoming", count: stats.upcomingLaunches, color: "bg-spacex-accent", textColor: "text-spacex-accent" },
  ].filter(i => i.count > 0);
  const total = items.reduce((a, b) => a + b.count, 0);

  return (
    <div className="glass-panel p-4 hud-corners">
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-4 h-4 text-spacex-success" />
        <h3 className="text-xs font-mono font-semibold text-spacex-success tracking-wider uppercase">
          Launch Outcomes
        </h3>
      </div>
      {/* Stacked bar */}
      <div className="h-3 rounded-full bg-spacex-dark/60 overflow-hidden flex mb-4">
        {items.map((item) => (
          <motion.div
            key={item.label}
            initial={{ width: 0 }}
            animate={{ width: `${(item.count / total) * 100}%` }}
            transition={{ duration: 0.8 }}
            className={`h-full ${item.color} first:rounded-l-full last:rounded-r-full`}
          />
        ))}
      </div>
      <div className="flex items-center justify-around">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className={`text-lg font-mono font-bold ${item.textColor}`}>{item.count}</p>
            <p className="text-[9px] font-mono text-spacex-muted">{item.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Rocket Breakdown ───────────────────────────────────────────────────────

function RocketBreakdown({ data }: { data: Record<string, number> }) {
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(data)
    .sort(([, a], [, b]) => b - a)
    .filter(([name]) => name !== "Unknown");
  const colors = [
    "bg-spacex-accent",
    "bg-spacex-thrust",
    "bg-spacex-success",
    "bg-purple-500",
  ];

  return (
    <div className="glass-panel p-4 hud-corners">
      <div className="flex items-center gap-2 mb-3">
        <Rocket className="w-4 h-4 text-spacex-thrust" />
        <h3 className="text-xs font-mono font-semibold text-spacex-thrust tracking-wider uppercase">
          Rockets Used
        </h3>
      </div>
      <div className="space-y-2.5">
        {sorted.map(([name, count], i) => {
          const pct = ((count / total) * 100).toFixed(1);
          return (
            <div key={name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono text-white">{name}</span>
                <span className="text-[10px] font-mono text-spacex-muted">
                  {count} ({pct}%)
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-spacex-dark/60 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                  className={`h-full rounded-full ${colors[i % colors.length]}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Launch Card ────────────────────────────────────────────────────────────

function LaunchCard({
  launch,
  index,
}: {
  launch: EnrichedLaunch;
  index: number;
}) {
  const isSuccess = launch.success === true;
  const isFailed = launch.success === false;
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
    ? "bg-spacex-warning/10"
    : isSuccess
    ? "bg-spacex-success/10"
    : isFailed
    ? "bg-spacex-danger/10"
    : "bg-spacex-muted/10";
  const statusDot = isUpcoming
    ? "bg-spacex-warning animate-pulse"
    : isSuccess
    ? "bg-spacex-success"
    : isFailed
    ? "bg-spacex-danger"
    : "bg-spacex-muted";
  const borderHover = isUpcoming
    ? "hover:border-spacex-warning/20"
    : isSuccess
    ? "hover:border-spacex-success/20"
    : isFailed
    ? "hover:border-spacex-danger/20"
    : "hover:border-spacex-accent/20";

  const landingInfo = launch.cores
    .filter((c) => c.landing_attempt)
    .map((c) => ({
      success: c.landing_success,
      type: c.landing_type,
    }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.5) }}
    >
      <Link
        href={`/missions/${launch.id}`}
        className={`glass-panel overflow-hidden transition-all group ${borderHover} block p-4 sm:p-5`}
      >
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Patch + core info */}
          <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
            {/* Mission patch */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-spacex-dark/60 border border-spacex-border/40 flex items-center justify-center shrink-0 overflow-hidden relative">
              {launch.links.patch.small ? (
                <Image
                  src={launch.links.patch.small}
                  alt={`${launch.name} patch`}
                  fill
                  sizes="56px"
                  className="object-contain"
                />
              ) : (
                <Rocket className="w-5 h-5 text-spacex-muted/40" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-sm sm:text-base font-semibold text-white truncate group-hover:text-spacex-accent transition-colors">
                  {launch.name}
                </span>
                <span className="text-[10px] font-mono text-spacex-accent bg-spacex-accent/10 px-1.5 py-0.5 rounded shrink-0">
                  #{launch.flight_number}
                </span>
                <span
                  className={`text-[9px] font-mono px-2 py-0.5 rounded ${statusBg} ${statusColor} flex items-center gap-1 shrink-0`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                  {statusLabel}
                </span>
              </div>

              {launch.details && (
                <p className="text-[11px] text-spacex-text/50 line-clamp-1 mb-1.5">
                  {launch.details}
                </p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-spacex-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-spacex-accent/50" />
                  {formatDate(launch.date_utc, launch.date_precision)}
                </span>
                {launch.rocketData && (
                  <span className="flex items-center gap-1">
                    <Rocket className="w-3 h-3 text-spacex-thrust/50" />
                    {launch.rocketData.name}
                  </span>
                )}
                {launch.launchpadData && (
                  <span className="flex items-center gap-1 hidden sm:flex">
                    <MapPin className="w-3 h-3 text-spacex-success/50" />
                    {launch.launchpadData.name}
                  </span>
                )}
                <span className="text-spacex-muted/40 hidden sm:inline">
                  {timeAgo(launch.date_utc)}
                </span>
              </div>
            </div>
          </div>

          {/* Right side: landing badges + reuse */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 sm:ml-auto">
            {landingInfo.length > 0 && (
              <div className="flex items-center gap-1.5">
                {landingInfo.map((l, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono ${
                      l.success
                        ? "bg-spacex-success/10 text-spacex-success"
                        : l.success === false
                        ? "bg-spacex-danger/10 text-spacex-danger"
                        : "bg-spacex-muted/10 text-spacex-muted"
                    }`}
                  >
                    <ArrowDown className="w-2.5 h-2.5" />
                    {l.type || "?"}
                  </div>
                ))}
              </div>
            )}

            {launch.cores.some((c) => c.reused) && (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-[8px] font-mono text-purple-400">
                <Repeat className="w-2.5 h-2.5" />
                B{launch.cores[0]?.flight || "?"}
              </div>
            )}

            <ExternalLink className="w-3.5 h-3.5 text-spacex-muted/30 group-hover:text-spacex-accent transition-colors" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 20;

export default function MissionsPage() {
  const { enrichedLaunches, stats, loading, error, refetch } = useSpaceXData();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [rocketFilter, setRocketFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [showCount, setShowCount] = useState(ITEMS_PER_PAGE);

  // Get unique rocket names for filter
  const rocketNames = useMemo(() => {
    const names = new Set<string>();
    enrichedLaunches.forEach((l) => {
      if (l.rocketData) names.add(l.rocketData.name);
    });
    return Array.from(names).sort();
  }, [enrichedLaunches]);

  // Filter + sort
  const filtered = useMemo(() => {
    let result = [...enrichedLaunches];

    // Status filter
    if (statusFilter === "success")
      result = result.filter((l) => l.success === true);
    else if (statusFilter === "failed")
      result = result.filter((l) => l.success === false);
    else if (statusFilter === "upcoming")
      result = result.filter((l) => l.upcoming && new Date(l.date_utc) > new Date());

    // Rocket filter
    if (rocketFilter !== "all") {
      result = result.filter((l) => l.rocketData?.name === rocketFilter);
    }

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.details?.toLowerCase().includes(q) ||
          l.rocketData?.name.toLowerCase().includes(q) ||
          l.launchpadData?.name.toLowerCase().includes(q) ||
          l.payloadData.some((p) => p.name.toLowerCase().includes(q)) ||
          l.payloadData.some((p) =>
            p.customers.some((c) => c.toLowerCase().includes(q))
          ) ||
          l.flight_number.toString().includes(q)
      );
    }

    // Sort
    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "date":
          cmp = a.date_unix - b.date_unix;
          break;
        case "name":
          cmp = a.name.localeCompare(b.name);
          break;
        case "flight_number":
          cmp = a.flight_number - b.flight_number;
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [enrichedLaunches, statusFilter, rocketFilter, search, sortField, sortDir]);

  const visible = filtered.slice(0, showCount);
  const hasMore = showCount < filtered.length;

  function toggleSort(field: SortField) {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-4 lg:p-6 flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-spacex-accent animate-spin mx-auto mb-4" />
          <p className="text-sm font-mono text-spacex-muted">
            Fetching mission data...
          </p>
          <p className="text-[10px] font-mono text-spacex-muted/50 mt-1">
            Loading launches, rockets, payloads, cores, and launchpads
          </p>
        </div>
      </div>
    );
  }

  // Error state
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

  return (
    <div className="p-4 lg:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="font-display text-lg sm:text-xl font-bold text-white">
            MISSIONS
          </h1>
          <p className="text-xs sm:text-sm text-spacex-muted mt-1">
            All {enrichedLaunches.length} launches — real-time data from launch API
          </p>
        </div>
        <button
          onClick={refetch}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-spacex-dark/50 border border-spacex-border/30 text-[10px] font-mono text-spacex-muted hover:text-spacex-accent hover:border-spacex-accent/30 transition-all w-fit"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          REFRESH DATA
        </button>
      </div>

      {/* Stats banner */}
      {stats && <StatsBanner stats={stats} />}

      {/* Charts row */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <LaunchOutcomes stats={stats} />
          <RocketBreakdown data={stats.launchesByRocket} />
        </div>
      )}

      {/* Filters + Search + Sort */}
      <div className="glass-panel p-3 sm:p-4 hud-corners">
        <div className="flex flex-col gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-spacex-muted" />
            <input
              type="text"
              placeholder="Search missions, payloads, customers..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowCount(ITEMS_PER_PAGE);
              }}
              className="w-full h-9 pl-9 pr-4 rounded-lg bg-spacex-dark/80 border border-spacex-border/50 text-sm text-spacex-text placeholder:text-spacex-muted/40 focus:outline-none focus:border-spacex-accent/40 focus:ring-1 focus:ring-spacex-accent/20 transition-all"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status filter */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <Filter className="w-3.5 h-3.5 text-spacex-muted shrink-0" />
              {(
                [
                  { key: "all", label: "All" },
                  { key: "success", label: "Success" },
                  { key: "failed", label: "Failed" },
                  { key: "upcoming", label: "Upcoming" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => {
                    setStatusFilter(key);
                    setShowCount(ITEMS_PER_PAGE);
                  }}
                  className={`text-[9px] sm:text-[10px] font-mono px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-md transition-all uppercase tracking-wider ${
                    statusFilter === key
                      ? "bg-spacex-accent/15 text-spacex-accent border border-spacex-accent/30"
                      : "text-spacex-muted hover:text-white bg-spacex-dark/30 border border-spacex-border/30"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Rocket filter */}
            <div className="flex items-center gap-1.5 sm:ml-auto flex-wrap">
              <Rocket className="w-3.5 h-3.5 text-spacex-muted shrink-0" />
              <select
                value={rocketFilter}
                onChange={(e) => {
                  setRocketFilter(e.target.value);
                  setShowCount(ITEMS_PER_PAGE);
                }}
                className="text-[10px] font-mono px-2 py-1.5 rounded-md bg-spacex-dark/60 border border-spacex-border/30 text-spacex-text focus:outline-none focus:border-spacex-accent/40 appearance-none pr-6 cursor-pointer"
              >
                <option value="all">All Vehicles</option>
                {rocketNames.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>

              {/* Sort */}
              <div className="flex items-center gap-1">
                <ArrowUpDown className="w-3.5 h-3.5 text-spacex-muted" />
                {(
                  [
                    { field: "date" as SortField, label: "Date" },
                    { field: "name" as SortField, label: "Name" },
                    { field: "flight_number" as SortField, label: "#" },
                  ] as const
                ).map(({ field, label }) => (
                  <button
                    key={field}
                    onClick={() => toggleSort(field)}
                    className={`text-[9px] sm:text-[10px] font-mono px-2 py-1 rounded-md transition-all ${
                      sortField === field
                        ? "bg-spacex-accent/15 text-spacex-accent border border-spacex-accent/30"
                        : "text-spacex-muted hover:text-white bg-spacex-dark/30 border border-spacex-border/30"
                    }`}
                  >
                    {label}
                    {sortField === field && (
                      <span className="ml-0.5">
                        {sortDir === "desc" ? "↓" : "↑"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Result count */}
        <div className="mt-2 text-[10px] font-mono text-spacex-muted">
          Showing {Math.min(showCount, filtered.length)} of {filtered.length}{" "}
          missions
          {search && ` matching "${search}"`}
        </div>
      </div>

      {/* Launch list */}
      <div className="space-y-2">
        {visible.map((launch, i) => (
          <LaunchCard key={launch.id} launch={launch} index={i} />
        ))}
      </div>

      {/* Load more */}
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={() => setShowCount((c) => c + ITEMS_PER_PAGE)}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-spacex-accent/10 border border-spacex-accent/20 text-xs font-mono text-spacex-accent hover:bg-spacex-accent/20 transition-all"
          >
            LOAD MORE ({filtered.length - showCount} remaining)
          </button>
        </div>
      )}

      {/* Empty state */}
      {filtered.length === 0 && !loading && (
        <div className="glass-panel p-8 text-center hud-corners">
          <Search className="w-8 h-8 text-spacex-muted/30 mx-auto mb-3" />
          <p className="text-sm font-mono text-spacex-muted">
            No missions found
          </p>
          <p className="text-[10px] text-spacex-muted/50 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <p className="text-[9px] font-mono text-white/15 text-center mt-8 pb-2">
        All data sourced from public APIs and publicly available sources. Not affiliated with SpaceX or any other agency.
      </p>
    </div>
  );
}
