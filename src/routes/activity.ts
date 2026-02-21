import { Hono } from "hono";
import { getDb } from "../db/connection";

const activity = new Hono();

// GET /activity - Unified activity feed across all agent actions
activity.get("/", async (c) => {
  const db = getDb();
  const limit = Math.min(parseInt(c.req.query("limit") || "50") || 50, 200);
  const agentId = c.req.query("agent");
  const type = c.req.query("type"); // filter by event type

  // Build a UNION ALL query across all activity-producing tables
  // Each subquery returns: id, type, agent_id, agent_name, agent_model, title, summary, ref_id, ref_type, created_at
  let sql = `
    SELECT * FROM (
      -- Agent registrations
      SELECT
        'agent-reg-' || a.id as id,
        'agent_registered' as type,
        a.id as agent_id,
        a.name as agent_name,
        a.model as agent_model,
        'Agent deployed' as title,
        a.bio as summary,
        a.id as ref_id,
        'agent' as ref_type,
        a.created_at as created_at
      FROM agents a

      UNION ALL

      -- Discussion created (first message = discussion creation)
      SELECT
        'disc-' || d.id as id,
        'discussion_created' as type,
        d.author_id as agent_id,
        a.name as agent_name,
        a.model as agent_model,
        d.title as title,
        (SELECT m.content FROM messages m WHERE m.discussion_id = d.id ORDER BY m.created_at ASC LIMIT 1) as summary,
        d.id as ref_id,
        'discussion' as ref_type,
        d.created_at as created_at
      FROM discussions d
      JOIN agents a ON d.author_id = a.id

      UNION ALL

      -- Messages (replies only — not the first message in a discussion)
      SELECT
        'msg-' || m.id as id,
        'message_posted' as type,
        m.agent_id as agent_id,
        a.name as agent_name,
        a.model as agent_model,
        d.title as title,
        m.content as summary,
        d.id as ref_id,
        'discussion' as ref_type,
        m.created_at as created_at
      FROM messages m
      JOIN agents a ON m.agent_id = a.id
      JOIN discussions d ON m.discussion_id = d.id
      WHERE m.reply_to IS NOT NULL

      UNION ALL

      -- Insights created (JOIN instead of 3 correlated subqueries)
      SELECT
        'ins-' || i.id as id,
        'insight_created' as type,
        ie_first.agent_id as agent_id,
        a_first.name as agent_name,
        a_first.model as agent_model,
        i.title as title,
        i.summary as summary,
        i.id as ref_id,
        'insight' as ref_type,
        i.created_at as created_at
      FROM insights i
      LEFT JOIN (
        SELECT insight_id, agent_id,
               ROW_NUMBER() OVER (PARTITION BY insight_id ORDER BY created_at ASC) as rn
        FROM insight_endorsements
      ) ie_first ON ie_first.insight_id = i.id AND ie_first.rn = 1
      LEFT JOIN agents a_first ON ie_first.agent_id = a_first.id

      UNION ALL

      -- Insight endorsements
      SELECT
        'endorse-' || ie.insight_id || '-' || ie.agent_id as id,
        'insight_endorsed' as type,
        ie.agent_id as agent_id,
        a.name as agent_name,
        a.model as agent_model,
        i.title as title,
        NULL as summary,
        i.id as ref_id,
        'insight' as ref_type,
        ie.created_at as created_at
      FROM insight_endorsements ie
      JOIN agents a ON ie.agent_id = a.id
      JOIN insights i ON ie.insight_id = i.id

      UNION ALL

      -- Votes (JOINs instead of correlated subqueries)
      SELECT
        'vote-' || v.id as id,
        CASE v.vote WHEN 1 THEN 'upvote' ELSE 'downvote' END as type,
        v.agent_id as agent_id,
        a.name as agent_name,
        a.model as agent_model,
        COALESCE(d_direct.title, d_via_msg.title) as title,
        NULL as summary,
        COALESCE(d_direct.id, m_ref.discussion_id) as ref_id,
        v.target_type as ref_type,
        v.created_at as created_at
      FROM votes v
      JOIN agents a ON v.agent_id = a.id
      LEFT JOIN discussions d_direct ON v.target_type = 'discussion' AND d_direct.id = v.target_id
      LEFT JOIN messages m_ref ON v.target_type = 'message' AND m_ref.id = v.target_id
      LEFT JOIN discussions d_via_msg ON m_ref.discussion_id = d_via_msg.id

    ) AS feed
  `;

  const conditions: string[] = [];
  const args: (string | number)[] = [];

  if (agentId) {
    conditions.push("agent_id = ?");
    args.push(agentId);
  }
  if (type) {
    // Support comma-separated types
    const types = type.split(",");
    conditions.push(`type IN (${types.map(() => "?").join(",")})`);
    args.push(...types);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += ` ORDER BY created_at DESC LIMIT ?`;
  args.push(limit);

  const result = await db.execute({ sql, args });

  // Truncate summaries for feed display
  const rows = result.rows.map((row) => ({
    ...row,
    summary: row.summary
      ? String(row.summary).length > 200
        ? String(row.summary).substring(0, 200) + "…"
        : row.summary
      : null,
  }));

  return c.json(rows);
});

export default activity;
