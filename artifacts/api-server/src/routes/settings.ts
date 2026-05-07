import { Router, type IRouter } from "express";
import { db, settingsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "../lib/logger";

const router: IRouter = Router();

async function getSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key));
  return row?.value ?? null;
}

async function setSetting(key: string, value: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
}

export async function getAllSettings(): Promise<Record<string, string>> {
  const rows = await db.select().from(settingsTable);
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getAllSettings();
  res.json(settings);
});

router.patch("/settings", async (req, res): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === "string") {
      await setSetting(key, value);
    }
  }
  const updated = await getAllSettings();
  res.json(updated);
});

router.post("/settings/test-twilio", async (req, res): Promise<void> => {
  const { getTwilioSettings, sendMessage } = await import("../lib/twilio");
  const { accountSid, authToken, fromNumber, toNumber, channel } = await getTwilioSettings();

  if (!accountSid || !authToken || !fromNumber || !toNumber) {
    res.status(400).json({ ok: false, error: "Twilio credentials not configured. Fill in all fields and save first." });
    return;
  }

  const isWhatsApp = channel === "whatsapp";
  const to = isWhatsApp ? `whatsapp:${toNumber}` : toNumber;
  const from = isWhatsApp ? `whatsapp:${fromNumber}` : fromNumber;

  try {
    await sendMessage(to, from, "[SimpleChat] Test message — your WhatsApp notifications are working!", accountSid, authToken);
    logger.info({ channel, to }, "Twilio test message sent successfully");
    res.json({ ok: true, channel, to });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error({ err, channel, to, from }, "Twilio test message failed");
    res.status(400).json({ ok: false, error: message });
  }
});

export { getSetting, setSetting };
export default router;
