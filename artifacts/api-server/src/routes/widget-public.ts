import { Router, type IRouter } from "express";
import { eq, and, gt } from "drizzle-orm";
import { db, conversationsTable, messagesTable, widgetsTable } from "@workspace/db";
import {
  WidgetStartConversationBody,
  WidgetGetMessagesParams,
  WidgetGetMessagesQueryParams,
  WidgetSendMessageParams,
  WidgetSendMessageBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/widget/conversations", async (req, res): Promise<void> => {
  const body = WidgetStartConversationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const [widget] = await db
    .select()
    .from(widgetsTable)
    .where(eq(widgetsTable.apiKey, body.data.apiKey));

  if (!widget) {
    res.status(401).json({ error: "Invalid API key" });
    return;
  }

  const now = new Date();
  const [conversation] = await db
    .insert(conversationsTable)
    .values({
      visitorName: body.data.visitorName,
      visitorEmail: body.data.visitorEmail ?? null,
      siteUrl: body.data.siteUrl,
      status: "open",
      unread: true,
      lastMessageAt: now,
    })
    .returning();

  const [message] = await db
    .insert(messagesTable)
    .values({
      conversationId: conversation.id,
      content: body.data.initialMessage,
      sender: "visitor",
    })
    .returning();

  res.status(201).json({ conversationId: conversation.id, message });
});

router.get("/widget/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = WidgetGetMessagesParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const queryParams = WidgetGetMessagesQueryParams.safeParse(req.query);
  if (!queryParams.success) {
    res.status(400).json({ error: queryParams.error.message });
    return;
  }

  let messages;
  if (queryParams.data.since) {
    const sinceDate = new Date(queryParams.data.since);
    messages = await db
      .select()
      .from(messagesTable)
      .where(
        and(
          eq(messagesTable.conversationId, params.data.id),
          gt(messagesTable.createdAt, sinceDate)
        )
      )
      .orderBy(messagesTable.createdAt);
  } else {
    messages = await db
      .select()
      .from(messagesTable)
      .where(eq(messagesTable.conversationId, params.data.id))
      .orderBy(messagesTable.createdAt);
  }

  res.json(messages);
});

router.post("/widget/conversations/:id/messages", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = WidgetSendMessageParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = WidgetSendMessageBody.safeParse(req.body);
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
      sender: "visitor",
    })
    .returning();

  await db
    .update(conversationsTable)
    .set({ lastMessageAt: new Date(), unread: true })
    .where(eq(conversationsTable.id, params.data.id));

  res.status(201).json(message);
});

export default router;
