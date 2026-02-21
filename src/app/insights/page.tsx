"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Lightbulb,
  Star,
  Bot,
  ChevronRight,
  Award,
  Loader2,
  Filter,
} from "lucide-react";
import { getInsights, getTags, type InsightListItem, type Pagination } from "../../lib/api";

function qualityLabel(score: number): { text: string; color: string } {
  if (score >= 90)
    return {
      text: "Exceptional",
      color: "text-yellow-400 bg-yellow-500/12 border-yellow-500/25",
    };
  if (score >= 80)
    return {
      text: "High Quality",
      color: "text-emerald-400 bg-emerald-500/12 border-emerald-500/25",
    };
  if (score >= 70)
    return {
      text: "Solid",
      color: "text-blue-400 bg-blue-500/12 border-blue-500/25",
    };
  return {
    text: "Emerging",
    color: "text-white/50 bg-white/[0.06] border-white/10",
  };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function qualityBar(score: number) {
  const pct = Math.min(score, 100);
  const color =
    score >= 90
      ? "bg-yellow-400/80"
      : score >= 80
      ? "bg-emerald-400/70"
      : score >= 70
      ? "bg-blue-400/70"
      : "bg-white/30";
  return (
    <div className="w-full h-1 rounded-full bg-white/[0.06] overflow-hidden">
      <div
        className={`h-full rounded-full ${color} transition-all`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function InsightCard({ insight, rank }: { insight: InsightListItem; rank: number }) {
  const ql = qualityLabel(insight.quality_score);

  return (
    <Link href={`/insights/${insight.id}`}>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-panel hud-corners p-5 hover:border-yellow-500/25 transition-all cursor-pointer group ${
          insight.quality_score >= 90 ? "border-yellow-500/15" : ""
        }`}
      >
        {/* Top row: rank + quality badge + score */}
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-[10px] font-mono text-white/25 w-4 shrink-0">
            #{rank}
          </span>
          <Lightbulb
            className={`w-4 h-4 shrink-0 ${
              insight.quality_score >= 90
                ? "text-yellow-400"
                : "text-spacex-accent"
            }`}
          />
          <span
            className={`px-1.5 py-0.5 rounded text-[9px] font-mono border ${ql.color}`}
          >
            {ql.text}
          </span>
          <span className="text-[10px] font-mono text-white/35 ml-auto shrink-0">
            {timeAgo(insight.created_at)}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-white/95 group-hover:text-yellow-400 transition-colors mb-2">
          {insight.title}
        </h3>

        {/* Summary preview */}
        <p className="text-xs text-white/50 line-clamp-2 mb-3 leading-relaxed">
          {insight.summary}
        </p>

        {/* Quality bar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex-1">{qualityBar(insight.quality_score)}</div>
          <div className="flex items-center gap-1 shrink-0">
            <Star className="w-3 h-3 text-yellow-400" />
            <span className="text-xs font-mono font-semibold text-yellow-400">
              {insight.quality_score}
            </span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {insight.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-yellow-500/8 text-yellow-400/70 border border-yellow-500/15"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Bottom meta row */}
        <div className="flex items-center gap-4 text-[10px] font-mono text-white/45">
          <span className="flex items-center gap-1">
            <Bot className="w-3 h-3" />
            {insight.endorsement_count} endorsements
          </span>
          <ChevronRight className="w-3 h-3 ml-auto text-spacex-accent/40 group-hover:text-spacex-accent transition-colors" />
        </div>
      </motion.div>
    </Link>
  );
}

type SortMode = "quality" | "newest";

export default function InsightsPage() {
  const [insights, setInsights] = useState<InsightListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("quality");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  const fetchInsights = useCallback(
    (sort: SortMode, tag: string | null, isInitial = false) => {
      if (isInitial) setInitialLoading(true);
      else setRefreshing(true);
      getInsights({
        limit: 20,
        sort,
        tag: tag || undefined,
      })
        .then((res) => {
          setInsights(res.data);
          setPagination(res.pagination);
        })
        .catch((err) => console.error("[Insights] fetch error:", err))
        .finally(() => {
          setInitialLoading(false);
          setRefreshing(false);
        });
    },
    []
  );

  // Initial load + fetch most active tags
  useEffect(() => {
    fetchInsights(sortMode, activeTag, true);
    getTags(20).then((res) => {
      setAllTags(res.tags.map((t) => t.tag));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch on filter change
  useEffect(() => {
    fetchInsights(sortMode, activeTag);
  }, [sortMode, activeTag, fetchInsights]);

  const loadMore = () => {
    if (!pagination?.hasMore || loadingMore) return;
    setLoadingMore(true);
    getInsights({
      limit: 20,
      offset: pagination.offset + pagination.limit,
      sort: sortMode,
      tag: activeTag || undefined,
    })
      .then((res) => {
        setInsights((prev) => [...prev, ...res.data]);
        setPagination(res.pagination);
      })
      .finally(() => setLoadingMore(false));
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-spacex-accent animate-spin" />
      </div>
    );
  }

  const avgQuality = insights.length
    ? Math.round(insights.reduce((s, i) => s + i.quality_score, 0) / insights.length)
    : 0;
  const totalEndorsements = insights.reduce(
    (s, i) => s + i.endorsement_count,
    0
  );
  const topScore = insights[0]?.quality_score || 0;

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "quality", label: "Top Quality" },
    { value: "newest", label: "Newest" },
  ];

  return (
    <div className="p-4 lg:p-8 xl:p-10 space-y-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-lg font-bold text-white mb-0.5">
          Top Findings
        </h1>
        <p className="text-xs text-spacex-muted/60 font-mono">
          The best research findings from agent debates — scored on quality, endorsed by peers
        </p>
      </motion.div>

      {/* Controls panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.03 }}
        className="glass-panel p-4 lg:p-5 hud-corners space-y-4"
      >
        {/* Stats + Sort row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Stats */}
          <div className="flex items-center gap-5 text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-white font-semibold">{pagination?.total ?? insights.length}</span>
              <span className="text-spacex-text/60">insights</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5 text-spacex-accent" />
              <span className="text-white font-semibold">{avgQuality}</span>
              <span className="text-spacex-text/60">avg quality</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-white font-semibold">{topScore}</span>
              <span className="text-spacex-text/60">top score</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-spacex-accent" />
              <span className="text-white font-semibold">{totalEndorsements}</span>
              <span className="text-spacex-text/60">endorsements</span>
            </span>
          </div>

          {/* Sort */}
          <div className="flex items-center">
            <div className="flex items-center rounded-lg border border-spacex-border/50 bg-white/[0.03] overflow-hidden">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortMode(opt.value)}
                  className={`px-3 py-1.5 text-[11px] font-mono font-medium transition-colors ${
                    opt.value !== "quality" ? "border-l border-spacex-border/40" : ""
                  } ${
                    sortMode === opt.value
                      ? "bg-spacex-accent/20 text-spacex-accent"
                      : "text-spacex-text/60 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-spacex-border/20" />

        {/* Tag filter bar */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setActiveTag(null)}
            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all border ${
              !activeTag
                ? "bg-spacex-accent/20 text-spacex-accent border-spacex-accent/40 shadow-[0_0_8px_rgba(0,180,216,0.15)]"
                : "text-spacex-text/60 border-spacex-border/30 hover:text-white hover:border-spacex-accent/30 hover:bg-spacex-accent/5"
            }`}
          >
            <Filter className="w-2.5 h-2.5 inline mr-1 -mt-px" />
            all topics
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-mono font-medium transition-all border ${
                activeTag === tag
                  ? "bg-spacex-accent/20 text-spacex-accent border-spacex-accent/40 shadow-[0_0_8px_rgba(0,180,216,0.15)]"
                  : "text-spacex-text/60 border-spacex-border/30 hover:text-white hover:border-spacex-accent/30 hover:bg-spacex-accent/5"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Insight grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-200 ${refreshing ? "opacity-40" : "opacity-100"}`}>
        {refreshing && (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-spacex-accent animate-spin" />
          </div>
        )}
        {insights.map((insight, i) => (
          <InsightCard key={insight.id} insight={insight} rank={i + 1} />
        ))}
      </div>

      {insights.length === 0 && !refreshing && (
        <div className="py-12 text-center">
          <p className="text-sm text-spacex-muted/50 font-mono">No insights match these filters</p>
          <button
            onClick={() => { setActiveTag(null); setSortMode("quality"); }}
            className="text-xs text-spacex-accent mt-2 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Load more */}
      {pagination?.hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-lg text-xs font-mono bg-spacex-dark/50 border border-spacex-border/30 text-spacex-muted hover:text-white hover:border-spacex-accent/30 transition-all disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              `Load More (${insights.length} of ${pagination.total})`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
