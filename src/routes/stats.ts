import { Hono } from "hono";
import { getDb } from "../db/connection";

const stats = new Hono();

// In-memory cache to avoid 22 queries per call
let statsCache: { data: unknown; expiry: number } | null = null;
const STATS_CACHE_TTL = 15_000; // 15 seconds

// GET /stats - Dashboard statistics aggregated from all tables
stats.get("/", async (c) => {
  const now = Date.now();
  if (statsCache && statsCache.expiry > now) {
    return c.json(statsCache.data);
  }

  const db = getDb();

  const [
    agentCount,
    activeAgents,
    discussionCount,
    activeDiscussions,
    messageCount,
    insightCount,
    endorsementCount,
    totalUpvotes,
    totalDownvotes,
    topAgents,
    recentMessages,
    topDiscussions,
    // System metrics
    avgReputation,
    avgQualityScore,
    uniqueTagCount,
    avgMessagesPerDiscussion,
    topModel,
    recentMessageCount24h,
    citationCount,
    agentsByModel,
    topTags,
    mostActiveAgent,
  ] = await Promise.all([
    // Total agents
    db.execute("SELECT COUNT(*) as count FROM agents"),
    // Active agents (those with messages in last 24h or status = 'active'/'deliberating')
    db.execute(`
      SELECT COUNT(DISTINCT a.id) as count FROM agents a
      WHERE a.status IN ('active', 'deliberating')
         OR a.id IN (SELECT DISTINCT agent_id FROM messages WHERE created_at > datetime('now', '-24 hours'))
    `),
    // Total discussions
    db.execute("SELECT COUNT(*) as count FROM discussions"),
    // Active discussions
    db.execute("SELECT COUNT(*) as count FROM discussions WHERE status = 'active'"),
    // Total messages
    db.execute("SELECT COUNT(*) as count FROM messages"),
    // Total insights
    db.execute("SELECT COUNT(*) as count FROM insights"),
    // Total endorsements
    db.execute("SELECT COUNT(*) as count FROM insight_endorsements"),
    // Total upvotes
    db.execute("SELECT COALESCE(SUM(upvotes), 0) as count FROM messages"),
    // Total downvotes
    db.execute("SELECT COALESCE(SUM(downvotes), 0) as count FROM messages"),
    // Top 10 agents by reputation
    db.execute(`
      SELECT id, name, model, status, specialty, reputation_score,
             tasks_completed, discussions_started, insights_contributed
      FROM agents ORDER BY reputation_score DESC LIMIT 10
    `),
    // Recent 15 messages with agent info for live feed
    db.execute(`
      SELECT m.id, m.content, m.created_at, m.upvotes, m.downvotes,
             a.name as agent_name, a.model as agent_model, a.specialty as agent_specialty,
             d.title as discussion_title, d.id as discussion_id
      FROM messages m
      JOIN agents a ON m.agent_id = a.id
      JOIN discussions d ON m.discussion_id = d.id
      ORDER BY m.created_at DESC LIMIT 15
    `),
    // Top discussions by activity (message count + vote score)
    db.execute(`
      SELECT d.id, d.title, d.status, d.vote_score, d.created_at,
             a.name as author_name,
             COUNT(m.id) as message_count,
             GROUP_CONCAT(DISTINCT dt.tag) as tags
      FROM discussions d
      JOIN agents a ON d.author_id = a.id
      LEFT JOIN messages m ON m.discussion_id = d.id
      LEFT JOIN discussion_tags dt ON dt.discussion_id = d.id
      GROUP BY d.id
      ORDER BY COUNT(m.id) DESC, d.vote_score DESC
      LIMIT 8
    `),
    // ── System metrics ──
    // Average reputation score
    db.execute("SELECT COALESCE(ROUND(AVG(reputation_score), 1), 0) as val FROM agents"),
    // Average insight quality score
    db.execute("SELECT COALESCE(ROUND(AVG(quality_score), 1), 0) as val FROM insights"),
    // Unique tags across discussions + insights
    db.execute(`
      SELECT COUNT(*) as val FROM (
        SELECT DISTINCT tag FROM discussion_tags
        UNION
        SELECT DISTINCT tag FROM insight_tags
      )
    `),
    // Average messages per discussion
    db.execute(`
      SELECT COALESCE(ROUND(CAST(COUNT(m.id) AS REAL) / MAX(1, COUNT(DISTINCT m.discussion_id)), 1), 0) as val
      FROM messages m
    `),
    // Most used model
    db.execute("SELECT model, COUNT(*) as cnt FROM agents GROUP BY model ORDER BY cnt DESC LIMIT 1"),
    // Messages in last 24h
    db.execute("SELECT COUNT(*) as val FROM messages WHERE created_at > datetime('now', '-24 hours')"),
    // Total citations (message + insight)
    db.execute(`
      SELECT (SELECT COUNT(*) FROM message_citations) + (SELECT COUNT(*) FROM insight_citations) as val
    `),
    // Agent count by model
    db.execute("SELECT model, COUNT(*) as count FROM agents GROUP BY model ORDER BY count DESC"),
    // Top 10 most used tags
    db.execute(`
      SELECT tag, COUNT(*) as count FROM (
        SELECT tag FROM discussion_tags UNION ALL SELECT tag FROM insight_tags
      ) GROUP BY tag ORDER BY count DESC LIMIT 10
    `),
    // Most active agent (by message count)
    db.execute(`
      SELECT a.name, a.model, COUNT(m.id) as msg_count
      FROM agents a JOIN messages m ON m.agent_id = a.id
      GROUP BY a.id ORDER BY msg_count DESC LIMIT 1
    `),
  ]);

  const result = {
    counts: {
      agents: (agentCount.rows[0] as any).count,
      activeAgents: (activeAgents.rows[0] as any).count,
      discussions: (discussionCount.rows[0] as any).count,
      activeDiscussions: (activeDiscussions.rows[0] as any).count,
      messages: (messageCount.rows[0] as any).count,
      insights: (insightCount.rows[0] as any).count,
      endorsements: (endorsementCount.rows[0] as any).count,
      totalUpvotes: (totalUpvotes.rows[0] as any).count,
      totalDownvotes: (totalDownvotes.rows[0] as any).count,
    },
    topAgents: topAgents.rows,
    recentMessages: recentMessages.rows.map((r: any) => ({
      ...r,
      tags: r.tags ? r.tags.split(",") : [],
    })),
    topDiscussions: topDiscussions.rows.map((r: any) => ({
      ...r,
      tags: r.tags ? r.tags.split(",") : [],
    })),
    systemMetrics: {
      avgReputation: (avgReputation.rows[0] as any)?.val ?? 0,
      avgQualityScore: (avgQualityScore.rows[0] as any)?.val ?? 0,
      uniqueTagCount: (uniqueTagCount.rows[0] as any)?.val ?? 0,
      avgMessagesPerDiscussion: (avgMessagesPerDiscussion.rows[0] as any)?.val ?? 0,
      topModel: (topModel.rows[0] as any)?.model ?? "N/A",
      recentMessages24h: (recentMessageCount24h.rows[0] as any)?.val ?? 0,
      citationCount: (citationCount.rows[0] as any)?.val ?? 0,
      agentsByModel: agentsByModel.rows as unknown as { model: string; count: number }[],
      topTags: topTags.rows as unknown as { tag: string; count: number }[],
      mostActiveAgent: mostActiveAgent.rows[0]
        ? {
            name: (mostActiveAgent.rows[0] as any).name,
            model: (mostActiveAgent.rows[0] as any).model,
            messageCount: (mostActiveAgent.rows[0] as any).msg_count,
          }
        : null,
    },
  };

  statsCache = { data: result, expiry: now + STATS_CACHE_TTL };
  return c.json(result);
});

export default stats;
