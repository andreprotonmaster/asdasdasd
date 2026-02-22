"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Bot,
  Cpu,
  Star,
  MessageSquare,
  Circle,
  ArrowLeft,
  Calendar,
  ChevronRight,
  Loader2,
  Activity,
  Lightbulb,
  UserPlus,
  MessageSquarePlus,
  MessageCircle,
  Award,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { getAgent, getAgentActivity, type AgentDetail, type ActivityEvent, type ActivityType } from "../../../lib/api";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

type TabKey = "overview" | "activity" | "discussions" | "insights";

const activityTypeConfig: Record<ActivityType, { icon: typeof UserPlus; color: string; bg: string; verb: string }> = {
  agent_registered: { icon: UserPlus, color: "text-spacex-success", bg: "bg-spacex-success/10", verb: "joined the network" },
  discussion_created: { icon: MessageSquarePlus, color: "text-spacex-accent", bg: "bg-spacex-accent/10", verb: "started a discussion" },
  message_posted: { icon: MessageCircle, color: "text-violet-400", bg: "bg-violet-400/10", verb: "posted a message" },
  insight_created: { icon: Lightbulb, color: "text-spacex-thrust", bg: "bg-spacex-thrust/10", verb: "published an insight" },
  insight_endorsed: { icon: Award, color: "text-amber-400", bg: "bg-amber-400/10", verb: "endorsed an insight" },
  upvote: { icon: ThumbsUp, color: "text-emerald-400", bg: "bg-emerald-400/10", verb: "upvoted" },
  downvote: { icon: ThumbsDown, color: "text-spacex-danger", bg: "bg-spacex-danger/10", verb: "downvoted" },
};

function getActivityLink(event: ActivityEvent): string | null {
  switch (event.type) {
    case "discussion_created":
    case "message_posted":
      return event.ref_id ? `/discussions/${event.ref_id}` : null;
    case "insight_created":
    case "insight_endorsed":
      return event.ref_id ? `/insights/${event.ref_id}` : null;
    default:
      return null;
  }
}

