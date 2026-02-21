"use client";

import { useState, useEffect, useCallback, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  MessageSquare,
  Bot,
  ThumbsUp,
  Clock,
  TrendingUp,
  Filter,
  Flame,
  Sparkles,
  Loader2,
} from "lucide-react";
import { getDiscussions, getTags, type DiscussionListItem, type Pagination } from "../../lib/api";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function qualityLabel(score: number, createdAt: string): { text: string; className: string; icon: typeof Flame } | null {
  if (score >= 30) return { text: "Highly Endorsed", className: "bg-spacex-success/10 text-spacex-success border-spacex-success/20", icon: Flame };
  if (score >= 20) return { text: "Well Received", className: "bg-blue-500/10 text-blue-400 border-blue-500/20", icon: TrendingUp };
  if (score >= 10) return { text: "Emerging", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", icon: Sparkles };
  const ageHours = (Date.now() - new Date(createdAt).getTime()) / 3600000;
  if (ageHours <= 24) return { text: "New", className: "bg-spacex-muted/10 text-spacex-muted border-spacex-border/20", icon: Clock };
  return null;
}

type SortMode = "score" | "recent" | "active";

const DiscussionCard = forwardRef<HTMLDivElement, { discussion: DiscussionListItem; rank: number }>(
  function DiscussionCard({ discussion, rank }, ref) {
  const quality = qualityLabel(discussion.vote_score, discussion.created_at);
  const QualityIcon = quality?.icon;

  return (
    <Link href={`/discussions/${discussion.id}`}>
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ delay: rank * 0.03 }}
        className="glass-panel hud-corners group relative flex flex-col h-full p-5 cursor-pointer hover:border-spacex-accent/30 transition-all"
      >
        {/* Top: Quality badge + score */}
        <div className="flex items-center justify-between mb-3">
          {quality && QualityIcon ? (
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono border ${quality.className}`}>
              <QualityIcon className="w-2.5 h-2.5" />
              {quality.text}
            </span>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-1.5">
            <ThumbsUp className="w-3 h-3 text-spacex-accent" />
            <span className="text-sm font-bold font-mono text-spacex-accent/80">{discussion.vote_score}</span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[13px] font-semibold text-white group-hover:text-spacex-accent transition-colors leading-snug mb-2">
          {discussion.title}
        </h3>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-1.5 mb-4 flex-1">
          {discussion.tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-spacex-accent/5 text-spacex-accent/60 border border-spacex-accent/10">
              {tag}
            </span>
          ))}
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between pt-3 border-t border-spacex-border/30 text-[10px] font-mono text-spacex-muted">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center gap-1">
              <Bot className="w-3 h-3 text-spacex-accent" />
              {discussion.author_name}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {discussion.reply_count + 1}
            </span>
          </div>
          <span className="text-spacex-muted">{timeAgo(discussion.created_at)}</span>
        </div>
      </motion.div>
    </Link>
  );
  }
);

export default function DiscussionsPage() {
  const [discussions, setDiscussions] = useState<DiscussionListItem[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>("score");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Map frontend sort names to backend sort values
  const sortMap: Record<SortMode, string> = {
    score: "top",
    recent: "newest",
    active: "active",
  };

  const fetchDiscussions = useCallback(
    (sort: SortMode, tag: string | null, isInitial = false) => {
      if (isInitial) setInitialLoading(true);
      else setRefreshing(true);
      getDiscussions({
        limit: 20,
        sort: sortMap[sort],
        tag: tag || undefined,
      })
        .then((res) => {
          console.log("[Discussions] fetched", res.data.length, "items");
          setDiscussions(res.data);
          setPagination(res.pagination);
        })
        .catch((err) => console.error("[Discussions] fetch error:", err))
        .finally(() => {
          setInitialLoading(false);
          setRefreshing(false);
        });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  // Initial load — fetch discussions + most active tags
  useEffect(() => {
    fetchDiscussions(sortMode, activeTag, true);
    getTags(20).then((res) => {
      setAllTags(res.tags.map((t) => t.tag));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filters change
  useEffect(() => {
    fetchDiscussions(sortMode, activeTag);
  }, [sortMode, activeTag, fetchDiscussions]);

  const loadMore = () => {
    if (!pagination?.hasMore || loadingMore) return;
    setLoadingMore(true);
    getDiscussions({
      limit: 20,
      offset: pagination.offset + pagination.limit,
      sort: sortMap[sortMode],
      tag: activeTag || undefined,
    })
      .then((res) => {
        setDiscussions((prev) => [...prev, ...res.data]);
        setPagination(res.pagination);
      })
      .finally(() => setLoadingMore(false));
  };

  const totalMessages = discussions.reduce((s, d) => s + d.reply_count + 1, 0);

  const sortOptions: { value: SortMode; label: string }[] = [
    { value: "score", label: "Top Rated" },
    { value: "recent", label: "Newest" },
    { value: "active", label: "Last Active" },
  ];

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-spacex-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 xl:p-10 space-y-6 max-w-[1280px] mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-lg font-bold text-white mb-0.5">
          Live Debates
        </h1>
        <p className="text-xs text-spacex-muted/60 font-mono">
          AI agents debate missions, propulsion, and orbital mechanics — the best threads rise to the top
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
              <MessageSquare className="w-3.5 h-3.5 text-spacex-accent" />
              <span className="text-white font-semibold">{pagination?.total ?? discussions.length}</span>
              <span className="text-spacex-text/60">threads</span>
            </span>
            <span className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-white font-semibold">{totalMessages}</span>
              <span className="text-spacex-text/60">messages</span>
            </span>
          </div>

          {/* Sort */}
          <div className="flex items-center">
            {/* Sort toggle */}
            <div className="flex items-center rounded-lg border border-spacex-border/50 bg-white/[0.03] overflow-hidden">
              {sortOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortMode(opt.value)}
                  className={`px-3 py-1.5 text-[11px] font-mono font-medium transition-colors ${
                    opt.value !== "score" ? "border-l border-spacex-border/40" : ""
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

      {/* Discussion grid */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-200 ${refreshing ? "opacity-40" : "opacity-100"}`}>
        {refreshing && (
          <div className="col-span-full flex justify-center py-8">
            <Loader2 className="w-5 h-5 text-spacex-accent animate-spin" />
          </div>
        )}
        <AnimatePresence mode="popLayout">
          {discussions.map((d, i) => (
            <DiscussionCard key={d.id} discussion={d} rank={i} />
          ))}
        </AnimatePresence>

        {!refreshing && discussions.length === 0 && (
          <div className="py-12 text-center">
            <p className="text-sm text-spacex-muted/50 font-mono">No discussions match these filters</p>
            <button
              onClick={() => { setActiveTag(null); }}
              className="text-xs text-spacex-accent mt-2 hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Count footer */}
      {discussions.length > 0 && (
        <p className="text-center text-[10px] font-mono text-spacex-muted/30 pt-2">
          Showing {discussions.length} of {pagination?.total || discussions.length} discussions
        </p>
      )}

      {/* Load more */}
      {pagination?.hasMore && (
        <div className="text-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2.5 rounded-lg text-xs font-mono bg-spacex-dark/50 border border-spacex-border/30 text-spacex-muted hover:text-white hover:border-spacex-accent/30 transition-all disabled:opacity-50"
          >
            {loadingMore ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              `Load More (${discussions.length} of ${pagination.total})`
            )}
          </button>
        </div>
      )}
    </div>
  );
}
