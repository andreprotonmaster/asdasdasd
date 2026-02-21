import { getDb } from "./connection";

export async function initSchema() {
  const db = getDb();

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT NOT NULL DEFAULT 'unknown',
      status TEXT NOT NULL DEFAULT 'idle',
      bio TEXT NOT NULL DEFAULT '',
      specialty TEXT NOT NULL DEFAULT '',
      reputation_score INTEGER NOT NULL DEFAULT 50,
      tasks_completed INTEGER NOT NULL DEFAULT 0,
      discussions_started INTEGER NOT NULL DEFAULT 0,
      insights_contributed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS discussions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      author_id TEXT NOT NULL REFERENCES agents(id),
      vote_score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS discussion_tags (
      discussion_id TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      PRIMARY KEY (discussion_id, tag)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      discussion_id TEXT NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      reply_to TEXT REFERENCES messages(id),
      content TEXT NOT NULL,
      upvotes INTEGER NOT NULL DEFAULT 0,
      downvotes INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS message_citations (
      message_id TEXT NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
      citation TEXT NOT NULL,
      PRIMARY KEY (message_id, citation)
    );

    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      summary TEXT NOT NULL,
      quality_score INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS insight_tags (
      insight_id TEXT NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
      tag TEXT NOT NULL,
      PRIMARY KEY (insight_id, tag)
    );

    CREATE TABLE IF NOT EXISTS insight_citations (
      insight_id TEXT NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
      citation TEXT NOT NULL,
      PRIMARY KEY (insight_id, citation)
    );

    CREATE TABLE IF NOT EXISTS insight_endorsements (
      insight_id TEXT NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      score INTEGER NOT NULL DEFAULT 50,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (insight_id, agent_id)
    );

    CREATE TABLE IF NOT EXISTS insight_sources (
      insight_id TEXT NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
      discussion_id TEXT NOT NULL REFERENCES discussions(id),
      PRIMARY KEY (insight_id, discussion_id)
    );

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      target_type TEXT NOT NULL CHECK(target_type IN ('message', 'discussion')),
      target_id TEXT NOT NULL,
      vote INTEGER NOT NULL CHECK(vote IN (-1, 1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(agent_id, target_type, target_id)
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      type TEXT NOT NULL,
      from_agent_id TEXT NOT NULL REFERENCES agents(id),
      discussion_id TEXT,
      message_id TEXT,
      insight_id TEXT,
      content TEXT,
      read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Indexes for fast queries
    CREATE INDEX IF NOT EXISTS idx_notifications_agent ON notifications(agent_id, read, created_at);
    CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
    CREATE INDEX IF NOT EXISTS idx_messages_discussion ON messages(discussion_id);
    CREATE INDEX IF NOT EXISTS idx_messages_agent ON messages(agent_id);
    CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to);
    CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
    CREATE INDEX IF NOT EXISTS idx_discussions_author ON discussions(author_id);
    CREATE INDEX IF NOT EXISTS idx_discussions_status ON discussions(status);
    CREATE INDEX IF NOT EXISTS idx_discussions_created ON discussions(created_at);
    CREATE INDEX IF NOT EXISTS idx_discussions_vote_score ON discussions(vote_score);
    CREATE INDEX IF NOT EXISTS idx_discussions_updated ON discussions(updated_at);
    CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_type, target_id);
    CREATE INDEX IF NOT EXISTS idx_insight_endorsements_agent ON insight_endorsements(agent_id);
    CREATE INDEX IF NOT EXISTS idx_discussion_tags_tag ON discussion_tags(tag);
    CREATE INDEX IF NOT EXISTS idx_insight_tags_tag ON insight_tags(tag);
    CREATE INDEX IF NOT EXISTS idx_insights_quality ON insights(quality_score);
    CREATE INDEX IF NOT EXISTS idx_insights_created ON insights(created_at);
    CREATE INDEX IF NOT EXISTS idx_agents_reputation ON agents(reputation_score);
  `);

  // Safe column migrations — add columns that may not exist on older schemas
  const migrations = [
    `ALTER TABLE agents ADD COLUMN api_key TEXT`,
    `ALTER TABLE agents ADD COLUMN claim_token TEXT`,
    `ALTER TABLE agents ADD COLUMN claimed INTEGER NOT NULL DEFAULT 0`,
    `ALTER TABLE agents ADD COLUMN claimed_at TEXT`,
    `ALTER TABLE agents ADD COLUMN description TEXT NOT NULL DEFAULT ''`,
    `ALTER TABLE agents ADD COLUMN api_key_hash TEXT`,
    `ALTER TABLE agents ADD COLUMN api_key_prefix TEXT`,
    `ALTER TABLE insight_endorsements ADD COLUMN score INTEGER NOT NULL DEFAULT 50`,
  ];

  for (const sql of migrations) {
    try {
      await db.execute(sql);
    } catch {
      // Column already exists — ignore
    }
  }

  // Create indexes that depend on migrated columns (unique indexes replace UNIQUE constraints)
  await db.executeMultiple(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_api_key ON agents(api_key);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_claim_token ON agents(claim_token);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_agents_api_key_hash ON agents(api_key_hash);
  `);
}
