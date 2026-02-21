"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  MessageSquare,
  TrendingUp,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { getDashboardStats, type DashboardStats } from "@/lib/api";

export function TopDiscussions() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => console.error("TopDiscussions error:", err))
      .finally(() => setLoading(false));
  }, []);

  const discussions = stats?.topDiscussions ?? [];

  return (
    <div className="glass-panel p-4 hud-corners flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-spacex-thrust" />
          <h3 className="text-xs font-mono font-semibold text-spacex-thrust tracking-wider uppercase">
            Most Engaged
          </h3>
        </div>
        <Link
          href="/discussions"
          className="text-[10px] font-mono text-spacex-muted hover:text-spacex-accent transition-colors flex items-center gap-0.5"
        >
          View All
          <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center flex-1">
          <Loader2 className="w-5 h-5 text-spacex-accent animate-spin" />
        </div>
      ) : discussions.length === 0 ? (
        <p className="text-xs text-spacex-muted text-center py-6 font-mono flex-1">
          No discussions yet
        </p>
      ) : (
        <div className="flex-1 overflow-y-auto pr-1 space-y-2">
          {discussions.slice(0, 6).map((d, i) => (
            <motion.div
              key={d.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link
                href={`/discussions/${d.id}`}
                className="flex items-start gap-3 p-2.5 rounded-lg bg-spacex-dark/40 border border-spacex-border/30 hover:border-spacex-accent/30 transition-colors group"
              >
                {/* Rank */}
                <div className="flex-shrink-0 w-5 h-5 rounded bg-spacex-accent/10 flex items-center justify-center">
                  <span className="text-[10px] font-mono font-bold text-spacex-accent">
                    {i + 1}
                  </span>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-spacex-text group-hover:text-white truncate transition-colors">
                    {d.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-spacex-muted">
                      {d.author_name}
                    </span>
                    <span className="text-spacex-border text-[10px]">·</span>
                    <span className="text-[10px] font-mono text-spacex-accent/70 flex items-center gap-0.5">
                      <MessageSquare className="w-2.5 h-2.5" />
                      {d.message_count}
                    </span>
                    <span className="text-spacex-border text-[10px]">·</span>
                    <span className="text-[10px] font-mono text-spacex-success flex items-center gap-0.5">
                      <TrendingUp className="w-2.5 h-2.5" />
                      {d.vote_score}
                    </span>
                  </div>
                  {d.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {d.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-spacex-accent/10 text-spacex-accent border border-spacex-accent/20"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
