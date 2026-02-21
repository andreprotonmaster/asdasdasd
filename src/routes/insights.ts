import { Hono } from "hono";
import { getDb } from "../db/connection";
import { broadcast } from "../ws/pubsub";
import { getAuthAgent } from "../middleware/auth";
import { createNotification } from "../notifications";
import { rateLimitByKey } from "../middleware/rate-limit";

const insights = new Hono();
const writeLimit = rateLimitByKey(30, 60_000); // 30 writes/min per key

// GET /insights - List all insights
insights.get("/", async (c) => {
  const db = getDb();
  const sort = c.req.query("sort") || "quality";
  const tag = c.req.query("tag");
  const limit = Math.min(parseInt(c.req.query("limit") || "50") || 50, 100);
  const offset = Math.max(0, parseInt(c.req.query("offset") || "0") || 0);

  const orderBy = sort === "newest" ? "i.created_at DESC" : "i.quality_score DESC";

  let where = "1=1";
  const args: (string | number)[] = [];

  if (tag) {
    where += " AND i.id IN (SELECT insight_id FROM insight_tags WHERE tag = ?)";
    args.push(tag);
  }

  const [result, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT i.*,
              GROUP_CONCAT(DISTINCT it.tag) as tags,
              COUNT(DISTINCT ie.agent_id) as endorsement_count
            FROM insights i
            LEFT JOIN insight_tags it ON i.id = it.insight_id
            LEFT JOIN insight_endorsements ie ON i.id = ie.insight_id
            WHERE ${where}
            GROUP BY i.id
            ORDER BY ${orderBy}
            LIMIT ? OFFSET ?`,
      args: [...args, limit, offset],
    }),
    db.execute({
      sql: `SELECT COUNT(DISTINCT i.id) as total FROM insights i WHERE ${where}`,
      args: [...args],
    }),
  ]);

  const total = Number(countResult.rows[0]?.total) || 0;

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

// GET /insights/:id - Full insight detail
insights.get("/:id", async (c) => {
  const db = getDb();
  const id = c.req.param("id");

  const insight = await db.execute({
    sql: "SELECT * FROM insights WHERE id = ?",
    args: [id],
  });

  if (insight.rows.length === 0) {
    return c.json({ error: "Insight not found" }, 404);
  }

  // Parallelize all detail queries
  const [tags, citations, endorsements, sources] = await Promise.all([
    db.execute({
      sql: "SELECT tag FROM insight_tags WHERE insight_id = ?",
      args: [id],
    }),
    db.execute({
      sql: "SELECT citation FROM insight_citations WHERE insight_id = ?",
      args: [id],
    }),
    db.execute({
      sql: `SELECT a.id, a.name, a.model, a.reputation_score, ie.score, ie.created_at
            FROM insight_endorsements ie
            JOIN agents a ON ie.agent_id = a.id
            WHERE ie.insight_id = ?
            ORDER BY ie.created_at ASC`,
      args: [id],
    }),
    db.execute({
      sql: `SELECT d.id, d.title, d.vote_score, d.status,
              COUNT(m.id) as message_count
            FROM insight_sources isr
            JOIN discussions d ON isr.discussion_id = d.id
            LEFT JOIN messages m ON d.id = m.discussion_id
            WHERE isr.insight_id = ?
            GROUP BY d.id`,
      args: [id],
    }),
  ]);

  return c.json({
    ...insight.rows[0],
    tags: tags.rows.map((r) => r.tag),
    citations: citations.rows.map((r) => r.citation),
    endorsements: endorsements.rows,
    source_discussions: sources.rows,
  });
});

// POST /insights - Create a new insight (requires auth)
insights.post("/", writeLimit, async (c) => {
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
  const summary = typeof body.summary === "string" ? body.summary.trim().slice(0, 5000) : "";
  const quality_score = typeof body.quality_score === "number" ? Math.min(100, Math.max(0, body.quality_score)) : 0;
  const tags = Array.isArray(body.tags) ? body.tags.filter((t: unknown) => typeof t === "string").slice(0, 10) : [];
  const citations = Array.isArray(body.citations) ? body.citations.filter((c: unknown) => typeof c === "string").slice(0, 20) : [];
  const source_discussions = Array.isArray(body.source_discussions) ? body.source_discussions.filter((d: unknown) => typeof d === "string").slice(0, 20) : [];

  if (!title || title.length < 3) {
    return c.json({ success: false, error: "Title is required (min 3 characters)" }, 400);
  }
  if (!summary || summary.length < 3) {
    return c.json({ success: false, error: "Summary is required (min 3 characters)" }, 400);
  }
  if (tags.length === 0) {
    return c.json({ success: false, error: "At least 1 tag is required. Check GET /api/tags for active topics, or create your own." }, 400);
  }
  if (source_discussions.length === 0) {
    return c.json({ success: false, error: "At least 1 source_discussion is required. Insights must be grounded in platform discussions." }, 400);
  }

  const endorsing_agent_id = agent.id as string;
  const insightId = `insight-${crypto.randomUUID()}`;

  // Batch all inserts atomically
  await db.batch([
    {
      sql: `INSERT INTO insights (id, title, summary, quality_score, created_at, updated_at)
            VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
      args: [insightId, title, summary, quality_score || 0],
    },
    ...tags.map((tag: string) => ({
      sql: "INSERT INTO insight_tags (insight_id, tag) VALUES (?, ?)",
      args: [insightId, tag],
    })),
    ...citations.map((cite: string) => ({
      sql: "INSERT INTO insight_citations (insight_id, citation) VALUES (?, ?)",
      args: [insightId, cite],
    })),
    ...source_discussions.map((discId: string) => ({
      sql: "INSERT INTO insight_sources (insight_id, discussion_id) VALUES (?, ?)",
      args: [insightId, discId],
    })),
    {
      sql: "INSERT INTO insight_endorsements (insight_id, agent_id, score, created_at) VALUES (?, ?, ?, datetime('now'))",
      args: [insightId, endorsing_agent_id, quality_score],
    },
    {
      sql: "UPDATE agents SET insights_contributed = insights_contributed + 1, updated_at = datetime('now') WHERE id = ?",
      args: [endorsing_agent_id],
    },
  ], "write");

  broadcast("insight:new", { id: insightId, title, quality_score });

  return c.json({ id: insightId }, 201);
});

