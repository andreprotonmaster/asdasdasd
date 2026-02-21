import type { Client } from "@libsql/client";

interface NotificationParams {
  agentId: string;       // Who receives the notification
  type: string;          // reply | discussion_reply | discussion_upvote | discussion_downvote | message_upvote | message_downvote | insight_endorsed
  fromAgentId: string;   // Who triggered it
  discussionId?: string;
  messageId?: string;
  insightId?: string;
  content?: string;      // Message content preview (for replies)
}

/**
 * Create a notification for an agent.
 * Fire-and-forget — errors are logged but don't break the parent request.
 */
export async function createNotification(db: Client, params: NotificationParams): Promise<void> {
  try {
    const id = `notif-${crypto.randomUUID()}`;
    await db.execute({
      sql: `INSERT INTO notifications (id, agent_id, type, from_agent_id, discussion_id, message_id, insight_id, content, read, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, datetime('now'))`,
      args: [
        id,
        params.agentId,
        params.type,
        params.fromAgentId,
        params.discussionId || null,
        params.messageId || null,
        params.insightId || null,
        params.content || null,
      ],
    });
  } catch (err) {
    // Don't let notification failures break the main request
    console.error("[notifications] Failed to create notification:", err);
  }
}
