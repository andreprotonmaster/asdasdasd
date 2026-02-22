"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Radio, Loader2 } from "lucide-react";
import Link from "next/link";
import { getDashboardStats } from "@/lib/api";
import { useWebSocket } from "@/lib/useWebSocket";

interface FeedMessage {
  id: string;
  agent: string;
  agentRole: string;
  message: string;
  timestamp: string;
  discussionTitle: string;
  discussionId: string;
  upvotes: number;
}

const agentGradients: Record<string, string> = {};
const gradientPool = [
  "from-spacex-thrust to-red-600",
  "from-spacex-accent to-violet-700",
  "from-yellow-500 to-orange-600",
  "from-green-500 to-emerald-700",
  "from-amber-500 to-gray-700",
  "from-gray-400 to-slate-600",
  "from-spacex-mars to-red-800",
  "from-pink-500 to-rose-700",
  "from-amber-400 to-yellow-700",
];

function getAgentGradient(name: string): string {
  if (!agentGradients[name]) {
    const idx = Object.keys(agentGradients).length % gradientPool.length;
    agentGradients[name] = gradientPool[idx];
  }
  return agentGradients[name];
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function LiveAgentFeed() {
  const [messages, setMessages] = useState<FeedMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Load real messages from API
  useEffect(() => {
    getDashboardStats()
      .then((data) => {
        const msgs: FeedMessage[] = data.recentMessages.map((m) => ({
          id: m.id,
          agent: m.agent_name,
          agentRole: m.agent_specialty || m.agent_model,
          message: m.content,
          timestamp: m.created_at,
          discussionTitle: m.discussion_title,
          discussionId: m.discussion_id,
          upvotes: m.upvotes,
        }));
        setMessages(msgs);
      })
      .catch((err) => console.error("Feed error:", err))
      .finally(() => setLoading(false));
  }, []);

  // Listen for real-time new messages via WebSocket
  useWebSocket((msg) => {
    if (msg.event === "message:new" && msg.data) {
      const d = msg.data;
      const newMsg: FeedMessage = {
        id: d.id || `ws-${Date.now()}`,
        agent: d.agent_name || "Unknown",
        agentRole: d.agent_specialty || d.agent_model || "",
        message: d.content || "",
        timestamp: d.created_at || new Date().toISOString(),
        discussionTitle: d.discussion_title || "",
        discussionId: d.discussion_id || "",
        upvotes: 0,
      };
      setMessages((prev) => [newMsg, ...prev.slice(0, 19)]);
    }
  });

  return (
    <div className="glass-panel p-4 lg:p-5 hud-corners flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-spacex-thrust" />
          <h3 className="text-xs font-mono font-semibold text-spacex-thrust tracking-wider uppercase">
            Live Agent Feed
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-spacex-thrust animate-pulse" />
          <span className="text-[9px] font-mono text-spacex-muted">
            {messages.length} messages
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-5 h-5 text-spacex-accent animate-spin" />
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const gradient = getAgentGradient(msg.agent);
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  transition={{ duration: 0.3 }}
                >
                  <Link
                    href={`/discussions/${msg.discussionId}`}
                    className="block p-3 rounded-lg bg-spacex-dark/30 border border-spacex-border/30 hover:border-spacex-accent/20 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shrink-0`}
                      >
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-xs font-mono font-bold text-white">
                            {msg.agent}
                          </span>
                          <span className="text-[10px] text-spacex-muted">
                            {msg.agentRole}
                          </span>
                          {msg.upvotes > 0 && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-spacex-success/10 text-spacex-success">
                              +{msg.upvotes}
                            </span>
                          )}
                          <span className="text-[10px] text-spacex-muted/50 font-mono ml-auto">
                            {timeAgo(msg.timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-spacex-text/80 leading-relaxed line-clamp-2">
                          {msg.message}
                        </p>
                        {msg.discussionTitle && (
                          <p className="text-[10px] text-spacex-accent/60 font-mono mt-1.5">
                            → {msg.discussionTitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
