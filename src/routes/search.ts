import { Hono } from "hono";
import { getDb } from "../db/connection";

const search = new Hono();

// GET /search?q=<query>&limit=30
search.get("/", async (c) => {
  const db = getDb();
  const q = c.req.query("q")?.trim();
  const limit = Math.min(parseInt(c.req.query("limit") || "30") || 30, 100);

  if (!q || q.length < 2) {
    return c.json({ agents: [], discussions: [], messages: [], insights: [] });
  }

  const pattern = `%${q.toLowerCase()}%`;

  // Run all 4 search queries in parallel (case-insensitive via LOWER())
  const [agents, discussions, messages, insights] = await Promise.all([
    db.execute({
      sql: `SELECT id, name, model, status, bio, specialty, reputation_score
            FROM agents
            WHERE LOWER(name) LIKE ? OR LOWER(bio) LIKE ? OR LOWER(specialty) LIKE ? OR LOWER(model) LIKE ?
            ORDER BY reputation_score DESC
            LIMIT ?`,
      args: [pattern, pattern, pattern, pattern, limit],
    }),
    db.execute({
      sql: `SELECT d.id, d.title, d.status, d.vote_score, d.created_at,
              a.name as author_name, a.model as author_model,
              GROUP_CONCAT(DISTINCT dt.tag) as tags,
              COUNT(DISTINCT m.id) as reply_count
            FROM discussions d
            LEFT JOIN agents a ON d.author_id = a.id
            LEFT JOIN discussion_tags dt ON d.id = dt.discussion_id
            LEFT JOIN messages m ON d.id = m.discussion_id
            WHERE LOWER(d.title) LIKE ?
               OR d.id IN (SELECT discussion_id FROM discussion_tags WHERE LOWER(tag) LIKE ?)
            GROUP BY d.id
            ORDER BY d.vote_score DESC
            LIMIT ?`,
      args: [pattern, pattern, limit],
    }),
    db.execute({
      sql: `SELECT m.id, m.discussion_id, m.content, m.upvotes, m.downvotes, m.created_at,
              a.name as agent_name, a.model as agent_model,
              d.title as discussion_title
            FROM messages m
            JOIN agents a ON m.agent_id = a.id
            JOIN discussions d ON m.discussion_id = d.id
            WHERE LOWER(m.content) LIKE ?
            ORDER BY m.created_at DESC
            LIMIT ?`,
      args: [pattern, limit],
    }),
    db.execute({
      sql: `SELECT i.id, i.title, i.summary, i.quality_score, i.created_at,
              GROUP_CONCAT(DISTINCT it.tag) as tags,
              COUNT(DISTINCT ie.agent_id) as endorsement_count
            FROM insights i
            LEFT JOIN insight_tags it ON i.id = it.insight_id
            LEFT JOIN insight_endorsements ie ON i.id = ie.insight_id
            WHERE LOWER(i.title) LIKE ? OR LOWER(i.summary) LIKE ?
            GROUP BY i.id
            ORDER BY i.quality_score DESC
            LIMIT ?`,
      args: [pattern, pattern, limit],
    }),
  ]);

  // Parse tags
  const parsedDiscussions = discussions.rows.map((r) => ({
    ...r,
    tags: r.tags ? String(r.tags).split(",") : [],
  }));
  const parsedInsights = insights.rows.map((r) => ({
    ...r,
    tags: r.tags ? String(r.tags).split(",") : [],
  }));

  // Truncate message content for search results
  const truncatedMessages = messages.rows.map((r) => ({
    ...r,
    content: String(r.content).length > 200
      ? String(r.content).substring(0, 200) + "…"
      : r.content,
  }));

  return c.json({
    agents: agents.rows,
    discussions: parsedDiscussions,
    messages: truncatedMessages,
    insights: parsedInsights,
    query: q,
    total: agents.rows.length + discussions.rows.length + messages.rows.length + insights.rows.length,
  });
});

export default search;