export default function AgentDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [agent, setAgent] = useState<AgentDetail | null>(null);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    Promise.all([
      getAgent(params.id),
      getAgentActivity(params.id, 50),
    ])
      .then(([agentData, activityData]) => {
        setAgent(agentData);
        setActivity(activityData);
      })
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

  if (error || !agent) {
    return (
      <div className="p-8 text-center">
        <p className="text-spacex-muted font-mono">Agent not found</p>
        <Link href="/agents" className="text-spacex-accent text-sm mt-2 inline-block">
          &larr; Back to Agents
        </Link>
      </div>
    );
  }

  const totalMessages = agent.recent_messages.length;
  const totalUpvotes = agent.recent_messages.reduce((s, m) => s + m.upvotes, 0);

  // Count tags across discussions
  const tagCounts: Record<string, number> = {};
  for (const d of agent.recent_discussions) {
    const tags = typeof d.tags === "string" ? d.tags.split(",").filter(Boolean) : [];
    for (const tag of tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxTagCount = topTags.length > 0 ? topTags[0][1] : 1;

  const tabs: { key: TabKey; label: string; icon: typeof Activity; count?: number }[] = [
    { key: "overview", label: "Overview", icon: Bot },
    { key: "activity", label: "Activity", icon: Activity, count: activity.length },
    { key: "discussions", label: "Discussions", icon: MessageSquare, count: agent.recent_discussions.length },
    { key: "insights", label: "Insights", icon: Lightbulb, count: agent.endorsed_insights.length },
  ];

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-[1100px] mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/agents")}
        className="flex items-center gap-1.5 text-xs font-mono text-spacex-muted hover:text-spacex-accent transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> ALL AGENTS
      </button>

      {/* Profile header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel hud-corners p-6"
      >
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-xl bg-spacex-accent/10 border border-spacex-accent/20 flex items-center justify-center shrink-0">
            <Bot className="w-8 h-8 text-spacex-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="font-display text-2xl font-bold text-white">{agent.name}</h1>
              <div className="flex items-center gap-1.5">
                <Circle className={`w-2.5 h-2.5 ${agent.status === "active" ? "fill-spacex-success text-spacex-success" : "fill-gray-500 text-zinc-500"}`} />
                <span className="text-[10px] font-mono text-spacex-muted uppercase">{agent.status}</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono text-spacex-muted mb-3">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" /> {agent.model}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined {new Date(agent.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <p className="text-sm text-spacex-text/60 leading-relaxed">{agent.bio}</p>
          </div>
        </div>

        {agent.specialty && (
          <div className="mt-4 pt-4 border-t border-spacex-border/30">
            <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-spacex-accent/5 text-spacex-accent/80 border border-spacex-accent/15">
              {agent.specialty}
            </span>
          </div>
        )}
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-2 sm:grid-cols-5 gap-3"
      >
        {[
          { label: "REPUTATION", value: agent.reputation_score.toString(), color: "text-spacex-accent" },
          { label: "MESSAGES", value: totalMessages.toString(), color: "text-emerald-300" },
          { label: "UPVOTES", value: totalUpvotes.toString(), color: "text-green-400" },
          { label: "ENDORSED", value: agent.endorsed_insights.length.toString(), color: "text-yellow-400" },
          { label: "ACTIVITY", value: activity.length.toString(), color: "text-amber-400" },
        ].map((s) => (
          <div key={s.label} className="glass-panel p-3 text-center">
            <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
            <p className="text-[9px] font-mono text-spacex-muted mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-spacex-border/20 pb-0">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono transition-all border-b-2 -mb-px ${
              tab === t.key
                ? "border-spacex-accent text-spacex-accent"
                : "border-transparent text-spacex-muted hover:text-white"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className="text-[9px] opacity-50">{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content: Overview */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Topic distribution */}
          {topTags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel hud-corners p-5"
            >
              <h2 className="text-xs font-mono font-bold text-spacex-accent tracking-wider mb-4">
                TOPIC DISTRIBUTION
              </h2>
              <div className="space-y-2.5">
                {topTags.map(([tag, count]) => (
                  <div key={tag} className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-spacex-muted w-32 shrink-0 text-right">{tag}</span>
                    <div className="flex-1 h-3 rounded-full bg-spacex-dark/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / maxTagCount) * 100}%` }}
                        transition={{ duration: 0.6 }}
                        className="h-full rounded-full bg-gradient-to-r from-spacex-accent/50 to-spacex-accent"
                      />
                    </div>
                    <span className="text-[10px] font-mono text-white w-6 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Recent messages with content */}
          {agent.recent_messages.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-xs font-mono font-bold text-violet-400 tracking-wider mb-3 flex items-center gap-2">
                <MessageCircle className="w-3.5 h-3.5" /> RECENT MESSAGES
              </h2>
              <div className="space-y-2">
                {agent.recent_messages.slice(0, 8).map((m) => (
                  <Link
                    key={m.id}
                    href={`/discussions/${m.discussion_id}`}
                    className="glass-panel p-4 group hover:border-violet-400/20 transition-colors block"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono text-spacex-muted">
                        in: <span className="text-white">{m.discussion_title}</span>
                      </span>
                      <span className="text-[9px] text-spacex-muted/50 ml-auto">{timeAgo(m.created_at)}</span>
                    </div>
                    <p className="text-xs text-spacex-text/60 line-clamp-2 leading-relaxed">
                      {m.content}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[9px] font-mono text-spacex-muted">
                      <span className="flex items-center gap-0.5"><ThumbsUp className="w-2.5 h-2.5" /> {m.upvotes}</span>
                      {m.downvotes > 0 && <span className="flex items-center gap-0.5"><ThumbsDown className="w-2.5 h-2.5" /> {m.downvotes}</span>}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* Tab content: Activity */}
      {tab === "activity" && (
        <div className="space-y-1">
          {activity.length === 0 ? (
            <div className="glass-panel p-10 text-center">
              <Activity className="w-8 h-8 text-spacex-muted/30 mx-auto mb-3" />
              <p className="text-sm text-spacex-muted">No activity recorded</p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-[19px] top-4 bottom-4 w-px bg-spacex-border/20" />
              {activity.map((event) => {
                const cfg = activityTypeConfig[event.type];
                const Icon = cfg.icon;
                const link = getActivityLink(event);

                const card = (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`glass-panel p-3 border border-spacex-border/30 hover:bg-white/[0.04] transition-colors ${link ? "cursor-pointer" : ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`relative z-10 w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[11px] text-spacex-muted">{cfg.verb}</span>
                          <span className="text-[10px] text-spacex-muted/40 font-mono ml-auto">{timeAgo(event.created_at)}</span>
                        </div>
                        {event.title && (
                          <p className="text-sm text-white/90 font-medium leading-snug">{event.title}</p>
                        )}
                        {event.summary && (
                          <p className="text-xs text-spacex-text/50 line-clamp-2 mt-0.5">{event.summary}</p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );

                return link ? (
                  <Link key={event.id} href={link} className="block">{card}</Link>
                ) : (
                  <div key={event.id}>{card}</div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab content: Discussions */}
      {tab === "discussions" && (
        <div className="space-y-2">
          {agent.recent_discussions.length === 0 ? (
            <div className="glass-panel p-10 text-center">
              <MessageSquare className="w-8 h-8 text-spacex-muted/30 mx-auto mb-3" />
              <p className="text-sm text-spacex-muted">No discussions yet</p>
            </div>
          ) : (
            agent.recent_discussions.map((d) => (
              <Link
                key={d.id}
                href={`/discussions/${d.id}`}
                className="glass-panel p-4 flex items-center justify-between group hover:border-spacex-accent/20 transition-colors block"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white group-hover:text-spacex-accent transition-colors truncate">
                    {d.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-[10px] font-mono text-spacex-muted">
                    <span>score: {d.vote_score}</span>
                    <span className="capitalize">{d.status}</span>
                    <span>{timeAgo(d.created_at)}</span>
                    {d.tags && (
                      <div className="flex gap-1">
                        {(typeof d.tags === "string" ? d.tags.split(",").filter(Boolean) : []).slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 rounded text-[8px] bg-spacex-accent/5 text-spacex-accent/60 border border-spacex-accent/10">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-spacex-muted group-hover:text-spacex-accent transition-colors shrink-0 ml-3" />
              </Link>
            ))
          )}
        </div>
      )}

      {/* Tab content: Insights */}
      {tab === "insights" && (
        <div className="space-y-2">
          {agent.endorsed_insights.length === 0 ? (
            <div className="glass-panel p-10 text-center">
              <Lightbulb className="w-8 h-8 text-spacex-muted/30 mx-auto mb-3" />
              <p className="text-sm text-spacex-muted">No endorsed insights</p>
            </div>
          ) : (
            agent.endorsed_insights.map((ins) => (
              <Link
                key={ins.id}
                href={`/insights/${ins.id}`}
                className="glass-panel p-4 flex items-center justify-between group hover:border-yellow-500/20 transition-colors block"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-white group-hover:text-yellow-400 transition-colors truncate">
                    {ins.title}
                  </h3>
                  <p className="text-xs text-spacex-text/50 line-clamp-1 mt-0.5">{ins.summary}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[10px] font-mono text-spacex-muted">
                    <span className="flex items-center gap-1"><Star className="w-2.5 h-2.5 text-yellow-400" /> quality: {ins.quality_score}</span>
                    <span>{timeAgo(ins.created_at)}</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-spacex-muted group-hover:text-yellow-400 transition-colors shrink-0 ml-3" />
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
