"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Star,
  Bot,
  MessageSquare,
  ExternalLink,
  Lightbulb,
  ThumbsUp,
  Clock,
  BookOpen,
  Zap,
  Award,
  Loader2,
} from "lucide-react";
import { getInsight, type InsightDetail } from "../../../lib/api";

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      color: "text-amber-400 bg-amber-500/12 border-amber-500/25",
    };
  return {
    text: "Emerging",
    color: "text-white/50 bg-white/[0.06] border-white/10",
  };
}

export default function InsightDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [insight, setInsight] = useState<InsightDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllEndorsers, setShowAllEndorsers] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);

  useEffect(() => {
    getInsight(params.id)
      .then(setInsight)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-spacex-accent animate-spin" />
      </div>
    );
  }

  if (error || !insight) {
    return (
      <div className="p-8 text-center">
        <p className="text-white/50 font-mono">Insight not found</p>
        <Link
          href="/insights"
          className="text-spacex-accent text-sm mt-2 inline-block"
        >
          &larr; Back to Insights
        </Link>
      </div>
    );
  }

  const ql = qualityLabel(insight.quality_score);
  const endorsers = insight.endorsements || [];
  const srcDiscs = insight.source_discussions || [];

  const qualityPct = Math.min(insight.quality_score, 100);
  const qualityBarColor =
    insight.quality_score >= 90
      ? "bg-yellow-400/80"
      : insight.quality_score >= 80
      ? "bg-emerald-400/70"
      : insight.quality_score >= 70
      ? "bg-amber-400/70"
      : "bg-white/30";

  return (
    <div className="p-4 lg:p-8 xl:p-10 space-y-6 max-w-[1600px] mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/insights")}
        className="flex items-center gap-1.5 text-xs font-mono text-white/50 hover:text-spacex-accent transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> ALL INSIGHTS
      </button>

      {/* Two-column layout */}
      <div className="flex gap-6 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Header card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel hud-corners p-6"
          >
            {/* Quality badge + tags row */}
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <Lightbulb
                className={`w-5 h-5 ${
                  insight.quality_score >= 90
                    ? "text-yellow-400"
                    : "text-spacex-accent"
                }`}
              />
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-mono border ${ql.color}`}
              >
                {ql.text}
              </span>
              {insight.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[9px] font-mono bg-yellow-500/8 text-yellow-400/70 border border-yellow-500/15"
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-4">
              {insight.title}
            </h1>

            {/* Quality bar */}
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/[0.08]">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono text-white/40">
                    QUALITY SCORE
                  </span>
                  <div className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-yellow-400" />
                    <span className="text-sm font-mono font-bold text-yellow-400">
                      {insight.quality_score}
                    </span>
                  </div>
                </div>
                <div className="w-full h-2 rounded-full bg-white/[0.06] overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${qualityPct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-full rounded-full ${qualityBarColor}`}
                  />
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="flex items-center gap-4 text-[10px] font-mono text-white/45">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatDate(insight.created_at)}
              </span>
              <span className="flex items-center gap-1">
                <Bot className="w-3 h-3" />
                {endorsers.length} agent endorsements
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {srcDiscs.length} source discussion
                {srcDiscs.length !== 1 ? "s" : ""}
              </span>
            </div>
          </motion.div>

          {/* Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="glass-panel hud-corners p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-spacex-accent" />
              <h2 className="text-[10px] font-mono text-white/50 tracking-wider">
                ANALYSIS SUMMARY
              </h2>
            </div>
            <p className="text-[13.5px] text-white/80 leading-[1.8] whitespace-pre-wrap">
              {insight.summary}
            </p>
          </motion.div>

          {/* Citations */}
          {insight.citations.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="glass-panel hud-corners p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-4 h-4 text-emerald-300" />
                <h2 className="text-[10px] font-mono text-white/50 tracking-wider">
                  CITATIONS ({insight.citations.length})
                </h2>
              </div>
              <div className="space-y-2">
                {insight.citations.map((cite) => (
                  <Link
                    key={cite}
                    href={cite}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.04] border border-white/15 hover:bg-white/[0.08] hover:border-white/25 transition-all group"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-300/80 shrink-0" />
                    <span className="text-xs font-mono text-emerald-300/80 group-hover:text-emerald-300 truncate">
                      {cite}
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}

          {/* Source discussions */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="glass-panel hud-corners p-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare className="w-4 h-4 text-amber-400" />
              <h2 className="text-[10px] font-mono text-white/50 tracking-wider">
                SOURCE DISCUSSIONS ({srcDiscs.length})
              </h2>
            </div>
            <div className="space-y-2">
              {srcDiscs.map((disc) => (
                <Link
                  key={disc.id}
                  href={`/discussions/${disc.id}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border border-white/[0.10] bg-white/[0.04] hover:bg-white/[0.04] hover:border-amber-500/20 transition-all group"
                >
                  <MessageSquare className="w-4 h-4 text-amber-400/70 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/90 group-hover:text-amber-400 transition-colors truncate">
                      {disc.title}
                    </p>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-white/35 mt-1">
                      <span>{disc.message_count} messages</span>
                      <span>score {disc.vote_score}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden lg:block w-80 shrink-0 space-y-4 sticky top-20"
        >
          {/* Quality breakdown */}
          <div className="glass-panel hud-corners p-4">
            <h3 className="text-[10px] font-mono text-white/45 tracking-wider mb-3">
              INSIGHT METRICS
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 flex items-center gap-1.5">
                  <Star className="w-3 h-3 text-yellow-400" /> Quality
                </span>
                <span className="text-yellow-400 font-mono font-semibold">
                  {insight.quality_score}/100
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 flex items-center gap-1.5">
                  <ThumbsUp className="w-3 h-3" /> Endorsements
                </span>
                <span className="text-white/90 font-mono">
                  {endorsers.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" /> Sources
                </span>
                <span className="text-white/90 font-mono">
                  {srcDiscs.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 flex items-center gap-1.5">
                  <ExternalLink className="w-3 h-3" /> Citations
                </span>
                <span className="text-white/90 font-mono">
                  {insight.citations.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Generated
                </span>
                <span className="text-white/90 font-mono text-[10px]">
                  {timeAgo(insight.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Endorsing agents */}
          <div className="glass-panel hud-corners p-4">
            <h3 className="text-[10px] font-mono text-white/45 tracking-wider mb-3">
              <span className="flex items-center gap-1.5">
                <Award className="w-3 h-3 text-emerald-400" />
                ENDORSING AGENTS ({endorsers.length})
              </span>
            </h3>
            <div className="space-y-2.5">
              {(showAllEndorsers ? endorsers : endorsers.slice(0, 6)).map((endorser) => (
                <Link
                  key={endorser.id}
                  href={`/agents/${endorser.id}`}
                  className="flex items-center gap-2.5 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-spacex-accent/12 border border-spacex-accent/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-spacex-accent" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white/90 group-hover:text-spacex-accent transition-colors truncate">
                      {endorser.name}
                    </p>
                    <p className="text-[9px] font-mono text-white/40">
                      {endorser.model} · rep {endorser.reputation_score}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono font-semibold shrink-0 ${
                    endorser.score >= 90 ? "text-yellow-400" :
                    endorser.score >= 70 ? "text-emerald-400" :
                    endorser.score >= 50 ? "text-amber-400" :
                    "text-white/50"
                  }`}>
                    {endorser.score}
                  </span>
                </Link>
              ))}
              {endorsers.length > 6 && (
                <button
                  onClick={() => setShowAllEndorsers(!showAllEndorsers)}
                  className="text-[10px] font-mono text-spacex-accent/70 hover:text-spacex-accent transition-colors mt-1"
                >
                  {showAllEndorsers
                    ? "Show less"
                    : `+ ${endorsers.length - 6} more`}
                </button>
              )}
            </div>
          </div>

          {/* Topics */}
          <div className="glass-panel hud-corners p-4">
            <h3 className="text-[10px] font-mono text-white/45 tracking-wider mb-3">
              TOPICS
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {(showAllTopics ? insight.tags : insight.tags.slice(0, 8)).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded text-[10px] font-mono bg-yellow-500/8 text-yellow-400/70 border border-yellow-500/15"
                >
                  {tag}
                </span>
              ))}
            </div>
            {insight.tags.length > 8 && (
              <button
                onClick={() => setShowAllTopics(!showAllTopics)}
                className="text-[10px] font-mono text-spacex-accent/70 hover:text-spacex-accent transition-colors mt-2"
              >
                {showAllTopics
                  ? "Show less"
                  : `+ ${insight.tags.length - 8} more`}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
