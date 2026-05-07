import { Router, type IRouter } from "express";
import { eq, desc, count, and } from "drizzle-orm";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import {
  ListConversationsQueryParams,
  GetConversationParams,
  UpdateConversationParams,
  UpdateConversationBody,
  SendAgentMessageParams,
  SendAgentMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/conversations", async (req, res): Promise<void> => {
  const query = ListConversationsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { status } = query.data;

  let rows;
  if (status === "open") {
    rows = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.status, "open"))
      .orderBy(desc(conversationsTable.lastMessageAt));
  } else if (status === "closed") {
    rows = await db
      .select()
      .from(conversationsTable)
      .where(eq(conversationsTable.status, "closed"))
      .orderBy(desc(conversationsTable.lastMessageAt));
  } else {
    rows = await db
      .select()
      .from(conversationsTable)
      .orderBy(desc(conversationsTable.lastMessageAt));
  }

  res.json(rows);
});

router.get("/conversations/stats", async (_req, res): Promise<void> => {
  const [total, openCount, closedCount, unreadCount] = await Promise.all([
    db.select({ count: count() }).from(conversationsTable),
    db.select({ count: count() }).from(conversationsTable).where(eq(conversationsTable.status, "open")),
    db.select({ count: count() }).from(conversationsTable).where(eq(conversationsTable.status, "closed")),
    db.select({ count: count() }).from(conversationsTable).where(eq(conversationsTable.unread, true)),
  ]);

  res.json({
    total: total[0]?.count ?? 0,
    open: openCount[0]?.count ?? 0,
    closed: closedCount[0]?.count ?? 0,
    unread: unreadCount[0]?.count ?? 0,
  });
});

router.get("/conversations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetConversationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const messages = await db
    .select()
    .from(messagesTable)
    .where(eq(messagesTable.conversationId, conversation.id))
    .orderBy(messagesTable.createdAt);

  res.json({ ...conversation, messages });
});

router.patch("/conversations/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateConversationParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateConversationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Partial<typeof conversationsTable.$inferInsert> = {};
  if (body.data.status !== undefined) updateData.status = body.data.status;
  if (body.data.unread !== undefined) updateData.unread = body.data.unread;

  const [updated] = await db
    .update(conversationsTable)
    .set(updateData)
    .where(eq(conversationsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  res.json(updated);
});

router.post("/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = SendAgentMessageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SendAgentMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, params.data.id));

  if (!conversation) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  const [message] = await db
    .insert(messagesTable)
    .values({
      conversationId: params.data.id,
      content: body.data.content,
      sender: "agent",
    })
    .returning();

  await db
    .update(conversationsTable)
    .set({ lastMessageAt: new Date(), unread: false })
    .where(eq(conversationsTable.id, params.data.id));

  res.status(201).json(message);
});

export default router;
