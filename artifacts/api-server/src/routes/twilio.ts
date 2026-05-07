import { Router, type IRouter } from "express";
import { db, conversationsTable, messagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sendSms, getTwilioSettings } from "../lib/twilio";

const router: IRouter = Router();

router.post("/twilio/inbound", async (req, res): Promise<void> => {
  const body = req.body as Record<string, string>;
  const text = (body["Body"] ?? "").trim();
  const from = body["From"] ?? "";

  const twimlEmpty = `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`;

  if (!text) {
    res.set("Content-Type", "text/xml").send(twimlEmpty);
    return;
  }

  // Parse format: #<conversationId>: <reply text>
  const match = text.match(/^#(\d+):\s*([\s\S]+)/);
  if (!match) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>To reply to a conversation, start your message with #ID: (e.g. #42: Hello!)</Message></Response>`;
    res.set("Content-Type", "text/xml").send(twiml);
    return;
  }

  const conversationId = parseInt(match[1], 10);
  const replyContent = match[2].trim();

  const [conversation] = await db
    .select()
    .from(conversationsTable)
    .where(eq(conversationsTable.id, conversationId));

  if (!conversation) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Conversation #${conversationId} not found.</Message></Response>`;
    res.set("Content-Type", "text/xml").send(twiml);
    return;
  }

  await db.insert(messagesTable).values({
    conversationId,
    content: replyContent,
    sender: "agent",
  });

  await db
    .update(conversationsTable)
    .set({ lastMessageAt: new Date(), unread: false })
    .where(eq(conversationsTable.id, conversationId));

  const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>Reply sent to ${conversation.visitorName} in conversation #${conversationId}.</Message></Response>`;
  res.set("Content-Type", "text/xml").send(twiml);
});

export default router;
