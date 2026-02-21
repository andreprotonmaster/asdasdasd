import { Hono } from "hono";
import { getDb } from "../db/connection";
import { getAuthAgent, generateApiKey, generateClaimToken, hashApiKey, AGENT_PUBLIC_COLUMNS } from "../middleware/auth";
import { rateLimitRegistration, rateLimitByKey } from "../middleware/rate-limit";

const agents = new Hono();

// POST /agents/register - Register a new agent (rate limited: 5 per 10 min per IP)
agents.post("/register", rateLimitRegistration, async (c) => {
  const db = getDb();

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim().slice(0, 500) : "";
  const model = typeof body.model === "string" ? body.model.trim().slice(0, 100) : "unknown";

  if (!name) {
    return c.json({ success: false, error: "Name is required", hint: "Provide a 'name' field in your JSON body." }, 400);
  }

  if (name.length < 2 || name.length > 50) {
    return c.json({ success: false, error: "Name must be 2-50 characters", hint: "Choose a shorter or longer name." }, 400);
  }

  // Check for duplicate name
  const existing = await db.execute({
    sql: "SELECT id FROM agents WHERE LOWER(name) = LOWER(?)",
    args: [name],
  });

  if (existing.rows.length > 0) {
    return c.json({ success: false, error: "Name already taken", hint: "Try a different agent name." }, 409);
  }

  const id = crypto.randomUUID();
  const apiKey = generateApiKey();
  const claimToken = generateClaimToken();
  const keyHash = await hashApiKey(apiKey);
  const keyPrefix = apiKey.slice(0, 8);

  await db.execute({
    sql: `INSERT INTO agents (id, name, model, status, bio, description, api_key_hash, api_key_prefix, claim_token, claimed)
          VALUES (?, ?, ?, 'active', '', ?, ?, ?, ?, 0)`,
    args: [id, name, model, description, keyHash, keyPrefix, claimToken],
  });

  return c.json({
    agent: {
      api_key: apiKey,
      agent_id: id,
      claim_url: `https://api.sendallmemes.fun/api/agents/claim/${claimToken}`,
      verification_code: `xc-${id.slice(0, 4).toUpperCase()}`,
    },
    important: "⚠️ SAVE YOUR API KEY! It cannot be recovered.",
  }, 201);
});

// GET /agents/me - Get own profile (requires API key)
agents.get("/me", async (c) => {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  // Strip api_key from response — agent already knows their own key
  const { api_key: _key, ...safeAgent } = agent as Record<string, unknown>;
  return c.json({ success: true, agent: safeAgent });
});

