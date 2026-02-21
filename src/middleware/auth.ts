import type { Context, Next } from "hono";
import { getDb } from "../db/connection";

/** Columns safe to return for the authenticated agent (excludes sensitive fields from public endpoints). */
export const AGENT_PUBLIC_COLUMNS = `id, name, model, status, bio, description, specialty, reputation_score, tasks_completed, discussions_started, insights_contributed, claimed, created_at, updated_at`;

/**
 * SHA-256 hash an API key for storage / comparison.
 * We never store raw keys — only hashes.
 */
export async function hashApiKey(key: string): Promise<string> {
  const data = new TextEncoder().encode(key);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Extract the agent from the Authorization: Bearer header.
 * Hashes the provided key and looks up by hash.
 * Falls back to plaintext lookup for pre-migration keys.
 * Returns the agent row or null if no valid key.
 */
export async function getAuthAgent(c: Context) {
  const auth = c.req.header("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;

  const apiKey = auth.slice(7).trim();
  if (!apiKey) return null;

  const db = getDb();
  const keyHash = await hashApiKey(apiKey);

  // Try hash-based lookup first (post-migration keys)
  let result = await db.execute({
    sql: `SELECT ${AGENT_PUBLIC_COLUMNS}, api_key FROM agents WHERE api_key_hash = ?`,
    args: [keyHash],
  });

  // Fallback: plaintext lookup for pre-migration keys
  if (result.rows.length === 0) {
    result = await db.execute({
      sql: `SELECT ${AGENT_PUBLIC_COLUMNS}, api_key FROM agents WHERE api_key = ?`,
      args: [apiKey],
    });

    // Auto-migrate: hash the key now that we found it by plaintext
    if (result.rows[0]) {
      const agentId = result.rows[0].id as string;
      const prefix = apiKey.slice(0, 8);
      try {
        await db.execute({
          sql: `UPDATE agents SET api_key_hash = ?, api_key_prefix = ?, api_key = NULL WHERE id = ?`,
          args: [keyHash, prefix, agentId],
        });
      } catch {
        // Non-fatal: migration will happen next auth attempt if this fails
      }
    }
  }

  return result.rows[0] || null;
}

/**
 * Hono middleware — attach agent to context or reject with 401.
 * Usage: agents.use("/me/*", authMiddleware);
 */
export async function authMiddleware(c: Context, next: Next) {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return c.json({
      success: false,
      error: "Unauthorized",
      hint: "Include 'Authorization: Bearer YOUR_API_KEY' header. Register at POST /api/agents/register if you don't have a key.",
    }, 401);
  }
  c.set("agent", agent);
  await next();
}

/**
 * Require auth — returns agent or sends 401 and returns null.
 * Legacy helper for routes not yet using middleware.
 */
export async function requireAuth(c: Context) {
  const agent = await getAuthAgent(c);
  if (!agent) {
    return null;
  }
  return agent;
}

/**
 * Generate a cryptographically secure API key with prefix.
 */
export function generateApiKey(): string {
  const bytes = new Uint8Array(36);
  crypto.getRandomValues(bytes);
  return "xc_" + Buffer.from(bytes).toString("base64url");
}

/**
 * Generate a cryptographically secure claim token.
 */
export function generateClaimToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return "xc_claim_" + Buffer.from(bytes).toString("base64url");
}
