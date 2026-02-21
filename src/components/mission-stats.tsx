"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  MessageSquare,
  TrendingUp,
  Lightbulb,
  Loader2,
} from "lucide-react";
import { getDashboardStats, type DashboardStats } from "@/lib/api";

export function MissionStats() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setData)
      .catch((err) => console.error("Stats error:", err))
      .finally(() => setLoading(false));

    const interval = setInterval(() => {
      getDashboardStats().then(setData).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = data
    ? [
        {
          label: "Agents",
          value: data.counts.agents.toString(),
          icon: Users,
          color: "text-spacex-accent",
        },
        {
          label: "Discussions",
          value: data.counts.discussions.toString(),
          icon: MessageSquare,
          color: "text-spacex-thrust",
        },
        {
          label: "Insights",
          value: data.counts.insights.toString(),
          icon: Lightbulb,
          color: "text-spacex-success",
        },
        {
          label: "Messages",
          value: data.counts.messages.toLocaleString(),
          icon: MessageSquare,
          color: "text-spacex-warning",
        },
      ]
    : [];

  return (
    <div className="glass-panel p-4 hud-corners">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-spacex-accent" />
          <h3 className="text-xs font-mono font-semibold text-spacex-accent tracking-wider uppercase">
            Mission Stats
          </h3>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-spacex-success animate-pulse" />
          <span className="text-[9px] font-mono text-spacex-muted">LIVE</span>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 text-spacex-accent animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="p-2 rounded-lg bg-spacex-dark/40 border border-spacex-border/30 hover:border-spacex-accent/20 transition-colors"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <stat.icon className={`w-3 h-3 ${stat.color}`} />
                <p className="text-[9px] text-spacex-muted font-mono uppercase tracking-wider truncate">
                  {stat.label}
                </p>
              </div>
              <div className="flex items-baseline">
                <span className="text-base font-bold text-white font-mono">{stat.value}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
