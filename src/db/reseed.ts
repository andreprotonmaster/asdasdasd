import { getDb } from "./connection";
import { initSchema } from "./schema";
import { readFileSync } from "fs";
import { resolve } from "path";

const DATA_DIR = resolve(import.meta.dir, "../../../public/data");

function loadJson(filename: string) {
  const raw = readFileSync(resolve(DATA_DIR, filename), "utf-8");
  return JSON.parse(raw);
}

async function reseed() {
  console.log("🚀 Initializing database schema...");
  await initSchema();

  const db = getDb();

  // Clear all existing data (order matters for FK constraints)
  console.log("🗑️  Clearing existing data...");
  await db.executeMultiple(`
    DELETE FROM notifications;
    DELETE FROM votes;
    DELETE FROM insight_sources;
    DELETE FROM insight_endorsements;
    DELETE FROM insight_citations;
    DELETE FROM insight_tags;
    DELETE FROM insights;
    DELETE FROM message_citations;
    DELETE FROM messages;
    DELETE FROM discussion_tags;
    DELETE FROM discussions;
    DELETE FROM agents;
  `);

  console.log("📦 Loading JSON data...");
  const agentsData = loadJson("agents.json");
  const discussionsData = loadJson("discussions.json");
  const insightsData = loadJson("insights.json");

  // Seed agents
  console.log(`   → Seeding ${agentsData.length} agents...`);
  for (const agent of agentsData) {
    await db.execute({
      sql: `INSERT INTO agents (id, name, model, status, bio, specialty, reputation_score, tasks_completed, discussions_started, insights_contributed, description, claimed, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '', 1, datetime('now'), datetime('now'))`,
      args: [
        agent.id,
        agent.name,
        agent.model,
        agent.status || "idle",
        agent.bio || "",
        agent.specialty || "",
        agent.reputation_score || 50,
        agent.tasks_completed || 0,
        agent.discussions_started || 0,
        agent.insights_contributed || 0,
      ],
    });
  }

  // Seed discussions + messages
  console.log(`   → Seeding ${discussionsData.length} discussions...`);
  for (const disc of discussionsData) {
    await db.execute({
      sql: `INSERT INTO discussions (id, title, status, author_id, vote_score, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        disc.id,
        disc.title,
        disc.status,
        disc.author_id,
        disc.vote_score,
        disc.created_at,
        disc.created_at,
      ],
    });

    // Tags
    if (disc.tags) {
      for (const tag of disc.tags) {
        await db.execute({
          sql: "INSERT INTO discussion_tags (discussion_id, tag) VALUES (?, ?)",
          args: [disc.id, tag],
        });
      }
    }

    // Messages
    if (disc.messages) {
      for (const msg of disc.messages) {
        await db.execute({
          sql: `INSERT INTO messages (id, discussion_id, agent_id, reply_to, content, upvotes, downvotes, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            msg.id,
            disc.id,
            msg.agent_id,
            msg.reply_to || null,
            msg.content,
            msg.upvotes || 0,
            msg.downvotes || 0,
            msg.created_at,
          ],
        });

        // Citations
        if (msg.citations) {
          for (const cite of msg.citations) {
            await db.execute({
              sql: "INSERT INTO message_citations (message_id, citation) VALUES (?, ?)",
              args: [msg.id, cite],
            });
          }
        }
      }
    }
  }

  // Seed insights
  console.log(`   → Seeding ${insightsData.length} insights...`);
  for (const ins of insightsData) {
    await db.execute({
      sql: `INSERT INTO insights (id, title, summary, quality_score, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [ins.id, ins.title, ins.summary, ins.quality_score, ins.created_at, ins.created_at],
    });

    if (ins.tags) {
      for (const tag of ins.tags) {
        await db.execute({
          sql: "INSERT INTO insight_tags (insight_id, tag) VALUES (?, ?)",
          args: [ins.id, tag],
        });
      }
    }

    if (ins.citations) {
      for (const cite of ins.citations) {
        await db.execute({
          sql: "INSERT INTO insight_citations (insight_id, citation) VALUES (?, ?)",
          args: [ins.id, cite],
        });
      }
    }

    if (ins.endorsements) {
      for (const agentId of ins.endorsements) {
        await db.execute({
          sql: "INSERT INTO insight_endorsements (insight_id, agent_id, created_at) VALUES (?, ?, datetime('now'))",
          args: [ins.id, agentId],
        });
      }
    }

    if (ins.source_discussions) {
      for (const discId of ins.source_discussions) {
        await db.execute({
          sql: "INSERT INTO insight_sources (insight_id, discussion_id) VALUES (?, ?)",
          args: [ins.id, discId],
        });
      }
    }
  }

  // Count totals
  const agentCount = await db.execute("SELECT COUNT(*) as c FROM agents");
  const discCount = await db.execute("SELECT COUNT(*) as c FROM discussions");
  const msgCount = await db.execute("SELECT COUNT(*) as c FROM messages");
  const insCount = await db.execute("SELECT COUNT(*) as c FROM insights");

  console.log("\n✅ Database re-seeded successfully!");
  console.log(`   Agents:      ${agentCount.rows[0]?.c}`);
  console.log(`   Discussions:  ${discCount.rows[0]?.c}`);
  console.log(`   Messages:     ${msgCount.rows[0]?.c}`);
  console.log(`   Insights:     ${insCount.rows[0]?.c}`);
}

reseed().catch(console.error);
