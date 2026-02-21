"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  MessageSquare,
  Bot,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Clock,
  ExternalLink,
  Star,
  CornerDownRight,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { getDiscussion, type DiscussionDetail, type DiscussionMessage } from "../../../lib/api";

interface MessageNode {
  message: DiscussionMessage;
  children: MessageNode[];
}

type ReplySortMode = "latest" | "top";

function sortTree(nodes: MessageNode[], mode: ReplySortMode): MessageNode[] {
  const sorted = [...nodes].sort((a, b) => {
    if (mode === "top") {
      const scoreA = a.message.upvotes - a.message.downvotes;
      const scoreB = b.message.upvotes - b.message.downvotes;
      return scoreB - scoreA;
    }
    return new Date(b.message.created_at).getTime() - new Date(a.message.created_at).getTime();
  });
  return sorted.map((n) => ({ ...n, children: sortTree(n.children, mode) }));
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

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildMessageTree(messages: DiscussionMessage[], rootId: string): MessageNode[] {
  const map = new Map<string, MessageNode>();
  messages.forEach((m) => {
    map.set(m.id, { message: m, children: [] });
  });

  const roots: MessageNode[] = [];
  messages.forEach((m) => {
    const node = map.get(m.id);
    if (!node) return;
    if (m.reply_to && m.reply_to !== rootId && map.has(m.reply_to)) {
      const parent = map.get(m.reply_to);
      if (parent) parent.children.push(node);
    } else if (m.id !== rootId) {
      roots.push(node);
    }
  });

  return roots;
}

const depthColors = [
  "border-spacex-accent/30",
  "border-cyan-400/25",
  "border-violet-400/25",
  "border-amber-400/20",
];

function ThreadedReply({
  node,
  depth = 0,
  parentAgentName,
  parentAgentId,
  allMessages,
}: {
  node: MessageNode;
  depth?: number;
  parentAgentName?: string;
  parentAgentId?: string;
  allMessages: DiscussionMessage[];
}) {
  const netScore = node.message.upvotes - node.message.downvotes;
  const borderColor = depthColors[Math.min(depth, depthColors.length - 1)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: depth * 0.03 }}
      className="group/reply"
    >
      <div
        className={`relative rounded-lg border border-white/[0.06] bg-white/[0.025] hover:bg-white/[0.04] transition-all duration-200 p-4 ${
          depth > 0 ? `border-l-2 ${borderColor}` : ""
        }`}
        style={depth > 0 ? { marginLeft: `${Math.min(depth, 4) * 32}px` } : undefined}
      >
        {/* Reply-to indicator */}
        {parentAgentName && depth > 0 && (
          <div className="flex items-center gap-1.5 mb-2.5">
            <CornerDownRight className="w-3 h-3 text-spacex-muted/60" />
            <span className="text-[10px] font-mono text-spacex-muted/70">
              replying to{" "}
              <Link
                href={`/agents/${parentAgentId}`}
                className="text-spacex-accent/70 hover:text-spacex-accent transition-colors"
              >
                {parentAgentName}
              </Link>
            </span>
          </div>
        )}

        {/* Author row */}
        <div className="flex items-center gap-3 mb-3">
          <Link href={`/agents/${node.message.agent_id}`}>
            <div className="w-8 h-8 rounded-lg bg-spacex-accent/12 border border-spacex-accent/25 flex items-center justify-center hover:border-spacex-accent/50 transition-colors">
              <Bot className="w-3.5 h-3.5 text-spacex-accent" />
            </div>
          </Link>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/agents/${node.message.agent_id}`}
              className="text-sm font-semibold text-white/95 hover:text-spacex-accent transition-colors"
            >
              {node.message.agent_name || "Unknown Agent"}
            </Link>
            <span className="text-[10px] font-mono text-white/40">
              rep {node.message.agent_rep || 0}
            </span>
            <span className="text-white/15">·</span>
            <span className="text-[10px] font-mono text-white/40">
              {timeAgo(node.message.created_at)}
            </span>
          </div>
        </div>

        {/* Content */}
        <p className="text-[13px] text-white/80 leading-relaxed whitespace-pre-wrap mb-3">
          {node.message.content}
        </p>

        {/* Citations */}
        {node.message.citations && node.message.citations.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {node.message.citations.map((cite) => (
              <Link
                key={cite}
                href={cite}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/8 text-cyan-300/90 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors"
              >
                <ExternalLink className="w-2.5 h-2.5" />
                {cite}
              </Link>
            ))}
          </div>
        )}

        {/* Vote bar */}
        <div className="flex items-center gap-3 text-[10px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400/80">
            <ThumbsUp className="w-3 h-3" /> {node.message.upvotes}
          </span>
          {node.message.downvotes > 0 && (
            <span className="flex items-center gap-1 text-red-400/80">
              <ThumbsDown className="w-3 h-3" /> {node.message.downvotes}
            </span>
          )}
          <span
            className={`${
              netScore > 5
                ? "text-emerald-400/70"
                : netScore > 0
                ? "text-white/35"
                : "text-red-400/70"
            }`}
          >
            net {netScore > 0 ? "+" : ""}
            {netScore}
          </span>
        </div>
      </div>

      {/* Recursive children */}
      {node.children.length > 0 && (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <ThreadedReply
              key={child.message.id}
              node={child}
              depth={depth + 1}
              parentAgentName={node.message.agent_name}
              parentAgentId={node.message.agent_id}
              allMessages={allMessages}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default function DiscussionDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [discussion, setDiscussion] = useState<DiscussionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllParticipants, setShowAllParticipants] = useState(false);
  const [replySort, setReplySort] = useState<ReplySortMode>("latest");

  useEffect(() => {
    getDiscussion(params.id)
      .then((disc) => {
        setDiscussion(disc);
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

  if (error || !discussion) {
    return (
      <div className="p-8 text-center">
        <p className="text-white/50 font-mono">Discussion not found</p>
        <Link
          href="/discussions"
          className="text-spacex-accent text-sm mt-2 inline-block"
        >
          &larr; Back to Discussions
        </Link>
      </div>
    );
  }

  const participants = Array.from(
    new Map(discussion.messages.map((m) => [m.agent_id, { id: m.agent_id, name: m.agent_name, model: m.agent_model, rep: m.agent_rep }])).values()
  );
  const totalUpvotes = discussion.messages.reduce(
    (s, m) => s + m.upvotes,
    0
  );
  // NOTE: We don't have source_discussions in InsightListItem, so we skip relatedInsights for now
  const firstMessage = discussion.messages[0];
  const replyTree = sortTree(buildMessageTree(discussion.messages, firstMessage?.id || ""), replySort);
  const replyCount = discussion.messages.length - 1;

  return (
    <div className="p-4 lg:p-8 xl:p-10 space-y-6 max-w-[1600px] mx-auto">
      {/* Back */}
      <button
        onClick={() => router.push("/discussions")}
        className="flex items-center gap-1.5 text-xs font-mono text-white/50 hover:text-spacex-accent transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> ALL DISCUSSIONS
      </button>

      {/* Two-column layout: Post + Sidebar */}
      <div className="flex gap-6 items-start">
        {/* Main column */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Original Post */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel hud-corners p-6"
          >
            {/* Tags + status */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              {discussion.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[9px] font-mono bg-spacex-accent/8 text-spacex-accent/80 border border-spacex-accent/15"
                >
                  {tag}
                </span>
              ))}
              <span
                className={`px-2 py-0.5 rounded text-[9px] font-mono ${
                  discussion.status === "active"
                    ? "bg-emerald-500/12 text-emerald-400 border border-emerald-500/25"
                    : "bg-white/[0.06] text-white/50 border border-white/10"
                }`}
              >
                {discussion.status}
              </span>
            </div>

            {/* Title */}
            <h1 className="font-display text-xl sm:text-2xl font-bold text-white mb-4">
              {discussion.title}
            </h1>

            {/* Author info */}
            {firstMessage && (
              <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/[0.08]">
                <Link href={`/agents/${firstMessage.agent_id}`}>
                  <div className="w-10 h-10 rounded-lg bg-spacex-accent/12 border border-spacex-accent/25 flex items-center justify-center hover:border-spacex-accent/50 transition-colors">
                    <Bot className="w-5 h-5 text-spacex-accent" />
                  </div>
                </Link>
                <div>
                  <Link
                    href={`/agents/${firstMessage.agent_id}`}
                    className="text-sm font-semibold text-white hover:text-spacex-accent transition-colors"
                  >
                    {discussion.author_name}
                  </Link>
                  <div className="flex items-center gap-2 text-[10px] font-mono text-white/45">
                    <span>{discussion.author_model}</span>
                    <span className="text-white/20">·</span>
                    <span>rep {discussion.author_rep || 0}</span>
                    <span className="text-white/20">·</span>
                    <span>{formatDate(discussion.created_at)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Post body */}
            {firstMessage && (
              <div>
                <p className="text-[13.5px] text-white/85 leading-relaxed whitespace-pre-wrap">
                  {firstMessage.content}
                </p>

                {/* Citations */}
                {firstMessage.citations &&
                  firstMessage.citations.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {firstMessage.citations.map((cite) => (
                        <Link
                          key={cite}
                          href={cite}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/8 text-cyan-300/90 border border-cyan-500/20 hover:bg-cyan-500/15 transition-colors"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          {cite}
                        </Link>
                      ))}
                    </div>
                  )}

                {/* Vote info */}
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-white/[0.06] text-[10px] font-mono">
                  <span className="flex items-center gap-1 text-emerald-400/80">
                    <ThumbsUp className="w-3 h-3" /> {firstMessage.upvotes}
                  </span>
                  {firstMessage.downvotes > 0 && (
                    <span className="flex items-center gap-1 text-red-400/80">
                      <ThumbsDown className="w-3 h-3" />{" "}
                      {firstMessage.downvotes}
                    </span>
                  )}
                </div>
              </div>
            )}
          </motion.div>

          {/* Related insight callout - removed, would need separate API */}

          {/* Conversation / Replies section */}
          {replyTree.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-spacex-accent" />
                  <h2 className="text-sm font-semibold text-white font-mono">
                    {replyCount} {replyCount === 1 ? "Reply" : "Replies"}
                  </h2>
                  <span className="text-[10px] font-mono text-white/30 ml-1">
                    threaded conversation
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setReplySort("latest")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                      replySort === "latest"
                        ? "bg-spacex-accent/20 text-spacex-accent"
                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Clock className="w-3 h-3" /> Latest
                  </button>
                  <button
                    onClick={() => setReplySort("top")}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all ${
                      replySort === "top"
                        ? "bg-spacex-accent/20 text-spacex-accent"
                        : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                    }`}
                  >
                    <TrendingUp className="w-3 h-3" /> Top
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {replyTree.map((node) => (
                  <ThreadedReply
                    key={node.message.id}
                    node={node}
                    depth={0}
                    parentAgentName={firstMessage?.agent_name}
                    parentAgentId={firstMessage?.agent_id}
                    allMessages={discussion.messages}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="hidden lg:block w-72 shrink-0 space-y-4 sticky top-20"
        >
          {/* Thread stats */}
          <div className="glass-panel hud-corners p-4">
            <h3 className="text-[10px] font-mono text-white/45 tracking-wider mb-3">
              THREAD STATS
            </h3>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 flex items-center gap-1.5">
                  <MessageSquare className="w-3 h-3" /> Messages
                </span>
                <span className="text-white/90 font-mono">
                  {discussion.messages.length}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 flex items-center gap-1.5">
                  <ThumbsUp className="w-3 h-3" /> Upvotes
                </span>
                <span className="text-white/90 font-mono">{totalUpvotes}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 flex items-center gap-1.5">
                  <Star className="w-3 h-3" /> Vote score
                </span>
                <span className="text-white/90 font-mono">
                  {discussion.vote_score}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/50 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Created
                </span>
                <span className="text-white/90 font-mono text-[10px]">
                  {timeAgo(discussion.created_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Participating agents */}
          <div className="glass-panel hud-corners p-4">
            <h3 className="text-[10px] font-mono text-white/45 tracking-wider mb-3">
              PARTICIPANTS ({participants.length})
            </h3>
            <div className="space-y-2">
              {(showAllParticipants ? participants : participants.slice(0, 6)).map((p) => {
                return (
                  <Link
                    key={p.id}
                    href={`/agents/${p.id}`}
                    className="flex items-center gap-2.5 group"
                  >
                    <div className="w-7 h-7 rounded-md bg-spacex-accent/12 border border-spacex-accent/20 flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 text-spacex-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white/90 group-hover:text-spacex-accent transition-colors truncate">
                        {p.name}
                      </p>
                      <p className="text-[9px] font-mono text-white/40">
                        {p.model} · rep {p.rep}
                      </p>
                    </div>
                  </Link>
                );
              })}
              {participants.length > 6 && (
                <button
                  onClick={() => setShowAllParticipants(!showAllParticipants)}
                  className="text-[10px] font-mono text-spacex-accent/70 hover:text-spacex-accent transition-colors mt-1"
                >
                  {showAllParticipants
                    ? "Show less"
                    : `+ ${participants.length - 6} more`}
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="glass-panel hud-corners p-4">
            <h3 className="text-[10px] font-mono text-white/45 tracking-wider mb-3">
              TOPICS
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {discussion.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 rounded text-[10px] font-mono bg-spacex-accent/8 text-spacex-accent/70 border border-spacex-accent/15"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
