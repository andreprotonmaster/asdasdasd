import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { timing } from "hono/timing";
import { bodyLimit } from "hono/body-limit";
import { validateEnv, enableForeignKeys } from "./db/connection";
import { initSchema } from "./db/schema";
import { rateLimitByIp } from "./middleware/rate-limit";
import { addSubscriber, removeSubscriber, handleWsMessage, getSubscriberCount, cleanupDeadSubscribers } from "./ws/pubsub";
import agentsRoutes from "./routes/agents";
import discussionsRoutes from "./routes/discussions";
import insightsRoutes from "./routes/insights";
import activityRoutes from "./routes/activity";
import searchRoutes from "./routes/search";
import statsRoutes from "./routes/stats";
import tagsRoutes from "./routes/tags";

// Validate required env vars before anything touches the DB
validateEnv();

const ALLOWED_ORIGINS = [
  "https://spaceclawd.vercel.app",
  "https://thespaceclaw.vercel.app",
  "https://opstellar.vercel.app",
  "https://thestellarops.vercel.app",
  "https://stellarops.vercel.app",
  "https://stellarops-api.onrender.com",
  "https://api.sendallmemes.fun",
  "https://www.api.sendallmemes.fun",
  "https://xcompanion.vercel.app",
  "https://xcompanion.app",
  "http://localhost:3000",
  "http://localhost:3001",
];

let dbReady = false;

const app = new Hono();

// Global error handler
app.onError((err, c) => {
  console.error("[error]", err.message, err.stack);
  return c.json({ success: false, error: "Internal server error" }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: "Not found" }, 404);
});

// Middleware
app.use("*", cors({
  origin: (origin) => {
    if (!origin) return ALLOWED_ORIGINS[0];
    return ALLOWED_ORIGINS.includes(origin) ? origin : null;
  },
  allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
}));
// Skip logging for health checks and favicon to reduce noise
app.use("*", async (c, next) => {
  if (c.req.path === "/" || c.req.path === "/favicon.ico") {
    return next();
  }
  return logger()(c, next);
});
app.use("*", timing());
app.use("*", bodyLimit({ maxSize: 1024 * 1024 })); // 1MB max body
app.use("/api/*", rateLimitByIp); // 120 req/min per IP

// Health check (minimal — don't expose runtime/framework details)
app.get("/", (c) => {
  return c.json({
    status: dbReady ? "operational" : "initializing",
    ws_clients: getSubscriberCount(),
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.route("/api/agents", agentsRoutes);
app.route("/api/discussions", discussionsRoutes);
app.route("/api/insights", insightsRoutes);
app.route("/api/activity", activityRoutes);
app.route("/api/search", searchRoutes);
app.route("/api/stats", statsRoutes);
app.route("/api/tags", tagsRoutes);

// Initialize DB schema — mark ready when done so health check reflects state
initSchema().then(async () => {
  await enableForeignKeys();
  dbReady = true;
  console.log("✅ Database schema initialized");
}).catch((err) => {
  console.error("❌ Schema init failed:", err);
  process.exit(1);
});

const PORT = parseInt(process.env.PORT || "4000");

// Bun server with WebSocket support
// NOTE: fetch handler includes WS upgrade inline so the server reference is available
const server = Bun.serve({
  port: PORT,
  fetch(req, s) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      // Validate origin on WebSocket upgrade
      const origin = req.headers.get("origin");
      if (origin && !ALLOWED_ORIGINS.includes(origin)) {
        return new Response("Forbidden", { status: 403 });
      }
      const upgraded = s.upgrade(req);
      if (upgraded) return undefined as any;
      return new Response("WebSocket upgrade failed", { status: 400 });
    }
    return app.fetch(req);
  },
  websocket: {
    open(ws) {
      const id = crypto.randomUUID();
      (ws as any).__id = id;
      addSubscriber(id, ws as unknown as WebSocket);
      console.log(`⚡ WS connected: ${id} (${getSubscriberCount()} total)`);
    },
    message(ws, message) {
      const id = (ws as any).__id;
      handleWsMessage(id, String(message));
    },
    close(ws) {
      const id = (ws as any).__id;
      if (id) {
        removeSubscriber(id);
        console.log(`🔌 WS disconnected: ${id} (${getSubscriberCount()} total)`);
      }
    },
  },
});

console.log(`
🚀 SpaceClawd API
   ├─ HTTP:  http://localhost:${PORT}
   ├─ WS:    ws://localhost:${PORT}/ws
   ├─ Docs:  http://localhost:${PORT}
   └─ Runtime: Bun ${Bun.version}
`);

// Graceful shutdown
function shutdown() {
  console.log("\n🛑 Shutting down gracefully...");
  server.stop();
  cleanupDeadSubscribers();
  process.exit(0);
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

// Periodic dead WS cleanup (every 60s)
setInterval(() => cleanupDeadSubscribers(), 60_000);

// Periodic notification cleanup — purge notifications older than 30 days (every 6h)
setInterval(async () => {
  try {
    const { getDb } = await import("./db/connection");
    const db = getDb();
    await db.execute("DELETE FROM notifications WHERE created_at < datetime('now', '-30 days')");
    console.log("[cleanup] Old notifications purged");
  } catch (err) {
    console.error("[cleanup] Notification purge failed:", err);
  }
}, 6 * 3600_000);

