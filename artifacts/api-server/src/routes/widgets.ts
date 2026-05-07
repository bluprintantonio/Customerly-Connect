import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, widgetsTable } from "@workspace/db";
import {
  CreateWidgetBody,
  DeleteWidgetParams,
  UpdateWidgetParams,
  UpdateWidgetBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/widgets", async (_req, res): Promise<void> => {
  const widgets = await db
    .select()
    .from(widgetsTable)
    .orderBy(widgetsTable.createdAt);
  res.json(widgets);
});

router.post("/widgets", async (req, res): Promise<void> => {
  const body = CreateWidgetBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const apiKey = randomBytes(24).toString("hex");

  const [widget] = await db
    .insert(widgetsTable)
    .values({ ...body.data, apiKey })
    .returning();

  res.status(201).json(widget);
});

router.patch("/widgets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateWidgetParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = UpdateWidgetBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const updateData: Partial<typeof widgetsTable.$inferInsert> = {};
  if (body.data.name !== undefined) updateData.name = body.data.name;
  if ("webhookUrl" in body.data) updateData.webhookUrl = body.data.webhookUrl ?? null;
  if ("webhookSecret" in body.data) updateData.webhookSecret = body.data.webhookSecret ?? null;

  const [updated] = await db
    .update(widgetsTable)
    .set(updateData)
    .where(eq(widgetsTable.id, params.data.id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Widget not found" });
    return;
  }

  res.json(updated);
});

router.delete("/widgets/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteWidgetParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(widgetsTable)
    .where(eq(widgetsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Widget not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
