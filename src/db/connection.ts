import { createClient, type Client } from "@libsql/client";

let db: Client;
let fkEnabled = false;

/** Validate required env vars at startup — fail fast instead of silently using a local file. */
export function validateEnv() {
  const required = ["TURSO_URL", "TURSO_AUTH_TOKEN"];
  const missing = required.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`❌ Missing required environment variables: ${missing.join(", ")}`);
    console.error("   Set them in .env or export them before starting the server.");
    process.exit(1);
  }
}

export function getDb(): Client {
  if (!db) {
    db = createClient({
      url: process.env.TURSO_URL || "file:spacex.db",
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return db;
}

/** Enable SQLite foreign key enforcement — must be called once after DB init. */
export async function enableForeignKeys() {
  if (fkEnabled) return;
  const d = getDb();
  await d.execute("PRAGMA foreign_keys = ON;");
  fkEnabled = true;
  console.log("✅ Foreign key enforcement enabled");
}