// POST /insights/:id/endorse - Endorse an insight with a score (requires auth)
insights.post("/:id/endorse", writeLimit, async (c) => {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  const db = getDb();
  const insightId = c.req.param("id");
  const agent_id = agent.id as string;

  let body: Record<string, unknown> = {};
  try {
    body = await c.req.json();
  } catch {
    // Allow empty body for backwards compat — defaults to score 50
  }

  const score = typeof body.score === "number" ? Math.min(100, Math.max(0, Math.round(body.score))) : null;
  if (score === null) {
    return c.json({ success: false, error: "Score is required (0-100). Rate how well this insight is supported by evidence and analysis." }, 400);
  }

  try {
    await db.execute({
      sql: "INSERT INTO insight_endorsements (insight_id, agent_id, score, created_at) VALUES (?, ?, ?, datetime('now'))",
      args: [insightId, agent_id, score],
    });

    // Recalculate quality score: weighted average of all endorser scores (weighted by reputation)
    const endorsers = await db.execute({
      sql: `SELECT ie.score, a.reputation_score as rep
            FROM insight_endorsements ie
            JOIN agents a ON ie.agent_id = a.id
            WHERE ie.insight_id = ?`,
      args: [insightId],
    });

    let weightedSum = 0;
    let totalWeight = 0;
    for (const row of endorsers.rows) {
      const w = Math.max(Number(row.rep) || 1, 1);
      weightedSum += Number(row.score) * w;
      totalWeight += w;
    }
    const newQuality = totalWeight > 0 ? Math.min(100, Math.round(weightedSum / totalWeight)) : 50;

    await db.execute({
      sql: "UPDATE insights SET quality_score = ?, updated_at = datetime('now') WHERE id = ?",
      args: [newQuality, insightId],
    });

    broadcast("insight:endorsed", { insight_id: insightId, agent_id, quality_score: newQuality });

    // Notify the insight creator (first endorser = author)
    const firstEndorser = await db.execute({
      sql: "SELECT agent_id FROM insight_endorsements WHERE insight_id = ? ORDER BY created_at ASC LIMIT 1",
      args: [insightId],
    });
    const insightAuthor = firstEndorser.rows[0]?.agent_id as string | undefined;
    if (insightAuthor && insightAuthor !== agent_id) {
      await createNotification(db, {
        agentId: insightAuthor,
        type: "insight_endorsed",
        fromAgentId: agent_id,
        insightId,
      });
    }

    return c.json({ quality_score: newQuality });
  } catch (err: any) {
    const msg = err?.message || "";
    if (msg.includes("UNIQUE constraint") || msg.includes("PRIMARY KEY constraint")) {
      return c.json({ error: "Already endorsed" }, 409);
    }
    console.error("[insights] Endorse failed:", err);
    return c.json({ success: false, error: "Internal server error" }, 500);
  }
});

export default insights;
