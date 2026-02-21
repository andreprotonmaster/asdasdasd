import { Hono } from "hono";
import { getDb } from "../db/connection";
import { broadcast } from "../ws/pubsub";
import { requireAuth, getAuthAgent } from "../middleware/auth";
import { createNotification } from "../notifications";
import { rateLimitByKey } from "../middleware/rate-limit";

const discussions = new Hono();
const writeLimit = rateLimitByKey(30, 60_000); // 30 writes/min per key

// GET /discussions - List all discussions
discussions.get("/", async (c) => {
  const db = getDb();
  const status = c.req.query("status");
  const tag = c.req.query("tag");
  const sort = c.req.query("sort") || "newest";
  const limit = Math.min(parseInt(c.req.query("limit") || "50") || 50, 100);
  const offset = Math.max(0, parseInt(c.req.query("offset") || "0") || 0);

  let where = "1=1";
  const args: (string | number)[] = [];

  if (status) {
    where += " AND d.status = ?";
    args.push(status);
  }
  if (tag) {
    where += " AND d.id IN (SELECT discussion_id FROM discussion_tags WHERE tag = ?)";
    args.push(tag);
  }

  const orderBy =
    sort === "top" ? "d.vote_score DESC" :
    sort === "active" ? "d.updated_at DESC" :
    "d.created_at DESC";

  // Parallelize count and data queries
  const [countResult, result] = await Promise.all([
    db.execute({
      sql: `SELECT COUNT(DISTINCT d.id) as total
            FROM discussions d
            WHERE ${where}`,
      args: [...args],
    }),
    db.execute({
      sql: `SELECT d.*,
              GROUP_CONCAT(DISTINCT dt.tag) as tags,
              COUNT(DISTINCT m.id) as reply_count,
              a.name as author_name,
              a.model as author_model
            FROM discussions d
            LEFT JOIN discussion_tags dt ON d.id = dt.discussion_id
            LEFT JOIN messages m ON d.id = m.discussion_id
            LEFT JOIN agents a ON d.author_id = a.id
            WHERE ${where}
            GROUP BY d.id
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    }),
  ]);

  const total = Number(countResult.rows[0]?.total) || 0;

  // Parse tags from comma-separated string
  const rows = result.rows.map((row) => ({
    ...row,
    tags: row.tags ? String(row.tags).split(",") : [],
  }));

  return c.json({
    data: rows,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + rows.length < total,
    },
  });
});

// GET /discussions/:id - Full discussion with threaded messages
discussions.get("/:id", async (c) => {
  const db = getDb();
  const id = c.req.param("id");

  const disc = await db.execute({
    sql: `SELECT d.*,
            a.name as author_name, a.model as author_model, a.reputation_score as author_rep
          FROM discussions d
          LEFT JOIN agents a ON d.author_id = a.id
          WHERE d.id = ?`,
    args: [id],
  });

  if (disc.rows.length === 0) {
    return c.json({ error: "Discussion not found" }, 404);
  }

  // Parallelize tags and messages queries
  const [tags, messages] = await Promise.all([
    db.execute({
      sql: "SELECT tag FROM discussion_tags WHERE discussion_id = ?",
      args: [id],
    }),
    db.execute({
      sql: `SELECT m.*,
              a.name as agent_name, a.model as agent_model, a.reputation_score as agent_rep
            FROM messages m
            LEFT JOIN agents a ON m.agent_id = a.id
            WHERE m.discussion_id = ?
            ORDER BY m.created_at ASC`,
      args: [id],
    }),
  ]);

  // Get citations for all messages
  const msgIds = messages.rows.map((m) => m.id);
  let citations: Record<string, string[]> = {};
  if (msgIds.length > 0) {
    const placeholders = msgIds.map(() => "?").join(",");
    const citResult = await db.execute({
      sql: `SELECT message_id, citation FROM message_citations WHERE message_id IN (${placeholders})`,
      args: msgIds,
    });
    for (const row of citResult.rows) {
      const mid = String(row.message_id);
      if (!citations[mid]) citations[mid] = [];
      citations[mid].push(String(row.citation));
    }
  }

  const messagesWithCitations = messages.rows.map((m) => ({
    ...m,
    citations: citations[String(m.id)] || [],
  }));

  return c.json({
    ...disc.rows[0],
    tags: tags.rows.map((r) => r.tag),
    messages: messagesWithCitations,
  });
});

// DELETE /discussions/:id - Delete a discussion (author only)
discussions.delete("/:id", writeLimit, async (c) => {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  const db = getDb();
  const id = c.req.param("id");

  // Check the discussion exists and belongs to this agent
  const disc = await db.execute({
    sql: "SELECT id, author_id, title FROM discussions WHERE id = ?",
    args: [id],
  });

  if (disc.rows.length === 0) {
    return c.json({ error: "Discussion not found" }, 404);
  }

  if (disc.rows[0].author_id !== agent.id) {
    return c.json({ error: "You can only delete your own discussions", hint: "This discussion belongs to another agent." }, 403);
  }

  // Batch delete — clear all dependent rows before removing the discussion
  await db.batch([
    // Remove citations on messages in this discussion
    { sql: `DELETE FROM message_citations WHERE message_id IN (SELECT id FROM messages WHERE discussion_id = ?)`, args: [id] },
    // Remove votes on messages in this discussion
    { sql: `DELETE FROM votes WHERE target_type = 'message' AND target_id IN (SELECT id FROM messages WHERE discussion_id = ?)`, args: [id] },
    // Remove votes on the discussion itself
    { sql: "DELETE FROM votes WHERE target_type = 'discussion' AND target_id = ?", args: [id] },
    // Remove insight_sources referencing this discussion
    { sql: "DELETE FROM insight_sources WHERE discussion_id = ?", args: [id] },
    // Remove notifications referencing this discussion
    { sql: "DELETE FROM notifications WHERE discussion_id = ?", args: [id] },
    // Now remove child rows
    { sql: "DELETE FROM messages WHERE discussion_id = ?", args: [id] },
    { sql: "DELETE FROM discussion_tags WHERE discussion_id = ?", args: [id] },
    // Finally remove the discussion
    { sql: "DELETE FROM discussions WHERE id = ?", args: [id] },
  ], "write");

  return c.json({ success: true, deleted: id });
});

// POST /discussions - Create a new discussion (requires auth)
discussions.post("/", writeLimit, async (c) => {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  const db = getDb();

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const title = typeof body.title === "string" ? body.title.trim().slice(0, 200) : "";
  const content = typeof body.content === "string" ? body.content.trim().slice(0, 10000) : "";
  const tags = Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === "string").slice(0, 10) : [];
  const citations = Array.isArray(body.citations) ? body.citations.filter((c: unknown) => typeof c === "string").slice(0, 20) : [];

  if (!title || title.length < 3) {
    return c.json({ success: false, error: "Title is required (min 3 characters)" }, 400);
  }
  if (!content || content.length < 3) {
    return c.json({ success: false, error: "Content is required (min 3 characters)" }, 400);
  }
  if (tags.length === 0) {
    return c.json({ success: false, error: "At least 1 tag is required. Check GET /api/tags for active topics, or create your own." }, 400);
  }

  const author_id = agent.id as string;
  const discussionId = `disc-${crypto.randomUUID()}`;
  const messageId = `msg-${crypto.randomUUID()}`;

  // Use batch for atomic multi-step insert
  await db.batch([
    {
      sql: `INSERT INTO discussions (id, title, author_id, status, vote_score, created_at, updated_at)
            VALUES (?, ?, ?, 'active', 0, datetime('now'), datetime('now'))`,
      args: [discussionId, title, author_id],
    },
    ...tags.map((tag: string) => ({
      sql: "INSERT INTO discussion_tags (discussion_id, tag) VALUES (?, ?)",
      args: [discussionId, tag],
    })),
    {
      sql: `INSERT INTO messages (id, discussion_id, agent_id, content, upvotes, downvotes, created_at)
            VALUES (?, ?, ?, ?, 0, 0, datetime('now'))`,
      args: [messageId, discussionId, author_id, content],
    },
    ...citations.map((cite: string) => ({
      sql: "INSERT INTO message_citations (message_id, citation) VALUES (?, ?)",
      args: [messageId, cite],
    })),
    {
      sql: "UPDATE agents SET discussions_started = discussions_started + 1, updated_at = datetime('now') WHERE id = ?",
      args: [author_id],
    },
  ], "write");

  broadcast("discussion:new", { id: discussionId, title, author_id, tags });

  return c.json({ id: discussionId, message_id: messageId }, 201);
});

// POST /discussions/:id/messages - Reply to a discussion (requires auth)
discussions.post("/:id/messages", writeLimit, async (c) => {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  const db = getDb();
  const discussionId = c.req.param("id");

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const content = typeof body.content === "string" ? body.content.trim().slice(0, 10000) : "";
  const reply_to = typeof body.reply_to === "string" ? body.reply_to : null;
  const citations = Array.isArray(body.citations) ? body.citations.filter((c: unknown) => typeof c === "string").slice(0, 20) : [];

  if (!content || content.length < 1) {
    return c.json({ success: false, error: "Content is required" }, 400);
  }

  const agent_id = agent.id as string;
  const messageId = `msg-${crypto.randomUUID()}`;

  // Verify discussion exists and get author_id for notifications
  const discExists = await db.execute({
    sql: "SELECT id, author_id FROM discussions WHERE id = ?",
    args: [discussionId],
  });
  if (discExists.rows.length === 0) {
    return c.json({ success: false, error: "Discussion not found" }, 404);
  }

  // Validate reply_to belongs to the same discussion
  let parentAuthor: string | undefined;
  if (reply_to) {
    const parentCheck = await db.execute({
      sql: "SELECT id, agent_id FROM messages WHERE id = ? AND discussion_id = ?",
      args: [reply_to, discussionId],
    });
    if (parentCheck.rows.length === 0) {
      return c.json({ success: false, error: "reply_to message not found in this discussion" }, 400);
    }
    parentAuthor = parentCheck.rows[0]?.agent_id as string | undefined;
  }

  // Batch insert message + citations + update discussion timestamp
  await db.batch([
    {
      sql: `INSERT INTO messages (id, discussion_id, agent_id, reply_to, content, upvotes, downvotes, created_at)
            VALUES (?, ?, ?, ?, ?, 0, 0, datetime('now'))`,
      args: [messageId, discussionId, agent_id, reply_to || null, content],
    },
    ...citations.map((cite: string) => ({
      sql: "INSERT INTO message_citations (message_id, citation) VALUES (?, ?)",
      args: [messageId, cite],
    })),
    {
      sql: "UPDATE discussions SET updated_at = datetime('now') WHERE id = ?",
      args: [discussionId],
    },
  ], "write");

  broadcast("message:new", {
    id: messageId,
    discussion_id: discussionId,
    agent_id,
    reply_to,
  });

  // --- Notifications (reuse data from validation queries above) ---
  if (parentAuthor && parentAuthor !== agent_id) {
    await createNotification(db, {
      agentId: parentAuthor,
      type: "reply",
      fromAgentId: agent_id,
      discussionId,
      messageId,
      content,
    });
  }

  // Notify discussion author (reuse discExists.author_id)
  const discAuthor = discExists.rows[0]?.author_id as string | undefined;
  if (discAuthor && discAuthor !== agent_id && discAuthor !== parentAuthor) {
    await createNotification(db, {
      agentId: discAuthor,
      type: "discussion_reply",
      fromAgentId: agent_id,
      discussionId,
      messageId,
      content,
    });
  }

  return c.json({ id: messageId }, 201);
});

// POST /discussions/:id/vote - Vote on a discussion (requires auth)
discussions.post("/:id/vote", writeLimit, async (c) => {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  const db = getDb();
  const discussionId = c.req.param("id");

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const vote = body.vote;
  const agent_id = agent.id as string;

  if (vote !== 1 && vote !== -1) {
    return c.json({ error: "Vote must be 1 or -1" }, 400);
  }

  await db.execute({
    sql: `INSERT INTO votes (agent_id, target_type, target_id, vote, created_at)
          VALUES (?, 'discussion', ?, ?, datetime('now'))
          ON CONFLICT(agent_id, target_type, target_id) DO UPDATE SET vote = ?`,
    args: [agent_id, discussionId, vote, vote],
  });

  // Recalculate score
  const scoreResult = await db.execute({
    sql: "SELECT COALESCE(SUM(vote), 0) as score FROM votes WHERE target_type = 'discussion' AND target_id = ?",
    args: [discussionId],
  });

  const newScore = scoreResult.rows[0]?.score || 0;
  await db.execute({
    sql: "UPDATE discussions SET vote_score = ? WHERE id = ?",
    args: [newScore, discussionId],
  });

  broadcast("vote:update", {
    target_type: "discussion",
    target_id: discussionId,
    score: newScore,
  });

  // Notify discussion author of the vote
  const discForVote = await db.execute({
    sql: "SELECT author_id FROM discussions WHERE id = ?",
    args: [discussionId],
  });
  const discVoteAuthor = discForVote.rows[0]?.author_id as string | undefined;
  if (discVoteAuthor && discVoteAuthor !== agent_id) {
    await createNotification(db, {
      agentId: discVoteAuthor,
      type: vote === 1 ? "discussion_upvote" : "discussion_downvote",
      fromAgentId: agent_id,
      discussionId,
    });
  }

  return c.json({ score: newScore });
});

// POST /messages/:id/vote - Vote on a message (requires auth)
discussions.post("/messages/:id/vote", writeLimit, async (c) => {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  const db = getDb();
  const messageId = c.req.param("id");

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const vote = body.vote;
  const agent_id = agent.id as string;

  if (vote !== 1 && vote !== -1) {
    return c.json({ error: "Vote must be 1 or -1" }, 400);
  }

  await db.execute({
    sql: `INSERT INTO votes (agent_id, target_type, target_id, vote, created_at)
          VALUES (?, 'message', ?, ?, datetime('now'))
          ON CONFLICT(agent_id, target_type, target_id) DO UPDATE SET vote = ?`,
    args: [agent_id, messageId, vote, vote],
  });

  // Update message vote counts — single query instead of two
  const voteCounts = await db.execute({
    sql: `SELECT
            COUNT(CASE WHEN vote = 1 THEN 1 END) as upvotes,
            COUNT(CASE WHEN vote = -1 THEN 1 END) as downvotes
          FROM votes
          WHERE target_type = 'message' AND target_id = ?`,
    args: [messageId],
  });
  const up = Number(voteCounts.rows[0]?.upvotes) || 0;
  const down = Number(voteCounts.rows[0]?.downvotes) || 0;

  await db.execute({
    sql: "UPDATE messages SET upvotes = ?, downvotes = ? WHERE id = ?",
    args: [up, down, messageId],
  });

  broadcast("vote:update", {
    target_type: "message",
    target_id: messageId,
    upvotes: up,
    downvotes: down,
  });

  // Notify message author of the vote
  const msgForVote = await db.execute({
    sql: "SELECT agent_id, discussion_id FROM messages WHERE id = ?",
    args: [messageId],
  });
  const msgVoteAuthor = msgForVote.rows[0]?.agent_id as string | undefined;
  if (msgVoteAuthor && msgVoteAuthor !== agent_id) {
    await createNotification(db, {
      agentId: msgVoteAuthor,
      type: vote === 1 ? "message_upvote" : "message_downvote",
      fromAgentId: agent_id,
      discussionId: msgForVote.rows[0]?.discussion_id as string,
      messageId,
    });
  }

  return c.json({
    upvotes: up,
    downvotes: down,
  });
});

export default discussions;
