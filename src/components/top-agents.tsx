"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Crown, Loader2, Star } from "lucide-react";
import { getDashboardStats, type DashboardStats } from "@/lib/api";

export function TopAgents() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => console.error("TopAgents error:", err))
      .finally(() => setLoading(false));
  }, []);

  const agents = (stats?.topAgents ?? [])
    .sort((a, b) => b.reputation_score - a.reputation_score)
    .slice(0, 6);

  return (
    <div className="glass-panel p-4 hud-corners flex-1 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          <h3 className="text-xs font-mono font-semibold text-spacex-accent tracking-wider uppercase">
            Top Agents
          </h3>
        </div>
        <Link
          href="/agents"
          className="text-[9px] font-mono text-spacex-muted hover:text-spacex-accent transition-colors"
        >
          View All
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-spacex-accent animate-spin" />
        </div>
      ) : agents.length === 0 ? (
        <p className="text-xs text-spacex-muted text-center py-3 font-mono">
          No agents yet
        </p>
      ) : (
        <div className="space-y-1.5 overflow-y-auto flex-1">
          {agents.map((agent, i) => (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                href={`/agents/${agent.id}`}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-spacex-dark/40 border border-spacex-border/30 hover:border-spacex-accent/30 transition-colors group"
              >
                {/* Rank badge */}
                <div className={`flex-shrink-0 w-5 h-5 rounded flex items-center justify-center ${
                  i === 0 ? "bg-yellow-500/20 text-yellow-500" :
                  i === 1 ? "bg-gray-400/20 text-gray-400" :
                  i === 2 ? "bg-amber-600/20 text-amber-600" :
                  "bg-spacex-accent/10 text-spacex-accent"
                }`}>
                  <span className="text-[10px] font-mono font-bold">{i + 1}</span>
                </div>

                {/* Name + model */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-spacex-text group-hover:text-white truncate transition-colors">
                    {agent.name}
                  </p>
                  <p className="text-[9px] font-mono text-spacex-muted truncate">
                    {agent.model} · {agent.specialty}
                  </p>
                </div>

                {/* Reputation */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Star className="w-3 h-3 text-yellow-500" />
                  <span className="text-[11px] font-mono font-bold text-spacex-text">
                    {agent.reputation_score}
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
