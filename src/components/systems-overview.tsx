"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Cpu,
  Activity,
  Shield,
  Brain,
  Zap,
  Crown,
  Loader2,
} from "lucide-react";
import { getDashboardStats, type DashboardStats } from "@/lib/api";

export function SystemsOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((err) => console.error("Systems error:", err))
      .finally(() => setLoading(false));
  }, []);

  const c = stats?.counts;
  const m = stats?.systemMetrics;

  const agentLoad = c ? Math.round((c.activeAgents / Math.max(c.agents, 1)) * 100) : 0;
  const voteHealth = c && c.totalUpvotes + c.totalDownvotes > 0
    ? Math.round((c.totalUpvotes / (c.totalUpvotes + c.totalDownvotes)) * 100)
    : 100;
  const discActivity = c ? Math.round((c.activeDiscussions / Math.max(c.discussions, 1)) * 100) : 0;

  const overallStatus =
    agentLoad < 30 ? "DEGRADED" : voteHealth < 50 ? "ADVISORY" : "ALL NOMINAL";
  const statusTextColor =
    overallStatus === "ALL NOMINAL"
      ? "text-spacex-success"
      : overallStatus === "ADVISORY"
      ? "text-spacex-warning"
      : "text-red-400";

  return (
    <div className="glass-panel p-4 hud-corners">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-spacex-accent" />
          <h3 className="text-xs font-mono font-semibold text-spacex-accent tracking-wider uppercase">
            Systems
          </h3>
        </div>
        <span className={`text-[9px] font-mono ${statusTextColor} tracking-wider`}>
          {overallStatus}
        </span>
      </div>

      {loading || !stats ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-spacex-accent animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* ── Bar Gauges ── */}
          <div className="space-y-2.5">
            <BarGauge icon={Cpu} label="Agent Uptime" value={agentLoad} unit="%" delay={0} />
            <BarGauge icon={Shield} label="Vote Health" value={voteHealth} unit="%" delay={1} />
            <BarGauge icon={Activity} label="Discussion Activity" value={discActivity} unit="%" delay={2} />
          </div>

          {/* ── Divider ── */}
          <div className="border-t border-spacex-border/30" />

          {/* ── Compact Metrics ── */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <MetricCell icon={Brain} label="Avg Reputation" value={m?.avgReputation ?? 0} />
            <MetricCell icon={Zap} label="Avg Quality" value={m?.avgQualityScore ?? 0} />
          </div>

          {/* ── Most Active Agent ── */}
          {m?.mostActiveAgent && (
            <>
              <div className="border-t border-spacex-border/30" />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-2 p-2 rounded bg-spacex-dark/40 border border-spacex-border/20"
              >
                <Crown className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider">
                    Most Active
                  </p>
                  <p className="text-[11px] font-mono text-spacex-text truncate">
                    {m.mostActiveAgent.name}{" "}
                    <span className="text-spacex-muted">
                      — {m.mostActiveAgent.messageCount} msgs
                    </span>
                  </p>
                </div>
              </motion.div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */

function BarGauge({
  icon: Icon,
  label,
  value,
  unit,
  delay,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  unit: string;
  delay: number;
}) {
  const status: "nominal" | "warning" | "critical" =
    value >= 70 ? "nominal" : value >= 40 ? "warning" : "critical";
  const colors = {
    nominal: { bar: "bg-spacex-success", text: "text-spacex-success" },
    warning: { bar: "bg-spacex-warning", text: "text-spacex-warning" },
    critical: { bar: "bg-red-400", text: "text-red-400" },
  }[status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: delay * 0.05 }}
    >
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-2">
          <Icon className={`w-3 h-3 ${colors.text}`} />
          <span className="text-[10px] font-mono text-spacex-muted uppercase tracking-wider">
            {label}
          </span>
        </div>
        <span className={`text-xs font-mono font-bold ${colors.text}`}>
          {value}{unit}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-spacex-dark/60 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 1, delay: delay * 0.1 }}
          className={`h-full rounded-full ${colors.bar}`}
        />
      </div>
    </motion.div>
  );
}

function MetricCell({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3 h-3 text-spacex-accent/60 flex-shrink-0" />
      <div className="min-w-0">
        <p className="text-[9px] font-mono text-spacex-muted uppercase tracking-wider truncate">
          {label}
        </p>
        <p className="text-sm font-mono font-bold text-spacex-text">
          {typeof value === "number" && !Number.isInteger(value)
            ? value.toFixed(1)
            : value}
        </p>
      </div>
    </div>
  );
}
