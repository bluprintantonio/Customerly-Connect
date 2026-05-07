import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const widgetsTable = pgTable("widgets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  siteUrl: text("site_url").notNull(),
  apiKey: text("api_key").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWidgetSchema = createInsertSchema(widgetsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertWidget = z.infer<typeof insertWidgetSchema>;
export type Widget = typeof widgetsTable.$inferSelect;
