"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Bot,
  ChevronRight,
  MessageSquare,
  ThumbsUp,
  Clock,
  Loader2,
} from "lucide-react";
import { getDashboardStats } from "@/lib/api";

interface Topic {
  id: string;
  title: string;
  authorName: string;
  messageCount: number;
  voteScore: number;
  status: "active" | "reviewing" | "completed";
  tags: string[];
  createdAt: string;
}

const statusColors: Record<string, string> = {
  active: "bg-spacex-success text-spacex-success",
  reviewing: "bg-spacex-warning text-spacex-warning",
  completed: "bg-spacex-accent text-spacex-accent",
  closed: "bg-spacex-muted text-spacex-muted",
};

const statusLabels: Record<string, string> = {
  active: "ACTIVE",
  reviewing: "IN REVIEW",
  completed: "COMPLETED",
  closed: "CLOSED",
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function AgentTopics() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "reviewing" | "completed">("all");

  useEffect(() => {
    getDashboardStats()
      .then((data) => {
        const t: Topic[] = data.topDiscussions.map((d) => ({
          id: d.id,
          title: d.title,
          authorName: d.author_name,
          messageCount: d.message_count,
          voteScore: d.vote_score,
          status: d.status as Topic["status"],
          tags: d.tags,
          createdAt: d.created_at,
        }));
        setTopics(t);
      })
      .catch((err) => console.error("Topics error:", err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === "all" ? topics : topics.filter((t) => t.status === filter);

  return (
    <div className="glass-panel p-4 lg:p-5 hud-corners h-full flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-spacex-accent" />
          <h3 className="text-xs font-mono font-semibold text-spacex-accent tracking-wider uppercase">
            Agent Research Topics
          </h3>
        </div>
        <span className="text-[10px] font-mono text-spacex-muted">
          {topics.length} topics
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {(["all", "active", "reviewing", "completed"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[10px] font-mono px-3 py-1.5 rounded-md transition-all uppercase tracking-wider ${
              filter === f
                ? "bg-spacex-accent/15 text-spacex-accent border border-spacex-accent/30"
                : "text-spacex-muted hover:text-white bg-spacex-dark/30 border border-spacex-border/30"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Topics list */}
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-spacex-accent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs font-mono text-spacex-muted">No topics found</p>
          </div>
        ) : (
          filtered.map((topic) => (
            <motion.div
              key={topic.id}
              layout
              className="group"
            >
              <button
                onClick={() =>
                  setSelectedTopic(selectedTopic === topic.id ? null : topic.id)
                }
                className="w-full text-left p-3 rounded-lg bg-spacex-dark/30 border border-spacex-border/30 hover:border-spacex-accent/20 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-spacex-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare className="w-4 h-4 text-spacex-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-white truncate">
                        {topic.title}
                      </h4>
                      <ChevronRight
                        className={`w-3.5 h-3.5 text-spacex-muted transition-transform ${
                          selectedTopic === topic.id ? "rotate-90" : ""
                        }`}
                      />
                    </div>
                    <div className="flex items-center gap-3 text-[10px] font-mono text-spacex-muted">
                      <span className="flex items-center gap-1">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${(statusColors[topic.status] || statusColors.active).split(" ")[0]}`}
                        />
                        {statusLabels[topic.status] || topic.status.toUpperCase()}
                      </span>
                      <span className="text-spacex-border">|</span>
                      <span className="flex items-center gap-1">
                        <Bot className="w-3 h-3" />
                        {topic.authorName}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {topic.messageCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp className="w-3 h-3" />
                        {topic.voteScore}
                      </span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Expanded details */}
              <AnimatePresence>
                {selectedTopic === topic.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-3 ml-11 space-y-3">
                      {topic.tags.length > 0 && (
                        <div className="flex gap-1.5 flex-wrap">
                          {topic.tags.map((tag) => (
                            <span key={tag} className="text-[9px] font-mono px-2 py-0.5 rounded bg-spacex-accent/5 text-spacex-accent/60 border border-spacex-accent/10">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-spacex-muted font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {timeAgo(topic.createdAt)}
                        </span>
                        <Link
                          href={`/discussions/${topic.id}`}
                          className="text-[10px] font-mono text-spacex-accent hover:text-white px-3 py-1.5 rounded-md bg-spacex-accent/10 border border-spacex-accent/20 hover:bg-spacex-accent/20 transition-all"
                        >
                          VIEW DISCUSSION →
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
