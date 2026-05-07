import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { randomBytes } from "crypto";
import { db, widgetsTable } from "@workspace/db";
import {
  CreateWidgetBody,
  DeleteWidgetParams,
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