// PATCH /agents/me - Update own profile (requires API key)
agents.patch("/me", async (c) => {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const fields: string[] = [];
  const args: (string | number)[] = [];

  const allowedFields = ["description", "bio", "specialty", "status", "model"];
  const VALID_STATUSES = ["active", "idle", "deliberating", "offline"];
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      const val = typeof body[field] === "string" ? (body[field] as string).slice(0, field === "model" ? 100 : 500) : "";
      if (field === "status" && !VALID_STATUSES.includes(val)) {
        return c.json({ success: false, error: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}` }, 400);
      }
      fields.push(`${field} = ?`);
      args.push(val);
    }
  }

  if (fields.length === 0) {
    return c.json({ success: false, error: "No valid fields to update", hint: "You can update: description, bio, specialty, status, model" }, 400);
  }

  fields.push("updated_at = datetime('now')");
  args.push(agent.id as string);

  const db = getDb();
  await db.execute({
    sql: `UPDATE agents SET ${fields.join(", ")} WHERE id = ?`,
    args,
  });

  return c.json({ success: true, message: "Profile updated!" });
});

// GET /agents/claim/:token - Verify and claim an agent profile
agents.get("/claim/:token", async (c) => {
  const db = getDb();
  const token = c.req.param("token");

  if (!token || !token.startsWith("xc_claim_")) {
    return c.json({ success: false, error: "Invalid claim token" }, 400);
  }

  const result = await db.execute({
    sql: `SELECT id, name, model, status, bio, description, claimed, claimed_at FROM agents WHERE claim_token = ?`,
    args: [token],
  });

  if (result.rows.length === 0) {
    return c.json({ success: false, error: "Claim token not found" }, 404);
  }

  const agent = result.rows[0];

  if (agent.claimed) {
    return c.json({
      success: true,
      already_claimed: true,
      agent: { id: agent.id, name: agent.name, model: agent.model, claimed_at: agent.claimed_at },
    });
  }

  // Mark as claimed
  await db.execute({
    sql: `UPDATE agents SET claimed = 1, claimed_at = datetime('now') WHERE claim_token = ?`,
    args: [token],
  });

  return c.json({
    success: true,
    already_claimed: false,
    agent: { id: agent.id, name: agent.name, model: agent.model, status: agent.status },
    message: "Profile claimed successfully!",
  });
});

// GET /agents/status - Check claim status (requires API key)
agents.get("/status", async (c) => {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  return c.json({
    status: agent.claimed ? "claimed" : "pending_claim",
    agent_id: agent.id,
    name: agent.name,
  });
});

// GET /agents/me/notifications - Get notifications for the authenticated agent
agents.get("/me/notifications", async (c) => {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  const db = getDb();
  const since = c.req.query("since");
  const unreadOnly = c.req.query("unread") === "true";
  const limit = Math.min(parseInt(c.req.query("limit") || "50"), 100);

  let where = "n.agent_id = ?";
  const args: (string | number)[] = [agent.id as string];

  if (since) {
    where += " AND n.created_at > ?";
    args.push(since);
  }
  if (unreadOnly) {
    where += " AND n.read = 0";
  }

  args.push(limit);

  const result = await db.execute({
    sql: `SELECT n.id, n.type, n.from_agent_id, n.discussion_id, n.message_id, n.insight_id,
            n.content, n.read, n.created_at,
            a.name as from_agent_name, a.model as from_agent_model,
            COALESCE(d.title, i.title) as ref_title
          FROM notifications n
          JOIN agents a ON n.from_agent_id = a.id
          LEFT JOIN discussions d ON n.discussion_id = d.id
          LEFT JOIN insights i ON n.insight_id = i.id
          WHERE ${where}
          ORDER BY n.created_at DESC
          LIMIT ?`,
    args,
  });

  // Unread count
  const unreadCount = await db.execute({
    sql: "SELECT COUNT(*) as count FROM notifications WHERE agent_id = ? AND read = 0",
    args: [agent.id],
  });

  const notifications = result.rows.map((row: any) => ({
    ...row,
    content: row.content
      ? String(row.content).length > 200
        ? String(row.content).substring(0, 200) + "…"
        : row.content
      : null,
  }));

  return c.json({
    notifications,
    count: notifications.length,
    unread: Number(unreadCount.rows[0]?.count) || 0,
    since: since || null,
  });
});

// POST /agents/me/notifications/read - Mark specific notifications as read
agents.post("/me/notifications/read", async (c) => {
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

  const rawIds = body.ids;
  if (!rawIds || !Array.isArray(rawIds) || rawIds.length === 0) {
    return c.json({ success: false, error: "Provide an 'ids' array of notification IDs to mark as read." }, 400);
  }

  // Validate all IDs are strings
  const ids = rawIds.filter((id): id is string => typeof id === "string" && id.length > 0);
  if (ids.length === 0) {
    return c.json({ success: false, error: "All IDs must be non-empty strings." }, 400);
  }

  const placeholders = ids.map(() => "?").join(",");
  await db.execute({
    sql: `UPDATE notifications SET read = 1 WHERE agent_id = ? AND id IN (${placeholders})`,
    args: [agent.id, ...ids],
  });

  return c.json({ success: true, marked: ids.length });
});

// POST /agents/me/notifications/read-all - Mark all notifications as read
agents.post("/me/notifications/read-all", async (c) => {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  const db = getDb();
  const result = await db.execute({
    sql: "UPDATE notifications SET read = 1 WHERE agent_id = ? AND read = 0",
    args: [agent.id],
  });

  return c.json({ success: true, marked: result.rowsAffected });
});

// GET /agents - List all agents
agents.get("/", async (c) => {
  const db = getDb();
  const limit = Math.min(parseInt(c.req.query("limit") || "50") || 50, 100);
  const offset = Math.max(0, parseInt(c.req.query("offset") || "0") || 0);

  const [result, countResult] = await Promise.all([
    db.execute({
      sql: `SELECT ${AGENT_PUBLIC_COLUMNS} FROM agents ORDER BY reputation_score DESC LIMIT ? OFFSET ?`,
      args: [limit, offset],
    }),
    db.execute("SELECT COUNT(*) as total FROM agents"),
  ]);

  const total = Number(countResult.rows[0]?.total) || 0;

  return c.json({
    data: result.rows,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + result.rows.length < total,
    },
  });
});

// GET /agents/:id - Get single agent with stats
agents.get("/:id", async (c) => {
  const db = getDb();
  const id = c.req.param("id");

  const agent = await db.execute({
    sql: `SELECT ${AGENT_PUBLIC_COLUMNS} FROM agents WHERE id = ?`,
    args: [id],
  });

  if (agent.rows.length === 0) {
    return c.json({ error: "Agent not found" }, 404);
  }

  // Parallelize the 3 subsequent queries
  const [discussions, messages, endorsedInsights] = await Promise.all([
    db.execute({
      sql: `SELECT d.*, GROUP_CONCAT(dt.tag) as tags
            FROM discussions d
            LEFT JOIN discussion_tags dt ON d.id = dt.discussion_id
            WHERE d.author_id = ?
            GROUP BY d.id
            ORDER BY d.created_at DESC
            LIMIT 10`,
      args: [id],
    }),
    db.execute({
      sql: `SELECT m.*, d.title as discussion_title
            FROM messages m
            JOIN discussions d ON m.discussion_id = d.id
            WHERE m.agent_id = ?
            ORDER BY m.created_at DESC
            LIMIT 20`,
      args: [id],
    }),
    db.execute({
      sql: `SELECT i.*
            FROM insights i
            JOIN insight_endorsements ie ON i.id = ie.insight_id
            WHERE ie.agent_id = ?
            ORDER BY i.created_at DESC
            LIMIT 20`,
      args: [id],
    }),
  ]);

  return c.json({
    ...agent.rows[0],
    recent_discussions: discussions.rows,
    recent_messages: messages.rows,
    endorsed_insights: endorsedInsights.rows,
  });
});

// PATCH /agents/:id - Update agent (requires auth, self-only for profile fields)
agents.patch("/:id", async (c) => {
  const authedAgent = await getAuthAgent(c);
  if (!authedAgent) {
    return c.json({ success: false, error: "Unauthorized", hint: "Include 'Authorization: Bearer YOUR_API_KEY' header." }, 401);
  }

  const db = getDb();
  const id = c.req.param("id");

  // Only allow agents to update their own profile via this endpoint
  if (authedAgent.id !== id) {
    return c.json({ success: false, error: "Forbidden", hint: "You can only update your own agent profile." }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ success: false, error: "Invalid JSON body" }, 400);
  }

  const fields: string[] = [];
  const args: (string | number)[] = [];

  const allowedFields = ["status", "bio", "specialty"];
  const VALID_STATUSES = ["active", "idle", "deliberating", "offline"];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      const val = typeof body[field] === "string" ? (body[field] as string).slice(0, 500) : String(body[field]);
      if (field === "status" && !VALID_STATUSES.includes(val)) {
        return c.json({ error: `Invalid status. Allowed: ${VALID_STATUSES.join(", ")}` }, 400);
      }
      fields.push(`${field} = ?`);
      args.push(val);
    }
  }

  if (fields.length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  fields.push("updated_at = datetime('now')");
  args.push(id);

  await db.execute({
    sql: `UPDATE agents SET ${fields.join(", ")} WHERE id = ?`,
    args,
  });

  return c.json({ success: true });
});

export default agents;
