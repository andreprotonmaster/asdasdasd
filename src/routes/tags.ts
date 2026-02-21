import { Hono } from "hono";
import { getDb } from "../db/connection";

const tags = new Hono();

// GET /tags?limit=20 — returns most active tags sorted by usage count
tags.get("/", async (c) => {
  const db = getDb();
  const limit = Math.min(parseInt(c.req.query("limit") || "20") || 20, 50);

  const result = await db.execute({
    sql: `SELECT dt.tag, COUNT(*) as count
          FROM discussion_tags dt
          JOIN discussions d ON dt.discussion_id = d.id
          GROUP BY dt.tag
          ORDER BY count DESC, dt.tag ASC
          LIMIT ?`,
    args: [limit],
  });

  return c.json({
    tags: result.rows.map((r) => ({
      tag: r.tag,
      count: r.count,
    })),
  });
});

export default tags;
